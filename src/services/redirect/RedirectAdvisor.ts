/**
 * Redirect Advisor - Intelligent Tourist Redirection Engine
 * Suggests alternatives when destinations are crowded
 */

import { TrafficEngine } from '@/services/traffic/trafficEngine';
import { OOTY_SPOTS, getDistance, getParkingForSpot, getSpotById } from '@/data/ootyMapData';

export interface SuggestionCard {
    originalSpotId: string;
    suggestedSpot: {
        id: string;
        name: string;
        image: string;
        category: string;
    };
    crowdScore: number; // 0-100
    parkingAvailable: number; // slots
    reason: string;
    distanceDiff: string; // e.g. "+2 km"
}

export class RedirectAdvisor {
    private static readonly CROWD_THRESHOLD = 71; // High congestion threshold

    /**
     * Check if a spot needs redirection and provide alternatives
     */
    static async checkAndSuggest(targetSpotId: string): Promise<SuggestionCard | null> {
        const congestion = await TrafficEngine.getCongestionScore(targetSpotId);

        // If traffic is manageable, no redirect needed
        if (congestion.score < this.CROWD_THRESHOLD) {
            return null;
        }

        // Find alternatives
        return this.findBestAlternative(targetSpotId, congestion.score);
    }

    /**
     * Find the best alternative spot based on category and current crowd levels
     */
    private static async findBestAlternative(originalId: string, originalScore: number): Promise<SuggestionCard | null> {
        const original = getSpotById(originalId);
        if (!original) return null;

        // Get all spots in same category
        const candidates = OOTY_SPOTS.filter(s =>
            s.id !== originalId &&
            s.category === original.category
        );

        // Analyze candidates
        let bestCandidate = null;
        let lowestScore = 100;

        for (const spot of candidates) {
            const scoreData = await TrafficEngine.getCongestionScore(spot.id);

            // Initial filter: Must be significantly better
            if (scoreData.score < 50 && scoreData.score < lowestScore) {
                lowestScore = scoreData.score;
                bestCandidate = spot;
            }
        }

        // Detailed check for best candidate
        if (bestCandidate) {
            const parking = getParkingForSpot(bestCandidate.id);
            const parkingSlots = parking ? (parking.totalSlots - (parking.totalSlots * (lowestScore / 100))) : 0;

            // Calculate distance difference
            const distOriginal = getDistance(11.41, 76.69, original.latitude, original.longitude); // From center (approx)
            const distNew = getDistance(11.41, 76.69, bestCandidate.latitude, bestCandidate.longitude);
            const diff = (distNew - distOriginal).toFixed(1);
            const diffStr = distNew > distOriginal ? `+${diff} km` : `${diff} km`;

            return {
                originalSpotId: originalId,
                suggestedSpot: {
                    id: bestCandidate.id,
                    name: bestCandidate.name,
                    image: bestCandidate.image,
                    category: bestCandidate.category
                },
                crowdScore: lowestScore,
                parkingAvailable: Math.floor(parkingSlots),
                reason: `${original.name} is crowded (${originalScore}%)`,
                distanceDiff: diffStr
            };
        }

        return null; // No good alternatives found
    }
}
