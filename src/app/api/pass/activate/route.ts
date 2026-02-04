import { checkAdmin, unauthorized } from "@/lib/auth-check";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const admin = await checkAdmin();
        if (!admin) return unauthorized();

        // Admin IS the user activating it
        const user = admin;

        const { passId } = await req.json();

        if (!passId) {
            return NextResponse.json({ error: "No Pass ID" }, { status: 400 });
        }

        const pass = await prisma.pass.findUnique({ where: { id: passId } });

        if (!pass) return NextResponse.json({ error: "Pass not found" }, { status: 404 });

        if (pass.status !== 'SUBMITTED') {
            return NextResponse.json({ error: `Cannot activate. Status is ${pass.status}` }, { status: 400 });
        }

        const updatedPass = await prisma.pass.update({
            where: { id: passId },
            data: {
                status: 'ACTIVE',
                activatedAt: new Date(),
                activatedBy: user?.id || 'admin'
            },
            include: { user: true }
        });

        return NextResponse.json({ success: true, pass: updatedPass });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}
