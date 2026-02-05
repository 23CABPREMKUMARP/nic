
import { prisma } from '@/lib/prisma';

/**
 * Offline Ticket Service
 * Manages database entry of tickets for walk-ins, government passes, emergency vehicles
 */

export interface OfflineTicket {
    id: string;
    timestamp: Date;
    vehicleNo: string;
    name: string;
    mobile?: string | null;
    members: number;
    vehicleType: string;
    spotId: string;
    type: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
}

export class OfflineTicketService {

    /**
     * Create a new offline ticket
     */
    static async createTicket(ticketData: any) {
        // 1. Duplicate Vehicle Check (only check ACTIVE tickets)
        const existingTicket = await prisma.offlineTicket.findFirst({
            where: {
                vehicleNo: ticketData.vehicleNo.toUpperCase(),
                status: 'ACTIVE'
            }
        });

        if (existingTicket) {
            throw new Error(`Vehicle ${ticketData.vehicleNo} already has an active ticket.`);
        }

        // 2. Create Ticket
        return await prisma.offlineTicket.create({
            data: {
                ...ticketData,
                vehicleNo: ticketData.vehicleNo.toUpperCase(),
                status: 'ACTIVE'
            }
        });
    }

    /**
     * Get all tickets for a specific spot
     */
    static async getTicketsBySpot(spotId: string) {
        return await prisma.offlineTicket.findMany({
            where: { spotId, status: 'ACTIVE' },
            orderBy: { createdAt: 'desc' }
        });
    }

    /**
     * Get all tickets
     */
    static async getAllTickets() {
        return await prisma.offlineTicket.findMany({
            orderBy: { createdAt: 'desc' }
        });
    }

    /**
     * Verify/Search for a ticket (Offline or Online Parking)
     */
    static async verifyTicket(query: string) {
        const q = query.toUpperCase();

        // 1. Check Offline Tickets
        const offlineTicket = await prisma.offlineTicket.findFirst({
            where: {
                OR: [
                    { id: { contains: q, mode: 'insensitive' } },
                    { vehicleNo: { contains: q, mode: 'insensitive' } }
                ]
            },
            orderBy: { createdAt: 'desc' }
        });

        if (offlineTicket) {
            return { ...offlineTicket, source: 'OFFLINE' };
        }

        // 2. Check Online Parking Bookings
        const onlineBooking = await prisma.parkingBooking.findFirst({
            where: {
                OR: [
                    { id: { contains: q, mode: 'insensitive' } },
                    { vehicleNo: { contains: q, mode: 'insensitive' } },
                    { qrCode: { contains: q, mode: 'insensitive' } }
                ]
            },
            include: {
                facility: {
                    include: { location: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        if (onlineBooking) {
            return {
                ...onlineBooking,
                source: 'ONLINE',
                // Map fields for UI consistency if needed, but let's keep them and handle in UI
                name: onlineBooking.vehicleNo, // Placeholder or fetch user name
                spotId: onlineBooking.facility.location.name,
                type: 'ONLINE_BOOKING',
            };
        }

        return null;
    }

    /**
     * Mark ticket as exited
     */
    static async markExit(id: string, source: string = 'OFFLINE') {
        if (source === 'ONLINE') {
            return await prisma.parkingBooking.update({
                where: { id },
                data: {
                    status: 'COMPLETED',
                    paymentStatus: 'COMPLETED',
                    checkOutTime: new Date()
                }
            });
        }

        return await prisma.offlineTicket.update({
            where: { id },
            data: { status: 'EXITED' }
        });
    }

    /**
     * Get stats for dashboard (including offline data)
     */
    static async getStats() {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const [totalToday, activeNow, revenueData] = await Promise.all([
            prisma.offlineTicket.count({
                where: { createdAt: { gte: todayStart } }
            }),
            prisma.offlineTicket.count({
                where: { status: 'ACTIVE' }
            }),
            prisma.offlineTicket.findMany({
                where: {
                    type: 'OFFLINE_PAID',
                    createdAt: { gte: todayStart }
                },
                select: { vehicleType: true }
            })
        ]);

        const revenue = revenueData.reduce((acc: number, t: { vehicleType: string }) => {
            const price = t.vehicleType === 'CAR' ? 50 : t.vehicleType === 'BUS' ? 100 : 20;
            return acc + price;
        }, 0);

        return {
            totalToday,
            activeNow,
            revenue
        };
    }
}
