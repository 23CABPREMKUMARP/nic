/**
 * GraphHopper Service - API client for routing
 * Handles both GraphHopper Cloud API and local fallback routing
 */

import { COMMON_ROUTES, OOTY_SPOTS, OOTY_JUNCTIONS, getDistance, getSpotById, getHazardsNearPoint } from '@/data/ootyMapData';

// ============================================
// TYPES
// ============================================

export interface RoutePoint {
    lat: number;
    lng: number;
}

export interface RouteInstruction {
    text: string;
    tamil: string;
    distance: number;
    time: number;
    coordinate: [number, number];
    sign?: number;
    alert?: 'HAIRPIN' | 'STEEP_CLIMB' | 'STEEP_DESCENT' | 'FOG_ZONE' | 'WILDLIFE' | 'BRAKE_WARNING';
}

export interface RouteResult {
    success: boolean;
    distance: number; // km
    duration: number; // minutes
    polyline: [number, number][];
    instructions: RouteInstruction[];
    hillAlerts: HillAlert[];
    source: 'graphhopper' | 'fallback';
    error?: string;
}

export interface HillAlert {
    type: string;
    name: string;
    location: [number, number];
    message: string;
    tamilMessage: string;
}

export type VehicleType = 'car' | 'bike' | 'foot';

// ============================================
// CONFIGURATION
// ============================================

const GRAPHHOPPER_API_URL = process.env.GRAPHHOPPER_API_URL || 'https://graphhopper.com/api/1';
const GRAPHHOPPER_API_KEY = process.env.GRAPHHOPPER_API_KEY || process.env.NEXT_PUBLIC_GRAPHHOPPER_API_KEY || '';

// ============================================
// GRAPHHOPPER SERVICE CLASS
// ============================================

export class GraphHopperService {
    private static apiKey = GRAPHHOPPER_API_KEY;
    private static apiUrl = GRAPHHOPPER_API_URL;

    /**
     * Check if GraphHopper API is available
     */
    static isApiAvailable(): boolean {
        // Debug Log: Check if API Key is actually loaded
        if (!this.apiKey) {
            console.error('❌ GraphHopperService: API Key is MISSING or EMPTY');
            console.log('   process.env.GRAPHHOPPER_API_KEY:', process.env.GRAPHHOPPER_API_KEY ? 'Set' : 'Unset');
            console.log('   process.env.NEXT_PUBLIC_GRAPHHOPPER_API_KEY:', process.env.NEXT_PUBLIC_GRAPHHOPPER_API_KEY ? 'Set' : 'Unset');
        }
        return !!this.apiKey && this.apiKey.length > 10;
    }

    /**
     * Get route between two points
     */
    static async getRoute(
        start: RoutePoint,
        end: RoutePoint,
        vehicle: VehicleType = 'car'
    ): Promise<RouteResult> {
        // Try GraphHopper API first
        if (this.isApiAvailable()) {
            try {
                console.log(`🗺️ GraphHopper: Requesting route from ${start.lat},${start.lng} to ${end.lat},${end.lng}`);
                const result = await this.fetchFromGraphHopper(start, end, vehicle);
                if (result.success) {
                    return result;
                }
            } catch (error: any) {
                console.warn('⚠️ GraphHopper API failed:', error.message);
                // Fallback will be attempted
            }
        } else {
            console.warn('⚠️ GraphHopper API key missing or invalid. Using offline fallback.');
        }

        // Fallback to local routing
        return this.calculateFallbackRoute(start, end, vehicle, !this.isApiAvailable());
    }

