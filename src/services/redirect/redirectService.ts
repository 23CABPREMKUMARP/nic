/**
 * Redirect Service - Smart alternative location generator
 * Suggests places based on multiple factors
 */

import { OOTY_SPOTS, OOTY_PARKING, getDistance } from '@/data/ootyMapData';
import { TrafficEngine, SpotCongestion } from '@/services/traffic/trafficEngine';
import { TrafficShaping, TrafficLevel } from '@/services/traffic/trafficShaping';
import { getWeather } from '@/services/weatherService';
import { getThemedSuggestions, SuggestionTheme } from '@/services/redirect/themedSuggestions';

// ============================================
// TYPES
// ============================================

export interface RedirectSuggestion {
    id: string;
    name: string;
    tamilName: string;
    category: string;
    type: string;
    image: string;
    coordinates: { lat: number; lng: number };

    // Scoring
    overallScore: number;
    factors: RedirectFactors;

    // Status
    congestionLevel: TrafficLevel;
    congestionScore: number;
    parkingAvailable: boolean;

    // Recommendation
    reason: string;
    tamilReason: string;
    badge?: string;
}

export interface RedirectFactors {
    distanceScore: number;     // Closer is better
    interestScore: number;     // Match user interests
    crowdScore: number;        // Lower crowd is better
    parkingScore: number;      // Parking availability
    weatherScore: number;      // Weather suitability
    photoScore: number;        // Photo attractiveness
}

export interface RedirectOptions {
    userLocation?: { lat: number; lng: number };
    interests?: string[];       // Categories user is interested in
    avoidCrowds?: boolean;
    requireParking?: boolean;
    maxDistance?: number;       // km
    limit?: number;
}

// ============================================
// REDIRECT SERVICE CLASS
// ============================================

export class RedirectService {
    /**
     * Get alternative spots for a crowded destination
     */
    static async getAlternatives(
        currentSpotId: string,
        options: RedirectOptions = {}
    ): Promise<RedirectSuggestion[]> {
        const currentSpot = OOTY_SPOTS.find(s => s.id === currentSpotId);
        if (!currentSpot) {
            throw new Error(`Spot not found: ${currentSpotId}`);
        }

        // Default user location to current spot
        const userLoc = options.userLocation || {
            lat: currentSpot.latitude,
            lng: currentSpot.longitude
        };

        // Get all congestion data
        const allCongestion = await TrafficEngine.getAllCongestion();
        const congestionMap = new Map(allCongestion.map(c => [c.spotId, c]));

        // Get weather for scoring
        const weather = await getWeather('Ooty');
        const weatherCode = weather?.current?.code ?? 0;
        const isRaining = weatherCode >= 51;
        const isFoggy = weatherCode >= 45 && weatherCode <= 48;

        // Score all spots
        const suggestions: RedirectSuggestion[] = [];

        for (const spot of OOTY_SPOTS) {
            // Skip current spot
            if (spot.id === currentSpotId) continue;

            // Calculate distance
            const distance = getDistance(userLoc.lat, userLoc.lng, spot.latitude, spot.longitude);

            // Skip if too far
            if (options.maxDistance && distance > options.maxDistance) continue;

            // Get congestion
            const congestion = congestionMap.get(spot.id);
            const congestionScore = congestion?.score || 50;
            const level = TrafficShaping.getLevel(congestionScore);

            // Skip if avoiding crowds and spot is crowded
            if (options.avoidCrowds && (level === 'RED' || level === 'ORANGE')) continue;

            // Check parking
            const parking = OOTY_PARKING.find(p => p.spotId === spot.id);
            const parkingAvailable = parking ? congestionScore < 80 : true;

            // Skip if parking required but not available
            if (options.requireParking && !parkingAvailable) continue;

            // Calculate factors
            const factors = this.calculateFactors(
                spot, currentSpot, distance, congestionScore,
                parkingAvailable, isRaining, isFoggy, options.interests
            );

            // Calculate overall score
            const overallScore = this.calculateOverallScore(factors);

            // Generate reason
            const { reason, tamilReason } = this.generateReason(spot, factors, level);

            suggestions.push({
                id: spot.id,
                name: spot.name,
                tamilName: spot.tamil_name,
                category: spot.category,
                type: spot.type,
                image: spot.image,
                coordinates: { lat: spot.latitude, lng: spot.longitude },
                overallScore,
                factors,
                congestionLevel: level,
                congestionScore,
                parkingAvailable,
                reason,
                tamilReason,
                badge: this.getBadge(factors, level)
            });
        }

        // Sort by overall score and limit
        return suggestions
            .sort((a, b) => b.overallScore - a.overallScore)
            .slice(0, options.limit || 5);
    }

