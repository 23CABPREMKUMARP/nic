import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function checkAdmin() {
    const user = await currentUser();

    if (!user) {
        return null;
    }

    // Auto-Sync & Promote to ADMIN for development/testing ease
    const dbUser = await prisma.user.upsert({
        where: { id: user.id },
        update: {
            email: user.emailAddresses[0].emailAddress,
            name: `${user.firstName} ${user.lastName}`.trim(),
            role: 'ADMIN'
        },
        create: {
            id: user.id,
            email: user.emailAddresses[0].emailAddress,
            name: `${user.firstName} ${user.lastName}`.trim(),
            role: 'ADMIN'
        }
    });

    return dbUser;
}

export function unauthorized() {
    return NextResponse.json({ error: "Unauthorized Access" }, { status: 403 });
}
