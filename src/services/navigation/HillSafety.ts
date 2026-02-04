/**
 * Hill Safety Module - Terrain-aware safety alerts
 * Detects and warns about hill-specific hazards
 */

import { HILL_HAZARDS, getDistance, getHazardsNearPoint } from '@/data/ootyMapData';
import { VoiceGuide } from './VoiceGuide';

// ============================================
// TYPES
// ============================================

export type HazardType =
    | 'HAIRPIN'
    | 'HAIRPIN_ZONE'
    | 'STEEP_CLIMB'
    | 'STEEP_DESCENT'
    | 'FOG_ZONE'
    | 'WILDLIFE'
    | 'BRAKE_WARNING'
    | 'ACCIDENT_PRONE';

export interface SafetyAlert {
    id: string;
    type: HazardType;
    name: string;
    location: { lat: number; lng: number };
    radius: number;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    message: string;
    tamilMessage: string;
    action: string;
    tamilAction: string;
}

export interface RoadCondition {
    isFoggy: boolean;
    isRainy: boolean;
    visibility: 'GOOD' | 'MODERATE' | 'POOR';
    brakingCondition: 'NORMAL' | 'SLIPPERY' | 'DANGEROUS';
}

// ============================================
// HILL SAFETY CLASS
// ============================================

export class HillSafety {
    private static alertedHazards = new Set<string>();
    private static lastLocation: { lat: number; lng: number } | null = null;
    private static tripStartTime: number = 0;
    private static distanceTraveled: number = 0;

    /**
     * Start monitoring for a trip
     */
    static startTrip() {
        this.alertedHazards.clear();
        this.lastLocation = null;
        this.tripStartTime = Date.now();
        this.distanceTraveled = 0;
        console.log('🛡️ HillSafety: Trip monitoring started');
    }

    /**
     * End trip monitoring
     */
    static endTrip() {
        const duration = Math.round((Date.now() - this.tripStartTime) / 60000);
        console.log(`🛡️ HillSafety: Trip ended. Duration: ${duration} min, Distance: ${this.distanceTraveled.toFixed(1)} km`);
        this.alertedHazards.clear();
    }

    /**
     * Update current location and check for hazards
     */
    static checkLocation(lat: number, lng: number): SafetyAlert[] {
        // Update distance traveled
        if (this.lastLocation) {
            this.distanceTraveled += getDistance(
                this.lastLocation.lat, this.lastLocation.lng,
                lat, lng
            );
        }
        this.lastLocation = { lat, lng };

        // Find nearby hazards
        const nearbyHazards = getHazardsNearPoint(lat, lng, 0.5); // 500m radius
        const alerts: SafetyAlert[] = [];

        for (const hazard of nearbyHazards) {
            // Check if we've already alerted for this hazard
            if (this.alertedHazards.has(hazard.id)) {
                continue;
            }

            const distance = getDistance(lat, lng, hazard.center.lat, hazard.center.lng) * 1000;

            // Alert when within 300m
            if (distance <= 300) {
                this.alertedHazards.add(hazard.id);

                const alert = this.createAlert(hazard, distance);
                alerts.push(alert);

                // Announce via voice
                VoiceGuide.announceHillAlert(hazard.type);
            }
        }

        return alerts;
    }

    /**
     * Create a safety alert from a hazard
     */
    private static createAlert(hazard: any, distance: number): SafetyAlert {
        const severity = this.getSeverity(hazard.type);
        const action = this.getAction(hazard.type);

        return {
            id: hazard.id,
            type: hazard.type as HazardType,
            name: hazard.name,
            location: hazard.center,
            radius: hazard.radius,
            severity,
            message: hazard.alert_en,
            tamilMessage: hazard.alert_ta,
            action: action.en,
            tamilAction: action.ta
        };
    }

