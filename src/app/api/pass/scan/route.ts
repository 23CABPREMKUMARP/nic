import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { qrCode } = await req.json();

        if (!qrCode) {
            return NextResponse.json({ error: "No QR Code provided" }, { status: 400 });
        }

        const pass = await prisma.pass.findUnique({
            where: { qrCode },
            include: { user: true }
        });

        if (!pass) {
            // Check for Parking Booking
            // ... (existing parking logic) ...
            const parking = await prisma.parkingBooking.findUnique({
                where: { qrCode },
                include: { user: true, facility: { include: { location: true } } }
            });

            if (parking) {
                let parkingWarning = null;
                if (parking.status === 'CANCELLED') parkingWarning = "BOOKING CANCELLED";
                if (parking.status === 'NO_SHOW') parkingWarning = "NO SHOW - REFUNDED";
                if (parking.status === 'ARRIVED') parkingWarning = "ALREADY ARRIVED";
                if (parking.status === 'COMPLETED') parkingWarning = "ALREADY EXITED";

                return NextResponse.json({
                    type: "PARKING",
                    pass: null,
                    parking,
                    warning: parkingWarning,
                    validForToday: true
                });
            }

            return NextResponse.json({ error: "Invalid Pass or Booking" }, { status: 404 });
        }

        // Pass Status Checks
        let warning: string | null = null;
        if (pass.status === 'USED') warning = "ALREADY ENTERED (USED)";
        else if (pass.status === 'CANCELLED') warning = "PASS CANCELLED";

        const today = new Date();
        const visitDate = new Date(pass.visitDate);
        const isToday = visitDate.toDateString() === today.toDateString();
        const isPast = visitDate < new Date(today.setHours(0, 0, 0, 0));

        if (!warning) {
            if (isPast) warning = "EXPIRED (Past Date)";
            else if (!isToday) warning = "INVALID DATE (Future)";
        }

        return NextResponse.json({
            pass,
            warning,
            validForToday: isToday && !isPast && !warning
        });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}
