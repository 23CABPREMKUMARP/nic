/**
 * Parking Validator Service
 * analyzing parking slot bookings for pre-emptive traffic control
 */

import { OOTY_PARKING } from '@/data/ootyMapData';

export interface ParkingAnalytics {
    spotId: string;
    totalSlots: number;
    bookedSlots: number;
    activeVehicles: number; // Physically present
    cancelledSlots: number;
    occupancyRate: number; // %
    status: 'AVAILABLE' | 'WARNING' | 'FULL' | 'CRITICAL';
    waitTimeMinutes: number;
    predictionNextHour: number; // Predicted occupancy %
}

export class ParkingValidator {

    /**
     * Get real-time parking analytics for a specific spot
     */
    static async getSpotAnalytics(spotId: string): Promise<ParkingAnalytics> {
        // Mocking real-time database inputs
        // in prod, this would query the Parking DB via API

        const parkingRef = OOTY_PARKING.find(p => p.spotId === spotId);
        const total = parkingRef ? parkingRef.totalSlots : 100; // Default fallback

        // Simulating occupancy based on random factors + "time of day"
        // To verify redirection, we can force high numbers for specific spots
        let baseOccupancy = Math.floor(Math.random() * 60) + 20; // 20-80% base

        // Force High Congestion for testing "Ooty Lake" if needed, 
        // or just rely on random high rolls. 
        // Let's make Ooty Lake naturally busier in this simulation.
        if (spotId === 'ooty-lake') {
            baseOccupancy += 30;
        }

        if (spotId === 'test-critical') {
            baseOccupancy = 99;
        }

        // Clamp to 0-100
        const occupancyRate = Math.min(100, Math.max(0, baseOccupancy));

        const booked = Math.floor(total * (occupancyRate / 100));
        const active = Math.floor(booked * 0.9); // 90% of booked are present
        const cancelled = Math.floor(booked * 0.05); // 5% cancellation rate

        let status: ParkingAnalytics['status'] = 'AVAILABLE';
        if (occupancyRate > 95) status = 'CRITICAL';
        else if (occupancyRate > 90) status = 'FULL';
        else if (occupancyRate > 80) status = 'WARNING';

        // Calculate wait time: (Vehicles in queue / exit rate)
        // Simple heuristic: if full, wait 2 mins per car over capacity? 
        // Or just map occupancy to wait time.
        const waitTime = occupancyRate > 90 ? (occupancyRate - 90) * 3 : 0;

        return {
            spotId,
            totalSlots: total,
            bookedSlots: booked,
            activeVehicles: active,
            cancelledSlots: cancelled,
            occupancyRate,
            status,
            waitTimeMinutes: Math.round(waitTime),
            predictionNextHour: Math.min(100, occupancyRate + 10) // Trend up
        };
    }

    /**
     * Get analytics for all managed parking spots
     */
    static async getAllSpots(): Promise<ParkingAnalytics[]> {
        const spotIds = OOTY_PARKING.map(p => p.spotId).filter(id => id !== null) as string[];
        return Promise.all(spotIds.map(id => this.getSpotAnalytics(id)));
    }
}
