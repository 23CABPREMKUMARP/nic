import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const locations = await prisma.location.findMany({
            where: { type: "ATTRACTION" }, // Assuming parking is linked to attractions
            include: {
                parkingFacilities: true
            }
        });
        return NextResponse.json({ locations });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }
}
