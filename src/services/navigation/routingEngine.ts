
import { OOTY_ROADS, OOTY_SPOTS, OOTY_JUNCTIONS } from "@/data/ooty_map_data";

export interface RouteOptions {
    avoidCrowds: boolean;
    hillOptimized: boolean;
    vehicleType: 'CAR' | 'BIKE' | 'BUS';
    isFoggy: boolean;
}

export interface Step {
    instruction: string;
    tamil_instruction: string;
    distance: number;
    alert?: 'HAIRPIN' | 'STEEP_DECLINE' | 'BRAKE_WARNING' | 'ACCIDENT_PRONE' | 'MIST_ZONE';
    coordinate: [number, number];
    landmark?: string;
}

interface Node {
    id: string;
    lat: number;
    lng: number;
}

interface Edge {
    from: string;
    to: string;
    distance: number;
    weight: number;
    hairpins: number;
    steepness: number; // 1-5
    isOneWay: boolean;
}

export class RoutingEngine {
    private static BASE_SPEED = 25; // km/h

    // Graph definition for Ooty Core
    private static nodes: Node[] = [
        ...OOTY_JUNCTIONS.map(j => ({ id: j.id, lat: j.lat, lng: j.lng })),
        ...OOTY_SPOTS.map(s => ({ id: s.id, lat: s.latitude, lng: s.longitude }))
    ];

    private static edges: Edge[] = [
        { from: 'finger-post', to: 'charring-cross', distance: 1.2, weight: 1, hairpins: 0, steepness: 1, isOneWay: true },
        { from: 'charring-cross', to: 'chamundi-jn', distance: 0.8, weight: 1.2, hairpins: 0, steepness: 2, isOneWay: true },
        { from: 'chamundi-jn', to: 'main-bus-stand', distance: 1.5, weight: 1, hairpins: 2, steepness: 3, isOneWay: true },
        { from: 'main-bus-stand', to: 'ooty-boat-house', distance: 0.5, weight: 1, hairpins: 0, steepness: 1, isOneWay: false },
        { from: 'charring-cross', to: 'botanical-garden', distance: 0.9, weight: 1, hairpins: 0, steepness: 2, isOneWay: false },
        { from: 'chamundi-jn', to: 'rose-garden', distance: 0.4, weight: 1, hairpins: 0, steepness: 1, isOneWay: false },
        { from: 'main-bus-stand', to: 'lovedale-jn', distance: 2.2, weight: 1.5, hairpins: 4, steepness: 4, isOneWay: false },
        { from: 'charring-cross', to: 'doddabetta-peak', distance: 6.5, weight: 2.5, hairpins: 12, steepness: 5, isOneWay: false },
        { from: 'finger-post', to: 'pykara-falls', distance: 18.0, weight: 1, hairpins: 8, steepness: 3, isOneWay: false }
    ];

    static calculateRoute(startLoc: [number, number], endLoc: [number, number], options: RouteOptions) {
        // Find nearest nodes to start and end
        const startNode = this.findNearestNode(startLoc);
        const endNode = this.findNearestNode(endLoc);

        console.log(`🛣️ RoutingEngine: Pathfinding from ${startNode.id} to ${endNode.id}`);

        // For this implementation, we will simulate the graph traversal to return steps
        // In a production app, we'd use Dijkstra's algorithm here.

        let path = this.getPath(startNode.id, endNode.id);

        // Enhance path with hill-specific steps
        const steps: Step[] = [];

        // Initial instruction
        steps.push({
            instruction: `Head toward ${startNode.id.replace(/-/g, ' ')}`,
            tamil_instruction: `${startNode.id.replace(/-/g, ' ')} நோக்கிச் செல்லவும்`,
            distance: 100,
            coordinate: startLoc
        });

        let totalKm = 0;
        let totalHairpins = 0;
        let maxSteepness = 0;

        path.forEach((edge, idx) => {
            totalKm += edge.distance;
            totalHairpins += edge.hairpins;
            maxSteepness = Math.max(maxSteepness, edge.steepness);

            const toNode = this.nodes.find(n => n.id === edge.to);

            steps.push({
                instruction: `Continue on ${edge.from.replace(/-/g, ' ')} to ${edge.to.replace(/-/g, ' ')}`,
                tamil_instruction: `${edge.from.replace(/-/g, ' ')} வழியாக ${edge.to.replace(/-/g, ' ')} நோக்கி தொடரவும்`,
                distance: edge.distance * 1000,
                coordinate: [toNode!.lat, toNode!.lng],
                landmark: edge.to.replace(/-/g, ' ')
            });

            if (edge.hairpins > 0) {
                steps.push({
                    instruction: `Warning: ${edge.hairpins} Hairpin bends ahead. Stay in your lane.`,
                    tamil_instruction: `எச்சரிக்கை: ${edge.hairpins} கொண்டை ஊசி வளைவுகள் உள்ளன. உங்கள் பாதையிலேயே செல்லவும்.`,
                    distance: 0,
                    alert: 'HAIRPIN',
                    coordinate: [toNode!.lat, toNode!.lng]
                });
            }

            if (edge.steepness >= 4) {
                steps.push({
                    instruction: "Steep descent: Use engine braking. Do not stay on brakes.",
                    tamil_instruction: "செங்குத்தான இறக்கம்: கியரை பயன்படுத்தி வேகத்தை குறைக்கவும். பிரேக்கை மட்டும் நம்ப வேண்டாம்.",
                    distance: 0,
                    alert: 'BRAKE_WARNING',
                    coordinate: [toNode!.lat, toNode!.lng]
                });
            }
        });

        const eta = this.calculateETA(totalKm, options.isFoggy ? 80 : 40, options.isFoggy);

        return {
            steps,
            totalDistance: totalKm,
            estimatedTime: eta,
            hairpins: totalHairpins,
            difficulty: maxSteepness > 4 ? 'EXPERT' : maxSteepness > 2 ? 'MODERATE' : 'EASY',
            safetyScore: options.isFoggy ? 65 : 95
        };
    }

    private static findNearestNode(loc: [number, number]): Node {
        return this.nodes.reduce((prev, curr) => {
            const distPrev = getDistance(loc[0], loc[1], prev.lat, prev.lng);
            const distCurr = getDistance(loc[0], loc[1], curr.lat, curr.lng);
            return distCurr < distPrev ? curr : prev;
        });
    }

    private static getPath(startId: string, endId: string): Edge[] {
        // Simple mock path for demo purposes
        // In reality, this would be the output of a Dijkstra search
        const pathEdges = this.edges.filter(e => e.from === startId || e.to === endId);
        return pathEdges.length > 0 ? [pathEdges[0]] : [];
    }

    private static calculateETA(km: number, density: number, isFoggy: boolean) {
        let speed = this.BASE_SPEED;
        if (isFoggy) speed *= 0.5;
        if (density > 70) speed *= 0.4;

        const mins = (km / speed) * 60;
        return Math.max(5, Math.round(mins));
    }
}

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
