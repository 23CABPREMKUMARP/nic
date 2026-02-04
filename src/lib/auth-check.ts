import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function checkAdmin() {
    const user = await currentUser();

    if (!user) {
        return null;
    }

    // Sync user to DB (but don't auto-promote)
    const dbUser = await prisma.user.upsert({
        where: { id: user.id },
        update: {
            email: user.emailAddresses[0].emailAddress,
            name: `${user.firstName} ${user.lastName}`.trim(),
            // checking role separately, so we don't overwrite it here
        },
        create: {
            id: user.id,
            email: user.emailAddresses[0].emailAddress,
            name: `${user.firstName} ${user.lastName}`.trim(),
            role: 'USER' // Default to standard user
        }
    });

    if (dbUser.role !== 'ADMIN') {
        return null;
    }

    return dbUser;
}

export function unauthorized() {
    return NextResponse.json({ error: "Unauthorized Access" }, { status: 403 });
}
