/**
 * Congestion Model - Predictive congestion scoring
 * Uses multiple data sources with weighted scoring
 */

import { CrowdEngine } from '@/services/crowdEngine';
import { TrafficService } from '@/services/trafficService';
import { getWeather } from '@/services/weatherService';
import { getHistoricalData, getEventData, getTimingFactors } from '@/data/historicalData';
import { CongestionFactors } from './trafficEngine';

// ============================================
// WEIGHTS CONFIGURATION
// ============================================

const WEIGHTS = {
    ePass: 0.30,      // 30% - Real-time E-Pass scans
    parking: 0.25,    // 25% - Parking occupancy
    historical: 0.20, // 20% - Historical patterns
    weather: 0.10,    // 10% - Weather impact
    event: 0.10,      // 10% - Events/festivals
    timing: 0.05      // 5%  - School/market timing
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
            timingScore
        ] = await Promise.all([
            this.calculateEPassScore(locationName),
            this.calculateParkingScore(locationName),
            this.calculateHistoricalScore(locationName),
            this.calculateWeatherScore(),
            this.calculateEventScore(locationName),
            this.calculateTimingScore()
        ]);

        return {
            ePassScore,
            parkingScore,
            historicalScore,
            weatherScore,
            eventScore,
            timingScore
        };
    }

    /**
     * Compute final weighted score
     */
    static computeScore(factors: CongestionFactors): number {
        const weighted =
            factors.ePassScore * WEIGHTS.ePass +
            factors.parkingScore * WEIGHTS.parking +
            factors.historicalScore * WEIGHTS.historical +
            factors.weatherScore * WEIGHTS.weather +
            factors.eventScore * WEIGHTS.event +
            factors.timingScore * WEIGHTS.timing;

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

    /**
     * E-Pass based scoring (real-time)
     * Based on number of E-Pass scans at the location
     */
    private static async calculateEPassScore(locationName: string): Promise<number> {
        try {
            const crowd = await CrowdEngine.analyzeLocation(locationName);
            return crowd.score;
        } catch {
            return 50; // Default to medium if unavailable
        }
    }

    /**
     * Parking occupancy scoring
     */
    private static async calculateParkingScore(locationName: string): Promise<number> {
        try {
            const crowd = await CrowdEngine.analyzeLocation(locationName);
            return crowd.factors?.parking || 50;
        } catch {
            return 50;
        }
    }

    /**
     * Historical pattern scoring
     * Uses same day/time data from last 3 years
     */
    private static async calculateHistoricalScore(locationName: string): Promise<number> {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const hour = now.getHours();
        const month = now.getMonth();

        try {
            const historical = await getHistoricalData(locationName);

            if (historical) {
                // Get average for this day/time
                const dayPattern = historical.weekdayPattern[dayOfWeek] || 1.0;
                const hourPattern = historical.hourlyPattern[hour] || 1.0;
                const monthPattern = historical.monthlyPattern[month] || 1.0;

                const baseScore = historical.averageScore || 50;
                return Math.round(baseScore * dayPattern * hourPattern * monthPattern);
            }
        } catch {
            // Fall back to default pattern
        }

        // Default historical pattern based on time
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

            // Weather code impacts:
            // 0: Clear - High outdoor activity
            // 1-3: Partly cloudy - Normal
            // 45-48: Fog - Reduced travel
            // 51-67: Rain - Reduced outdoor, increased indoor
            // 71-77: Snow - Low activity
            // 80-82: Rain showers - Variable

            if (code === 0) return 70; // Clear weather increases crowds
            if (code >= 1 && code <= 3) return 60;
            if (code >= 45 && code <= 48) return 40; // Fog reduces travel
            if (code >= 51 && code <= 67) return 30; // Rain reduces outdoor
            if (code >= 71) return 20; // Extreme weather

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

            // Check for active events
            const activeEvents = events.filter(event => {
                const start = new Date(event.startDate);
                const end = new Date(event.endDate);
                return now >= start && now <= end;
            });

            if (activeEvents.length === 0) return 30; // No events, lower base

            // Check if event affects this location
            const affectsLocation = activeEvents.some(event =>
                event.affectedSpots?.includes(locationName) ||
                event.type === 'DISTRICT_WIDE'
            );

            if (affectsLocation) return 90; // High impact
            if (activeEvents.length > 0) return 60; // General event impact

            return 30;
        } catch {
            return 30;
        }
    }

    /**
     * School/Market timing scoring
     */
    private static async calculateTimingScore(): Promise<number> {
        const now = new Date();
        const hour = now.getHours();
        const dayOfWeek = now.getDay();

        try {
            const timings = await getTimingFactors();

            // Check school timings (weekdays 8-9, 15-16)
            if (dayOfWeek >= 1 && dayOfWeek <= 5) {
                if ((hour >= 8 && hour <= 9) || (hour >= 15 && hour <= 16)) {
                    return 80; // School rush
                }
            }

            // Check market timings (varies by day)
            if (timings.marketDays?.includes(dayOfWeek)) {
                if (hour >= 7 && hour <= 11) {
                    return 70; // Market hours
                }
            }

            // Weekend factor
            if (dayOfWeek === 0 || dayOfWeek === 6) {
                if (hour >= 10 && hour <= 17) {
                    return 75; // Weekend tourist rush
                }
            }

            return 40; // Normal timing
        } catch {
            // Default timing factor
            if (hour >= 10 && hour <= 17) return 60;
            return 40;
        }
    }

    /**
     * Default historical score when no data available
     */
    private static getDefaultHistoricalScore(
        dayOfWeek: number,
        hour: number,
        month: number
    ): number {
        let score = 50;

        // Weekend boost
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            score += 20;
        }

        // Peak hours (10-12, 15-17)
        if ((hour >= 10 && hour <= 12) || (hour >= 15 && hour <= 17)) {
            score += 15;
        }

        // Peak tourism months (April-May, Oct-Dec)
        if ([3, 4, 9, 10, 11].includes(month)) {
            score += 10;
        }

        return Math.min(100, score);
    }

    /**
     * Assess data quality
     */
    private static assessDataQuality(factors: CongestionFactors): 'HIGH' | 'MEDIUM' | 'LOW' {
        // Check if we have real data or defaults
        const hasRealEPass = factors.ePassScore !== 50;
        const hasRealParking = factors.parkingScore !== 50;
        const hasRealWeather = factors.weatherScore !== 50;

        const realDataCount = [hasRealEPass, hasRealParking, hasRealWeather]
            .filter(Boolean).length;

        if (realDataCount >= 3) return 'HIGH';
        if (realDataCount >= 1) return 'MEDIUM';
        return 'LOW';
    }

    /**
     * Calculate confidence score
     */
    private static calculateConfidence(factors: CongestionFactors): number {
        const quality = this.assessDataQuality(factors);

        switch (quality) {
            case 'HIGH': return 0.9;
            case 'MEDIUM': return 0.7;
            case 'LOW': return 0.5;
        }
    }
}

export default CongestionModel;
