import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { qrCode } = await req.json();

        if (!qrCode) {
            return NextResponse.json({ valid: false, message: "No QR Code provided" }, { status: 400 });
        }

        const pass = await prisma.pass.findUnique({
            where: { qrCode },
            include: { user: true }
        });

        if (!pass) {
            return NextResponse.json({ valid: false, message: "Invalid Pass" }, { status: 404 });
        }

        if (pass.status !== 'ACTIVE') {
            return NextResponse.json({ valid: false, message: `Pass is ${pass.status}`, pass }, { status: 400 });
        }

        // Check date validity
        const today = new Date();
        const visitDate = new Date(pass.visitDate);
        // Simple check: is it the same day?
        const isSameDay = today.toDateString() === visitDate.toDateString();

        if (!isSameDay) {
            // Allow if it's strictly mostly "today" but maybe ignore stringent time for now
            // For demo, let's just warn if dates don't match but allow if it's future? No, strict check.
            // Actually, if visit date is in past, expired.
            const oneDay = 24 * 60 * 60 * 1000;
            if (today.getTime() - visitDate.getTime() > oneDay) {
                return NextResponse.json({ valid: false, message: "Pass Expired", pass }, { status: 400 });
            }
        }

        return NextResponse.json({ valid: true, message: "Entry Allowed", pass });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}
