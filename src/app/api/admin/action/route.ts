import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { checkAdmin, unauthorized } from "@/lib/auth-check";

export async function POST(req: Request) {
    const admin = await checkAdmin();
    if (!admin) return unauthorized();

    try {
        const body = await req.json();
        const { actionType, details } = body;

        // Log the action
        const log = await prisma.adminLog.create({
            data: {
                adminId: admin.id,
                action: `${actionType}: ${details}`, // Fixed string interpolation syntax
                timestamp: new Date()
            }
        });

        // Logic for specific actions
        if (actionType === 'BROADCAST_SMS') {
            // Mock SMS sending
            // In real app: call Twilio/SNS
        } else if (actionType === 'REDIRECT_TRAFFIC') {
            // Maybe update location status
        }

        return NextResponse.json({ success: true, log });

    } catch (e) {
        console.error(e)
        return NextResponse.json({ error: "Action failed" }, { status: 500 });
    }
}
