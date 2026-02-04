/**
 * Analytics Service - Aggregator for Data Streams
 * Simulates real-time data from E-Pass, Parking, and User Reports
 */

import { OOTY_SPOTS } from '@/data/ootyMapData';

export interface EPassData {
    entriesPerHour: number;
    vehicleTypes: { car: number; bus: number; bike: number };
    totalVisitors: number;
}

export interface ParkingData {
    spotId: string;
    totalSlots: number;
    occupiedSlots: number;
    occupancyRate: number; // 0-100
    queueLength: number;
}

export class AnalyticsService {

    /**
     * Get real-time E-Pass statistics for a location
     * (Simulated for demo)
     */
    static async getEPassStats(locationName: string): Promise<EPassData> {
        // Mock fluctuation based on time
        const hour = new Date().getHours();
        const baseEntries = (hour >= 9 && hour <= 18) ? 150 : 20;
        const randomFactor = Math.floor(Math.random() * 50);

        return {
            entriesPerHour: baseEntries + randomFactor,
            vehicleTypes: {
                car: 60,
                bus: 10,
                bike: 30
            },
            totalVisitors: 1200 + (hour * 150)
        };
    }

    /**
     * Get real-time parking data
     * (Simulated)
     */
    static async getParkingData(spotId: string): Promise<ParkingData> {
        // Mock random occupancy
        const occupancy = Math.floor(Math.random() * 100);

        return {
            spotId,
            totalSlots: 200,
            occupiedSlots: Math.floor((occupancy / 100) * 200),
            occupancyRate: occupancy,
            queueLength: occupancy > 90 ? Math.floor(Math.random() * 20) : 0
        };
    }

    /**
     * Get community report score (0-100)
     * High score = Many users reporting congestion
     */
    static async getUserReportScore(locationName: string): Promise<number> {
        // 5% chance of high user reports
        if (Math.random() > 0.95) return 80 + Math.floor(Math.random() * 20);
        return Math.floor(Math.random() * 20); // Mostly low
    }
}
