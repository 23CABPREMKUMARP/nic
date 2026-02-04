/**
 * Crowd Router - Crowd-aware rerouting logic
 * Integrates with CrowdEngine to detect overcrowding and suggest alternatives
 */

import { CrowdEngine, CrowdLevel } from '@/services/crowdEngine';
import { TrafficService, TrafficInfo } from '@/services/trafficService';
import { OOTY_SPOTS, getDistance } from '@/data/ootyMapData';

// ============================================
// TYPES
// ============================================

export interface RerouteDecision {
    shouldReroute: boolean;
    reason: 'CROWD' | 'TRAFFIC' | 'PARKING' | 'ROAD_CLOSED' | null;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    message: string;
    tamilMessage: string;
    alternatives: AlternativeSpot[];
}

export interface AlternativeSpot {
    id: string;
    name: string;
    tamilName: string;
    distance: number;
    crowdLevel: CrowdLevel;
    parkingAvailable: boolean;
    reason: string;
}

// ============================================
// CROWD ROUTER CLASS
// ============================================

export class CrowdRouter {
    // Thresholds for rerouting
    private static CROWD_THRESHOLD = 80; // Trigger reroute if crowd score > 80
    private static TRAFFIC_DELAY_THRESHOLD = 20; // minutes
    private static PARKING_THRESHOLD = 90; // % full

    /**
     * Check if destination needs rerouting
     */
    static async checkReroute(destinationName: string): Promise<RerouteDecision> {
        // Get crowd analysis
        const crowdAnalysis = await CrowdEngine.analyzeLocation(destinationName);

        // Get traffic info
        const trafficInfo = await TrafficService.estimateTraffic(destinationName);

        // Check road closure
        if (trafficInfo.status === 'BLOCKED') {
            return {
                shouldReroute: true,
                reason: 'ROAD_CLOSED',
                severity: 'CRITICAL',
                message: `Road to ${destinationName} is blocked. Finding alternative route.`,
                tamilMessage: `${destinationName} செல்லும் சாலை மூடப்பட்டுள்ளது. மாற்று வழி தேடுகிறேன்.`,
                alternatives: await this.findAlternatives(destinationName, 'ROAD_CLOSED')
            };
        }

        // Check crowd overflow
        if (crowdAnalysis.score > this.CROWD_THRESHOLD || crowdAnalysis.level === 'OVERFLOW') {
            return {
                shouldReroute: true,
                reason: 'CROWD',
                severity: crowdAnalysis.score > 90 ? 'CRITICAL' : 'HIGH',
                message: `${destinationName} is overcrowded (${crowdAnalysis.score}% capacity). Suggesting alternatives.`,
                tamilMessage: `${destinationName} நிரம்பி வழிகிறது (${crowdAnalysis.score}% கொள்ளளவு). மாற்று இடங்கள் பரிந்துரைக்கிறேன்.`,
                alternatives: await this.findAlternatives(destinationName, 'CROWD')
            };
        }

        // Check traffic delay
        if (trafficInfo.delayMinutes > this.TRAFFIC_DELAY_THRESHOLD || trafficInfo.status === 'HEAVY') {
            return {
                shouldReroute: true,
                reason: 'TRAFFIC',
                severity: 'MEDIUM',
                message: `Heavy traffic to ${destinationName}. Expected delay: +${trafficInfo.delayMinutes} minutes.`,
                tamilMessage: `${destinationName} செல்ல கடுமையான போக்குவரத்து. எதிர்பார்க்கப்படும் தாமதம்: +${trafficInfo.delayMinutes} நிமிடங்கள்.`,
                alternatives: await this.findAlternatives(destinationName, 'TRAFFIC')
            };
        }

        // Check parking
        if (crowdAnalysis.factors.parking > this.PARKING_THRESHOLD) {
            return {
                shouldReroute: true,
                reason: 'PARKING',
                severity: 'MEDIUM',
                message: `Parking at ${destinationName} is nearly full (${crowdAnalysis.factors.parking}%).`,
                tamilMessage: `${destinationName} வாகன நிறுத்துமிடம் கிட்டத்தட்ட நிரம்பியது (${crowdAnalysis.factors.parking}%).`,
                alternatives: await this.findAlternatives(destinationName, 'PARKING')
            };
        }

        // No reroute needed
        return {
            shouldReroute: false,
            reason: null,
            severity: 'LOW',
            message: 'Route is clear. No rerouting needed.',
            tamilMessage: 'வழி தெளிவாக உள்ளது. மாற்று வழி தேவையில்லை.',
            alternatives: []
        };
    }

