/**
 * Admin Control - Traffic control for local authorities
 * Allows setting road closures, VIP movements, festivals, and restrictions
 */

import { prisma } from '@/lib/prisma';

// ============================================
// TYPES
// ============================================

export type ControlType =
    | 'ROAD_CLOSED'
    | 'ACCIDENT'
    | 'VIP_MOVEMENT'
    | 'FESTIVAL'
    | 'LANDSLIDE'
    | 'MAINTENANCE'
    | 'WEATHER_ALERT'
    | 'SCHOOL_ZONE'
    | 'HEAVY_VEHICLE_BAN';

export type ControlSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface TrafficControl {
    id: string;
    type: ControlType;
    title: string;
    location: { lat: number; lng: number };
    radius: number; // meters
    startTime: Date;
    endTime?: Date;
    severity: ControlSeverity;
    affectedRoutes: string[];
    alternateRoutes: string[];
    message: { en: string; ta: string };
    createdBy: string;
    createdAt: Date;
    active: boolean;
}

export interface ControlStats {
    activeControls: number;
    byType: Record<ControlType, number>;
    affectedRoutes: number;
    totalRedirections: number;
}

// ============================================
// IN-MEMORY STORAGE (Replace with DB in production)
// ============================================

let activeControls: TrafficControl[] = [];

// ============================================
// ADMIN CONTROL CLASS
// ============================================

