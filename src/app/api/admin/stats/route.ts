import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

import { checkAdmin, unauthorized } from "@/lib/auth-check";

export async function GET() {
    const admin = await checkAdmin();
    if (!admin) return unauthorized();

    try {
        const [totalPasses, activePasses, todayPasses, parkingOccupied, revenueData, offlineStats] = await Promise.all([
            prisma.pass.count(),
            prisma.pass.count({ where: { status: 'ACTIVE' } }),
            prisma.pass.count({
                where: {
                    visitDate: {
                        gte: new Date(new Date().setHours(0, 0, 0, 0)),
                        lt: new Date(new Date().setHours(23, 59, 59, 999))
                    }
                }
            }),
            prisma.parkingSlot.count({ where: { isOccupied: true } }),
            prisma.parkingBooking.aggregate({
                _sum: { amount: true },
                where: { paymentStatus: 'PAID' }
            }),
            // Use local service-like logic if possible, or direct prisma
            prisma.offlineTicket.aggregate({
                _sum: { members: true },
                _count: { id: true },
                where: {
                    createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
                }
            })
        ]);

        // Calculate Offline Revenue (approx)
        const offlineRevenueData = await prisma.offlineTicket.findMany({
            where: {
                type: 'OFFLINE_PAID',
                createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
            },
            select: { vehicleType: true }
        });
        const offlineRevenue = offlineRevenueData.reduce((acc: number, t: { vehicleType: string }) => {
            const price = t.vehicleType === 'CAR' ? 50 : t.vehicleType === 'BUS' ? 100 : 20;
            return acc + price;
        }, 0);

        const recentPasses = await prisma.pass.findMany({
            take: 5,
            orderBy: { updatedAt: 'desc' },
            include: { user: true }
        });

        const passRevenue = totalPasses * 50;
        const totalRevenue = (revenueData._sum.amount || 0) + passRevenue + offlineRevenue;

        return NextResponse.json({
            totalVisitors: totalPasses + (offlineStats._count.id || 0),
            activeNow: activePasses + (await prisma.offlineTicket.count({ where: { status: 'ACTIVE' } })),
            todayVisitors: todayPasses + (offlineStats._count.id || 0),
            parkingOccupied,
            totalRevenue,
            recentActivity: recentPasses
        });
    } catch (error) {
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}
