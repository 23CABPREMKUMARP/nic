
import { socket } from "./socketService";
import { RealtimeEngine } from "./realtimeEngine";

export class RedirectLive {
    private static THRESHOLDS = {
        CROWD_SCORE: 85,
        TRAFFIC_DELAY: 20,
        PARKING_FULL: 95
    };

    /**
     * Watches the live data stream and triggers instant socket redirs
     */
    static initWatcher() {
        RealtimeEngine.subscribe((data) => {
            if (!data) return;

            // Check attractions
            data.attractions.forEach((spot: any) => {
                const shouldRedirect =
                    spot.crowdScore > this.THRESHOLDS.CROWD_SCORE ||
                    spot.traffic?.delayMinutes > this.THRESHOLDS.TRAFFIC_DELAY ||
                    spot.factors?.parking > this.THRESHOLDS.PARKING_FULL;

                if (shouldRedirect) {
                    socket.emit('REDIRECT_TRIGGER', {
                        spotId: spot.id,
                        name: spot.name,
                        reason: spot.crowdLevel === 'OVERFLOW' ? 'Severe Overcrowding' : 'Heavy Traffic Access',
                        alternatives: spot.alternatives
                    });
                }
            });
        });
    }
}
