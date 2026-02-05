/**
 * CrowdAnalyzer - Core Analysis Engine
 * Calculates real-time crowd metrics from E-Pass, Parking, and Historical data
 */

import { prisma } from '@/lib/prisma';

export interface CrowdMetrics {
    crowdLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    crowdScore: number;
    waitingEstimate: number; // minutes
    parkingChance: number; // percentage
    bestAlternate: string | null;
    trend: 'RISING' | 'STABLE' | 'FALLING';
    factors: {
        epass: number;
        parking: number;
        historical: number;
        weather: number;
    };
    gateLoad: Record<string, number>;
    prediction2h: number[];
}

export interface SpotAnalysis {
    spotId: string;
    spotName: string;
    metrics: CrowdMetrics;
    recommendation: string;
    bestVisitTime: string;
    redirectionNeeded: boolean;
}

// Algorithm weights
const WEIGHTS = {
    EPASS: 0.35,
    PARKING: 0.40,
    HISTORICAL: 0.15,
    WEATHER: 0.10
};

// Thresholds
const THRESHOLDS = {
    LOW: 60,
    MEDIUM: 80,
    HIGH: 100
};

export class CrowdAnalyzer {
    /**
     * Analyze a specific spot/location
     */
    static async analyzeSpot(spotName: string): Promise<SpotAnalysis> {
        const [epassScore, parkingScore, historicalFactor, weatherFactor, gateLoad] = await Promise.all([
            this.getEPassScore(spotName),
            this.getParkingScore(spotName),
            this.getHistoricalFactor(spotName),
            this.getWeatherFactor(),
            this.getGateLoad()
        ]);

        // Calculate weighted crowd score
        const crowdScore = Math.round(
            (epassScore * WEIGHTS.EPASS) +
            (parkingScore * WEIGHTS.PARKING) +
            (historicalFactor * WEIGHTS.HISTORICAL) +
            (weatherFactor * WEIGHTS.WEATHER)
        );

        const crowdLevel = this.getCrowdLevel(crowdScore);
        const trend = await this.detectTrend(spotName);
        const prediction2h = await this.predict2Hours(spotName, crowdScore, trend);
        const parkingChance = Math.max(0, 100 - parkingScore);
        const waitingEstimate = this.calculateWaitTime(crowdScore, parkingScore);
        const bestAlternate = await this.findBestAlternate(spotName, crowdScore);

        const metrics: CrowdMetrics = {
            crowdLevel,
            crowdScore,
            waitingEstimate,
            parkingChance,
            bestAlternate,
            trend,
            factors: {
                epass: Math.round(epassScore),
                parking: Math.round(parkingScore),
                historical: Math.round(historicalFactor),
                weather: Math.round(weatherFactor)
            },
            gateLoad,
            prediction2h
        };

        return {
            spotId: spotName.toLowerCase().replace(/\s+/g, '-'),
            spotName,
            metrics,
            recommendation: this.generateRecommendation(metrics, spotName),
            bestVisitTime: this.calculateBestVisitTime(prediction2h),
            redirectionNeeded: crowdScore > 75
        };
    }

    /**
     * Analyze all major spots
     */
    static async analyzeAll(): Promise<SpotAnalysis[]> {
        const locations = await prisma.location.findMany({
            select: { name: true }
        });

        const defaultSpots = ['Ooty Lake', 'Botanical Garden', 'Doddabetta Peak', 'Rose Garden', 'Tea Factory'];
        const spotNames = locations.length > 0
            ? locations.map(l => l.name)
            : defaultSpots;

        return Promise.all(spotNames.map(name => this.analyzeSpot(name)));
    }

