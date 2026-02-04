
/**
 * Offline Ticket Service
 * Manages manual entry of tickets for walk-ins, government passes, emergency vehicles
 */

export interface OfflineTicket {
    id: string;
    timestamp: Date;
    vehicleNo: string;
    name: string;
    mobile?: string;
    members: number;
    vehicleType: 'CAR' | 'BUS' | 'BIKE' | 'EMERGENCY';
    spotId: string;
    parkingSlotId?: string;
    type: 'OFFLINE_PAID' | 'GOVT_PASS' | 'EMERGENCY' | 'STAFF';
    status: 'ACTIVE' | 'EXITED' | 'CANCELLED';
    createdBy: string; // Admin ID
}

// In-memory store for demo purposes (would be DB in prod)
const OFFLINE_TICKETS: OfflineTicket[] = [];

export class OfflineTicketService {

    /**
     * Create a new offline ticket
     */
    static async createTicket(ticketData: Omit<OfflineTicket, 'id' | 'timestamp' | 'status'>): Promise<OfflineTicket> {
        // 1. Duplicate Vehicle Check (only check ACTIVE tickets)
        const isDuplicate = OFFLINE_TICKETS.some(t =>
            t.vehicleNo.toUpperCase() === ticketData.vehicleNo.toUpperCase() &&
            t.status === 'ACTIVE'
        );

        if (isDuplicate) {
            throw new Error(`Vehicle ${ticketData.vehicleNo} already has an active ticket.`);
        }

        // 2. Create Ticket
        const newTicket: OfflineTicket = {
            ...ticketData,
            id: `OFF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            timestamp: new Date(),
            status: 'ACTIVE',
            vehicleNo: ticketData.vehicleNo.toUpperCase()
        };

        OFFLINE_TICKETS.push(newTicket);
        return newTicket;
    }

    /**
     * Get all tickets for a specific spot
     */
    static async getTicketsBySpot(spotId: string): Promise<OfflineTicket[]> {
        return OFFLINE_TICKETS.filter(t => t.spotId === spotId && t.status === 'ACTIVE');
    }

    /**
     * Get all tickets
     */
    static async getAllTickets(): Promise<OfflineTicket[]> {
        return OFFLINE_TICKETS;
    }

    /**
     * Mark ticket as exited
     */
    static async markExit(ticketId: string): Promise<boolean> {
        const ticket = OFFLINE_TICKETS.find(t => t.id === ticketId);
        if (!ticket) return false;

        ticket.status = 'EXITED';
        return true;
    }

    /**
     * Get stats for dashboard
     */
    static async getStats() {
        return {
            totalToday: OFFLINE_TICKETS.filter(t => t.timestamp.getDate() === new Date().getDate()).length,
            activeNow: OFFLINE_TICKETS.filter(t => t.status === 'ACTIVE').length,
            revenue: OFFLINE_TICKETS
                .filter(t => t.type === 'OFFLINE_PAID' && t.timestamp.getDate() === new Date().getDate())
                .reduce((acc, t) => acc + (t.vehicleType === 'CAR' ? 50 : t.vehicleType === 'BUS' ? 100 : 20), 0)
        };
    }
}
