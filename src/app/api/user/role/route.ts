import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
    const user = await currentUser();
    if (!user) return NextResponse.json({ role: null });

    try {
        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { role: true }
        });

        return NextResponse.json({ role: dbUser?.role || 'USER' });
    } catch (error) {
        console.error("Failed to fetch user role", error);
        return NextResponse.json({ role: null });
    }
}
