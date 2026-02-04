/**
 * Smart ETA - Hill-specific ETA calculations
 * Accounts for hairpins, gradients, fog, school zones, and tourist vehicle rules
 */

import { OOTY_ROADS, HILL_HAZARDS, OOTY_JUNCTIONS } from '@/data/ootyMapData';
import { getWeather } from '@/services/weatherService';
import { AdminControl } from '@/services/admin/adminControl';
import { getTimingFactors } from '@/data/historicalData';

// ============================================
// TYPES
// ============================================

export interface SmartETAResult {
    baseETA: number;          // Minutes (standard calculation)
    adjustedETA: number;      // Minutes (with all factors)
    confidence: number;       // 0-1
    factors: ETAFactors;
    warnings: ETAWarning[];
    breakdown: ETABreakdown;
}

export interface ETAFactors {
    hairpinDelay: number;     // Minutes added for hairpin turns
    gradientDelay: number;    // Minutes added for steep roads
    fogDelay: number;         // Minutes added for fog conditions
    schoolZoneDelay: number;  // Minutes added for school zones
    congestionDelay: number;  // Minutes added for traffic
    controlDelay: number;     // Minutes added for admin controls
}

export interface ETAWarning {
    type: 'HAIRPIN' | 'FOG' | 'STEEP' | 'SCHOOL_ZONE' | 'CONTROL' | 'WEATHER';
    message: string;
    tamilMessage: string;
    severity: 'INFO' | 'WARNING' | 'ALERT';
}

export interface ETABreakdown {
    drivingTime: number;
    trafficTime: number;
    hazardTime: number;
    totalTime: number;
}

export interface RouteSegment {
    name: string;
    distanceKm: number;
    hairpins: number;
    gradient: number; // Percentage
    isSteep: boolean;
    hasSchoolZone: boolean;
    speedLimit: number;
}

// ============================================
// CONSTANTS
// ============================================

const HAIRPIN_DELAY_SECONDS = 20;      // Seconds per hairpin
const STEEP_GRADIENT_MULTIPLIER = 0.15; // 15% speed reduction for steep
const FOG_MULTIPLIER = 0.4;            // 40% speed reduction in fog
const SCHOOL_ZONE_DELAY_MINUTES = 3;   // Minutes for school zone during hours
const TOURIST_VEHICLE_SPEED = 25;      // km/h average for tourist vehicles
const HEAVY_VEHICLE_NIGHT_ONLY = true; // Heavy vehicles only at night

// ============================================
// SMART ETA CLASS
// ============================================

export class SmartETA {
    /**
     * Calculate smart ETA for a route
     */
    static async calculate(
        routePolyline: [number, number][],
        baseDistanceKm: number,
        baseETAMinutes: number,
        vehicleType: 'car' | 'bike' | 'bus' | 'heavy' = 'car'
    ): Promise<SmartETAResult> {
        const warnings: ETAWarning[] = [];

        // Analyze route segments
        const segments = this.analyzeRouteSegments(routePolyline);

        // Calculate individual delays
        const hairpinDelay = this.calculateHairpinDelay(segments);
        const gradientDelay = this.calculateGradientDelay(segments, vehicleType);
        const fogDelay = await this.calculateFogDelay(segments);
        const schoolZoneDelay = await this.calculateSchoolZoneDelay(segments);
        const congestionDelay = 0; // Already in base ETA from GraphHopper
        const controlDelay = await this.calculateControlDelay(routePolyline);

        // Collect warnings
        if (hairpinDelay > 2) {
            warnings.push({
                type: 'HAIRPIN',
                message: `${Math.round(segments.reduce((sum, s) => sum + s.hairpins, 0))} hairpin turns ahead`,
                tamilMessage: 'முன்னால் ஹேர்பின் வளைவுகள்',
                severity: 'WARNING'
            });
        }

        if (fogDelay > 0) {
            warnings.push({
                type: 'FOG',
                message: 'Fog conditions. Reduced visibility.',
                tamilMessage: 'மூட்டம். பார்வை குறைவு.',
                severity: 'ALERT'
            });
        }

        if (schoolZoneDelay > 0) {
            warnings.push({
                type: 'SCHOOL_ZONE',
                message: 'School zone ahead. Speed limit enforced.',
                tamilMessage: 'பள்ளி மண்டலம். வேக வரம்பு.',
                severity: 'INFO'
            });
        }

        if (controlDelay > 0) {
            warnings.push({
                type: 'CONTROL',
                message: 'Traffic control in effect.',
                tamilMessage: 'போக்குவரத்து கட்டுப்பாடு.',
                severity: 'WARNING'
            });
        }

        // Check weather
        const weather = await getWeather('Ooty');
        const weatherCode = weather?.current?.code ?? 0;
        if (weatherCode >= 51) {
            warnings.push({
                type: 'WEATHER',
                message: 'Rain expected. Roads may be slippery.',
                tamilMessage: 'மழை வரும். சாலைகள் வழுக்கலாம்.',
                severity: 'WARNING'
            });
        }

        // Sum up factors
        const factors: ETAFactors = {
            hairpinDelay,
            gradientDelay,
            fogDelay,
            schoolZoneDelay,
            congestionDelay,
            controlDelay
        };

        const totalDelay = Object.values(factors).reduce((sum, d) => sum + d, 0);
        const adjustedETA = baseETAMinutes + totalDelay;

        // Calculate confidence
        const confidence = this.calculateConfidence(factors, segments);

        return {
            baseETA: baseETAMinutes,
            adjustedETA: Math.round(adjustedETA),
            confidence,
            factors,
            warnings,
            breakdown: {
                drivingTime: baseETAMinutes,
                trafficTime: congestionDelay,
                hazardTime: hairpinDelay + gradientDelay + fogDelay,
                totalTime: Math.round(adjustedETA)
            }
        };
    }

