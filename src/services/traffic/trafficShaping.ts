/**
 * Traffic Shaping - Active traffic behavior management
 * Controls recommendations and routing based on congestion levels
 */

import { OOTY_SPOTS } from '@/data/ootyMapData';
import { CrowdEngine } from '@/services/crowdEngine';

// ============================================
// TYPES
// ============================================

export type TrafficLevel = 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';

export interface TrafficAction {
    level: TrafficLevel;
    recommend: boolean;
    rankingModifier: number; // Multiplier for ranking (1.0 = normal)
    showAlternatives: boolean;
    blockFromSuggestions: boolean;
    alertUsers: boolean;
    message: {
        en: string;
        ta: string;
    };
}

export interface AlternativeSpot {
    id: string;
    name: string;
    tamilName: string;
    distance: number;
    currentScore: number;
    level: TrafficLevel;
    reason: string;
}

// ============================================
// THRESHOLDS
// ============================================

const THRESHOLDS = {
    GREEN: { min: 0, max: 40 },
    YELLOW: { min: 41, max: 70 },
    ORANGE: { min: 71, max: 85 },
    RED: { min: 86, max: 100 }
};

// ============================================
// TRAFFIC SHAPING CLASS
// ============================================

export class TrafficShaping {
    /**
     * Get traffic level from score
     */
    static getLevel(score: number): TrafficLevel {
        if (score <= THRESHOLDS.GREEN.max) return 'GREEN';
        if (score <= THRESHOLDS.YELLOW.max) return 'YELLOW';
        if (score <= THRESHOLDS.ORANGE.max) return 'ORANGE';
        return 'RED';
    }

    /**
     * Get action based on traffic level
     */
    static getAction(level: TrafficLevel): TrafficAction {
        switch (level) {
            case 'GREEN':
                return {
                    level: 'GREEN',
                    recommend: true,
                    rankingModifier: 1.0,
                    showAlternatives: false,
                    blockFromSuggestions: false,
                    alertUsers: false,
                    message: {
                        en: 'Light traffic, good time to visit',
                        ta: 'குறைந்த போக்குவரத்து, பார்க்க நல்ல நேரம்'
                    }
                };

            case 'YELLOW':
                return {
                    level: 'YELLOW',
                    recommend: true,
                    rankingModifier: 0.8, // Lower ranking
                    showAlternatives: true,
                    blockFromSuggestions: false,
                    alertUsers: false,
                    message: {
                        en: 'Moderate crowd, alternatives available',
                        ta: 'மிதமான கூட்டம், மாற்று இடங்கள் உள்ளன'
                    }
                };

            case 'ORANGE':
                return {
                    level: 'ORANGE',
                    recommend: false,
                    rankingModifier: 0.4, // Significantly lower
                    showAlternatives: true,
                    blockFromSuggestions: false,
                    alertUsers: true,
                    message: {
                        en: 'Heavy rush, consider alternatives',
                        ta: 'அதிக கூட்டம், மாற்று இடங்களை பரிசீலிக்கவும்'
                    }
                };

            case 'RED':
                return {
                    level: 'RED',
                    recommend: false,
                    rankingModifier: 0.1, // Almost exclude
                    showAlternatives: true,
                    blockFromSuggestions: true,
                    alertUsers: true,
                    message: {
                        en: 'Overcrowded! Visit not recommended now',
                        ta: 'அதிக நெரிசல்! இப்போது பார்வையிட பரிந்துரைக்கப்படவில்லை'
                    }
                };
        }
    }

    /**
     * Get action from score directly
     */
    static getActionFromScore(score: number): TrafficAction {
        return this.getAction(this.getLevel(score));
    }

