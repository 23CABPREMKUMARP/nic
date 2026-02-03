import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { passId } = await req.json();

        const pass = await prisma.pass.findUnique({ where: { id: passId } });

        if (!pass) return NextResponse.json({ error: "Pass not found" }, { status: 404 });

        if (pass.status !== 'ACTIVE') {
            return NextResponse.json({ error: `Start entry not allowed. Status is ${pass.status}` }, { status: 400 });
        }

        const updatedPass = await prisma.pass.update({
            where: { id: passId },
            data: {
                status: 'USED'
            }
        });

        return NextResponse.json({ success: true, pass: updatedPass });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}
