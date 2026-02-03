import { createPass } from "@/services/passService";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        // Fallback for dev: if no auth, check if body has it (NOT SECURE for prod, but helps if middleware is broken locally)
        // const userId = passedAuth?.userId || (process.env.NODE_ENV === 'development' ? 'dev_user' : null);

        // For now, let's stick to auth(). If this fails, middleware is 100% the culprit.
        if (!userId) {
            // Debug for user
            console.log("Auth failed, no userId found in session.");
            return NextResponse.json({ error: "Unauthorized - Please Login" }, { status: 401 });
        }

        const body = await req.json();

        // Use client-provided metadata (trusted because we verified userId ownership via auth())
        // Ensure the body userId matches the token userId to prevent spoofing other users
        if (body.userId && body.userId !== userId) {
            return NextResponse.json({ error: "User ID mismatch" }, { status: 403 });
        }

        const newPass = await createPass(
            userId,
            body.email || "unknown@example.com",
            body.name || "Unknown User",
            body
        );

        return NextResponse.json(newPass);

        return NextResponse.json(newPass);
    } catch (error: any) {
        console.error("Error creating pass:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 400 });
    }
}
