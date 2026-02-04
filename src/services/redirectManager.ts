import { CrowdAnalysis, CrowdEngine } from "./crowdEngine";
import { TrafficInfo, TrafficService } from "./trafficService";

export interface RedirectAlert {
    type: 'CROWD' | 'TRAFFIC' | 'CLOSURE';
    severity: 'MEDIUM' | 'CRITICAL';
    message: string;
    suggestion?: string;
}

export class RedirectManager {
    /**
     * Evaluates if a user should be redirected from their current destination
     */
    static async checkRedirect(destinationName: string): Promise<RedirectAlert | null> {
        const crowd = await CrowdEngine.analyzeLocation(destinationName);
        const traffic = await TrafficService.estimateTraffic(destinationName);

        // 1. Emergency Closure (Highest Priority)
        if (traffic.status === 'BLOCKED') {
            return {
                type: 'CLOSURE',
                severity: 'CRITICAL',
                message: `URGENT: Access to ${destinationName} is blocked due to ${traffic.closureReason || 'a road issue'}.`,
                suggestion: "Please select an alternative route or destination."
            };
        }

        // 2. Crowd Overflow (>80% score)
        if (crowd.score > 80 || crowd.level === 'OVERFLOW') {
            return {
                type: 'CROWD',
                severity: 'CRITICAL',
                message: `${destinationName} is experiencing peak crowd overflow.`,
                suggestion: crowd.recommendation
            };
        }

        // 3. Traffic Delay (>20 min)
        if (traffic.delayMinutes > 20 || traffic.status === 'HEAVY') {
            return {
                type: 'TRAFFIC',
                severity: 'MEDIUM',
                message: `Heavy traffic detected near ${destinationName}. Delay: +${traffic.delayMinutes} min.`,
                suggestion: "Consider visiting a nearby spot first to avoid the rush."
            };
        }

        // 4. Parking Full (40% weight of crowd score, but specifically check if parking score is 100)
        if (crowd.factors.parking >= 90) {
            return {
                type: 'TRAFFIC',
                severity: 'MEDIUM',
                message: `Parking at ${destinationName} is nearly full.`,
                suggestion: "We recommend checking nearby parking hubs."
            };
        }

        return null;
    }

    /**
     * Logic to find the best alternative based on current conditions
     */
    static async suggestAlternates(currentLocation: string, userLat: number, userLng: number) {
        // This leverages mapService logic but can be more specific to the user's current GPS
        // For now we use the existing mapService ranking which favors SAFE spots
    }
}
