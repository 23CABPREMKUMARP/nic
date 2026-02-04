import { prisma } from "@/lib/prisma";
import { CrowdEngine } from "@/services/crowdEngine";
import { TrafficService } from "@/services/trafficService";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const locations = await prisma.location.findMany({
            where: { type: 'PARKING' },
            take: 3
        });

        const stats = await Promise.all(locations.map(async loc => {
            const crowd = await CrowdEngine.analyzeLocation(loc.name);
            const traffic = await TrafficService.estimateTraffic(loc.name);
            return {
                name: loc.name,
                status: crowd.level === 'SAFE' ? 'Available' : crowd.level === 'OVERFLOW' ? 'Full' : 'Busy',
                traffic: traffic.status
            };
        }));

        const alerts = [];
        // Add a traffic alert if any major spot is HEAVY
        const majorSpots = ['Ooty Lake', 'Botanical Garden'];
        for (const spot of majorSpots) {
            const traffic = await TrafficService.estimateTraffic(spot);
            if (traffic.status === 'HEAVY') {
                alerts.push({
                    type: 'Traffic Alert',
                    message: `Heavy congestion detected near ${spot}. Delay: +${traffic.delayMinutes} min.`
                });
            }
        }

        // Add weather alert
        const weatherScore = await (CrowdEngine as any).getWeatherScore('Ooty');
        if (weatherScore < 30) {
            alerts.push({
                type: 'Weather Alert',
                message: 'Light rain detected in Ooty. Carry an umbrella.'
            });
        }

        return NextResponse.json({ stats, alerts });
    } catch (e) {
        return NextResponse.json({ error: "Failed to fetch dashboard stats" }, { status: 500 });
    }
}
