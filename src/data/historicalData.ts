/**
 * Historical Data - Past patterns for congestion prediction
 * Uses day/hour/month patterns from historical analysis
 */

// ============================================
// TYPES
// ============================================

export interface HistoricalPattern {
    locationName: string;
    averageScore: number;
    weekdayPattern: Record<number, number>; // 0-6 (Sun-Sat)
    hourlyPattern: Record<number, number>;  // 0-23
    monthlyPattern: Record<number, number>; // 0-11 (Jan-Dec)
    peakTimes: string[];
    quietTimes: string[];
}

export interface EventData {
    id: string;
    name: string;
    type: 'FESTIVAL' | 'HOLIDAY' | 'LOCAL_EVENT' | 'DISTRICT_WIDE';
    startDate: string;
    endDate: string;
    affectedSpots?: string[];
    crowdMultiplier: number;
    description: string;
}

export interface TimingFactors {
    schoolStart: number; // 8
    schoolEnd: number;   // 16
    marketDays: number[]; // Days with local markets
    peakTouristHours: [number, number]; // Start, End
}

// ============================================
// HISTORICAL PATTERNS DATA
// ============================================

const HISTORICAL_PATTERNS: Record<string, HistoricalPattern> = {
    'Botanical Garden': {
        locationName: 'Botanical Garden',
        averageScore: 65,
        weekdayPattern: { 0: 1.4, 1: 0.7, 2: 0.8, 3: 0.8, 4: 0.9, 5: 1.0, 6: 1.5 },
        hourlyPattern: {
            6: 0.3, 7: 0.4, 8: 0.6, 9: 0.9, 10: 1.3, 11: 1.4, 12: 1.2,
            13: 1.0, 14: 1.1, 15: 1.3, 16: 1.4, 17: 1.2, 18: 0.8, 19: 0.4,
            20: 0.2, 21: 0.1, 22: 0.1, 23: 0.1, 0: 0.1, 1: 0.1, 2: 0.1,
            3: 0.1, 4: 0.1, 5: 0.2
        },
        monthlyPattern: { 0: 0.8, 1: 0.7, 2: 0.9, 3: 1.3, 4: 1.5, 5: 1.0, 6: 0.8, 7: 0.7, 8: 0.8, 9: 1.1, 10: 1.3, 11: 1.2 },
        peakTimes: ['10:00-12:00', '15:00-17:00'],
        quietTimes: ['06:00-08:00', '18:00-19:00']
    },
    'Ooty Lake': {
        locationName: 'Ooty Lake',
        averageScore: 70,
        weekdayPattern: { 0: 1.5, 1: 0.6, 2: 0.7, 3: 0.7, 4: 0.8, 5: 1.1, 6: 1.6 },
        hourlyPattern: {
            6: 0.2, 7: 0.3, 8: 0.5, 9: 0.8, 10: 1.2, 11: 1.3, 12: 1.1,
            13: 0.9, 14: 1.0, 15: 1.4, 16: 1.5, 17: 1.3, 18: 0.9, 19: 0.5,
            20: 0.3, 21: 0.1, 22: 0.1, 23: 0.1, 0: 0.1, 1: 0.1, 2: 0.1,
            3: 0.1, 4: 0.1, 5: 0.2
        },
        monthlyPattern: { 0: 0.7, 1: 0.6, 2: 0.8, 3: 1.4, 4: 1.6, 5: 0.9, 6: 0.7, 7: 0.6, 8: 0.7, 9: 1.2, 10: 1.4, 11: 1.3 },
        peakTimes: ['15:00-17:00', '10:00-12:00'],
        quietTimes: ['06:00-09:00']
    },
    'Rose Garden': {
        locationName: 'Rose Garden',
        averageScore: 55,
        weekdayPattern: { 0: 1.3, 1: 0.7, 2: 0.8, 3: 0.8, 4: 0.9, 5: 1.0, 6: 1.4 },
        hourlyPattern: {
            6: 0.4, 7: 0.5, 8: 0.7, 9: 1.0, 10: 1.2, 11: 1.3, 12: 1.1,
            13: 0.9, 14: 1.0, 15: 1.2, 16: 1.2, 17: 1.0, 18: 0.7, 19: 0.4,
            20: 0.2, 21: 0.1, 22: 0.1, 23: 0.1, 0: 0.1, 1: 0.1, 2: 0.1,
            3: 0.1, 4: 0.1, 5: 0.3
        },
        monthlyPattern: { 0: 0.8, 1: 0.7, 2: 0.9, 3: 1.2, 4: 1.3, 5: 0.9, 6: 0.8, 7: 0.7, 8: 0.8, 9: 1.0, 10: 1.2, 11: 1.1 },
        peakTimes: ['10:00-12:00'],
        quietTimes: ['06:00-08:00', '17:00-18:00']
    },
    'Doddabetta Peak': {
        locationName: 'Doddabetta Peak',
        averageScore: 60,
        weekdayPattern: { 0: 1.5, 1: 0.6, 2: 0.7, 3: 0.7, 4: 0.8, 5: 1.0, 6: 1.5 },
        hourlyPattern: {
            6: 0.8, 7: 1.0, 8: 1.2, 9: 1.3, 10: 1.4, 11: 1.2, 12: 0.9,
            13: 0.7, 14: 0.8, 15: 1.0, 16: 1.1, 17: 0.9, 18: 0.5, 19: 0.2,
            20: 0.1, 21: 0.1, 22: 0.1, 23: 0.1, 0: 0.1, 1: 0.1, 2: 0.1,
            3: 0.1, 4: 0.1, 5: 0.5
        },
        monthlyPattern: { 0: 0.9, 1: 0.8, 2: 1.0, 3: 1.3, 4: 1.4, 5: 0.8, 6: 0.6, 7: 0.5, 8: 0.7, 9: 1.1, 10: 1.3, 11: 1.2 },
        peakTimes: ['07:00-10:00'],
        quietTimes: ['14:00-16:00']
    },
    'Tea Factory': {
        locationName: 'Tea Factory',
        averageScore: 45,
        weekdayPattern: { 0: 1.2, 1: 0.8, 2: 0.9, 3: 0.9, 4: 0.9, 5: 1.0, 6: 1.3 },
        hourlyPattern: {
            6: 0.2, 7: 0.3, 8: 0.5, 9: 0.8, 10: 1.1, 11: 1.2, 12: 1.1,
            13: 1.0, 14: 1.1, 15: 1.2, 16: 1.1, 17: 0.9, 18: 0.6, 19: 0.3,
            20: 0.1, 21: 0.1, 22: 0.1, 23: 0.1, 0: 0.1, 1: 0.1, 2: 0.1,
            3: 0.1, 4: 0.1, 5: 0.2
        },
        monthlyPattern: { 0: 0.9, 1: 0.8, 2: 0.9, 3: 1.1, 4: 1.2, 5: 0.9, 6: 0.8, 7: 0.8, 8: 0.9, 9: 1.0, 10: 1.1, 11: 1.0 },
        peakTimes: ['10:00-12:00', '14:00-16:00'],
        quietTimes: ['09:00-10:00']
    }
};