    /**
     * Get E-Pass based score
     */
    private static async getEPassScore(destination: string): Promise<number> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        try {
            const passes = await prisma.pass.findMany({
                where: {
                    status: 'ACTIVE',
                    visitDate: { gte: today, lte: endOfDay },
                    toLocation: { contains: destination, mode: 'insensitive' }
                },
                select: {
                    membersCount: true,
                    vehicleType: true,
                    fromLocation: true
                }
            });

            // Calculate weighted entries (heavier vehicles = more impact)
            let totalImpact = 0;
            passes.forEach(pass => {
                const members = pass.membersCount || 1;
                const vehicleWeight = pass.vehicleType === 'BUS' ? 3 : pass.vehicleType === 'CAR' ? 1.5 : 1;
                totalImpact += members * vehicleWeight;
            });

            // Normalize: 2000 impact = 100 score
            return Math.min(100, (totalImpact / 2000) * 100);
        } catch {
            return 50; // Default if DB error
        }
    }

    /**
     * Get Parking occupancy score
     */
    private static async getParkingScore(locationName: string): Promise<number> {
        try {
            const location = await prisma.location.findFirst({
                where: { name: { contains: locationName, mode: 'insensitive' } },
                include: {
                    parkingFacilities: {
                        include: {
                            bookings: {
                                where: {
                                    status: { in: ['BOOKED', 'ARRIVED'] },
                                    bookingDate: {
                                        gte: new Date(new Date().setHours(0, 0, 0, 0)),
                                        lte: new Date(new Date().setHours(23, 59, 59, 999))
                                    }
                                }
                            }
                        }
                    }
                }
            });

            if (!location?.parkingFacilities?.length) return 40;

            let totalSlots = 0;
            let bookedSlots = 0;

            location.parkingFacilities.forEach(f => {
                totalSlots += f.totalSlots;
                bookedSlots += f.bookings.length;
            });

            return totalSlots > 0 ? Math.min(100, (bookedSlots / totalSlots) * 100) : 40;
        } catch {
            return 40;
        }
    }

    /**
     * Get historical factor based on past patterns
     */
    private static async getHistoricalFactor(spotName: string): Promise<number> {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const hour = now.getHours();
        const month = now.getMonth();

        // Weekend boost
        const weekendFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 1.3 : 1.0;

        // Peak hours (10am-4pm)
        const hourFactor = (hour >= 10 && hour <= 16) ? 1.4 : (hour >= 8 && hour <= 18) ? 1.1 : 0.7;

        // Festival/Season boost (April-June summer, Oct-Dec winter tourism)
        const seasonFactor = ([3, 4, 5, 9, 10, 11].includes(month)) ? 1.5 : 1.0;

        // Try to get actual historical data
        try {
            const stats = await prisma.crowdStats.findMany({
                where: {
                    location: { name: { contains: spotName, mode: 'insensitive' } },
                    timestamp: {
                        gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) // Last year
                    }
                },
                orderBy: { count: 'desc' },
                take: 10
            });

            if (stats.length > 0) {
                const avgCount = stats.reduce((sum, s) => sum + s.count, 0) / stats.length;
                return Math.min(100, (avgCount / 1000) * 100 * weekendFactor * hourFactor * seasonFactor);
            }
        } catch {
            // Continue with calculated factor
        }

        // Baseline with modifiers
        return Math.min(100, 50 * weekendFactor * hourFactor * seasonFactor);
    }

    /**
     * Get weather impact factor
     */
    private static async getWeatherFactor(): Promise<number> {
        try {
            const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=11.4102&longitude=76.6950&current_weather=true`);
            const data = await res.json();
            const code = data.current_weather?.weathercode || 0;

            // Clear weather = high crowd potential
            if (code === 0 || (code >= 1 && code <= 3)) return 90;
            // Cloudy
            if (code >= 45 && code <= 48) return 70;
            // Rain = low crowd
            if (code >= 51) return 30;

            return 60;
        } catch {
            return 60;
        }
    }

    /**
     * Get gate-wise load distribution
     */
    private static async getGateLoad(): Promise<Record<string, number>> {
        const gates: Record<string, number> = {
            'Mettupalayam': 0,
            'Coonoor': 0,
            'Kotagiri': 0,
            'Gudalur': 0
        };

        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const passes = await prisma.pass.groupBy({
                by: ['fromLocation'],
                where: {
                    status: 'ACTIVE',
                    visitDate: { gte: today }
                },
                _count: { id: true }
            });

            const maxCount = Math.max(...passes.map(p => p._count.id), 1);
            passes.forEach(p => {
                // Match gate names from fromLocation
                Object.keys(gates).forEach(gate => {
                    if (p.fromLocation?.toLowerCase().includes(gate.toLowerCase())) {
                        gates[gate] = Math.round((p._count.id / maxCount) * 100);
                    }
                });
            });
        } catch {
            // Return default zeros
        }

        return gates;
    }

    /**
     * Detect trend (rising/stable/falling)
     */
    private static async detectTrend(spotName: string): Promise<'RISING' | 'STABLE' | 'FALLING'> {
        try {
            const stats = await prisma.crowdStats.findMany({
                where: {
                    location: { name: { contains: spotName, mode: 'insensitive' } }
                },
                orderBy: { timestamp: 'desc' },
                take: 6 // Last 6 readings
            });

            if (stats.length < 2) return 'STABLE';

            const recent = stats.slice(0, 3).reduce((sum, s) => sum + s.count, 0) / 3;
            const older = stats.slice(3).reduce((sum, s) => sum + s.count, 0) / Math.max(1, stats.slice(3).length);

            const diff = recent - older;
            if (diff > 50) return 'RISING';
            if (diff < -50) return 'FALLING';
            return 'STABLE';
        } catch {
            return 'STABLE';
        }
    }

    /**
     * Predict next 2 hours (30-min intervals)
     */
    private static async predict2Hours(
        spotName: string,
        currentScore: number,
        trend: 'RISING' | 'STABLE' | 'FALLING'
    ): Promise<number[]> {
        const predictions: number[] = [currentScore];
        const trendFactor = trend === 'RISING' ? 5 : trend === 'FALLING' ? -5 : 0;
        const hour = new Date().getHours();

        for (let i = 1; i <= 4; i++) { // 4 x 30min = 2 hours
            const futureHour = hour + (i * 0.5);

            // Peak hour adjustment (10am-4pm rises, after 4pm falls)
            let hourAdjust = 0;
            if (futureHour >= 10 && futureHour <= 14) hourAdjust = 3;
            else if (futureHour >= 14 && futureHour <= 16) hourAdjust = 0;
            else if (futureHour > 16) hourAdjust = -4;

            const predicted = Math.max(0, Math.min(100,
                predictions[i - 1] + trendFactor + hourAdjust + (Math.random() * 4 - 2)
            ));
            predictions.push(Math.round(predicted));
        }

        return predictions;
    }

    /**
     * Calculate crowd level from score
     */
    private static getCrowdLevel(score: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
        if (score <= THRESHOLDS.LOW) return 'LOW';
        if (score <= THRESHOLDS.MEDIUM) return 'MEDIUM';
        if (score <= THRESHOLDS.HIGH) return 'HIGH';
        return 'CRITICAL';
    }

    /**
     * Calculate estimated wait time
     */
    private static calculateWaitTime(crowdScore: number, parkingScore: number): number {
        if (crowdScore <= 40) return 0;
        if (crowdScore <= 60) return 5 + Math.round(parkingScore / 20);
        if (crowdScore <= 80) return 15 + Math.round(parkingScore / 10);
        return 30 + Math.round(parkingScore / 5);
    }

    /**
     * Find best alternate spot
     */
    private static async findBestAlternate(currentSpot: string, currentScore: number): Promise<string | null> {
        if (currentScore < 70) return null;

        const alternates: Record<string, string[]> = {
            'Ooty Lake': ['Emerald Lake', 'Pykara Lake'],
            'Botanical Garden': ['Rose Garden', 'Government Museum'],
            'Doddabetta Peak': ['Nilgiri Mountain Railway', 'Dolphin\'s Nose'],
            'Rose Garden': ['Thread Garden', 'Botanical Garden'],
            'Tea Factory': ['Chocolate Factory', 'Wax World']
        };

        const options = alternates[currentSpot] || [];
        if (options.length === 0) return null;

        // Return first alternate (in production, check their scores too)
        return options[0];
    }

    /**
     * Generate smart recommendation
     */
    private static generateRecommendation(metrics: CrowdMetrics, spotName: string): string {
        if (metrics.crowdLevel === 'CRITICAL') {
            return `⚠️ ${spotName} is extremely crowded. Consider ${metrics.bestAlternate || 'visiting later'}.`;
        }
        if (metrics.crowdLevel === 'HIGH') {
            return `🔶 High crowd expected. Parking may take ${metrics.waitingEstimate} mins.`;
        }
        if (metrics.trend === 'RISING') {
            return `📈 Crowd is rising. Best to visit now before peak.`;
        }
        if (metrics.trend === 'FALLING') {
            return `📉 Crowd is decreasing. Good time to visit!`;
        }
        if (metrics.parkingChance > 70) {
            return `✅ Good parking availability. Low wait time expected.`;
        }
        return `👍 Normal crowd levels. Enjoy your visit!`;
    }

    /**
     * Calculate best visit time
     */
    private static calculateBestVisitTime(predictions: number[]): string {
        const hour = new Date().getHours();
        const minIndex = predictions.indexOf(Math.min(...predictions));
        const bestHour = hour + (minIndex * 0.5);

        if (minIndex === 0) return 'Now';

        const h = Math.floor(bestHour);
        const m = (bestHour % 1) * 60;
        return `${h.toString().padStart(2, '0')}:${m === 0 ? '00' : '30'}`;
    }
}
