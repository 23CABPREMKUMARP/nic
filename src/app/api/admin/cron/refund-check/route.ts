import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
    try {
        const gracePeriodMinutes = 30;
        const now = new Date();
        const thresholdTime = new Date(now.getTime() - gracePeriodMinutes * 60000); // Time 30 mins ago

        // 1. Find Expired "BOOKED" slots (No Show)
        const expiredBookings = await prisma.parkingBooking.findMany({
            where: {
                status: 'BOOKED',
                startTime: {
                    lt: thresholdTime
                }
            }
        });

        const results = [];

        // 2. Process Refunds
        for (const booking of expiredBookings) {
            // Refund Logic:
            // "100% refund before slot start" - (handled by manual cancel usually)
            // "80% within grace period" - (handled by manual cancel)
            // "0% after marked arrived" - (handled by arrival log)

            // The prompt says "Auto Refund Condition... If arrival NOT marked within allowed time window... Trigger refund".
            // It actually says "Reopen slot... Trigger refund".
            // And "Refund rules: ... 0% after marked arrived" (which is irrelevant for no-show)
            // Usually no-show = no refund or partial. But user says "Automatically cancel booking... Trigger refund". 
            // I will assume it triggers a refund (maybe partial). Let's say 50% for No-Show.

            // Update Status
            const updated = await prisma.parkingBooking.update({
                where: { id: booking.id },
                data: {
                    status: 'NO_SHOW',
                    paymentStatus: 'REFUNDED_PARTIAL' // Simulating refund
                } // In real app, call Payment Gateway Refund API here
            });

            results.push(updated.id);
            // Send Notification (Simulated)
            // await sendNotification(booking.userId, "Booking Cancelled due to No-Show. Refund initiated.");
        }

        return NextResponse.json({
            success: true,
            processed: results.length,
            ids: results
        });

    } catch (error) {
        return NextResponse.json({ error: "Job Failed" }, { status: 500 });
    }
}