    /**
     * Get smart suggestions (not based on current spot)
     */
    static async getSuggestions(
        options: RedirectOptions = {}
    ): Promise<RedirectSuggestion[]> {
        const userLoc = options.userLocation || { lat: 11.4102, lng: 76.6950 };

        // Get all congestion
        const allCongestion = await TrafficEngine.getAllCongestion();
        const congestionMap = new Map(allCongestion.map(c => [c.spotId, c]));

        // Get weather
        const weather = await getWeather('Ooty');
        const weatherCode = weather?.current?.code ?? 0;
        const isRaining = weatherCode >= 51;
        const isFoggy = weatherCode >= 45 && weatherCode <= 48;

        const suggestions: RedirectSuggestion[] = [];

        for (const spot of OOTY_SPOTS) {
            const distance = getDistance(userLoc.lat, userLoc.lng, spot.latitude, spot.longitude);

            if (options.maxDistance && distance > options.maxDistance) continue;

            const congestion = congestionMap.get(spot.id);
            const congestionScore = congestion?.score || 50;
            const level = TrafficShaping.getLevel(congestionScore);

            if (options.avoidCrowds && (level === 'RED' || level === 'ORANGE')) continue;

            const parking = OOTY_PARKING.find(p => p.spotId === spot.id);
            const parkingAvailable = parking ? congestionScore < 80 : true;

            if (options.requireParking && !parkingAvailable) continue;

            const factors = this.calculateFactors(
                spot, null, distance, congestionScore,
                parkingAvailable, isRaining, isFoggy, options.interests
            );

            const overallScore = this.calculateOverallScore(factors);
            const { reason, tamilReason } = this.generateReason(spot, factors, level);

            suggestions.push({
                id: spot.id,
                name: spot.name,
                tamilName: spot.tamil_name,
                category: spot.category,
                type: spot.type,
                image: spot.image,
                coordinates: { lat: spot.latitude, lng: spot.longitude },
                overallScore,
                factors,
                congestionLevel: level,
                congestionScore,
                parkingAvailable,
                reason,
                tamilReason,
                badge: this.getBadge(factors, level)
            });
        }

        return suggestions
            .sort((a, b) => b.overallScore - a.overallScore)
            .slice(0, options.limit || 5);
    }

    /**
     * Calculate scoring factors
     */
    private static calculateFactors(
        spot: any,
        currentSpot: any | null,
        distance: number,
        congestionScore: number,
        parkingAvailable: boolean,
        isRaining: boolean,
        isFoggy: boolean,
        interests?: string[]
    ): RedirectFactors {
        // Distance score (0-100, closer is better)
        const distanceScore = Math.max(0, 100 - (distance * 10));

        // Interest score
        let interestScore = 50;
        if (interests && interests.length > 0) {
            if (interests.includes(spot.category)) interestScore = 100;
            else if (interests.includes(spot.type)) interestScore = 80;
        } else if (currentSpot) {
            // Match current spot's category
            if (spot.category === currentSpot.category) interestScore = 90;
            else if (spot.type === currentSpot.type) interestScore = 70;
        }

        // Crowd score (lower congestion = higher score)
        const crowdScore = 100 - congestionScore;

        // Parking score
        const parkingScore = parkingAvailable ? 100 : 30;

        // Weather score
        let weatherScore = 70;
        if (spot.type === 'OUTDOOR') {
            if (isRaining) weatherScore = 20;
            else if (isFoggy) weatherScore = 40;
            else weatherScore = 100;
        } else if (spot.type === 'INDOOR') {
            if (isRaining) weatherScore = 100;
            else weatherScore = 80;
        }

        // Photo score (scenic spots score higher)
        const photoScore = this.getPhotoScore(spot);

        return {
            distanceScore,
            interestScore,
            crowdScore,
            parkingScore,
            weatherScore,
            photoScore
        };
    }

    /**
     * Calculate overall score from factors
     */
    private static calculateOverallScore(factors: RedirectFactors): number {
        const weights = {
            distance: 0.15,
            interest: 0.20,
            crowd: 0.30,
            parking: 0.15,
            weather: 0.10,
            photo: 0.10
        };

        const score =
            factors.distanceScore * weights.distance +
            factors.interestScore * weights.interest +
            factors.crowdScore * weights.crowd +
            factors.parkingScore * weights.parking +
            factors.weatherScore * weights.weather +
            factors.photoScore * weights.photo;

        return Math.round(score);
    }

    /**
     * Get photo attractiveness score
     */
    private static getPhotoScore(spot: any): number {
        const scenicSpots = ['doddabetta', 'ooty-lake', 'botanical-garden', 'pine-forest'];
        if (scenicSpots.some(s => spot.id.includes(s))) return 100;
        if (spot.type === 'OUTDOOR') return 80;
        return 60;
    }

    /**
     * Generate recommendation reason
     */
    private static generateReason(
        spot: any,
        factors: RedirectFactors,
        level: TrafficLevel
    ): { reason: string; tamilReason: string } {
        // Find the best factor
        const factorScores = [
            { name: 'crowd', score: factors.crowdScore, en: 'Less crowded', ta: 'குறைந்த கூட்டம்' },
            { name: 'weather', score: factors.weatherScore, en: 'Perfect for weather', ta: 'வானிலைக்கு ஏற்றது' },
            { name: 'parking', score: factors.parkingScore, en: 'Easy parking', ta: 'எளிதான வாகன நிறுத்தம்' },
            { name: 'distance', score: factors.distanceScore, en: 'Nearby', ta: 'அருகில்' },
            { name: 'photo', score: factors.photoScore, en: 'Great for photos', ta: 'புகைப்படங்களுக்கு சிறந்தது' }
        ];

        const best = factorScores.sort((a, b) => b.score - a.score)[0];

        if (level === 'GREEN') {
            return {
                reason: `${best.en} - Very peaceful now`,
                tamilReason: `${best.ta} - மிகவும் அமைதியாக உள்ளது`
            };
        }

        return {
            reason: best.en,
            tamilReason: best.ta
        };
    }

    /**
     * Get badge for suggestion
     */
    private static getBadge(factors: RedirectFactors, level: TrafficLevel): string | undefined {
        if (level === 'GREEN' && factors.crowdScore >= 80) return '🏆 Best Choice';
        if (factors.weatherScore >= 90) return '☀️ Weather Perfect';
        if (factors.photoScore >= 90) return '📸 Photo Spot';
        if (factors.parkingScore >= 100) return '🅿️ Easy Parking';
        return undefined;
    }
}

export default RedirectService;