// Default pattern for unknown locations
const DEFAULT_PATTERN: HistoricalPattern = {
    locationName: 'Default',
    averageScore: 50,
    weekdayPattern: { 0: 1.3, 1: 0.7, 2: 0.8, 3: 0.8, 4: 0.9, 5: 1.0, 6: 1.4 },
    hourlyPattern: {
        6: 0.3, 7: 0.4, 8: 0.6, 9: 0.9, 10: 1.2, 11: 1.3, 12: 1.1,
        13: 0.9, 14: 1.0, 15: 1.2, 16: 1.2, 17: 1.0, 18: 0.7, 19: 0.4,
        20: 0.2, 21: 0.1, 22: 0.1, 23: 0.1, 0: 0.1, 1: 0.1, 2: 0.1,
        3: 0.1, 4: 0.1, 5: 0.2
    },
    monthlyPattern: { 0: 0.8, 1: 0.7, 2: 0.9, 3: 1.2, 4: 1.4, 5: 0.9, 6: 0.7, 7: 0.6, 8: 0.8, 9: 1.1, 10: 1.3, 11: 1.2 },
    peakTimes: ['10:00-12:00', '15:00-17:00'],
    quietTimes: ['06:00-08:00']
};

// ============================================
// EVENT CALENDAR
// ============================================

