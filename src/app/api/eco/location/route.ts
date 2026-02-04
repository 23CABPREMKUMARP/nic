
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const body = await request.json();
    const { userId, consent, path } = body;

    // In a real scenario, this would:
    // 1. Log consent to user profile
    // 2. Anonymize path data
    // 3. Store in a time-series DB for TrafficEngine

    console.log(`[EcoLocation] User ${userId} consent: ${consent}. Path points: ${path?.length || 0}`);

    return NextResponse.json({
        success: true,
        message: consent ? 'Location data will be used anonymously to help Nilgiri traffic.' : 'Privacy preference updated.'
    });
}
