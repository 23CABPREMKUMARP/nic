/**
 * Parking First - Route planning with parking priority
 * Routes: HOME → PARKING → SPOT (with walking directions)
 */

import { GraphHopperService, RouteResult, RoutePoint } from './GraphHopperService';
import { OOTY_SPOTS, OOTY_PARKING, getDistance, getParkingForSpot } from '@/data/ootyMapData';
import { prisma } from '@/lib/prisma';

// ============================================
// TYPES
// ============================================

export interface ParkingFirstRoute {
    success: boolean;
    parking: ParkingInfo;
    drivingRoute: RouteResult;
    walkingRoute: WalkingRoute;
    totalDistance: number;
    totalDuration: number;
    reservation?: ParkingReservation;
}

export interface ParkingInfo {
    id: string;
    name: string;
    coordinates: RoutePoint;
    totalSlots: number;
    availableSlots: number;
    ratePerHour: number;
    type: 'FREE' | 'PAID';
    distanceToSpot: number; // meters
}

export interface WalkingRoute {
    distance: number; // meters
    duration: number; // minutes
    instructions: WalkingInstruction[];
}

export interface WalkingInstruction {
    text: string;
    tamil: string;
    distance: number;
}

export interface ParkingReservation {
    id: string;
    facilityId: string;
    reservedUntil: Date;
    status: 'RESERVED' | 'CONFIRMED' | 'EXPIRED';
}

// ============================================
// PARKING FIRST CLASS
// ============================================

export class ParkingFirst {
    /**
     * Plan a route with parking-first approach
     * Route: Start → Parking → Walk to Destination
     */
    static async planRoute(
        start: RoutePoint,
        destinationId: string,
        options?: {
            reserveParking?: boolean;
            userId?: string;
            preferFree?: boolean;
        }
    ): Promise<ParkingFirstRoute> {
        // Find destination spot
        const spot = OOTY_SPOTS.find(s => s.id === destinationId);
        if (!spot) {
            throw new Error(`Destination not found: ${destinationId}`);
        }

        // Find best parking for this spot
        const parking = await this.findBestParking(spot, options?.preferFree);
        if (!parking) {
            throw new Error(`No parking available near ${spot.name}`);
        }

        // Get driving route to parking
        const drivingRoute = await GraphHopperService.getRoute(
            start,
            parking.coordinates,
            'car'
        );

        if (!drivingRoute.success) {
            throw new Error(drivingRoute.error || 'Unable to find a valid road route to parking. Please try a different location.');
        }

        // Generate walking route from parking to spot
        const walkingRoute = this.generateWalkingRoute(
            parking.coordinates,
            { lat: spot.latitude, lng: spot.longitude },
            spot
        );

        // Reserve parking if requested
        let reservation: ParkingReservation | undefined;
        if (options?.reserveParking && options?.userId) {
            reservation = await this.reserveParking(parking.id, options.userId);
        }

        return {
            success: true,
            parking,
            drivingRoute,
            walkingRoute,
            totalDistance: drivingRoute.distance + (walkingRoute.distance / 1000),
            totalDuration: drivingRoute.duration + walkingRoute.duration,
            reservation
        };
    }

    /**
     * Find the best parking for a spot
     */
    static async findBestParking(
        spot: any,
        preferFree: boolean = false
    ): Promise<ParkingInfo | null> {
        // Get parking facilities near the spot
        const nearbyParking = OOTY_PARKING
            .map(p => ({
                ...p,
                distance: getDistance(spot.latitude, spot.longitude, p.latitude, p.longitude) * 1000 // to meters
            }))
            .filter(p => p.distance < 2000) // Within 2km
            .sort((a, b) => {
                // Prefer spot-specific parking first
                if (a.spotId === spot.id && b.spotId !== spot.id) return -1;
                if (b.spotId === spot.id && a.spotId !== spot.id) return 1;

                // Then by preference (free vs paid)
                if (preferFree) {
                    if (a.type === 'FREE' && b.type !== 'FREE') return -1;
                    if (b.type === 'FREE' && a.type !== 'FREE') return 1;
                }

                // Then by distance
                return a.distance - b.distance;
            });

        if (nearbyParking.length === 0) {
            return null;
        }

        const best = nearbyParking[0];

        // Get available slots from database
        let availableSlots = best.totalSlots;
        try {
            // Query through Location since ParkingFacility doesn't have name
            const facility = await prisma.parkingFacility.findFirst({
                where: {
                    location: {
                        name: { contains: best.name, mode: 'insensitive' }
                    }
                },
                include: {
                    bookings: {
                        where: {
                            status: { in: ['BOOKED', 'ARRIVED'] },
                            bookingDate: {
                                gte: new Date(new Date().setHours(0, 0, 0, 0)),
                                lte: new Date(new Date().setHours(23, 59, 59, 999))
                            }
                        }
                    }
                }
            });

            if (facility) {
                availableSlots = facility.totalSlots - facility.bookings.length;
            }
        } catch (error) {
            // Database might not have this facility, use static data
            console.warn('Could not fetch parking availability from DB');
        }

        return {
            id: best.id,
            name: best.name,
            coordinates: { lat: best.latitude, lng: best.longitude },
            totalSlots: best.totalSlots,
            availableSlots: Math.max(0, availableSlots),
            ratePerHour: best.ratePerHour,
            type: best.type as 'FREE' | 'PAID',
            distanceToSpot: Math.round(best.distance)
        };
    }

