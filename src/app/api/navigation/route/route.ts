/**
 * Navigation Route API
 * GET/POST /api/navigation/route
 * 
 * Calculate route between two points with Ooty-specific optimizations
 */

import { NextRequest, NextResponse } from 'next/server';
import { GraphHopperService, VehicleType } from '@/services/navigation/GraphHopperService';
import { CrowdRouter } from '@/services/navigation/CrowdRouter';
import { ParkingFirst } from '@/services/navigation/ParkingFirst';
import { HillSafety } from '@/services/navigation/HillSafety';
import { OOTY_SPOTS } from '@/data/ootyMapData';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const {
            start,
            end,
            destinationId,
            vehicle = 'car',
            options = {}
        } = body;

        // Validate inputs
        if (!start?.lat || !start?.lng) {
            return NextResponse.json(
                { error: 'Start location (lat, lng) is required' },
                { status: 400 }
            );
        }

        if (!end?.lat && !end?.lng && !destinationId) {
            return NextResponse.json(
                { error: 'End location or destinationId is required' },
                { status: 400 }
            );
        }

        // Resolve destination
        let endPoint = end;
        let destination = null;

        if (destinationId) {
            destination = OOTY_SPOTS.find(s => s.id === destinationId);
            if (!destination) {
                return NextResponse.json(
                    { error: `Destination not found: ${destinationId}` },
                    { status: 404 }
                );
            }
            endPoint = { lat: destination.latitude, lng: destination.longitude };
        }

        // Check if rerouting is needed
        let rerouteInfo = null;
        if (options.avoidCrowds && destination) {
            rerouteInfo = await CrowdRouter.checkReroute(destination.name);
        }

        // Use parking-first routing if requested
        if (options.parkingFirst && destinationId) {
            const parkingRoute = await ParkingFirst.planRoute(
                start,
                destinationId,
                {
                    reserveParking: options.reserveParking,
                    userId: options.userId,
                    preferFree: options.preferFreeParking
                }
            );

            return NextResponse.json({
                success: true,
                type: 'parking-first',
                route: parkingRoute.drivingRoute,
                parking: parkingRoute.parking,
                walking: parkingRoute.walkingRoute,
                totalDistance: parkingRoute.totalDistance,
                totalDuration: parkingRoute.totalDuration,
                reservation: parkingRoute.reservation,
                hillAlerts: HillSafety.getRouteHazards(parkingRoute.drivingRoute.polyline),
                reroute: rerouteInfo
            });
        }

        // Standard routing
        const route = await GraphHopperService.getRoute(
            start,
            endPoint,
            vehicle as VehicleType
        );

        // Get hill hazards along the route
        const hillAlerts = HillSafety.getRouteHazards(route.polyline);

        if (!route.success) {
            return NextResponse.json(
                { error: route.error || 'Unable to find a valid road route. Please verify your starting point is near a road.' },
                { status: 422 }
            );
        }

        return NextResponse.json({
            success: true,
            type: 'standard',
            route: {
                distance: route.distance,
                duration: route.duration,
                polyline: route.polyline,
                instructions: route.instructions,
                source: route.source
            },
            destination: destination ? {
                id: destination.id,
                name: destination.name,
                tamilName: destination.tamil_name
            } : null,
            hillAlerts,
            reroute: rerouteInfo
        });

    } catch (error: any) {
        console.error('Navigation route error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to calculate route' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);

    const startLat = parseFloat(searchParams.get('startLat') || '');
    const startLng = parseFloat(searchParams.get('startLng') || '');
    const endLat = parseFloat(searchParams.get('endLat') || '');
    const endLng = parseFloat(searchParams.get('endLng') || '');
    const destinationId = searchParams.get('destinationId');
    const vehicle = searchParams.get('vehicle') || 'car';

    if (!startLat || !startLng) {
        return NextResponse.json(
            { error: 'Start coordinates (startLat, startLng) are required' },
            { status: 400 }
        );
    }

    // Resolve destination
    let endPoint = { lat: endLat, lng: endLng };
    let destination = null;

    if (destinationId) {
        destination = OOTY_SPOTS.find(s => s.id === destinationId);
        if (!destination) {
            return NextResponse.json(
                { error: `Destination not found: ${destinationId}` },
                { status: 404 }
            );
        }
        endPoint = { lat: destination.latitude, lng: destination.longitude };
    }

    if (!endPoint.lat || !endPoint.lng) {
        return NextResponse.json(
            { error: 'End coordinates or destinationId required' },
            { status: 400 }
        );
    }

    try {
        const route = await GraphHopperService.getRoute(
            { lat: startLat, lng: startLng },
            endPoint,
            vehicle as VehicleType
        );

        const hillAlerts = HillSafety.getRouteHazards(route.polyline);

        return NextResponse.json({
            success: true,
            route,
            destination: destination ? {
                id: destination.id,
                name: destination.name
            } : null,
            hillAlerts
        });

    } catch (error: any) {
        console.error('Navigation route error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to calculate route' },
            { status: 500 }
        );
    }
}
