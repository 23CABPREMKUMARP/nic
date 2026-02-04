/**
 * User Badges API - Get user incentives and badges
 */

import { NextRequest, NextResponse } from 'next/server';
import { IncentiveSystem } from '@/services/redirect/incentiveSystem';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            // Return available badges for non-logged in users
            const allBadges = IncentiveSystem.getAllBadges();

            return NextResponse.json({
                success: true,
                data: {
                    authenticated: false,
                    availableBadges: allBadges,
                    message: 'Login to earn badges and rewards'
                }
            });
        }

        // Get user's incentives
        const incentives = await IncentiveSystem.getUserIncentives(userId);
        const allBadges = IncentiveSystem.getAllBadges();

        // Calculate progress for each badge
        const badgeProgress = allBadges.map(badge => {
            const earned = incentives.badges.find(b => b.id === badge.id);
            return {
                ...badge,
                earned: !!earned,
                earnedAt: earned?.earnedAt,
                progress: earned ? 100 : Math.min(99, Math.random() * 80) // Mock progress
            };
        });

        return NextResponse.json({
            success: true,
            data: {
                authenticated: true,
                userId,
                points: incentives.points,
                level: incentives.level,
                badges: badgeProgress,
                activeCoupons: incentives.activeCoupons,
                stats: {
                    totalBadges: incentives.badges.length,
                    usedCoupons: incentives.usedCoupons,
                    totalSavings: incentives.totalSavings
                },
                nextReward: getNextReward(incentives.points)
            }
        });
    } catch (error: any) {
        console.error('Badges API error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

function getNextReward(points: number): { name: string; pointsNeeded: number } {
    if (points < 100) {
        return { name: 'Silver Status', pointsNeeded: 100 - points };
    }
    if (points < 200) {
        return { name: 'Gold Status', pointsNeeded: 200 - points };
    }
    if (points < 500) {
        return { name: 'Platinum Status', pointsNeeded: 500 - points };
    }
    return { name: 'Exclusive Rewards', pointsNeeded: 0 };
}
