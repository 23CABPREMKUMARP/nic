
import { getWeather } from "./weatherService";

export interface TouristSpot {
    id: string;
    name: string;
    description: string;
    type: 'INDOOR' | 'OUTDOOR';
    image: string;
    latitude: number;
    longitude: number;
    openTime: string;
    closeTime: string;
    virtualTourUrl?: string;
}

export interface LiveSpotData extends TouristSpot {
    crowdLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME';
    crowdCount: number;
    parkingAvailable: boolean;
    parkingSlots: number;
    weatherCondition: string;
    visitScore: number; // 0 to 100
    recommendationReason: string;
}

const STATIC_SPOTS: TouristSpot[] = [
    {
        id: 'ooty-lake',
        name: 'Ooty Lake',
        description: 'Artificial lake built by John Sullivan in 1824. Famous for boating.',
        type: 'OUTDOOR',
        image: 'https://images.unsplash.com/photo-1559827291-72ee739d0d9a?auto=format&fit=crop&q=80&w=1000',
        latitude: 11.4102,
        longitude: 76.6950,
        openTime: '09:00',
        closeTime: '18:00',
        virtualTourUrl: '/virtual-tour/ooty-lake'
    },
    {
        id: 'botanical-garden',
        name: 'Botanical Garden',
        description: 'Sprawling gardens with exotic plants, ferns & a fossilized tree.',
        type: 'OUTDOOR',
        image: 'https://images.unsplash.com/photo-1585827552668-d0728b355e3d?auto=format&fit=crop&q=80&w=1000',
        latitude: 11.4150,
        longitude: 76.7100,
        openTime: '07:00',
        closeTime: '18:30',
        virtualTourUrl: '/virtual-tour/botanical'
    },
    {
        id: 'doddabetta',
        name: 'Doddabetta Peak',
        description: 'Highest peak in the Nilgiris offering panoramic views.',
        type: 'OUTDOOR',
        image: 'https://images.unsplash.com/photo-1628163539524-ec4081c738c6?auto=format&fit=crop&q=80&w=1000',
        latitude: 11.4012,
        longitude: 76.7348,
        openTime: '07:00',
        closeTime: '18:00',
        virtualTourUrl: '/virtual-tour/doddabetta'
    },
    {
        id: 'tea-factory',
        name: 'Tea Factory & Museum',
        description: 'Learn how tea is processed and taste fresh Nilgiri tea.',
        type: 'INDOOR',
        image: 'https://images.unsplash.com/photo-1598263520111-e408ec077977?auto=format&fit=crop&q=80&w=1000',
        latitude: 11.4050,
        longitude: 76.7150,
        openTime: '09:00',
        closeTime: '19:00',
        virtualTourUrl: '/virtual-tour/tea-factory'
    },
    {
        id: 'rose-garden',
        name: 'Government Rose Garden',
        description: 'Largest rose garden in India with thousands of varieties.',
        type: 'OUTDOOR',
        image: 'https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?auto=format&fit=crop&q=80&w=1000',
        latitude: 11.4000,
        longitude: 76.7100,
        openTime: '07:30',
        closeTime: '18:30'
    },
    {
        id: 'pykara',
        name: 'Pykara Falls & Lake',
        description: 'Majestic waterfalls and a serene lake away from the town center.',
        type: 'OUTDOOR',
        image: 'https://images.unsplash.com/photo-1546274527-9327167ef1f2?auto=format&fit=crop&q=80&w=1000',
        latitude: 11.4500,
        longitude: 76.6000,
        openTime: '08:30',
        closeTime: '17:30'
    },
    {
        id: 'tribal-museum',
        name: 'Tribal Museum',
        description: 'Artifacts and history of the indigenous tribes of Nilgiris.',
        type: 'INDOOR',
        image: 'https://images.unsplash.com/photo-1599905273752-965a9142858a?auto=format&fit=crop&q=80&w=1000',
        latitude: 11.4200,
        longitude: 76.7000,
        openTime: '10:00',
        closeTime: '17:00'
    }
];

// Helper to simulate reliable "live" data
const getSimulatedCrowd = (id: string) => {
    // Deterministic random based on hour to keep it stable for demo
    const hour = new Date().getHours();
    const baseHash = id.charCodeAt(0) + hour;
    return Math.floor((Math.sin(baseHash) + 1) * 500) + 50; // Returns 50-1050 visitors
};

export const getSmartRecommendations = async (): Promise<LiveSpotData[]> => {
    // 1. Get Live Weather
    const weather = await getWeather('Ooty');
    const isRaining = weather?.current.code ? weather.current.code >= 51 : false;
    const isFoggy = weather?.current.code ? (weather.current.code >= 45 && weather.current.code <= 48) : false;

    // 2. Process each spot
    const recommendations = STATIC_SPOTS.map(spot => {
        const crowdCount = getSimulatedCrowd(spot.id);
        const capacity = 1000; // Simulated capacity
        const crowdPercentage = (crowdCount / capacity) * 100;

        let crowdLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME' = 'LOW';
        if (crowdPercentage > 80) crowdLevel = 'EXTREME';
        else if (crowdPercentage > 60) crowdLevel = 'HIGH';
        else if (crowdPercentage > 30) crowdLevel = 'MODERATE';

        const parkingSlots = Math.max(0, 100 - Math.floor(crowdCount / 10)); // Rough heuristic
        const parkingAvailable = parkingSlots > 10;

        // 3. AI Scoring Logic
        let score = 100;
        let reasons: string[] = [];

        // Weather Influence
        if (spot.type === 'OUTDOOR') {
            if (isRaining) {
                score -= 60;
                reasons.push("Rain Warning");
            } else if (isFoggy) {
                score -= 30;
                reasons.push("Low Visibility");
            } else {
                score += 10;
                reasons.push("Great Weather");
            }
        } else {
            if (isRaining) {
                score += 30; // Boost indoor spots during rain
                reasons.push("Perfect for Rain");
            }
        }

        // Crowd Influence
        if (crowdLevel === 'EXTREME') {
            score -= 40;
            reasons.push("Overcrowded");
        } else if (crowdLevel === 'HIGH') {
            score -= 20;
        } else {
            score += 20;
            reasons.push("Less Crowd");
        }

        // Parking Influence
        if (!parkingAvailable) {
            score -= 20;
            reasons.push("Parking Full");
        }

        return {
            ...spot,
            crowdLevel,
            crowdCount,
            parkingAvailable,
            parkingSlots,
            weatherCondition: isRaining ? 'Rainy' : isFoggy ? 'Foggy' : 'Clear',
            visitScore: Math.max(0, Math.min(100, score)),
            recommendationReason: reasons[0] || "Average Condition"
        };
    });

    // Sort by score
    return recommendations.sort((a, b) => b.visitScore - a.visitScore);
};

export const getPredictionForNext3Hours = () => {
    const currentHour = new Date().getHours();
    return Array.from({ length: 3 }).map((_, i) => {
        const hour = (currentHour + i + 1) % 24;
        const formattedHour = `${hour}:00`;
        // Simulating a trend where crowd peaks at 11am-2pm
        let trend = 'LOW';
        if (hour >= 11 && hour <= 14) trend = 'HIGH';
        else if (hour >= 9 && hour <= 18) trend = 'MODERATE';

        return { time: formattedHour, crowdTrend: trend };
    });
};
