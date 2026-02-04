import { prisma } from "@/lib/prisma";
import { getSmartRecommendations } from "./tourismService";
import { CrowdEngine } from "./crowdEngine";
import { TrafficService } from "./trafficService";
import { OOTY_SPOTS, OOTY_JUNCTIONS } from "@/data/ooty_map_data";

export async function getMapData() {
    // 1. Fetch DB locations (keep for custom/admin spots)
    const dbLocations = await prisma.location.findMany({
        include: {
            parkingSlots: true,
            crowdStats: { orderBy: { timestamp: 'desc' }, take: 24 },
            parkingFacilities: true
        }
    });

    // 2. Merge with Ground Truth OOTY_SPOTS
    const allBaseLocations = [...OOTY_SPOTS, ...dbLocations.filter(db => !OOTY_SPOTS.find(s => s.name === db.name))];

    // 3. Fetch live "AI" suggestions for images/fallback
    const recommendations = await getSmartRecommendations();

    // 4. Deep Analysis with Crowd & Traffic Engines
    const enrichedLocations = await Promise.all(allBaseLocations.map(async (loc: any) => {
        const crowdAnalysis = await CrowdEngine.analyzeLocation(loc.name);
        const trafficInfo = await TrafficService.estimateTraffic(loc.name);

        const staticMatch = recommendations.find(r =>
            r.name.toLowerCase() === loc.name.toLowerCase() ||
            loc.name.toLowerCase().includes(r.name.toLowerCase())
        );

        return {
            ...loc,
            image: loc.image || staticMatch?.image || null,
            crowdLevel: crowdAnalysis.level,
            crowdScore: crowdAnalysis.score,
            factors: crowdAnalysis.factors,
            traffic: trafficInfo,
            recommendationReason: crowdAnalysis.recommendation,
            caption: crowdAnalysis.caption,
            selfieScore: (9.0 + (Math.random() * 0.9)).toFixed(1),
            bestTime: loc.bestTime || (loc.name.includes('Peak') ? '06:30 AM' : loc.name.includes('Lake') ? '04:30 PM' : '09:00 AM'),
            // Find alternatives (Ranking Algorithm: Favor SAFE spots)
            alternatives: (crowdAnalysis.level === 'OVERFLOW' || trafficInfo.status === 'HEAVY')
                ? recommendations
                    .filter(r => r.name !== loc.name)
                    .sort((a, b) => (a.crowdLevel === 'SAFE' ? -1 : 1)) // Rank SAFE high
                    .slice(0, 3)
                : []
        };
    }));

    // 5. Generate Heatmap & Traffic Flow for Map UI
    const heatmapPoints = enrichedLocations.map(l => ({
        lat: l.latitude,
        lng: l.longitude,
        intensity: l.crowdScore / 100,
        level: l.crowdLevel
    }));

    // Simulated Road Network Traffic Flow (Based on Police Connectors)
    const getStatus = (name: string) => enrichedLocations.find(l => l.name.includes(name))?.traffic.status || 'SMOOTH';

    const trafficFlow = [
        { start: [11.4120, 76.6850], end: [11.4145, 76.7032], status: getStatus('Charring'), name: "Finger Post to Charring Cross" },
        { start: [11.4145, 76.7032], end: [11.4085, 76.7120], status: getStatus('Rose'), name: "Charring Cross to Chamundi Jn" },
        { start: [11.4085, 76.7120], end: [11.4050, 76.6960], status: getStatus('Lake'), name: "Chamundi Jn to Bus Stand" },
        { start: [11.4050, 76.6960], end: [11.4050, 76.6910], status: getStatus('Lake'), name: "Bus Stand to Boat House" }
    ];

    return {
        attractions: enrichedLocations.filter(l => l.type === 'ATTRACTION'),
        parking: enrichedLocations.filter(l => l.type === 'PARKING'),
        heatmap: heatmapPoints,
        trafficFlow: trafficFlow,
        junctions: OOTY_JUNCTIONS
    };
}