    /**
     * Get severity level for a hazard type
     */
    private static getSeverity(type: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
        const severityMap: Record<string, 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'> = {
            'HAIRPIN': 'HIGH',
            'HAIRPIN_ZONE': 'HIGH',
            'STEEP_CLIMB': 'MEDIUM',
            'STEEP_DESCENT': 'HIGH',
            'FOG_ZONE': 'HIGH',
            'WILDLIFE': 'MEDIUM',
            'BRAKE_WARNING': 'CRITICAL',
            'ACCIDENT_PRONE': 'CRITICAL'
        };
        return severityMap[type] || 'MEDIUM';
    }

    /**
     * Get recommended action for a hazard type
     */
    private static getAction(type: string): { en: string; ta: string } {
        const actions: Record<string, { en: string; ta: string }> = {
            'HAIRPIN': {
                en: 'Stay in your lane, use horn before each turn',
                ta: 'உங்கள் பாதையில் இருங்கள், ஒவ்வொரு திருப்பத்திற்கும் முன் ஹார்ன் அடியுங்கள்'
            },
            'HAIRPIN_ZONE': {
                en: 'Reduce speed to 15-20 km/h through this zone',
                ta: 'இந்த பகுதியில் வேகத்தை 15-20 கி.மீ/மணி என குறைக்கவும்'
            },
            'STEEP_CLIMB': {
                en: 'Use 2nd gear for better torque',
                ta: 'சிறந்த சக்திக்கு 2வது கியர் பயன்படுத்தவும்'
            },
            'STEEP_DESCENT': {
                en: 'Shift to 2nd gear, use engine braking',
                ta: '2வது கியருக்கு மாறி, என்ஜின் பிரேக்கிங் பயன்படுத்தவும்'
            },
            'FOG_ZONE': {
                en: 'Turn on fog lights, reduce speed to 20 km/h',
                ta: 'பனி விளக்குகளை ஒளிரவும், வேகத்தை 20 கி.மீ/மணி என குறைக்கவும்'
            },
            'WILDLIFE': {
                en: 'Do not stop, drive steadily at 30 km/h',
                ta: 'நிற்க வேண்டாம், 30 கி.மீ/மணி வேகத்தில் சீராக ஓட்டவும்'
            },
            'BRAKE_WARNING': {
                en: 'Find a safe spot to stop and let brakes cool for 10 minutes',
                ta: 'பாதுகாப்பான இடம் கண்டுபிடித்து 10 நிமிடம் பிரேக்குகளை குளிர விடுங்கள்'
            },
            'ACCIDENT_PRONE': {
                en: 'Maximum attention required, no overtaking',
                ta: 'அதிகபட்ச கவனம் தேவை, முந்துதல் வேண்டாம்'
            }
        };
        return actions[type] || { en: 'Exercise caution', ta: 'எச்சரிக்கையாக இருங்கள்' };
    }

    /**
     * Get current road conditions (integrates with weather)
     */
    static async getRoadConditions(lat: number, lng: number): Promise<RoadCondition> {
        // Check if in a fog zone
        const fogZones = HILL_HAZARDS.filter(h => h.type === 'FOG_ZONE');
        const inFogZone = fogZones.some(z =>
            getDistance(lat, lng, z.center.lat, z.center.lng) * 1000 < z.radius
        );

        // Default conditions (can be enhanced with weather API)
        const hour = new Date().getHours();
        const earlyMorning = hour >= 5 && hour <= 8;

        return {
            isFoggy: inFogZone || earlyMorning, // Ooty is often foggy in early morning
            isRainy: false, // TODO: Integrate with weather service
            visibility: inFogZone ? 'POOR' : earlyMorning ? 'MODERATE' : 'GOOD',
            brakingCondition: 'NORMAL'
        };
    }

    /**
     * Check if continuous descent braking warning is needed
     */
    static checkBrakeWarning(descentStartTime: number, descentDistance: number): boolean {
        // Warn if descending for more than 3km without a break
        if (descentDistance > 3) {
            return true;
        }

        // Warn if descending for more than 10 minutes continuously
        const descentDuration = (Date.now() - descentStartTime) / 60000;
        if (descentDuration > 10) {
            return true;
        }

        return false;
    }

    /**
     * Get all hazards along a route
     */
    static getRouteHazards(polyline: [number, number][]): SafetyAlert[] {
        const alerts: SafetyAlert[] = [];
        const seen = new Set<string>();

        for (const point of polyline) {
            const hazards = getHazardsNearPoint(point[0], point[1], 0.3);
            for (const hazard of hazards) {
                if (!seen.has(hazard.id)) {
                    seen.add(hazard.id);
                    alerts.push(this.createAlert(hazard, 0));
                }
            }
        }

        return alerts;
    }

    /**
     * Get emergency contacts for Ooty
     */
    static getEmergencyContacts() {
        return {
            police: '100',
            ambulance: '108',
            fireStation: '101',
            districtControl: '0423-2443355',
            touristHelpline: '1363',
            ootyPoliceStation: '0423-2443012',
            hospitalGH: '0423-2442212'
        };
    }
}

export default HillSafety;
