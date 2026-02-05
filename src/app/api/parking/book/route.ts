import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { currentUser } from '@clerk/nextjs/server';

export async function POST(req: Request) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { locationId, vehicleType, startTime, endTime, vehicleNo, passId } = await req.json();

        if (!locationId || !vehicleType || !startTime || !endTime || !vehicleNo) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        // 1. Find the facility configuration
        const facility = await prisma.parkingFacility.findUnique({
            where: {
                locationId_vehicleType: {
                    locationId,
                    vehicleType
                }
            }
        });

        if (!facility) {
            return NextResponse.json({ error: "Parking facility not found for this vehicle type" }, { status: 404 });
        }

        // 2. Calculate Amount
        const start = new Date(startTime);
        const end = new Date(endTime);
        const durationHours = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60));

        if (durationHours <= 0) {
            return NextResponse.json({ error: "Invalid duration" }, { status: 400 });
        }

        const amount = durationHours * facility.hourlyRate;

        // 3. Check Availability
        const activeBookings = await prisma.parkingBooking.count({
            where: {
                facilityId: facility.id,
                status: { in: ['BOOKED', 'ARRIVED'] },
                // Check if ACTIVE interval overlaps with REQUESTED interval
                // (StartA < EndB) and (EndA > StartB)
                startTime: { lt: end },
                endTime: { gt: start }
            }
        });

        if (activeBookings >= facility.totalSlots) {
            return NextResponse.json({ error: "Parking Full for this time slot" }, { status: 409 });
        }

        // 4. Create Booking

        const booking = await prisma.parkingBooking.create({
            data: {
                userId: user.id,
                passId: passId || null,
                facilityId: facility.id,
                bookingDate: new Date(),
                startTime: start,
                endTime: end,
                vehicleNo,
                vehicleType,
                amount,
                paymentStatus: "PENDING", // Pay on site/exit
                status: "BOOKED",
                qrCode: `PARK-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`
            },
            include: {
                facility: {
                    include: { location: true }
                }
            }
        });

        return NextResponse.json({ success: true, booking });

    } catch (error) {
        console.error("Booking Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
