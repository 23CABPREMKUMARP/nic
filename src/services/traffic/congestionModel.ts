/**
 * Congestion Model - Predictive congestion scoring
 * Uses multiple data sources with weighted scoring
 */

import { AnalyticsService } from '@/services/analytics/AnalyticsService';
import { TrafficService } from '@/services/trafficService';
import { getWeather } from '@/services/weatherService';
import { getHistoricalData, getEventData, getTimingFactors } from '@/data/historicalData';
import { CongestionFactors } from './trafficEngine';

// ============================================
// WEIGHTS CONFIGURATION
// ============================================

const WEIGHTS = {
    parking: 0.35,    // 35% - Real-time Slot Availability
    ePass: 0.30,      // 30% - Vehicle flow rate
    historical: 0.20, // 20% - 3-year avg pattern
    weather: 0.10,    // 10% - Rain/Fog impact
    reports: 0.05     // 5%  - Community warnings
};

// ============================================
// CONGESTION SCORE INTERFACE
// ============================================

export interface CongestionScore {
    total: number;
    factors: CongestionFactors;
    confidence: number;
    dataQuality: 'HIGH' | 'MEDIUM' | 'LOW';
}

// ============================================
// CONGESTION MODEL CLASS
// ============================================

export class CongestionModel {
    /**
     * Calculate all congestion factors for a location
     */
    static async calculateFactors(locationName: string): Promise<CongestionFactors> {
        const [
            ePassScore,
            parkingScore,
            historicalScore,
            weatherScore,
            eventScore,
            userReportsScore
        ] = await Promise.all([
            this.calculateEPassScore(locationName),
            this.calculateParkingScore(locationName),
            this.calculateHistoricalScore(locationName),
            this.calculateWeatherScore(),
            this.calculateEventScore(locationName),
            this.calculateUserReportsScore(locationName)
        ]);

        return {
            ePassScore,
            parkingScore,
            historicalScore,
            weatherScore,
            eventScore,
            userReportsScore
        };
    }

    /**
     * Compute final weighted score
     * Formula: (0.35 * parking) + (0.30 * e-pass) + (0.20 * history) + (0.10 * weather) + (0.05 * reports)
     */
    static computeScore(factors: CongestionFactors): number {
        const weighted =
            factors.parkingScore * WEIGHTS.parking +
            factors.ePassScore * WEIGHTS.ePass +
            factors.historicalScore * WEIGHTS.historical +
            factors.weatherScore * WEIGHTS.weather +
            (factors.userReportsScore || 0) * WEIGHTS.reports;

        return Math.round(Math.min(100, Math.max(0, weighted)));
    }

    /**
     * Get full congestion analysis
     */
    static async analyze(locationName: string): Promise<CongestionScore> {
        const factors = await this.calculateFactors(locationName);
        const total = this.computeScore(factors);

        // Calculate data quality
        const dataQuality = this.assessDataQuality(factors);
        const confidence = this.calculateConfidence(factors);

        return {
            total,
            factors,
            confidence,
            dataQuality
        };
    }

    // ============================================
    // FACTOR CALCULATIONS
    // ============================================

    private static async calculateEPassScore(locationName: string): Promise<number> {
        try {
            const stats = await AnalyticsService.getEPassStats(locationName);
            // Normalize entries to 0-100 score (assuming 200/hr is max capacity)
            return Math.min(100, Math.round((stats.entriesPerHour / 200) * 100));
        } catch {
            return 50;
        }
    }

    private static async calculateParkingScore(locationName: string): Promise<number> {
        try {
            const data = await AnalyticsService.getParkingData(locationName);
            return data.occupancyRate;
        } catch {
            return 50;
        }
    }

    private static async calculateUserReportsScore(locationName: string): Promise<number> {
        try {
            return await AnalyticsService.getUserReportScore(locationName);
        } catch {
            return 0;
        }
    }

    /**
     * Historical pattern scoring
     */
    private static async calculateHistoricalScore(locationName: string): Promise<number> {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const hour = now.getHours();
        const month = now.getMonth();

        try {
            const historical = await getHistoricalData(locationName);
            if (historical) {
                const dayPattern = historical.weekdayPattern[dayOfWeek] || 1.0;
                const hourPattern = historical.hourlyPattern[hour] || 1.0;
                const monthPattern = historical.monthlyPattern[month] || 1.0;
                const baseScore = historical.averageScore || 50;
                return Math.round(baseScore * dayPattern * hourPattern * monthPattern);
            }
        } catch { }

        return this.getDefaultHistoricalScore(dayOfWeek, hour, month);
    }

    /**
     * Weather impact scoring
     */
    private static async calculateWeatherScore(): Promise<number> {
        try {
            const weather = await getWeather('Ooty');
            if (!weather) return 50;

            const code = weather.current.code;
            if (code === 0) return 70; // Clear
            if (code >= 1 && code <= 3) return 60; // Clouds
            if (code >= 45 && code <= 48) return 40; // Fog
            if (code >= 51 && code <= 67) return 30; // Rain
            return 50;
        } catch {
            return 50;
        }
    }

    /**
     * Event/Festival scoring
     */
    private static async calculateEventScore(locationName: string): Promise<number> {
        try {
            const events = await getEventData();
            const now = new Date();
            const activeEvents = events.filter(event => {
                const start = new Date(event.startDate);
                const end = new Date(event.endDate);
                return now >= start && now <= end;
            });

            if (activeEvents.length === 0) return 30;
            const affectsLocation = activeEvents.some(event =>
                event.affectedSpots?.includes(locationName) ||
                event.type === 'DISTRICT_WIDE'
            );

            return affectsLocation ? 90 : 60;
        } catch {
            return 30;
        }
    }

    /**
     * School/Market timing scoring (Internal helper)
     */
    private static async calculateTimingScore(): Promise<number> {
        const now = new Date();
        const hour = now.getHours();
        const dayOfWeek = now.getDay();
        return (hour >= 10 && hour <= 17) ? 60 : 40;
    }

    private static getDefaultHistoricalScore(day: number, hour: number, month: number): number {
        let score = 50;
        if (day === 0 || day === 6) score += 20; // Weekend
        if ((hour >= 10 && hour <= 12) || (hour >= 15 && hour <= 17)) score += 15; // Peak params
        return Math.min(100, score);
    }

    private static assessDataQuality(factors: CongestionFactors): 'HIGH' | 'MEDIUM' | 'LOW' {
        const hasRealEPass = factors.ePassScore !== 50;
        const hasRealParking = factors.parkingScore !== 50;
        return (hasRealEPass && hasRealParking) ? 'HIGH' : 'MEDIUM';
    }

    private static calculateConfidence(factors: CongestionFactors): number {
        return this.assessDataQuality(factors) === 'HIGH' ? 0.9 : 0.7;
    }
}

export default CongestionModel;
