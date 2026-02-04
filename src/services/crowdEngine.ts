import { prisma } from "@/lib/prisma";
import { getWeather } from "./weatherService";

export type CrowdLevel = 'SAFE' | 'MEDIUM' | 'OVERFLOW';

export interface CrowdAnalysis {
    score: number;
    level: CrowdLevel;
    factors: {
        parking: number;
        passes: number;
        history: number;
        weather: number;
    };
    recommendation: string;
    caption: string;
}

export class CrowdEngine {
    // Weights as per requirements
    private static WEIGHTS = {
        PARKING: 0.40,
        PASSES: 0.35,
        HISTORY: 0.15,
        WEATHER: 0.10
    };

    /**
     * Calculates complex crowd score for a location
     */
    static async analyzeLocation(locationName: string): Promise<CrowdAnalysis> {
        // Fetch Admin overrides from SystemSettings
        const settings = await prisma.systemSettings.findMany();
        const weights = {
            PARKING: parseFloat(settings.find(s => s.key === 'WEIGHT_PARKING')?.value || '0.40'),
            PASSES: parseFloat(settings.find(s => s.key === 'WEIGHT_PASSES')?.value || '0.35'),
            HISTORY: parseFloat(settings.find(s => s.key === 'WEIGHT_HISTORY')?.value || '0.15'),
            WEATHER: parseFloat(settings.find(s => s.key === 'WEIGHT_WEATHER')?.value || '0.10'),
            FESTIVAL_MODE: settings.find(s => s.key === 'FESTIVAL_MODE')?.value === 'true'
        };

        const location = await prisma.location.findUnique({
            where: { name: locationName },
            include: {
                parkingFacilities: true,
                crowdStats: {
                    orderBy: { timestamp: 'desc' },
                    take: 24
                }
            }
        });

        if (!location) {
            return this.getDefaultAnalysis();
        }

        const manualLevel = settings.find(s => s.key === `CROWD_STATUS_${locationName.toUpperCase().replace(/\s+/g, '_')}`)?.value;

        // 1. Parking Occupancy (40%) - Occupancy % + arrivals density
        const parkingScore = await this.getParkingScore(location.id);

        // 2. E-Pass Active Entries (35%) - Active passes + members count
        const passScore = await this.getPassScore(locationName);

        // 3. Historical Trends (15%) - Last year + peaks
        const historyScore = this.getHistoryScore(location.crowdStats);

        // 4. Weather Impact (10%)
        const weatherScore = await this.getWeatherScore('Ooty');

        // Final Weighted Score (0-100)
        let finalScore = (
            (parkingScore * weights.PARKING) +
            (passScore * weights.PASSES) +
            (historyScore * weights.HISTORY) +
            (weatherScore * weights.WEATHER)
        );

        // Festival mode override
        if (weights.FESTIVAL_MODE && finalScore < 60) finalScore = 75;

        // Manual Level Override
        if (manualLevel) {
            if (manualLevel === 'CRITICAL' || manualLevel === 'OVERFLOW') finalScore = 95;
            if (manualLevel === 'HIGH') finalScore = 75;
            if (manualLevel === 'MEDIUM') finalScore = 55;
            if (manualLevel === 'LOW' || manualLevel === 'SAFE') finalScore = 20;
        }

        const level = this.getLevel(finalScore);
        const analysis = await getWeather('Ooty');

        return {
            score: Math.round(finalScore),
            level,
            factors: {
                parking: Math.round(parkingScore),
                passes: Math.round(passScore),
                history: Math.round(historyScore),
                weather: Math.round(weatherScore)
            },
            recommendation: this.getRecommendation(locationName, level, weatherScore),
            caption: this.generateCaption(level, analysis?.current?.code || 0)
        };
    }

    private static async getParkingScore(locationId: string): Promise<number> {
        const facilities = await prisma.parkingFacility.findMany({
            where: { locationId },
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
        });

        if (facilities.length === 0) return 30;

        let totalCapacity = 0;
        let totalBooked = 0;

        facilities.forEach(f => {
            totalCapacity += f.totalSlots;
            totalBooked += f.bookings.length;
        });

        const occupancy = totalCapacity > 0 ? (totalBooked / totalCapacity) * 100 : 0;
        // Simple density factor: if occupancy > 90, extra penalty
        return occupancy > 90 ? 100 : occupancy;
    }

    private static async getPassScore(locationName: string): Promise<number> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const passes = await prisma.pass.findMany({
            where: {
                status: 'ACTIVE',
                visitDate: {
                    gte: today,
                    lte: new Date(new Date().setHours(23, 59, 59, 999))
                },
                toLocation: { contains: locationName, mode: 'insensitive' }
            }
        });

        // Sum members count for more accuracy
        const totalMembers = passes.reduce((sum, p) => sum + (p.membersCount || 1), 0);

        // Threshold: 2000 members = 100 score
        return Math.min(100, (totalMembers / 2000) * 100);
    }

    private static getHistoryScore(stats: any[]): number {
        if (stats.length === 0) return 50;
        const latest = stats[0].count;
        const avg = stats.reduce((acc, s) => acc + s.count, 0) / stats.length;
        const ratio = latest / (avg || 1);
        return Math.min(100, ratio * 50);
    }

    private static async getWeatherScore(city: string): Promise<number> {
        const weather = await getWeather(city);
        if (!weather) return 50;
        const code = weather.current.code;
        if (code === 0 || (code >= 1 && code <= 3)) return 90; // Good weather -> high crowd potential
        if (code >= 51) return 30; // Rain -> low crowd potential
        return 60;
    }

    private static getLevel(score: number): CrowdLevel {
        if (score >= 80) return 'OVERFLOW';
        if (score >= 50) return 'MEDIUM';
        return 'SAFE';
    }

    private static getRecommendation(name: string, level: CrowdLevel, weatherScore: number): string {
        if (level === 'OVERFLOW') {
            if (name.includes('Lake')) return "Ooty Lake is crowded now. Emerald Lake looks perfect in this weather for selfies 🏞️";
            if (name.includes('Garden')) return "Botanical Garden is full. Rose Garden is calm and easy to park now 🌹";
            return `${name} is reaching capacity. We recommend exploring nearby hidden gems.`;
        }
        if (weatherScore < 40) return "Foggy today – try indoor experiences like the Tea Museum.";
        return "Optimal time for visit. Low crowd & easy parking now.";
    }

    private static generateCaption(level: CrowdLevel, weatherCode: number): string {
        if (weatherCode === 0) return "Clear sky – best selfie spot today";
        if (weatherCode >= 51) return "Rainy – Indoor facilities recommended";
        if (level === 'SAFE') return "Low crowd & easy parking now";
        if (level === 'OVERFLOW') return "Peak rush – Use alternate routes";
        return "Pleasant weather for a walk";
    }

    private static getDefaultAnalysis(): CrowdAnalysis {
        return {
            score: 0,
            level: 'SAFE',
            factors: { parking: 0, passes: 0, history: 0, weather: 0 },
            recommendation: "Data unavailable",
            caption: "Checking status..."
        };
    }
}
