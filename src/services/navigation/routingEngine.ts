import { OOTY_ROADS, OOTY_SPOTS, OOTY_JUNCTIONS } from "@/data/ooty_map_data";

export interface RouteOptions {
    avoidCrowds: boolean;
    hillOptimized: boolean;
    localRoutes: boolean; // School/Market aware
}

export interface Step {
    instruction: string;
    tamil_instruction: string;
    distance: number;
    alert?: 'HAIRPIN' | 'STEEP_DECLINE' | 'BRAKE_WARNING' | 'ACCIDENT_PRONE' | 'MIST_ZONE';
    coordinate: [number, number];
}

export class RoutingEngine {
    private static BASE_SPEED = 20; // 20km/h average in hills

    static calculateRoute(start: [number, number], end: [number, number], options: RouteOptions) {
        console.log("🛣️ RoutingEngine: Initializing hill-aware routing path...");

        // Basic step simulation with conditional logic
        const isMisty = true; // should come from a weather service
        const steps: Step[] = [
            {
                instruction: "Exit toward primary Ooty connector",
                tamil_instruction: "முக்கிய ஊட்டி இணைப்புச் சாலையை நோக்கிச் செல்லவும்",
                distance: 200,
                coordinate: start
            }
        ];

        // Fog Warning
        if (isMisty) {
            steps.push({
                instruction: "Fog warning: Visibility reduced to 20m. Turn on fog lights.",
                tamil_instruction: "மூடுபனி எச்சரிக்கை: தெரிவுநிலை 20மீ ஆக குறைந்துள்ளது. பனி விளக்குகளை ஒளிரவிடவும்.",
                distance: 0,
                alert: 'MIST_ZONE',
                coordinate: start
            });
        }

        // Logic for Ooty One-Way Loops
        const nearCharringCross = getDistance(start[0], start[1], 11.4145, 76.7032) < 0.5;
        if (nearCharringCross) {
            steps.push({
                instruction: "Follow Police One-Way Loop toward Commercial Road",
                tamil_instruction: "கமர்ஷியல் சாலை நோக்கி ஒருவழிப் பாதையைப் பின்பற்றவும்",
                distance: 600,
                coordinate: [11.4145, 76.7032]
            });
        }

        // Standard Hill Hazards
        steps.push({
            instruction: "Caution: Steep descent ahead. Maintain L2 gear.",
            tamil_instruction: "எச்சரிக்கை: செங்குத்தான இறக்கம். L2 கியரைப் பயன்படுத்தவும்.",
            distance: 800,
            alert: 'STEEP_DECLINE',
            coordinate: [11.4100, 76.7080]
        });

        steps.push({
            instruction: "Hairpin Bend No. 1: Sound horn and watch for uphill traffic.",
            tamil_instruction: "ஊசி வளைவு எண் 1: ஒலி எழுப்பி, மேலே வரும் வாகனங்களைக் கவனிக்கவும்.",
            distance: 100,
            alert: 'HAIRPIN',
            coordinate: [11.4050, 76.7120]
        });

        return {
            steps,
            totalDistance: 1.7,
            estimatedTime: this.calculateETA(1.7, 85, isMisty ? 'MISTY' : 'SUNNY'),
            fuelEfficiencyTip: "Use engine braking (Low Gear) to avoid brake fade in downhill sections."
        };
    }

    private static calculateETA(km: number, density: number, weather: string) {
        let baseMinutes = (km / this.BASE_SPEED) * 60;

        // Crowd impact
        if (density > 80) baseMinutes *= 1.8;
        else if (density > 50) baseMinutes *= 1.3;

        // Weather impact
        if (weather === 'MISTY') baseMinutes *= 1.4;
        if (weather === 'HEAVY_RAIN') baseMinutes *= 2.0;

        return Math.round(baseMinutes);
    }
}

// Simple distance helper for internal logic
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
