/**
 * Redirect Alternatives API - Get smart alternative spots
 */

import { NextRequest, NextResponse } from 'next/server';
import { RedirectService, RedirectOptions } from '@/services/redirect/redirectService';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const spotId = searchParams.get('spotId');
        const lat = searchParams.get('lat');
        const lng = searchParams.get('lng');
        const interests = searchParams.get('interests')?.split(',');
        const avoidCrowds = searchParams.get('avoidCrowds') === 'true';
        const requireParking = searchParams.get('requireParking') === 'true';
        const maxDistance = searchParams.get('maxDistance') ? parseFloat(searchParams.get('maxDistance')!) : undefined;
        const limit = parseInt(searchParams.get('limit') || '5');

        const options: RedirectOptions = {
            interests,
            avoidCrowds,
            requireParking,
            maxDistance,
            limit
        };

        if (lat && lng) {
            options.userLocation = { lat: parseFloat(lat), lng: parseFloat(lng) };
        }

        let suggestions;

        if (spotId) {
            // Get alternatives for a specific crowded spot
            suggestions = await RedirectService.getAlternatives(spotId, options);
        } else {
            // Get general smart suggestions
            suggestions = await RedirectService.getSuggestions(options);
        }

        return NextResponse.json({
            success: true,
            data: {
                suggestions,
                querySpotId: spotId || null,
                options: {
                    avoidCrowds,
                    requireParking,
                    maxDistance,
                    limit
                },
                timestamp: new Date().toISOString()
            }
        });
    } catch (error: any) {
        console.error('Alternatives API error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
