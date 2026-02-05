/**
 * PredictionModel - ML-like prediction for crowd trends
 * Uses time-series patterns and seasonal adjustments
 */

import { prisma } from '@/lib/prisma';

export interface HourlyPrediction {
    hour: string;
    predictedScore: number;
    confidence: number;
    level: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface DayPrediction {
    date: string;
    dayOfWeek: string;
    predictions: HourlyPrediction[];
    peakHour: string;
    bestVisitWindow: string;
    expectedMaxCrowd: number;
}

export interface TrendAnalysis {
    direction: 'UP' | 'DOWN' | 'FLAT';
    velocity: number; // change per hour
    spikeDetected: boolean;
    congestionAlert: boolean;
    decongestionTime: string | null;
}

// Historical patterns (mock ML model outputs)
const HOURLY_PATTERNS: Record<string, number[]> = {
    // Hour index 0-23, multiplier for base crowd
    weekday: [0.2, 0.1, 0.1, 0.1, 0.1, 0.2, 0.3, 0.5, 0.7, 0.9, 1.0, 1.0, 0.9, 0.8, 0.9, 1.0, 0.9, 0.7, 0.5, 0.4, 0.3, 0.3, 0.2, 0.2],
    weekend: [0.3, 0.2, 0.1, 0.1, 0.1, 0.2, 0.4, 0.6, 0.8, 1.0, 1.0, 1.0, 1.0, 0.9, 1.0, 1.0, 1.0, 0.8, 0.6, 0.5, 0.4, 0.3, 0.3, 0.3],
    festival: [0.4, 0.3, 0.2, 0.2, 0.2, 0.3, 0.5, 0.7, 0.9, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.9, 0.7, 0.6, 0.5, 0.4, 0.4, 0.4]
};

// Seasonal multipliers
const SEASONAL_FACTORS: Record<number, number> = {
    0: 0.8,  // Jan
    1: 0.7,  // Feb
    2: 0.9,  // Mar
    3: 1.3,  // Apr - Summer starts
    4: 1.5,  // May - Peak summer
    5: 1.4,  // Jun
    6: 0.6,  // Jul - Monsoon
    7: 0.5,  // Aug
    8: 0.7,  // Sep
    9: 1.2,  // Oct - Winter tourism
    10: 1.3, // Nov
    11: 1.4  // Dec - Holidays
};

export class PredictionModel {
    /**
     * Predict crowd for the next 24 hours
     */
    static async predictNext24Hours(spotName: string, baseScore: number): Promise<HourlyPrediction[]> {
        const now = new Date();
        const currentHour = now.getHours();
        const dayOfWeek = now.getDay();
        const month = now.getMonth();

        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const isFestival = await this.checkFestivalMode();

        const pattern = isFestival ? HOURLY_PATTERNS.festival
            : isWeekend ? HOURLY_PATTERNS.weekend
                : HOURLY_PATTERNS.weekday;

        const seasonalFactor = SEASONAL_FACTORS[month];
        const predictions: HourlyPrediction[] = [];

        for (let i = 0; i < 24; i++) {
            const hour = (currentHour + i) % 24;
            const patternMultiplier = pattern[hour];

            // Calculate predicted score
            let predicted = baseScore * patternMultiplier * seasonalFactor;

            // Add some randomness for realism
            predicted = Math.max(0, Math.min(100, predicted + (Math.random() * 10 - 5)));

            // Confidence decreases with time
            const confidence = Math.max(50, 95 - (i * 2));

            predictions.push({
                hour: `${hour.toString().padStart(2, '0')}:00`,
                predictedScore: Math.round(predicted),
                confidence,
                level: predicted <= 60 ? 'LOW' : predicted <= 80 ? 'MEDIUM' : 'HIGH'
            });
        }

        return predictions;
    }

    /**
     * Predict for a specific day
     */
    static async predictDay(spotName: string, targetDate: Date): Promise<DayPrediction> {
        const dayOfWeek = targetDate.getDay();
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        // Get base score from historical average
        const baseScore = await this.getHistoricalAverage(spotName, targetDate);
        const predictions = await this.predictNext24Hours(spotName, baseScore);

        // Find peak hour
        const peakPrediction = predictions.reduce((max, p) =>
            p.predictedScore > max.predictedScore ? p : max, predictions[0]);

        // Find best visit window (lowest 3 consecutive hours)
        let minSum = Infinity;
        let bestStartIndex = 0;
        for (let i = 0; i < predictions.length - 2; i++) {
            const sum = predictions[i].predictedScore + predictions[i + 1].predictedScore + predictions[i + 2].predictedScore;
            if (sum < minSum) {
                minSum = sum;
                bestStartIndex = i;
            }
        }

        return {
            date: targetDate.toISOString().split('T')[0],
            dayOfWeek: dayNames[dayOfWeek],
            predictions,
            peakHour: peakPrediction.hour,
            bestVisitWindow: `${predictions[bestStartIndex].hour} - ${predictions[bestStartIndex + 2].hour}`,
            expectedMaxCrowd: peakPrediction.predictedScore
        };
    }

