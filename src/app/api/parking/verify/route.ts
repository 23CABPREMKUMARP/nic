import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const { qrCode } = await req.json();

        if (!qrCode) {
            return NextResponse.json({ error: "No QR Code" }, { status: 400 });
        }

        const booking = await prisma.parkingBooking.findUnique({
            where: { qrCode },
            include: {
                user: true,
                facility: {
                    include: { location: true }
                }
            }
        });

        if (!booking) {
            return NextResponse.json({ error: "Invalid Booking" }, { status: 404 });
        }

        // Check Logic
        // 1. Is it already used?
        if (booking.status === 'ARRIVED' || booking.status === 'COMPLETED') {
            return NextResponse.json({
                error: "Already Checked In",
                booking: booking
            });
        }

        // 2. Is it cancelled?
        if (booking.status === 'CANCELLED' || booking.status === 'NO_SHOW') {
            return NextResponse.json({ error: "Booking Cancelled/Expired" });
        }

        // 3. Mark Arrived
        const updated = await prisma.parkingBooking.update({
            where: { id: booking.id },
            data: {
                status: 'ARRIVED',
                checkInTime: new Date()
            }
        });

        return NextResponse.json({
            success: true,
            message: "Check-in Successful",
            booking: updated
        });

    } catch (error) {
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}
