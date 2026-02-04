
import { NextResponse } from 'next/server';
import { EcoPointsService, EcoAction } from '@/services/eco/EcoPointsService';

// Mock DB for demonstration (in real app, this would be Prisma)
let mockUserPoints: Record<string, number> = { 'test-user': 45 };

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'test-user';

    const pointsValue = mockUserPoints[userId] || 0;
    const pointsData = EcoPointsService.calculateScore([], { isEV: true }); // Mocking base points

    // Adjust mock points for the demo
    pointsData.totalPoints = pointsValue;
    const level = EcoPointsService.getLevel(pointsValue);
    pointsData.level = level.name;
    pointsData.badge = level.badge;

    return NextResponse.json(pointsData);
}

export async function POST(request: Request) {
    const body = await request.json();
    const { userId, action } = body as { userId: string, action: EcoAction };

    if (!userId || !action) {
        return NextResponse.json({ error: 'Missing userId or action' }, { status: 400 });
    }

    // Update mock points
    const pointsData = EcoPointsService.calculateScore([action]);
    mockUserPoints[userId] = (mockUserPoints[userId] || 0) + pointsData.totalPoints;

    return NextResponse.json({
        success: true,
        added: pointsData.totalPoints,
        newTotal: mockUserPoints[userId]
    });
}
