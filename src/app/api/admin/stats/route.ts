import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

import { checkAdmin, unauthorized } from "@/lib/auth-check";

export async function GET() {
    const admin = await checkAdmin();
    if (!admin) return unauthorized();

    try {
        const totalPasses = await prisma.pass.count();
        const activePasses = await prisma.pass.count({ where: { status: 'ACTIVE' } });
        const todayPasses = await prisma.pass.count({
            where: {
                visitDate: {
                    gte: new Date(new Date().setHours(0, 0, 0, 0)),
                    lt: new Date(new Date().setHours(23, 59, 59, 999))
                }
            }
        });

        const parkingOccupied = await prisma.parkingSlot.count({ where: { isOccupied: true } });

        // Recent logs: actually just recent passes for now as logs model is separate but simplistic
        const recentPasses = await prisma.pass.findMany({
            take: 5,
            orderBy: { updatedAt: 'desc' },
            include: { user: true }
        });

        return NextResponse.json({
            totalVisitors: totalPasses,
            activeNow: activePasses,
            todayVisitors: todayPasses,
            parkingOccupied,
            recentActivity: recentPasses
        });
    } catch (error) {
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}
