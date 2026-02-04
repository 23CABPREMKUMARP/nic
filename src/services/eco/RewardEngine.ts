
/**
 * Reward Engine
 * Logic for mapping eco scores to specific rewards and coupons
 */

import { EcoPoints } from './EcoPointsService';

export interface Reward {
    type: string;
    title: string;
    description: string;
    couponCode?: string;
}

export class RewardEngine {
    static getRewards(points: EcoPoints): Reward[] {
        const rewards: Reward[] = [];

        if (points.totalPoints > 30) {
            rewards.push({
                type: 'DISCOUNT',
                title: 'Tea Powder Coupon',
                description: '10% off at Nilgiri Tea Co-operative'
            });
        }

        if (points.totalPoints > 60) {
            rewards.push({
                type: 'OFFER',
                title: 'Chocolate Shop Treat',
                description: 'Buy 1 Get 1 free at Ooty Home Made Chocolates'
            });
        }

        if (points.totalPoints > 90) {
            rewards.push({
                type: 'SPECIAL',
                title: 'Toy Train Priority Account',
                description: 'Digital fast-track access for toy train booking portal'
            });
            rewards.push({
                type: 'ACK',
                title: 'Tree Planting Acknowledgement',
                description: 'A tree has been planted in your name in the Nilgiri Biosphere'
            });
        }

        return rewards;
    }
}