    /**
     * Get alternative spots for a crowded location
     */
    static async getAlternatives(
        spotId: string,
        limit: number = 3
    ): Promise<AlternativeSpot[]> {
        const currentSpot = OOTY_SPOTS.find(s => s.id === spotId);
        if (!currentSpot) return [];

        // Get all spots with their congestion
        const alternatives: AlternativeSpot[] = [];

        for (const spot of OOTY_SPOTS) {
            if (spot.id === spotId) continue;

            // Only suggest similar categories
            if (spot.category !== currentSpot.category && spot.type !== currentSpot.type) {
                continue;
            }

            try {
                const crowd = await CrowdEngine.analyzeLocation(spot.name);
                const level = this.getLevel(crowd.score);

                // Only suggest GREEN or YELLOW spots
                if (level === 'RED' || level === 'ORANGE') continue;

                // Calculate distance
                const distance = this.calculateDistance(
                    currentSpot.latitude, currentSpot.longitude,
                    spot.latitude, spot.longitude
                );

                alternatives.push({
                    id: spot.id,
                    name: spot.name,
                    tamilName: spot.tamil_name,
                    distance: Math.round(distance * 10) / 10,
                    currentScore: crowd.score,
                    level,
                    reason: this.getAlternativeReason(spot, level)
                });
            } catch {
                // Skip if can't get crowd data
            }
        }

        // Sort by score (lower is better) and distance
        return alternatives
            .sort((a, b) => {
                const scoreDiff = a.currentScore - b.currentScore;
                if (Math.abs(scoreDiff) > 20) return scoreDiff;
                return a.distance - b.distance;
            })
            .slice(0, limit);
    }

    /**
     * Get reason for suggesting an alternative
     */
    private static getAlternativeReason(spot: any, level: TrafficLevel): string {
        if (level === 'GREEN') {
            return 'Very peaceful now';
        }
        return 'Less crowded option';
    }

    /**
     * Calculate distance between two points (km)
     */
    private static calculateDistance(
        lat1: number, lon1: number,
        lat2: number, lon2: number
    ): number {
        const R = 6371; // Earth's radius in km
        const dLat = this.toRad(lat2 - lat1);
        const dLon = this.toRad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private static toRad(deg: number): number {
        return deg * (Math.PI / 180);
    }

    /**
     * Apply shaping to a list of spots for recommendations
     */
    static async applyShaping(spots: any[]): Promise<any[]> {
        const shaped = await Promise.all(
            spots.map(async (spot) => {
                try {
                    const crowd = await CrowdEngine.analyzeLocation(spot.name);
                    const level = this.getLevel(crowd.score);
                    const action = this.getAction(level);

                    // Skip if blocked
                    if (action.blockFromSuggestions) {
                        return null;
                    }

                    return {
                        ...spot,
                        congestionScore: crowd.score,
                        congestionLevel: level,
                        rankingScore: (spot.rankingScore || 100) * action.rankingModifier,
                        showAlternatives: action.showAlternatives,
                        trafficMessage: action.message
                    };
                } catch {
                    return spot;
                }
            })
        );

        // Filter nulls and sort by ranking
        return shaped
            .filter(s => s !== null)
            .sort((a, b) => (b.rankingScore || 0) - (a.rankingScore || 0));
    }

    /**
     * Generate redirect message for a crowded spot
     */
    static generateRedirectMessage(
        crowdedSpot: string,
        score: number,
        alternatives: AlternativeSpot[]
    ): { en: string; ta: string } {
        const altNames = alternatives.slice(0, 2).map(a => a.name).join(' & ');

        return {
            en: `${crowdedSpot} heavy rush – ${score}%\n${altNames} peaceful now`,
            ta: `${crowdedSpot} அதிக நெரிசல் – ${score}%\n${altNames} இப்போது அமைதியாக உள்ளது`
        };
    }

    /**
     * Check if dynamic reroute is needed
     */
    static shouldReroute(
        previousScore: number,
        currentScore: number,
        threshold: number = 20
    ): boolean {
        const increase = currentScore - previousScore;
        return increase >= threshold || currentScore >= THRESHOLDS.ORANGE.min;
    }
}

export default TrafficShaping;