    /**
     * Analyze route to identify segments with special conditions
     */
    private static analyzeRouteSegments(
        polyline: [number, number][]
    ): RouteSegment[] {
        const segments: RouteSegment[] = [];

        // Check which known roads the route passes through
        for (const road of OOTY_ROADS) {
            const fromJunction = OOTY_JUNCTIONS.find(j => j.id === road.from);
            // Handle null 'to' (external roads) by skipping check or using end of polyline
            const toJunction = road.to ? OOTY_JUNCTIONS.find(j => j.id === road.to) : null;

            if (!fromJunction) continue;

            // Simple check - see if any polyline points are near the road endpoints
            const isOnRoute = polyline.some(point =>
                this.isNearPoint(point, { lat: fromJunction.lat, lng: fromJunction.lng }) ||
                (toJunction && this.isNearPoint(point, { lat: toJunction.lat, lng: toJunction.lng }))
            );

            if (isOnRoute) {
                segments.push({
                    name: road.name,
                    distanceKm: road.distance,
                    hairpins: road.hairpins || 0,
                    gradient: road.steepness * 2 || 0, // Approx gradient from steepness 1-5
                    isSteep: road.steepness >= 3,
                    hasSchoolZone: false, // Default
                    speedLimit: road.speedLimit || 40
                });
            }
        }

        // If no known roads, create a default segment
        if (segments.length === 0) {
            segments.push({
                name: 'Unknown Route',
                distanceKm: this.calculatePolylineDistance(polyline),
                hairpins: 0,
                gradient: 5,
                isSteep: false,
                hasSchoolZone: false,
                speedLimit: 40
            });
        }

        return segments;
    }

    /**
     * Calculate delay for hairpin turns
     */
    private static calculateHairpinDelay(segments: RouteSegment[]): number {
        const totalHairpins = segments.reduce((sum, s) => sum + s.hairpins, 0);
        return (totalHairpins * HAIRPIN_DELAY_SECONDS) / 60; // Convert to minutes
    }

    /**
     * Calculate delay for steep gradients
     */
    private static calculateGradientDelay(
        segments: RouteSegment[],
        vehicleType: string
    ): number {
        let delay = 0;

        for (const segment of segments) {
            if (segment.isSteep || segment.gradient > 8) {
                // Vehicles slow down on steep roads
                const baseTime = (segment.distanceKm / 40) * 60; // Base time in minutes
                let multiplier = STEEP_GRADIENT_MULTIPLIER;

                // Heavier vehicles are slower uphill
                if (vehicleType === 'bus') multiplier *= 1.5;
                if (vehicleType === 'heavy') multiplier *= 2;

                delay += baseTime * multiplier;
            }
        }

        return delay;
    }

    /**
     * Calculate delay for fog conditions
     */
    private static async calculateFogDelay(segments: RouteSegment[]): Promise<number> {
        // Check hazard zones for fog
        const hasFogZone = segments.some(s =>
            HILL_HAZARDS.some(h =>
                h.type === 'FOG_ZONE' &&
                (h.name.includes(s.name) || s.name.includes(h.name.split(' ')[0]))
            )
        );

        if (!hasFogZone) return 0;

        // Check current weather
        // Check current weather
        const weather = await getWeather('Ooty');
        const weatherCode = weather?.current?.code ?? 0;
        const isFoggy = weatherCode >= 45 && weatherCode <= 48;

        // Also check time - fog is common early morning
        const hour = new Date().getHours();
        const isFogTime = hour >= 5 && hour <= 8;

        if (isFoggy || isFogTime) {
            // Calculate delay based on affected segments
            const affectedDistance = segments
                .filter(s => HILL_HAZARDS.some(h => h.type === 'FOG_ZONE'))
                .reduce((sum, s) => sum + s.distanceKm, 0);

            // Fog reduces speed by 40%
            const baseTime = (affectedDistance / 40) * 60;
            return baseTime * FOG_MULTIPLIER;
        }

        return 0;
    }