    /**
     * Analyze trend in real-time
     */
    static async analyzeTrend(spotName: string): Promise<TrendAnalysis> {
        try {
            const stats = await prisma.crowdStats.findMany({
                where: {
                    location: { name: { contains: spotName, mode: 'insensitive' } }
                },
                orderBy: { timestamp: 'desc' },
                take: 12 // Last 12 readings (approx 2 hours if every 10 mins)
            });

            if (stats.length < 3) {
                return {
                    direction: 'FLAT',
                    velocity: 0,
                    spikeDetected: false,
                    congestionAlert: false,
                    decongestionTime: null
                };
            }

            const recentAvg = stats.slice(0, 4).reduce((s, c) => s + c.count, 0) / 4;
            const olderAvg = stats.slice(4).reduce((s, c) => s + c.count, 0) / Math.max(1, stats.slice(4).length);

            const velocity = (recentAvg - olderAvg) / 4; // Change per reading
            const direction = velocity > 10 ? 'UP' : velocity < -10 ? 'DOWN' : 'FLAT';

            // Spike detection (sudden 50%+ increase)
            const spikeDetected = stats.length >= 2 &&
                stats[0].count > stats[1].count * 1.5;

            // Congestion alert (over 80% capacity for 3+ readings)
            const recentHigh = stats.slice(0, 3).filter(s => s.count > 800).length >= 3;

            // Estimate decongestion time
            let decongestionTime: string | null = null;
            if (direction === 'DOWN' && velocity < -5) {
                const hoursToDecongest = Math.ceil(Math.abs(recentAvg - 500) / (Math.abs(velocity) * 6));
                const decTime = new Date();
                decTime.setHours(decTime.getHours() + hoursToDecongest);
                decongestionTime = `${decTime.getHours().toString().padStart(2, '0')}:00`;
            }

            return {
                direction,
                velocity: Math.round(velocity),
                spikeDetected,
                congestionAlert: recentHigh,
                decongestionTime
            };
        } catch {
            return {
                direction: 'FLAT',
                velocity: 0,
                spikeDetected: false,
                congestionAlert: false,
                decongestionTime: null
            };
        }
    }

    /**
     * Get gate-wise predictions
     */
    static async predictGateLoad(): Promise<Record<string, { current: number; predicted: number; trend: string }>> {
        const gates = ['Mettupalayam', 'Coonoor', 'Kotagiri', 'Gudalur'];
        const results: Record<string, { current: number; predicted: number; trend: string }> = {};

        for (const gate of gates) {
            try {
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const entries = await prisma.pass.count({
                    where: {
                        fromLocation: { contains: gate, mode: 'insensitive' },
                        status: 'ACTIVE',
                        visitDate: { gte: today }
                    }
                });

                // Simple prediction: 20% more in next 2 hours during peak
                const hour = new Date().getHours();
                const isPeak = hour >= 9 && hour <= 15;
                const predicted = isPeak ? Math.round(entries * 1.2) : Math.round(entries * 0.9);

                results[gate] = {
                    current: entries,
                    predicted,
                    trend: predicted > entries ? '↑' : predicted < entries ? '↓' : '→'
                };
            } catch {
                results[gate] = { current: 0, predicted: 0, trend: '→' };
            }
        }

        return results;
    }

    /**
     * Check if festival mode is active
     */
    private static async checkFestivalMode(): Promise<boolean> {
        try {
            const setting = await prisma.systemSettings.findFirst({
                where: { key: 'FESTIVAL_MODE' }
            });
            return setting?.value === 'true';
        } catch {
            return false;
        }
    }

    /**
     * Get historical average for a spot on similar days
     */
    private static async getHistoricalAverage(spotName: string, date: Date): Promise<number> {
        try {
            const dayOfWeek = date.getDay();
            const month = date.getMonth();

            // Query historical data for same day of week in same month
            const stats = await prisma.crowdStats.findMany({
                where: {
                    location: { name: { contains: spotName, mode: 'insensitive' } },
                    timestamp: {
                        gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
                    }
                },
                take: 100
            });

            if (stats.length === 0) return 50;

            const filtered = stats.filter(s => {
                const d = new Date(s.timestamp);
                return d.getDay() === dayOfWeek && d.getMonth() === month;
            });

            if (filtered.length === 0) return 50;

            const avg = filtered.reduce((sum, s) => sum + s.count, 0) / filtered.length;
            return Math.min(100, (avg / 1000) * 100); // Normalize to 0-100
        } catch {
            return 50;
        }
    }
}
