/**
 * Navigation Reroute API
 * POST /api/navigation/reroute
 * 
 * Check if destination needs rerouting and get alternatives
 */

import { NextRequest, NextResponse } from 'next/server';
import { CrowdRouter } from '@/services/navigation/CrowdRouter';
import { GraphHopperService } from '@/services/navigation/GraphHopperService';
import { OOTY_SPOTS } from '@/data/ootyMapData';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const {
            destinationId,
            destinationName,
            currentLocation,
            vehicle = 'car'
        } = body;

        // Resolve destination name
        let destName = destinationName;
        let destination = null;

        if (destinationId) {
            destination = OOTY_SPOTS.find(s => s.id === destinationId);
            if (destination) {
                destName = destination.name;
            }
        }

        if (!destName) {
            return NextResponse.json(
                { error: 'destinationId or destinationName is required' },
                { status: 400 }
            );
        }

        // Check if reroute is needed
        const rerouteDecision = await CrowdRouter.checkReroute(destName);

        // If reroute is needed and we have current location, calculate routes to alternatives
        if (rerouteDecision.shouldReroute && currentLocation?.lat && currentLocation?.lng) {
            const alternativesWithRoutes = await Promise.all(
                rerouteDecision.alternatives.map(async (alt) => {
                    const altSpot = OOTY_SPOTS.find(s => s.id === alt.id);
                    if (!altSpot) return alt;

                    try {
                        const route = await GraphHopperService.getRoute(
                            currentLocation,
                            { lat: altSpot.latitude, lng: altSpot.longitude },
                            vehicle
                        );

                        return {
                            ...alt,
                            route: {
                                distance: route.distance,
                                duration: route.duration
                            }
                        };
                    } catch {
                        return alt;
                    }
                })
            );

            return NextResponse.json({
                success: true,
                ...rerouteDecision,
                alternatives: alternativesWithRoutes
            });
        }

        return NextResponse.json({
            success: true,
            ...rerouteDecision
        });

    } catch (error: any) {
        console.error('Reroute check error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to check reroute' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);

    const destinationId = searchParams.get('destinationId');
    const destinationName = searchParams.get('destination');

    // Resolve destination name
    let destName = destinationName;

    if (destinationId) {
        const destination = OOTY_SPOTS.find(s => s.id === destinationId);
        if (destination) {
            destName = destination.name;
        }
    }

    if (!destName) {
        return NextResponse.json(
            { error: 'destinationId or destination name required' },
            { status: 400 }
        );
    }

    try {
        const rerouteDecision = await CrowdRouter.checkReroute(destName);

        return NextResponse.json({
            success: true,
            ...rerouteDecision
        });

    } catch (error: any) {
        console.error('Reroute check error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to check reroute' },
            { status: 500 }
        );
    }
}
