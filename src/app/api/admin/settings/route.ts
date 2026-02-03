import { checkAdmin, unauthorized } from "@/lib/auth-check";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    const admin = await checkAdmin();
    if (!admin) return unauthorized();

    try {
        const settings = await prisma.systemSettings.findMany();
        // Convert array to object
        const settingsMap = settings.reduce((acc: any, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});

        return NextResponse.json(settingsMap);
    } catch (e) {
        return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const admin = await checkAdmin();
    if (!admin) return unauthorized();

    try {
        const body = await req.json();
        const { key, value } = body;

        if (!key || value === undefined) {
            return NextResponse.json({ error: "Invalid key/value" }, { status: 400 });
        }

        const updated = await prisma.systemSettings.upsert({
            where: { key },
            update: { value: String(value) },
            create: { key, value: String(value) }
        });

        return NextResponse.json(updated);
    } catch (e) {
        return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }
}