    /**
     * Generate walking directions from parking to spot
     */
    private static generateWalkingRoute(
        parking: RoutePoint,
        spot: RoutePoint,
        spotInfo: any
    ): WalkingRoute {
        const distance = getDistance(parking.lat, parking.lng, spot.lat, spot.lng) * 1000; // meters
        const walkingSpeed = 5; // km/h = 83 m/min
        const duration = Math.round(distance / 83);

        return {
            distance: Math.round(distance),
            duration: Math.max(1, duration),
            instructions: [
                {
                    text: 'Exit parking and head towards the main entrance',
                    tamil: 'வாகன நிறுத்துமிடத்தை விட்டு வெளியேறி முக்கிய நுழைவாயிலை நோக்கி செல்லவும்',
                    distance: Math.round(distance * 0.3)
                },
                {
                    text: 'Follow the pedestrian path',
                    tamil: 'நடைபாதையைப் பின்பற்றவும்',
                    distance: Math.round(distance * 0.5)
                },
                {
                    text: `Arrive at ${spotInfo.name}`,
                    tamil: `${spotInfo.tamil_name} வந்துவிட்டீர்கள்`,
                    distance: Math.round(distance * 0.2)
                }
            ]
        };
    }

    /**
     * Reserve a parking slot
     */
    static async reserveParking(
        parkingId: string,
        userId: string
    ): Promise<ParkingReservation> {
        // Find parking facility in database
        const staticParking = OOTY_PARKING.find(p => p.id === parkingId);
        if (!staticParking) {
            throw new Error('Parking not found');
        }

        try {
            // Query through Location since ParkingFacility doesn't have name
            const facility = await prisma.parkingFacility.findFirst({
                where: {
                    location: {
                        name: { contains: staticParking.name, mode: 'insensitive' }
                    }
                }
            });

            if (facility) {
                // Create booking
                const booking = await prisma.parkingBooking.create({
                    data: {
                        facilityId: facility.id,
                        userId: userId,
                        vehicleNo: 'TBD', // User will update
                        vehicleType: 'CAR',
                        bookingDate: new Date(),
                        startTime: new Date(),
                        endTime: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours
                        amount: 0,
                        qrCode: `nav-park-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                        status: 'BOOKED'
                    }
                });

                return {
                    id: booking.id,
                    facilityId: facility.id,
                    reservedUntil: booking.endTime,
                    status: 'RESERVED'
                };
            }
        } catch (error) {
            console.warn('Could not create parking reservation in DB');
        }

        // Fallback: return mock reservation
        return {
            id: `reserve-${Date.now()}`,
            facilityId: parkingId,
            reservedUntil: new Date(Date.now() + 30 * 60 * 1000), // 30 min hold
            status: 'RESERVED'
        };
    }

    /**
     * Get parking availability for a destination
     */
    static async getParkingAvailability(destinationId: string): Promise<ParkingInfo[]> {
        const spot = OOTY_SPOTS.find(s => s.id === destinationId);
        if (!spot) {
            return [];
        }

        const nearbyParking = OOTY_PARKING
            .map(p => ({
                ...p,
                distance: getDistance(spot.latitude, spot.longitude, p.latitude, p.longitude) * 1000
            }))
            .filter(p => p.distance < 3000)
            .sort((a, b) => a.distance - b.distance);

        return Promise.all(
            nearbyParking.map(async (p) => {
                const parking = await this.findBestParking({ latitude: p.latitude, longitude: p.longitude });
                return {
                    id: p.id,
                    name: p.name,
                    coordinates: { lat: p.latitude, lng: p.longitude },
                    totalSlots: p.totalSlots,
                    availableSlots: parking?.availableSlots || p.totalSlots,
                    ratePerHour: p.ratePerHour,
                    type: p.type as 'FREE' | 'PAID',
                    distanceToSpot: Math.round(p.distance)
                };
            })
        );
    }
}

export default ParkingFirst;
