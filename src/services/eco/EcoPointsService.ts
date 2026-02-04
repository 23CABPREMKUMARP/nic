
/**
 * Eco Points Service
 * Calculates and tracks eco-points for Nilgiri E-Pass users
 */

export type EcoAction =
    | 'SHARE_LOCATION'
    | 'EXIT_UPDATE'
    | 'PARKING_DISCIPLINE'
    | 'LOW_CROWD_VISIT'
    | 'PUBLIC_TRANSPORT'
    | 'FEEDBACK_FORM'
    | 'WASTE_FREE_TRAVEL';

export interface EcoPoints {
    basePoints: number;
    bonusPoints: number;
    totalPoints: number;
    level: string;
    badge: string;
}

const ACTION_POINTS: Record<EcoAction, number> = {
    SHARE_LOCATION: 20,
    EXIT_UPDATE: 15,
    PARKING_DISCIPLINE: 10,
    LOW_CROWD_VISIT: 15,
    PUBLIC_TRANSPORT: 25,
    FEEDBACK_FORM: 10,
    WASTE_FREE_TRAVEL: 10
};

export class EcoPointsService {
    static calculateScore(actions: EcoAction[], options: { isEV?: boolean, isOffPeak?: boolean, isFamily?: boolean } = {}): EcoPoints {
        let basePoints = actions.reduce((sum, action) => sum + (ACTION_POINTS[action] || 0), 0);
        let bonusPoints = 0;

        if (options.isOffPeak) bonusPoints += 10;
        if (options.isEV) bonusPoints += 15;
        if (options.isFamily) bonusPoints += 5;

        const totalPoints = basePoints + bonusPoints;
        const levelData = this.getLevel(totalPoints);

        return {
            basePoints,
            bonusPoints,
            totalPoints,
            level: levelData.name,
            badge: levelData.badge
        };
    }

    static getLevel(points: number): { name: string, badge: string } {
        if (points >= 91) return { name: 'Hill Guardian', badge: '🛡️' };
        if (points >= 61) return { name: 'Eco Protector', badge: '🌿' };
        if (points >= 31) return { name: 'Nilgiri Friend', badge: '🤝' };
        return { name: 'Green Explorer', badge: '🌱' };
    }
}