const EVENTS: EventData[] = [
    {
        id: 'pongal-2026',
        name: 'Pongal Festival',
        type: 'FESTIVAL',
        startDate: '2026-01-14',
        endDate: '2026-01-17',
        affectedSpots: ['Botanical Garden', 'Ooty Lake', 'Rose Garden'],
        crowdMultiplier: 1.8,
        description: 'Tamil harvest festival - high tourist influx'
    },
    {
        id: 'summer-rush-2026',
        name: 'Summer Tourism Peak',
        type: 'DISTRICT_WIDE',
        startDate: '2026-04-15',
        endDate: '2026-06-15',
        crowdMultiplier: 1.6,
        description: 'Peak summer tourism season'
    },
    {
        id: 'ooty-flower-show',
        name: 'Ooty Flower Show',
        type: 'LOCAL_EVENT',
        startDate: '2026-05-01',
        endDate: '2026-05-24',
        affectedSpots: ['Botanical Garden', 'Rose Garden'],
        crowdMultiplier: 2.0,
        description: 'Annual flower exhibition'
    },
    {
        id: 'tea-festival',
        name: 'Nilgiri Tea Festival',
        type: 'LOCAL_EVENT',
        startDate: '2026-01-20',
        endDate: '2026-01-25',
        affectedSpots: ['Tea Factory'],
        crowdMultiplier: 1.5,
        description: 'Tea tasting and cultural events'
    },
    {
        id: 'diwali-2026',
        name: 'Diwali',
        type: 'FESTIVAL',
        startDate: '2026-10-20',
        endDate: '2026-10-25',
        crowdMultiplier: 1.7,
        description: 'Festival of lights - high tourist period'
    },
    {
        id: 'christmas-2026',
        name: 'Christmas & New Year',
        type: 'HOLIDAY',
        startDate: '2026-12-20',
        endDate: '2027-01-03',
        crowdMultiplier: 1.9,
        description: 'Year-end holiday rush'
    }
];

// ============================================
// TIMING CONFIGURATION
// ============================================

const TIMING_FACTORS: TimingFactors = {
    schoolStart: 8,
    schoolEnd: 16,
    marketDays: [0, 3], // Sunday and Wednesday markets
    peakTouristHours: [10, 17]
};

// ============================================
// EXPORTS
// ============================================

/**
 * Get historical pattern for a location
 */
export async function getHistoricalData(locationName: string): Promise<HistoricalPattern> {
    // Check exact match
    if (HISTORICAL_PATTERNS[locationName]) {
        return HISTORICAL_PATTERNS[locationName];
    }

    // Check partial match
    const key = Object.keys(HISTORICAL_PATTERNS).find(k =>
        k.toLowerCase().includes(locationName.toLowerCase()) ||
        locationName.toLowerCase().includes(k.toLowerCase())
    );

    if (key) {
        return HISTORICAL_PATTERNS[key];
    }

    return DEFAULT_PATTERN;
}

/**
 * Get event data
 */
export async function getEventData(): Promise<EventData[]> {
    const now = new Date();
    const threeMonthsAhead = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    // Return events within the next 3 months or currently active
    return EVENTS.filter(event => {
        const start = new Date(event.startDate);
        const end = new Date(event.endDate);
        return (start <= threeMonthsAhead && end >= now);
    });
}

/**
 * Get timing factors
 */
export async function getTimingFactors(): Promise<TimingFactors> {
    return TIMING_FACTORS;
}

/**
 * Get active events for today
 */
export async function getActiveEvents(): Promise<EventData[]> {
    const now = new Date();

    return EVENTS.filter(event => {
        const start = new Date(event.startDate);
        const end = new Date(event.endDate);
        return now >= start && now <= end;
    });
}

/**
 * Check if a spot is affected by any active event
 */
export async function isAffectedByEvent(spotName: string): Promise<{
    affected: boolean;
    event?: EventData;
    multiplier: number;
}> {
    const activeEvents = await getActiveEvents();

    for (const event of activeEvents) {
        if (event.type === 'DISTRICT_WIDE' || event.affectedSpots?.includes(spotName)) {
            return {
                affected: true,
                event,
                multiplier: event.crowdMultiplier
            };
        }
    }

    return { affected: false, multiplier: 1.0 };
}
