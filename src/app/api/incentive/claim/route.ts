/**
 * Incentive API - Claim coupons and manage rewards
 */

import { NextRequest, NextResponse } from 'next/server';
import { IncentiveSystem } from '@/services/redirect/incentiveSystem';
import { auth } from '@clerk/nextjs/server';

// POST - Claim or redeem coupon
export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'Login required' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { action, spotId, couponCode } = body;

        switch (action) {
            case 'GENERATE_COUPON': {
                // Generate coupon for a low-crowd spot
                const coupon = await IncentiveSystem.generateCoupon(
                    userId,
                    spotId,
                    body.type || 'PARKING_DISCOUNT'
                );

                if (!coupon) {
                    return NextResponse.json({
                        success: false,
                        message: 'Coupons only available for low-crowd spots'
                    });
                }

                return NextResponse.json({
                    success: true,
                    data: coupon,
                    message: 'Coupon generated! Use it when you arrive.'
                });
            }

            case 'GENERATE_PARKING_DISCOUNT': {
                const coupon = await IncentiveSystem.generateParkingDiscount(userId, spotId);

                if (!coupon) {
                    return NextResponse.json({
                        success: false,
                        message: 'Parking discounts available during off-peak hours only'
                    });
                }

                return NextResponse.json({
                    success: true,
                    data: coupon,
                    message: 'Parking discount coupon generated!'
                });
            }

            case 'REDEEM': {
                const result = await IncentiveSystem.redeemCoupon(userId, couponCode);

                return NextResponse.json({
                    success: result.success,
                    message: result.message,
                    savings: result.savings
                });
            }

            case 'RECORD_VISIT': {
                // Record a visit for badge progress
                const badges = await IncentiveSystem.checkBadgeProgress(userId, {
                    type: body.visitType || 'VISIT',
                    spotId
                });

                return NextResponse.json({
                    success: true,
                    data: {
                        badgesEarned: badges,
                        message: badges.length > 0
                            ? `🏆 You earned ${badges.length} badge(s)!`
                            : 'Visit recorded'
                    }
                });
            }

            default:
                return NextResponse.json(
                    { success: false, error: 'Invalid action' },
                    { status: 400 }
                );
        }
    } catch (error: any) {
        console.error('Incentive API error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
