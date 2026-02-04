/**
 * Navigation Suggest API
 * GET /api/navigation/suggest
 * 
 * Get smart suggestions for nearby spots based on crowd and conditions
 */

import { NextRequest, NextResponse } from 'next/server';
import { CrowdRouter } from '@/services/navigation/CrowdRouter';
import { CrowdEngine } from '@/services/crowdEngine';
import { OOTY_SPOTS, OOTY_PARKING, getDistance } from '@/data/ootyMapData';
import { getWeather } from '@/services/weatherService';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);

    const lat = parseFloat(searchParams.get('lat') || '11.4102');
    const lng = parseFloat(searchParams.get('lng') || '76.6950');
    const category = searchParams.get('category');
    const avoidCrowd = searchParams.get('avoidCrowd') === 'true';
    const limit = parseInt(searchParams.get('limit') || '5');

    try {
        // Get weather conditions
        const weather = await getWeather('Ooty');
        const weatherCode = weather?.current?.code ?? 0;
        const isRaining = weatherCode >= 51;
        const isFoggy = weatherCode >= 45 && weatherCode <= 48;


        // Build suggestions with crowd data
        const suggestions = await Promise.all(
            OOTY_SPOTS.map(async (spot) => {
                // Filter by category if specified
                if (category && spot.category !== category) {
                    return null;
                }

                // Get crowd analysis
                let crowdData;
                try {
                    crowdData = await CrowdEngine.analyzeLocation(spot.name);
                } catch {
                    crowdData = { score: 50, level: 'MEDIUM' as const, recommendation: '' };
                }

                // Skip overcrowded if avoidCrowd is true
                if (avoidCrowd && crowdData.level === 'OVERFLOW') {
                    return null;
                }

                // Calculate distance from user
                const distance = getDistance(lat, lng, spot.latitude, spot.longitude);

                // Find parking availability
                const parking = OOTY_PARKING.find(p => p.spotId === spot.id);
                const parkingAvailable = parking ?
                    (crowdData.factors?.parking || 0) < 80 : true;

                // Calculate visit score
                let visitScore = 100;
                const reasons: string[] = [];

                // Weather factor
                if (spot.type === 'OUTDOOR') {
                    if (isRaining) {
                        visitScore -= 40;
                        reasons.push('Rain advisory');
                    } else if (isFoggy) {
                        visitScore -= 20;
                        reasons.push('Low visibility');
                    } else if (weather?.current?.code === 0) {
                        visitScore += 10;
                        reasons.push('Perfect weather');
                    }
                } else if (isRaining) {
                    visitScore += 20;
                    reasons.push('Great for rain');
                }

                // Crowd factor
                if (crowdData.level === 'SAFE') {
                    visitScore += 20;
                    reasons.push('Low crowd');
                } else if (crowdData.level === 'OVERFLOW') {
                    visitScore -= 30;
                    reasons.push('Overcrowded');
                }

                // Parking factor
                if (!parkingAvailable) {
                    visitScore -= 15;
                    reasons.push('Limited parking');
                } else if (parking?.type === 'FREE') {
                    visitScore += 5;
                    reasons.push('Free parking');
                }

                // Distance factor (prefer closer spots)
                if (distance > 10) {
                    visitScore -= 10;
                }

                return {
                    id: spot.id,
                    name: spot.name,
                    tamilName: spot.tamil_name,
                    category: spot.category,
                    type: spot.type,
                    image: spot.image,
                    description: spot.description,
                    coordinates: {
                        lat: spot.latitude,
                        lng: spot.longitude
                    },
                    distance: Math.round(distance * 10) / 10,
                    crowdLevel: crowdData.level,
                    crowdScore: crowdData.score,
                    parkingAvailable,
                    visitScore: Math.max(0, Math.min(100, visitScore)),
                    reasons: reasons.slice(0, 2),
                    recommendation: crowdData.recommendation || reasons[0] || 'Good option',
                    openTime: spot.openTime,
                    closeTime: spot.closeTime,
                    bestTime: spot.bestTime
                };
            })
        );

        // Filter out nulls and sort by visit score
        const validSuggestions = suggestions
            .filter(s => s !== null)
            .sort((a, b) => b!.visitScore - a!.visitScore)
            .slice(0, limit);

        // Get categories for filtering
        const categories = [...new Set(OOTY_SPOTS.map(s => s.category))];

        return NextResponse.json({
            success: true,
            location: { lat, lng },
            weather: weather ? {
                temperature: weather.current.temp,
                code: weather.current.code,
                isRaining,
                isFoggy
            } : null,
            categories,
            suggestions: validSuggestions,
            totalSpots: OOTY_SPOTS.length
        });

    } catch (error: any) {
        console.error('Suggestions error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to get suggestions' },
            { status: 500 }
        );
    }
}
