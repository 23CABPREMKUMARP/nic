
import { NextResponse } from 'next/server';
import { CouponService } from '@/services/eco/CouponService';
import { RewardEngine } from '@/services/eco/RewardEngine';
import { EcoPointsService } from '@/services/eco/EcoPointsService';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const points = parseInt(searchParams.get('points') || '0');

    const dummyPoints = EcoPointsService.calculateScore([]);
    dummyPoints.totalPoints = points;

    const availableRewards = RewardEngine.getRewards(dummyPoints);
    return NextResponse.json(availableRewards);
}

export async function POST(request: Request) {
    const body = await request.json();
    const { rewardType } = body;

    if (!rewardType) {
        return NextResponse.json({ error: 'Reward type required' }, { status: 400 });
    }

    const coupon = CouponService.generate(rewardType);
    return NextResponse.json({ success: true, coupon });
}
