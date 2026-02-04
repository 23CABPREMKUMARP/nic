/**
 * Incentive System - Rewards for crowd distribution
 * Offers discounts, badges, and points for visiting low-crowd spots
 */

import { prisma } from '@/lib/prisma';
import { TrafficShaping, TrafficLevel } from '@/services/traffic/trafficShaping';
import { TrafficEngine } from '@/services/traffic/trafficEngine';

// ============================================
// TYPES
// ============================================

export interface Coupon {
    id: string;
    code: string;
    type: 'PARKING_DISCOUNT' | 'ENTRY_DISCOUNT' | 'FOOD_DISCOUNT' | 'SHOP_DISCOUNT';
    value: number; // Percentage or fixed amount
    valueType: 'PERCENTAGE' | 'FIXED';
    spotId?: string;
    expiresAt: Date;
    used: boolean;
    conditions: {
        minCrowdLevel?: TrafficLevel;
        offPeakOnly?: boolean;
        firstVisit?: boolean;
    };
}

export interface Badge {
    id: string;
    name: string;
    tamilName: string;
    icon: string;
    description: string;
    tamilDescription: string;
    earnedAt?: Date;
    criteria: BadgeCriteria;
}

export interface BadgeCriteria {
    type: 'VISITS' | 'LOW_CROWD' | 'EARLY_BIRD' | 'MULTI_SPOT' | 'ECO_TRAVELER';
    threshold: number;
}

export interface UserIncentives {
    userId: string;
    points: number;
    level: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
    badges: Badge[];
    activeCoupons: Coupon[];
    usedCoupons: number;
    totalSavings: number;
}

// ============================================
// BADGE DEFINITIONS
// ============================================

const BADGES: Badge[] = [
    {
        id: 'eco-traveler',
        name: 'Eco Traveler',
        tamilName: 'சுற்றுச்சூழல் பயணி',
        icon: '🌿',
        description: 'Visit 5 spots during low-crowd times',
        tamilDescription: 'குறைந்த கூட்ட நேரத்தில் 5 இடங்களுக்கு செல்லுங்கள்',
        criteria: { type: 'LOW_CROWD', threshold: 5 }
    },
    {
        id: 'early-bird',
        name: 'Early Bird',
        tamilName: 'அதிகாலை பறவை',
        icon: '🐦',
        description: 'Visit 3 spots before 9 AM',
        tamilDescription: 'காலை 9 மணிக்கு முன் 3 இடங்களுக்கு செல்லுங்கள்',
        criteria: { type: 'EARLY_BIRD', threshold: 3 }
    },
    {
        id: 'explorer',
        name: 'Ooty Explorer',
        tamilName: 'ஊட்டி ஆய்வாளர்',
        icon: '🗺️',
        description: 'Visit 10 different spots',
        tamilDescription: '10 வெவ்வேறு இடங்களுக்கு செல்லுங்கள்',
        criteria: { type: 'MULTI_SPOT', threshold: 10 }
    },
    {
        id: 'crowd-helper',
        name: 'Crowd Helper',
        tamilName: 'கூட்ட உதவியாளர்',
        icon: '👥',
        description: 'Choose alternatives 5 times when suggested',
        tamilDescription: 'பரிந்துரைக்கப்படும் போது 5 முறை மாற்று இடங்களை தேர்வு செய்யுங்கள்',
        criteria: { type: 'ECO_TRAVELER', threshold: 5 }
    },
    {
        id: 'loyal-visitor',
        name: 'Loyal Visitor',
        tamilName: 'விசுவாசமான பார்வையாளர்',
        icon: '⭐',
        description: 'Complete 20 visits',
        tamilDescription: '20 வருகைகளை முடிக்கவும்',
        criteria: { type: 'VISITS', threshold: 20 }
    }
];

// ============================================
// INCENTIVE SYSTEM CLASS
// ============================================

