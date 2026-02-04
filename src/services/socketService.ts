
/**
 * Simulated Socket Service for Real-time bidirectional communication
 * In a production env, this would connect to a WebSocket server (Pusher/Socket.io)
 */
class SocketService {
    private static instance: SocketService;
    private handlers: { [event: string]: Function[] } = {};

    static getInstance() {
        if (!this.instance) this.instance = new SocketService();
        return this.instance;
    }

    /**
     * Listen for real-time events (CROWD_ALERT, TRAFFIC_UPDATE, REDIRECT_TRIGGER)
     */
    on(event: string, handler: Function) {
        if (!this.handlers[event]) this.handlers[event] = [];
        this.handlers[event].push(handler);
    }

    /**
     * Broadcast an event to all local listeners
     * Used by RealtimeEngine when it detects threshold breaches
     */
    emit(event: string, data: any) {
        // console.log(`[Socket.IO Simulation] Emitting ${event}`, data);
        if (this.handlers[event]) {
            this.handlers[event].forEach(h => h(data));
        }
    }

    /**
     * Simulates background sync for location
     */
    trackBackground(userId: string, location: any) {
        // Send to server in background
        fetch('/api/user/location-sync', {
            method: 'POST',
            body: JSON.stringify({ userId, ...location }),
            keepalive: true // ENSURES it works even during page transition/close
        }).catch(() => { });
    }
}

export const socket = SocketService.getInstance();
