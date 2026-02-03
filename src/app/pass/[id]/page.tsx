import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import PassViewClient from "./PassViewClient";
import { auth } from "@clerk/nextjs/server";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function PassPage({ params }: PageProps) {
    const { id } = await params;
    const { userId } = await auth();

    const pass = await prisma.pass.findUnique({
        where: { id },
        include: { user: true, parkingSlot: { include: { location: true } } }
    });

    if (!pass) return notFound();

    // Basic security: only allow admin or the owner to view
    const currentUserData = await prisma.user.findUnique({ where: { id: userId || 'unknown' } });
    const isAdmin = currentUserData?.role === 'ADMIN';

    if (pass.userId !== userId && !isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-white">
                <h1 className="text-2xl font-bold mb-2">Unauthorized Access</h1>
                <p>You do not have permission to view this pass.</p>
            </div>
        );
    }

    return <PassViewClient pass={pass} />;
}