export class IncentiveSystem {
    /**
     * Generate coupon for low-crowd spot
     */
    static async generateCoupon(
        userId: string,
        spotId: string,
        type: Coupon['type'] = 'PARKING_DISCOUNT'
    ): Promise<Coupon | null> {
        // Check spot congestion
        const congestion = await TrafficEngine.getCongestionScore(spotId);

        // Only generate for GREEN spots
        if (congestion.level !== 'GREEN') {
            return null;
        }

        const coupon: Coupon = {
            id: `coupon-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            code: this.generateCouponCode(),
            type,
            value: this.getCouponValue(type, congestion.level),
            valueType: 'PERCENTAGE',
            spotId,
            expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours
            used: false,
            conditions: {
                minCrowdLevel: 'YELLOW',
                offPeakOnly: false
            }
        };

        // Store coupon (mock - would use database in production)
        await this.storeCoupon(userId, coupon);

        return coupon;
    }

    /**
     * Generate parking discount for off-peak
     */
    static async generateParkingDiscount(
        userId: string,
        spotId: string
    ): Promise<Coupon | null> {
        const now = new Date();
        const hour = now.getHours();

        // Off-peak: before 10 AM or after 5 PM
        const isOffPeak = hour < 10 || hour >= 17;

        if (!isOffPeak) return null;

        return this.generateCoupon(userId, spotId, 'PARKING_DISCOUNT');
    }

    /**
     * Award badge to user
     */
    static async awardBadge(
        userId: string,
        badgeId: string
    ): Promise<Badge | null> {
        const badge = BADGES.find(b => b.id === badgeId);
        if (!badge) return null;

        const awarded: Badge = {
            ...badge,
            earnedAt: new Date()
        };

        // Store badge (mock - would use database)
        console.log(`🏆 Badge awarded to ${userId}: ${badge.name}`);

        return awarded;
    }

    /**
     * Check and award badges based on user activity
     */
    static async checkBadgeProgress(
        userId: string,
        activity: {
            type: 'VISIT' | 'LOW_CROWD_VISIT' | 'EARLY_VISIT' | 'CHOSE_ALTERNATIVE';
            spotId: string;
        }
    ): Promise<Badge[]> {
        const awarded: Badge[] = [];

        // Get user stats (mock - would query database)
        const stats = await this.getUserStats(userId);

        // Update stats based on activity
        switch (activity.type) {
            case 'VISIT':
                stats.totalVisits++;
                stats.spotsVisited.add(activity.spotId);
                break;
            case 'LOW_CROWD_VISIT':
                stats.lowCrowdVisits++;
                break;
            case 'EARLY_VISIT':
                stats.earlyVisits++;
                break;
            case 'CHOSE_ALTERNATIVE':
                stats.alternativesChosen++;
                break;
        }

        // Check each badge
        for (const badge of BADGES) {
            if (stats.earnedBadges.has(badge.id)) continue;

            let earned = false;
            switch (badge.criteria.type) {
                case 'VISITS':
                    earned = stats.totalVisits >= badge.criteria.threshold;
                    break;
                case 'LOW_CROWD':
                    earned = stats.lowCrowdVisits >= badge.criteria.threshold;
                    break;
                case 'EARLY_BIRD':
                    earned = stats.earlyVisits >= badge.criteria.threshold;
                    break;
                case 'MULTI_SPOT':
                    earned = stats.spotsVisited.size >= badge.criteria.threshold;
                    break;
                case 'ECO_TRAVELER':
                    earned = stats.alternativesChosen >= badge.criteria.threshold;
                    break;
            }

            if (earned) {
                const awardedBadge = await this.awardBadge(userId, badge.id);
                if (awardedBadge) {
                    awarded.push(awardedBadge);
                    stats.earnedBadges.add(badge.id);
                }
            }
        }

        return awarded;
    }

    /**
     * Get user incentives summary
     */
    static async getUserIncentives(userId: string): Promise<UserIncentives> {
        const stats = await this.getUserStats(userId);
        const coupons = await this.getUserCoupons(userId);

        // Calculate points
        const points =
            stats.totalVisits * 10 +
            stats.lowCrowdVisits * 25 +
            stats.earlyVisits * 20 +
            stats.alternativesChosen * 15;

        // Calculate level
        let level: UserIncentives['level'] = 'BRONZE';
        if (points >= 500) level = 'PLATINUM';
        else if (points >= 200) level = 'GOLD';
        else if (points >= 100) level = 'SILVER';

        // Get earned badges
        const badges = BADGES.filter(b => stats.earnedBadges.has(b.id))
            .map(b => ({ ...b, earnedAt: new Date() }));

        return {
            userId,
            points,
            level,
            badges,
            activeCoupons: coupons.filter(c => !c.used && c.expiresAt > new Date()),
            usedCoupons: coupons.filter(c => c.used).length,
            totalSavings: this.calculateSavings(coupons.filter(c => c.used))
        };
    }

    /**
     * Redeem coupon
     */
    static async redeemCoupon(
        userId: string,
        couponCode: string
    ): Promise<{ success: boolean; message: string; savings?: number }> {
        const coupons = await this.getUserCoupons(userId);
        const coupon = coupons.find(c => c.code === couponCode);

        if (!coupon) {
            return { success: false, message: 'Invalid coupon code' };
        }

        if (coupon.used) {
            return { success: false, message: 'Coupon already used' };
        }

        if (coupon.expiresAt < new Date()) {
            return { success: false, message: 'Coupon has expired' };
        }

        // Check conditions
        if (coupon.spotId) {
            const congestion = await TrafficEngine.getCongestionScore(coupon.spotId);
            if (coupon.conditions.minCrowdLevel) {
                const levels: TrafficLevel[] = ['GREEN', 'YELLOW', 'ORANGE', 'RED'];
                const minIndex = levels.indexOf(coupon.conditions.minCrowdLevel);
                const currentIndex = levels.indexOf(congestion.level);
                if (currentIndex > minIndex) {
                    return {
                        success: false,
                        message: 'Coupon only valid during low crowd times'
                    };
                }
            }
        }

        // Mark as used
        coupon.used = true;

        return {
            success: true,
            message: 'Coupon redeemed successfully!',
            savings: coupon.valueType === 'PERCENTAGE' ? coupon.value : coupon.value
        };
    }

    // ============================================
    // HELPER METHODS
    // ============================================

    private static generateCouponCode(): string {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = 'OOTY-';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    private static getCouponValue(type: Coupon['type'], level: TrafficLevel): number {
        const baseValues: Record<Coupon['type'], number> = {
            'PARKING_DISCOUNT': 20,
            'ENTRY_DISCOUNT': 15,
            'FOOD_DISCOUNT': 10,
            'SHOP_DISCOUNT': 10
        };

        // Better discounts for GREEN spots
        const multiplier = level === 'GREEN' ? 1.5 : 1.0;
        return Math.round(baseValues[type] * multiplier);
    }

    private static async storeCoupon(userId: string, coupon: Coupon): Promise<void> {
        // Mock storage - would use database in production
        console.log(`🎫 Coupon ${coupon.code} stored for user ${userId}`);
    }

    private static async getUserCoupons(userId: string): Promise<Coupon[]> {
        // Mock - would query database
        return [];
    }

    private static async getUserStats(userId: string): Promise<{
        totalVisits: number;
        lowCrowdVisits: number;
        earlyVisits: number;
        alternativesChosen: number;
        spotsVisited: Set<string>;
        earnedBadges: Set<string>;
    }> {
        // Mock - would query database
        return {
            totalVisits: 0,
            lowCrowdVisits: 0,
            earlyVisits: 0,
            alternativesChosen: 0,
            spotsVisited: new Set(),
            earnedBadges: new Set()
        };
    }

    private static calculateSavings(usedCoupons: Coupon[]): number {
        return usedCoupons.reduce((total, c) => {
            if (c.valueType === 'FIXED') return total + c.value;
            // Estimate percentage savings
            return total + (c.value * 1); // Rough estimate
        }, 0);
    }

    /**
     * Get all available badges
     */
    static getAllBadges(): Badge[] {
        return BADGES;
    }
}

export default IncentiveSystem;