    /**
     * Find alternative spots based on reroute reason
     */
    static async findAlternatives(
        currentDestination: string,
        reason: 'CROWD' | 'TRAFFIC' | 'PARKING' | 'ROAD_CLOSED'
    ): Promise<AlternativeSpot[]> {
        const currentSpot = OOTY_SPOTS.find(s =>
            s.name.toLowerCase().includes(currentDestination.toLowerCase())
        );

        if (!currentSpot) {
            return [];
        }

        // Get alternatives (same category preferred)
        const alternatives: AlternativeSpot[] = [];

        for (const spot of OOTY_SPOTS) {
            if (spot.id === currentSpot.id) continue;

            // Get crowd data for this spot
            const crowdData = await CrowdEngine.analyzeLocation(spot.name);

            // Only suggest if crowd is safe or medium
            if (crowdData.level === 'OVERFLOW') continue;

            const distance = getDistance(
                currentSpot.latitude, currentSpot.longitude,
                spot.latitude, spot.longitude
            );

            // Prefer nearby spots (< 10km)
            if (distance > 10) continue;

            alternatives.push({
                id: spot.id,
                name: spot.name,
                tamilName: spot.tamil_name,
                distance: Math.round(distance * 10) / 10,
                crowdLevel: crowdData.level,
                parkingAvailable: crowdData.factors.parking < 80,
                reason: this.getAlternativeReason(spot, crowdData, currentSpot)
            });
        }

        // Sort by crowd level (SAFE first), then by distance
        return alternatives
            .sort((a, b) => {
                const levelOrder = { 'SAFE': 0, 'MEDIUM': 1, 'OVERFLOW': 2 };
                const levelDiff = levelOrder[a.crowdLevel] - levelOrder[b.crowdLevel];
                if (levelDiff !== 0) return levelDiff;
                return a.distance - b.distance;
            })
            .slice(0, 3); // Return top 3
    }

    /**
     * Generate reason for alternative suggestion
     */
    private static getAlternativeReason(
        spot: any,
        crowdData: any,
        currentSpot: any
    ): string {
        const reasons: string[] = [];

        if (crowdData.level === 'SAFE') {
            reasons.push('Low crowd');
        }

        if (crowdData.factors.parking < 50) {
            reasons.push('Easy parking');
        }

        if (spot.category === currentSpot.category) {
            reasons.push(`Similar experience (${spot.category})`);
        }

        if (reasons.length === 0) {
            reasons.push('Good alternative');
        }

        return reasons.join(', ');
    }

    /**
     * Get real-time suggestion based on current conditions
     */
    static async getSuggestion(
        userLat: number,
        userLng: number,
        preferences?: { category?: string; avoidCrowd?: boolean }
    ): Promise<AlternativeSpot[]> {
        const suggestions: AlternativeSpot[] = [];

        for (const spot of OOTY_SPOTS) {
            // Filter by category if specified
            if (preferences?.category && spot.category !== preferences.category) {
                continue;
            }

            const crowdData = await CrowdEngine.analyzeLocation(spot.name);

            // Skip crowded spots if avoidCrowd is true
            if (preferences?.avoidCrowd && crowdData.level === 'OVERFLOW') {
                continue;
            }

            const distance = getDistance(userLat, userLng, spot.latitude, spot.longitude);

            suggestions.push({
                id: spot.id,
                name: spot.name,
                tamilName: spot.tamil_name,
                distance: Math.round(distance * 10) / 10,
                crowdLevel: crowdData.level,
                parkingAvailable: crowdData.factors.parking < 80,
                reason: crowdData.recommendation
            });
        }

        // Sort by crowd level, then distance
        return suggestions
            .sort((a, b) => {
                const levelOrder = { 'SAFE': 0, 'MEDIUM': 1, 'OVERFLOW': 2 };
                const levelDiff = levelOrder[a.crowdLevel] - levelOrder[b.crowdLevel];
                if (levelDiff !== 0) return levelDiff;
                return a.distance - b.distance;
            })
            .slice(0, 5);
    }
}

export default CrowdRouter;
