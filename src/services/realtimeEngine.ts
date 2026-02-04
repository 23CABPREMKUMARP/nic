
export interface LivePoint {
    id: string;
    lat: number;
    lng: number;
    velocity: number;
    heading: number;
    timestamp: number;
}

export class RealtimeEngine {
    private static listeners: Set<(data: any) => void> = new Set();
    private static interval: NodeJS.Timeout | null = null;

    /**
     * Starts the global ticker at 1 second interval
     */
    static startTicker() {
        if (this.interval) return;

        console.log("🚀 Realtime Engine: TICKER STARTED (1s)");
        this.interval = setInterval(async () => {
            const data = await this.broadcastFetch();
            this.listeners.forEach(l => l(data));
        }, 1000);
    }

    private static async broadcastFetch() {
        try {
            const res = await fetch('/api/map/data');
            return await res.json();
        } catch (e) {
            console.error("Realtime fetch failed:", e);
            return null;
        }
    }

    static subscribe(callback: (data: any) => void) {
        this.listeners.add(callback);
        this.startTicker();
        return () => this.listeners.delete(callback);
    }

    /**
     * Predictive GPS: Interpolate position between two points
     */
    static interpolate(p1: [number, number], p2: [number, number], factor: number): [number, number] {
        return [
            p1[0] + (p2[0] - p1[0]) * factor,
            p1[1] + (p2[1] - p1[1]) * factor
        ];
    }
}
