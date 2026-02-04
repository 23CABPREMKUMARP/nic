import { prisma } from "@/lib/prisma";

export interface TrafficInfo {
    speedKmph: number;
    delayMinutes: number;
    status: 'SMOOTH' | 'MODERATE' | 'HEAVY' | 'BLOCKED';
    bestTime: string;
    flowOpacity: number; // For map visualization
    closureReason?: 'NATURAL_DISASTER' | 'ACCIDENT' | 'ROAD_ISSUE' | null;
}

export class TrafficService {
    // Average speeds for Hill Terrain
    private static FREE_FLOW_SPEED = 40;
    private static ROAD_CAPACITY = 500; // Vehicles per hour threshold for "Heavy"

    static async estimateTraffic(locationName: string): Promise<TrafficInfo> {
        // Fetch Admin overrides
        const settings = await prisma.systemSettings.findMany();
        const blockedRoads = settings.find(s => s.key === 'BLOCKED_ROADS')?.value?.split(',') || [];
        const manualStatus = settings.find(s => s.key === `TRAFFIC_STATUS_${locationName.toUpperCase().replace(/\s+/g, '_')}`)?.value;
        const closureReason = settings.find(s => s.key === `CLOSURE_REASON_${locationName.toUpperCase().replace(/\s+/g, '_')}`)?.value as any;

        if (blockedRoads.includes(locationName) || manualStatus === 'BLOCKED') {
            return {
                speedKmph: 0,
                delayMinutes: 999,
                status: 'BLOCKED',
                flowOpacity: 1,
                bestTime: "Road is currently blocked",
                closureReason: closureReason || 'ROAD_ISSUE'
            };
        }

        // 1. Get current vehicle flow estimate
        // Sum of: Recent Arrivals (Last 30 mins) + Expected Arrivals (Next 30 mins)
        const now = new Date();
        const thirtyMinsAgo = new Date(now.getTime() - 30 * 60000);
        const thirtyMinsLater = new Date(now.getTime() + 30 * 60000);

        const activeBookings = await prisma.parkingBooking.count({
            where: {
                facility: { location: { name: locationName } },
                startTime: { gte: thirtyMinsAgo, lte: thirtyMinsLater },
                status: { in: ['BOOKED', 'ARRIVED'] }
            }
        });

        const activePasses = await prisma.pass.count({
            where: {
                toLocation: { contains: locationName, mode: 'insensitive' },
                status: 'ACTIVE',
                visitDate: {
                    gte: new Date(new Date().setHours(0, 0, 0, 0)),
                    lte: new Date(new Date().setHours(23, 59, 59, 999))
                }
            }
        });

        const vehicleCount = activeBookings + (activePasses * 0.2); // Weighted estimate

        // 2. Calculate Speed & Delay
        let speed = this.FREE_FLOW_SPEED;
        let delay = 0;
        let status: TrafficInfo['status'] = (manualStatus as any) || 'SMOOTH';

        if (!manualStatus) {
            if (vehicleCount > this.ROAD_CAPACITY) {
                speed = 10;
                delay = 25;
                status = 'HEAVY';
            } else if (vehicleCount > this.ROAD_CAPACITY * 0.6) {
                speed = 22;
                delay = 12;
                status = 'MODERATE';
            }
        } else {
            // Adjust speed based on manual status
            if (status === 'HEAVY') { speed = 10; delay = 25; }
            if (status === 'MODERATE') { speed = 22; delay = 12; }
        }

        return {
            speedKmph: speed,
            delayMinutes: delay,
            status,
            flowOpacity: status === 'HEAVY' ? 0.9 : status === 'MODERATE' ? 0.6 : 0.3,
            bestTime: this.suggestBestTime()
        };
    }

    private static suggestBestTime(): string {
        const hour = new Date().getHours();
        if (hour >= 10 && hour <= 16) return "After 5:00 PM";
        if (hour < 9) return "Right Now (Early Morning)";
        return "Early Morning (7:00 AM)";
    }
}