export class AdminControl {
    /**
     * Create a new traffic control
     */
    static async createControl(
        control: Omit<TrafficControl, 'id' | 'createdAt' | 'active'>
    ): Promise<TrafficControl> {
        const newControl: TrafficControl = {
            ...control,
            id: `ctrl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            createdAt: new Date(),
            active: true
        };

        activeControls.push(newControl);

        // Log admin action
        await this.logAdminAction(control.createdBy, 'CREATE_CONTROL', {
            type: control.type,
            title: control.title
        });

        console.log(`🚧 Traffic control created: ${control.title}`);

        return newControl;
    }

    /**
     * Update an existing control
     */
    static async updateControl(
        id: string,
        updates: Partial<TrafficControl>,
        adminId: string
    ): Promise<TrafficControl | null> {
        const index = activeControls.findIndex(c => c.id === id);
        if (index === -1) return null;

        activeControls[index] = {
            ...activeControls[index],
            ...updates
        };

        await this.logAdminAction(adminId, 'UPDATE_CONTROL', { id, updates });

        return activeControls[index];
    }

    /**
     * Deactivate a control
     */
    static async deactivateControl(id: string, adminId: string): Promise<boolean> {
        const control = activeControls.find(c => c.id === id);
        if (!control) return false;

        control.active = false;
        control.endTime = new Date();

        await this.logAdminAction(adminId, 'DEACTIVATE_CONTROL', { id });

        return true;
    }

    /**
     * Get all active controls
     */
    static async getActiveControls(): Promise<TrafficControl[]> {
        const now = new Date();

        // Filter out expired controls
        return activeControls.filter(c => {
            if (!c.active) return false;
            if (c.endTime && c.endTime < now) return false;
            return true;
        });
    }

    /**
     * Get controls affecting a specific route
     */
    static async getControlsForRoute(routeId: string): Promise<TrafficControl[]> {
        const active = await this.getActiveControls();
        return active.filter(c => c.affectedRoutes.includes(routeId));
    }

    /**
     * Get controls near a location
     */
    static async getControlsNearLocation(
        lat: number,
        lng: number,
        radiusKm: number = 5
    ): Promise<TrafficControl[]> {
        const active = await this.getActiveControls();

        return active.filter(c => {
            const distance = this.calculateDistance(
                lat, lng,
                c.location.lat, c.location.lng
            );
            return distance <= radiusKm;
        });
    }

    /**
     * Check if a point is in a control zone
     */
    static async isInControlZone(
        lat: number,
        lng: number
    ): Promise<TrafficControl | null> {
        const active = await this.getActiveControls();

        for (const control of active) {
            const distance = this.calculateDistance(
                lat, lng,
                control.location.lat, control.location.lng
            ) * 1000; // Convert to meters

            if (distance <= control.radius) {
                return control;
            }
        }

        return null;
    }

    /**
     * Get control statistics
     */
    static async getStats(): Promise<ControlStats> {
        const active = await this.getActiveControls();

        const byType: Partial<Record<ControlType, number>> = {};
        const allAffectedRoutes = new Set<string>();

        for (const control of active) {
            byType[control.type] = (byType[control.type] || 0) + 1;
            control.affectedRoutes.forEach(r => allAffectedRoutes.add(r));
        }

        return {
            activeControls: active.length,
            byType: byType as Record<ControlType, number>,
            affectedRoutes: allAffectedRoutes.size,
            totalRedirections: 0 // Would track actual redirections
        };
    }

    // ============================================
    // QUICK ACTIONS
    // ============================================

    /**
     * Quick action: Close road
     */
    static async closeRoad(
        roadName: string,
        location: { lat: number; lng: number },
        reason: string,
        durationHours: number,
        adminId: string
    ): Promise<TrafficControl> {
        return this.createControl({
            type: 'ROAD_CLOSED',
            title: `${roadName} - Closed`,
            location,
            radius: 500,
            startTime: new Date(),
            endTime: new Date(Date.now() + durationHours * 60 * 60 * 1000),
            severity: 'HIGH',
            affectedRoutes: [roadName.toLowerCase().replace(/\s+/g, '-')],
            alternateRoutes: [],
            message: {
                en: `${roadName} is closed: ${reason}`,
                ta: `${roadName} மூடப்பட்டுள்ளது: ${reason}`
            },
            createdBy: adminId
        });
    }

    /**
     * Quick action: Report accident
     */
    static async reportAccident(
        location: { lat: number; lng: number },
        severity: ControlSeverity,
        description: string,
        adminId: string
    ): Promise<TrafficControl> {
        return this.createControl({
            type: 'ACCIDENT',
            title: 'Accident Reported',
            location,
            radius: 200,
            startTime: new Date(),
            severity,
            affectedRoutes: [],
            alternateRoutes: [],
            message: {
                en: `Accident: ${description}. Please use alternate route.`,
                ta: `விபத்து: ${description}. மாற்று வழியைப் பயன்படுத்தவும்.`
            },
            createdBy: adminId
        });
    }

    /**
     * Quick action: VIP Movement
     */
    static async createVIPMovement(
        route: string[],
        startTime: Date,
        endTime: Date,
        adminId: string
    ): Promise<TrafficControl> {
        return this.createControl({
            type: 'VIP_MOVEMENT',
            title: 'VIP Movement',
            location: { lat: 11.4102, lng: 76.6950 }, // Ooty center
            radius: 2000,
            startTime,
            endTime,
            severity: 'MEDIUM',
            affectedRoutes: route,
            alternateRoutes: [],
            message: {
                en: 'VIP movement in progress. Expect delays.',
                ta: 'VIP பயணம் நடைபெறுகிறது. தாமதத்தை எதிர்பாருங்கள்.'
            },
            createdBy: adminId
        });
    }

    /**
     * Quick action: Festival restriction
     */
    static async createFestivalRestriction(
        festivalName: string,
        affectedAreas: string[],
        startDate: Date,
        endDate: Date,
        adminId: string
    ): Promise<TrafficControl> {
        return this.createControl({
            type: 'FESTIVAL',
            title: `${festivalName} - Traffic Restrictions`,
            location: { lat: 11.4102, lng: 76.6950 },
            radius: 3000,
            startTime: startDate,
            endTime: endDate,
            severity: 'MEDIUM',
            affectedRoutes: affectedAreas,
            alternateRoutes: [],
            message: {
                en: `${festivalName} celebrations. Some areas may have restricted access.`,
                ta: `${festivalName} கொண்டாட்டங்கள். சில பகுதிகளில் அணுகல் கட்டுப்படுத்தப்படலாம்.`
            },
            createdBy: adminId
        });
    }

    /**
     * Quick action: Weather alert
     */
    static async createWeatherAlert(
        alertType: 'FOG' | 'RAIN' | 'LANDSLIDE_RISK',
        affectedRoads: string[],
        severity: ControlSeverity,
        adminId: string
    ): Promise<TrafficControl> {
        const messages = {
            'FOG': {
                en: 'Dense fog warning. Reduce speed and use fog lights.',
                ta: 'அடர்த்தியான மூட்டம் எச்சரிக்கை. வேகத்தைக் குறைக்கவும்.'
            },
            'RAIN': {
                en: 'Heavy rain alert. Roads may be slippery.',
                ta: 'கனமழை எச்சரிக்கை. சாலைகள் வழுக்கலாக இருக்கலாம்.'
            },
            'LANDSLIDE_RISK': {
                en: 'Landslide risk area. Drive with caution.',
                ta: 'நிலச்சரிவு ஆபத்து பகுதி. கவனமாக ஓட்டவும்.'
            }
        };

        return this.createControl({
            type: 'WEATHER_ALERT',
            title: `Weather Alert: ${alertType}`,
            location: { lat: 11.4102, lng: 76.6950 },
            radius: 5000,
            startTime: new Date(),
            severity,
            affectedRoutes: affectedRoads,
            alternateRoutes: [],
            message: messages[alertType],
            createdBy: adminId
        });
    }

    // ============================================
    // HELPER METHODS
    // ============================================

    private static calculateDistance(
        lat1: number, lon1: number,
        lat2: number, lon2: number
    ): number {
        const R = 6371; // Earth's radius in km
        const dLat = this.toRad(lat2 - lat1);
        const dLon = this.toRad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private static toRad(deg: number): number {
        return deg * (Math.PI / 180);
    }

    private static async logAdminAction(
        adminId: string,
        action: string,
        details: any
    ): Promise<void> {
        try {
            await prisma.adminLog.create({
                data: {
                    adminId,
                    action: `${action}: ${JSON.stringify(details)}`
                }
            });
        } catch (error) {
            console.log(`Admin action: ${action} by ${adminId}`);
        }
    }

    /**
     * Get control type icon
     */
    static getControlIcon(type: ControlType): string {
        const icons: Record<ControlType, string> = {
            'ROAD_CLOSED': '🚧',
            'ACCIDENT': '⚠️',
            'VIP_MOVEMENT': '🚔',
            'FESTIVAL': '🎉',
            'LANDSLIDE': '⛰️',
            'MAINTENANCE': '🔧',
            'WEATHER_ALERT': '🌧️',
            'SCHOOL_ZONE': '🏫',
            'HEAVY_VEHICLE_BAN': '🚛'
        };
        return icons[type] || '⚠️';
    }

    /**
     * Get severity color
     */
    static getSeverityColor(severity: ControlSeverity): string {
        const colors: Record<ControlSeverity, string> = {
            'LOW': '#22c55e',
            'MEDIUM': '#eab308',
            'HIGH': '#f97316',
            'CRITICAL': '#ef4444'
        };
        return colors[severity];
    }
}

export default AdminControl;