    /**
     * Calculate delay for school zones
     */
    private static async calculateSchoolZoneDelay(
        segments: RouteSegment[]
    ): Promise<number> {
        const hasSchoolZone = segments.some(s => s.hasSchoolZone);
        if (!hasSchoolZone) return 0;

        // Check if during school hours
        const timing = await getTimingFactors();
        const now = new Date();
        const hour = now.getHours();
        const dayOfWeek = now.getDay();

        // Weekdays during school start/end times
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
            if ((hour >= 7 && hour <= 9) || (hour >= 14 && hour <= 16)) {
                return SCHOOL_ZONE_DELAY_MINUTES;
            }
        }

        return 0;
    }

    /**
     * Calculate delay for admin controls
     */
    private static async calculateControlDelay(
        polyline: [number, number][]
    ): Promise<number> {
        let delay = 0;

        for (const point of polyline) {
            const control = await AdminControl.isInControlZone(point[0], point[1]);

            if (control) {
                switch (control.type) {
                    case 'ROAD_CLOSED':
                        delay += 15; // Major detour
                        break;
                    case 'ACCIDENT':
                        delay += 10;
                        break;
                    case 'VIP_MOVEMENT':
                        delay += 5;
                        break;
                    case 'FESTIVAL':
                        delay += 3;
                        break;
                    default:
                        delay += 2;
                }
                break; // Only count first control
            }
        }

        return delay;
    }

    /**
     * Check if a point is near another point
     */
    private static isNearPoint(
        point: [number, number],
        target: { lat: number; lng: number },
        thresholdKm: number = 0.5
    ): boolean {
        const distance = this.getDistance(point[0], point[1], target.lat, target.lng);
        return distance < thresholdKm;
    }

    /**
     * Calculate total distance of polyline
     */
    private static calculatePolylineDistance(polyline: [number, number][]): number {
        let distance = 0;
        for (let i = 1; i < polyline.length; i++) {
            distance += this.getDistance(
                polyline[i - 1][0], polyline[i - 1][1],
                polyline[i][0], polyline[i][1]
            );
        }
        return distance;
    }

    /**
     * Calculate distance between two points
     */
    private static getDistance(
        lat1: number, lon1: number,
        lat2: number, lon2: number
    ): number {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    /**
     * Calculate confidence score
     */
    private static calculateConfidence(
        factors: ETAFactors,
        segments: RouteSegment[]
    ): number {
        let confidence = 0.85; // Base confidence

        // Known roads increase confidence
        const hasKnownRoads = segments.some(s => s.name !== 'Unknown Route');
        if (hasKnownRoads) confidence += 0.05;

        // Many delays decrease confidence
        const totalDelay = Object.values(factors).reduce((sum, d) => sum + d, 0);
        if (totalDelay > 10) confidence -= 0.1;
        if (totalDelay > 20) confidence -= 0.1;

        return Math.max(0.5, Math.min(0.95, confidence));
    }

    /**
     * Get ETA display string
     */
    static formatETA(minutes: number): { en: string; ta: string } {
        if (minutes < 60) {
            return {
                en: `${minutes} min`,
                ta: `${minutes} நிமிடம்`
            };
        }

        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;

        if (mins === 0) {
            return {
                en: `${hours} hr`,
                ta: `${hours} மணி`
            };
        }

        return {
            en: `${hours} hr ${mins} min`,
            ta: `${hours} மணி ${mins} நிமிடம்`
        };
    }

    /**
     * Get vehicle-specific speed limits
     */
    static getVehicleSpeedLimit(vehicleType: string): number {
        const limits: Record<string, number> = {
            'car': 40,
            'bike': 35,
            'bus': 30,
            'heavy': 25,
            'tourist': 35
        };
        return limits[vehicleType] || 40;
    }

    /**
     * Check if heavy vehicle is allowed at current time
     */
    static isHeavyVehicleAllowed(): { allowed: boolean; message: string } {
        const hour = new Date().getHours();

        // Heavy vehicles allowed only at night (10 PM - 6 AM)
        if (hour >= 22 || hour < 6) {
            return { allowed: true, message: 'Heavy vehicles allowed during night hours' };
        }

        return {
            allowed: false,
            message: 'Heavy vehicles not allowed during day (10 PM - 6 AM only)'
        };
    }
}

export default SmartETA;