    /**
     * Fetch route from GraphHopper API
     */
    private static async fetchFromGraphHopper(
        start: RoutePoint,
        end: RoutePoint,
        vehicle: VehicleType
    ): Promise<RouteResult> {
        const params = new URLSearchParams({
            point: `${start.lat},${start.lng}`,
            key: this.apiKey,
            vehicle: vehicle,
            locale: 'en',
            instructions: 'true',
            points_encoded: 'false'
        });

        // Add second point
        params.append('point', `${end.lat},${end.lng}`);

        const response = await fetch(`${this.apiUrl}/route?${params.toString()}`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ GraphHopper API Error (${response.status}):`, errorText);
            throw new Error(`GraphHopper API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();

        if (!data.paths || data.paths.length === 0) {
            throw new Error('No route found');
        }

        const path = data.paths[0];
        const points = path.points.coordinates.map((c: number[]) => [c[1], c[0]] as [number, number]);

        // Process instructions
        const instructions: RouteInstruction[] = path.instructions.map((inst: any, idx: number) => ({
            text: inst.text,
            tamil: this.translateToTamil(inst.text),
            distance: inst.distance,
            time: Math.round(inst.time / 1000 / 60),
            coordinate: points[inst.interval[0]] || points[0],
            sign: inst.sign
        }));

        // Add hill alerts based on route points
        const hillAlerts = this.detectHillAlerts(points);

        return {
            success: true,
            distance: path.distance / 1000,
            duration: Math.round(path.time / 1000 / 60),
            polyline: points,
            instructions,
            hillAlerts,
            source: 'graphhopper'
        };
    }

    /**
     * Calculate route using local fallback (DISABLED - API ONLY)
     */
    private static calculateFallbackRoute(
        start: RoutePoint,
        end: RoutePoint,
        vehicle: VehicleType,
        apiMissing: boolean = false
    ): RouteResult {

        console.warn('⚠️ Offline routing is disabled per user request. API connection required.');

        return {
            success: false,
            distance: 0,
            duration: 0,
            polyline: [],
            instructions: [],
            hillAlerts: [],
            source: 'fallback',
            error: apiMissing
                ? 'Check your internet connection or API Key.'
                : 'Navigation Service Unavailable. Please try again later.'
        };
    }

    /**
     * Detect hill hazards along the route
     */
    private static detectHillAlerts(polyline: [number, number][]): HillAlert[] {
        const alerts: HillAlert[] = [];
        const seen = new Set<string>();

        for (const point of polyline) {
            const hazards = getHazardsNearPoint(point[0], point[1], 0.5);
            for (const hazard of hazards) {
                if (!seen.has(hazard.id)) {
                    seen.add(hazard.id);
                    alerts.push({
                        type: hazard.type,
                        name: hazard.name,
                        location: [hazard.center.lat, hazard.center.lng],
                        message: hazard.alert_en,
                        tamilMessage: hazard.alert_ta
                    });
                }
            }
        }

        return alerts;
    }

    /**
     * Find nearest spot to a point
     */
    private static findNearestSpot(point: RoutePoint) {
        let nearest = null;
        let minDist = Infinity;

        const allPoints = [...OOTY_SPOTS, ...OOTY_JUNCTIONS];

        for (const spot of allPoints) {
            // Handle different property names (some have lat/lng, some latitude/longitude)
            const lat = 'lat' in spot ? spot.lat : (spot as any).latitude;
            const lng = 'lng' in spot ? spot.lng : (spot as any).longitude;

            const dist = getDistance(point.lat, point.lng, lat, lng);
            if (dist < minDist) {
                minDist = dist;
                nearest = spot;
            }
        }

        return nearest;
    }

    /**
     * Basic translation to Tamil (placeholder - enhance with actual translations)
     */
    private static translateToTamil(text: string): string {
        const translations: Record<string, string> = {
            'Turn left': 'இடது புறம் திரும்பவும்',
            'Turn right': 'வலது புறம் திரும்பவும்',
            'Continue': 'தொடரவும்',
            'Arrive': 'வந்துவிட்டீர்கள்',
            'Head': 'செல்லவும்',
            'north': 'வடக்கு',
            'south': 'தெற்கு',
            'east': 'கிழக்கு',
            'west': 'மேற்கு'
        };

        let result = text;
        for (const [en, ta] of Object.entries(translations)) {
            result = result.replace(new RegExp(en, 'gi'), ta);
        }
        return result;
    }

    /**
     * Geocode a place name to coordinates
     */
    static async geocode(query: string): Promise<RoutePoint | null> {
        // First check local spots
        const spot = OOTY_SPOTS.find(s =>
            s.name.toLowerCase().includes(query.toLowerCase()) ||
            s.tamil_name.includes(query)
        );

        if (spot) {
            return { lat: spot.latitude, lng: spot.longitude };
        }

        // Try GraphHopper geocoding if API available
        if (this.isApiAvailable()) {
            try {
                const params = new URLSearchParams({
                    q: `${query}, Ooty, Tamil Nadu`,
                    key: this.apiKey,
                    limit: '1'
                });

                const response = await fetch(`${this.apiUrl}/geocode?${params.toString()}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.hits && data.hits.length > 0) {
                        return {
                            lat: data.hits[0].point.lat,
                            lng: data.hits[0].point.lng
                        };
                    }
                }
            } catch (error) {
                console.warn('Geocoding failed:', error);
            }
        }

        return null;
    }
}

export default GraphHopperService;
