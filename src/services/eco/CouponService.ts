
/**
 * Coupon Service
 * Manages coupon generation and validation for partners
 */

export interface Coupon {
    code: string;
    title: string;
    discount: string;
    partner: string;
    expiry: string;
    isRedeemed: boolean;
}

export class CouponService {
    static generate(type: string): Coupon {
        const codes: Record<string, string> = {
            'TEA': 'NLG-TEA-2026',
            'CHOC': 'NLG-CHOC-50',
            'TRAIN': 'NLG-TRAIN-FAST',
            'PARK': 'NLG-PARK-FREE'
        };

        const partners: Record<string, string> = {
            'TEA': 'Nilgiri Tea Co.',
            'CHOC': 'Ooty Handcrafted Chocolates',
            'TRAIN': 'Southern Railway (Tourism)',
            'PARK': 'Municipality Parking'
        };

        const expiry = new Date();
        expiry.setMonth(expiry.getMonth() + 1);

        return {
            code: `${codes[type] || 'ECO'}-${Math.random().toString(36).substring(7).toUpperCase()}`,
            title: `${type} Reward`,
            discount: type === 'CHOC' ? 'Flat 50%' : type === 'TEA' ? '15% Off' : 'Special Access',
            partner: partners[type] || 'Nilgiri Local Partner',
            expiry: expiry.toISOString().split('T')[0],
            isRedeemed: false
        };
    }
}
