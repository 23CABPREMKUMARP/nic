
/**
 * Parking Sync Service
 * Aggregates data from multiple sources to provide unified slot counts
 */

import { OOTY_PARKING } from '@/data/ootyMapData';
import { OfflineTicketService } from './OfflineTicketService';
import { ParkingValidator } from '@/services/validator/ParkingValidator';

export interface UnifiedSlotData {
    spotId: string;
    spotName: string;
    totalSlots: number;
    onlineBooked: number;
    offlineOccupied: number;
    availableSlots: number;
    occupancyRate: number;
    status: 'AVAILABLE' | 'WARNING' | 'FULL';
}

export class ParkingSync {

    /**
     * Get real-time unified parking data for all spots
     */
    static async getUnifiedData(): Promise<UnifiedSlotData[]> {
        const spots = OOTY_PARKING;

        const unifiedData = await Promise.all(spots.map(async (spot) => {
            if (!spot.spotId) return null;

            // 1. Get Online Data (Mocked via ParkingValidator logic for now)
            // In a real scenario, this would potentially be a separate DB query or API call
            const onlineAnalytics = await ParkingValidator.getSpotAnalytics(spot.spotId);

            // 2. Get Offline Data
            const offlineTickets = await OfflineTicketService.getTicketsBySpot(spot.spotId);
            const offlineCount = offlineTickets.length;

            // 3. Aggregate
            // Note: ParkingValidator already mocks "bookedSlots" which generally includes an assumption of total occupancy.
            // To make this realistic, let's assume ParkingValidator returns the *System* view, 
            // and we add the *Manual* view on top, or we treat ParkingValidator as the "Online Source".

            // Let's treat ParkingValidator.bookedSlots as "Online Bookings"
            const onlineCount = onlineAnalytics.bookedSlots;

            const totalOccupied = onlineCount + offlineCount;
            // Clamp to total slots (or allow overbooking if that's the reality)
            const clampedOccupied = Math.min(totalOccupied, spot.totalSlots);

            const available = Math.max(0, spot.totalSlots - clampedOccupied);
            const occupancyRate = Math.round((clampedOccupied / spot.totalSlots) * 100);

            let status: UnifiedSlotData['status'] = 'AVAILABLE';
            if (occupancyRate >= 90) status = 'FULL';
            else if (occupancyRate >= 75) status = 'WARNING';

            return {
                spotId: spot.spotId,
                spotName: spot.name,
                totalSlots: spot.totalSlots,
                onlineBooked: onlineCount,
                offlineOccupied: offlineCount,
                availableSlots: available,
                occupancyRate: occupancyRate,
                status: status
            };
        }));

        return unifiedData.filter((s): s is UnifiedSlotData => s !== null);
    }

    /**
     * Get specific spot data
     */
    static async getSpotUnifiedData(spotId: string): Promise<UnifiedSlotData | null> {
        const allData = await this.getUnifiedData();
        return allData.find(s => s.spotId === spotId) || null;
    }
}
