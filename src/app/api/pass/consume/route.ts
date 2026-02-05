import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { checkAdmin, unauthorized } from "@/lib/auth-check";
import { SMSService } from "@/services/sms/SMSService";

export async function POST(req: Request) {
    try {
        const admin = await checkAdmin();
        if (!admin) return unauthorized();

        const { passId } = await req.json();

        const pass = await prisma.pass.findUnique({
            where: { id: passId },
            include: { user: true }
        });

        if (!pass) return NextResponse.json({ error: "Pass not found" }, { status: 404 });

        if (pass.status !== 'ACTIVE') {
            return NextResponse.json({ error: `Start entry not allowed. Status is ${pass.status}` }, { status: 400 });
        }

        const updatedPass = await prisma.pass.update({
            where: { id: passId },
            data: {
                status: 'USED'
            },
            include: { user: true }
        });

        // Trigger Confirmation SMS
        const phone = updatedPass.mobile;
        if (phone) {
            SMSService.sendSMS(phone, `✅ E-Pass Activated at Gate!\n\nHello ${updatedPass.fullName || updatedPass.user?.name},\nYour entry has been recorded. Enjoy your stay in Ooty! 🌲`).catch(e => console.error("Entry SMS Fail:", e));
        }


        return NextResponse.json({ success: true, pass: updatedPass });


    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}
