/**
 * Ooty Map Data - Ground truth data for navigation
 * Contains tourist spots, junctions, roads, and pre-computed routes
 */

// ============================================
// TOURIST SPOTS
// ============================================
export const OOTY_SPOTS = [
    {
        id: "ooty-lake",
        name: "Ooty Lake",
        tamil_name: "ஊட்டி ஏரி",
        latitude: 11.4102,
        longitude: 76.6950,
        type: "ATTRACTION",
        category: "Lakes",
        tags: ["Boating", "Family", "Photography"],
        image: "https://images.unsplash.com/photo-1559827291-72ee739d0d9a?auto=format&fit=crop&q=80&w=600",
        description: "Artificial lake built by John Sullivan in 1824. Famous for boating.",
        openTime: "09:00",
        closeTime: "18:00",
        parking: "MODERATE",
        bestTime: "10:00 AM - 4:00 PM"
    },
    {
        id: "botanical-garden",
        name: "Botanical Garden",
        tamil_name: "தாவரவியல் பூங்கா",
        latitude: 11.4150,
        longitude: 76.7100,
        type: "ATTRACTION",
        category: "Gardens",
        tags: ["Nature", "Family", "Wheelchair Accessible"],
        image: "https://images.unsplash.com/photo-1585827552668-d0728b355e3d?auto=format&fit=crop&q=80&w=600",
        description: "55-hectare garden established in 1848 with exotic plants and a fossilized tree.",
        openTime: "07:00",
        closeTime: "18:30",
        parking: "GOOD",
        bestTime: "9:00 AM - 11:30 AM"
    },
    {
        id: "doddabetta-peak",
        name: "Doddabetta Peak",
        tamil_name: "தொட்டபெட்டா சிகரம்",
        latitude: 11.4012,
        longitude: 76.7348,
        type: "ATTRACTION",
        category: "View Points",
        tags: ["Nature", "Photography", "Trekking"],
        image: "https://images.unsplash.com/photo-1628163539524-ec4081c738c6?auto=format&fit=crop&q=80&w=600",
        description: "Highest peak in the Nilgiri Mountains at 2,637 meters.",
        openTime: "07:00",
        closeTime: "18:00",
        parking: "DIFFICULT",
        bestTime: "6:30 AM - 8:30 AM",
        hairpins: 8,
        steepness: 4
    },
    {
        id: "rose-garden",
        name: "Rose Garden",
        tamil_name: "ரோஜா பூங்கா",
        latitude: 11.4000,
        longitude: 76.7100,
        type: "ATTRACTION",
        category: "Gardens",
        tags: ["Flowers", "Photography", "Couples"],
        image: "https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?auto=format&fit=crop&q=80&w=600",
        description: "One of the largest rose gardens in India with thousands of varieties.",
        openTime: "07:30",
        closeTime: "18:30",
        parking: "EASY",
        bestTime: "4:00 PM - 6:00 PM"
    },
    {
        id: "tea-factory",
        name: "Tea Factory & Museum",
        tamil_name: "தேயிலை தொழிற்சாலை",
        latitude: 11.4050,
        longitude: 76.7150,
        type: "ATTRACTION",
        category: "Heritage",
        tags: ["Shopping", "Educational", "Indoor"],
        image: "https://images.unsplash.com/photo-1598263520111-e408ec077977?auto=format&fit=crop&q=80&w=600",
        description: "Learn how Nilgiri tea is processed and taste fresh brews.",
        openTime: "09:00",
        closeTime: "19:00",
        parking: "GOOD",
        bestTime: "Any time (Indoor)"
    },
    {
        id: "pykara-falls",
        name: "Pykara Falls",
        tamil_name: "பைக்காரா நீர்வீழ்ச்சி",
        latitude: 11.4780,
        longitude: 76.6020,
        type: "ATTRACTION",
        category: "Waterfalls",
        tags: ["Nature", "Adventure", "Photography"],
        image: "https://images.unsplash.com/photo-1546274527-9327167ef1f2?auto=format&fit=crop&q=80&w=600",
        description: "Cascading waterfalls and serene lake, 20km from Ooty town.",
        openTime: "08:30",
        closeTime: "17:30",
        parking: "EASY",
        bestTime: "9:00 AM - 1:00 PM",
        hairpins: 5,
        steepness: 3
    },
    {
        id: "9th-mile",
        name: "9th Mile Shooting Point",
        tamil_name: "9-வது மைல்",
        latitude: 11.4500,
        longitude: 76.6500,
        type: "ATTRACTION",
        category: "View Points",
        tags: ["Photography", "Movies", "Sunset"],
        image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=600",
        description: "Popular filming location with panoramic valley views.",
        openTime: "06:00",
        closeTime: "18:00",
        parking: "EASY",
        bestTime: "3:00 PM - 6:30 PM"
    },
    {
        id: "emerald-lake",
        name: "Emerald Lake",
        tamil_name: "எமரால்ட் ஏரி",
        latitude: 11.3750,
        longitude: 76.5800,
        type: "ATTRACTION",
        category: "Lakes",
        tags: ["Nature", "Quiet", "Photography"],
        image: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&q=80&w=600",
        description: "Pristine lake surrounded by tea gardens, less crowded alternative to Ooty Lake.",
        openTime: "06:00",
        closeTime: "18:00",
        parking: "EASY",
        bestTime: "7:00 AM - 10:00 AM"
    }
];

// ============================================
// PARKING FACILITIES
// ============================================
export const OOTY_PARKING = [
    {
        id: "parking-lake",
        name: "Ooty Lake Parking",
        latitude: 11.4095,
        longitude: 76.6940,
        spotId: "ooty-lake",
        totalSlots: 150,
        type: "PAID",
        ratePerHour: 30
    },
    {
        id: "parking-botanical",
        name: "Botanical Garden Parking",
        latitude: 11.4145,
        longitude: 76.7090,
        spotId: "botanical-garden",
        totalSlots: 200,
        type: "PAID",
        ratePerHour: 20
    },
    {
        id: "parking-doddabetta",
        name: "Doddabetta Summit Parking",
        latitude: 11.4005,
        longitude: 76.7340,
        spotId: "doddabetta-peak",
        totalSlots: 80,
        type: "PAID",
        ratePerHour: 40
    },
    {
        id: "parking-rose",
        name: "Rose Garden Parking",
        latitude: 11.3995,
        longitude: 76.7095,
        spotId: "rose-garden",
        totalSlots: 100,
        type: "FREE",
        ratePerHour: 0
    },
    {
        id: "parking-bus-stand",
        name: "Main Bus Stand Parking",
        latitude: 11.4050,
        longitude: 76.6960,
        spotId: null,
        totalSlots: 300,
        type: "PAID",
        ratePerHour: 15
    },
    {
        id: "parking-emerald",
        name: "Emerald Lake Parking",
        latitude: 11.3760,
        longitude: 76.5810,
        spotId: "emerald-lake",
        totalSlots: 50,
        type: "FREE",
        ratePerHour: 0
    }
];

// ============================================
// KEY JUNCTIONS
// ============================================
export const OOTY_JUNCTIONS = [
    { id: "charing-cross", name: "Charing Cross", tamil_name: "சாரிங் கிராஸ்", lat: 11.4123, lng: 76.7032 },
    { id: "finger-post", name: "Finger Post", tamil_name: "ஃபிங்கர் போஸ்ட்", lat: 11.4120, lng: 76.6850 },
    { id: "commercial-road", name: "Commercial Road Junction", tamil_name: "வணிக சாலை சந்திப்பு", lat: 11.4110, lng: 76.6980 },
    { id: "bus-stand", name: "Main Bus Stand", tamil_name: "பேருந்து நிலையம்", lat: 11.4050, lng: 76.6960 },
    { id: "lake-road", name: "Lake Road Junction", tamil_name: "ஏரி சாலை சந்திப்பு", lat: 11.4080, lng: 76.6945 },
    { id: "botanical-junction", name: "Botanical Junction", tamil_name: "தாவரவியல் சந்திப்பு", lat: 11.4140, lng: 76.7080 },
    { id: "doddabetta-fork", name: "Doddabetta Fork", tamil_name: "தொட்டபெட்டா பிரிப்பு", lat: 11.4080, lng: 76.7200 },
    { id: "coonoor-road", name: "Coonoor Road Start", tamil_name: "கூனூர் சாலை தொடக்கம்", lat: 11.4000, lng: 76.7050 }
];

// ============================================
// ROAD SEGMENTS
// ============================================
export const OOTY_ROADS = [
    {
        id: "charring-to-lake",
        from: "charing-cross",
        to: "lake-road",
        name: "Garden Road",
        distance: 0.8,
        oneWay: false,
        steepness: 1,
        hairpins: 0,
        speedLimit: 30
    },
    {
        id: "lake-to-busstand",
        from: "lake-road",
        to: "bus-stand",
        name: "Lake Road",
        distance: 0.5,
        oneWay: false,
        steepness: 1,
        hairpins: 0,
        speedLimit: 25
    },
    {
        id: "charring-to-botanical",
        from: "charing-cross",
        to: "botanical-junction",
        name: "Botanical Road",
        distance: 1.2,
        oneWay: false,
        steepness: 2,
        hairpins: 1,
        speedLimit: 30
    },
    {
        id: "botanical-to-doddabetta",
        from: "botanical-junction",
        to: "doddabetta-fork",
        name: "Doddabetta Road",
        distance: 4.5,
        oneWay: false,
        steepness: 4,
        hairpins: 8,
        speedLimit: 25,
        alerts: ["STEEP_CLIMB", "HAIRPIN_ZONE", "FOG_PRONE"]
    },
    {
        id: "charring-to-fingerpost",
        from: "charing-cross",
        to: "finger-post",
        name: "Mysore Road",
        distance: 1.5,
        oneWay: false,
        steepness: 2,
        hairpins: 2,
        speedLimit: 40
    },
    {
        id: "fingerpost-to-pykara",
        from: "finger-post",
        to: null, // External
        name: "Pykara Road",
        distance: 18.0,
        oneWay: false,
        steepness: 3,
        hairpins: 5,
        speedLimit: 40,
        alerts: ["LONG_ROUTE", "WILDLIFE_ZONE"]
    }
];

// ============================================
// HILL SAFETY ZONES
// ============================================
export const HILL_HAZARDS = [
    {
        id: "doddabetta-hairpins",
        type: "HAIRPIN_ZONE",
        name: "Doddabetta Hairpin Bends",
        center: { lat: 11.4050, lng: 76.7280 },
        radius: 500, // meters
        count: 8,
        alert_en: "Caution: 8 hairpin bends ahead. Use horn at each turn.",
        alert_ta: "எச்சரிக்கை: 8 கொண்டை ஊசி வளைவுகள் உள்ளன. ஒவ்வொரு திருப்பத்திலும் ஹார்ன் அடிக்கவும்."
    },
    {
        id: "doddabetta-fog",
        type: "FOG_ZONE",
        name: "Doddabetta Summit Fog Zone",
        center: { lat: 11.4012, lng: 76.7348 },
        radius: 800,
        alert_en: "Fog zone ahead. Visibility may drop to 10 meters. Use fog lights.",
        alert_ta: "மூடுபனி பகுதி. பனி விளக்குகளைப் பயன்படுத்தவும்."
    },
    {
        id: "coonoor-ghat",
        type: "STEEP_DESCENT",
        name: "Coonoor Ghat Road",
        center: { lat: 11.3800, lng: 76.7100 },
        radius: 2000,
        alert_en: "Steep descent: 36 hairpin bends. Use engine braking. Check brakes before descent.",
        alert_ta: "செங்குத்தான இறக்கம்: 36 கொண்டை ஊசி வளைவுகள். என்ஜின் பிரேக்கிங் பயன்படுத்தவும்."
    },
    {
        id: "pykara-wildlife",
        type: "WILDLIFE_ZONE",
        name: "Pykara Wildlife Corridor",
        center: { lat: 11.4600, lng: 76.6200 },
        radius: 3000,
        alert_en: "Wildlife zone. Watch for elephants and bison crossing. Do not stop.",
        alert_ta: "வனவிலங்கு பகுதி. யானைகள் மற்றும் காட்டெருமை கடக்கும். நிற்க வேண்டாம்."
    }
];

// ============================================
// PRE-COMPUTED COMMON ROUTES (Offline Fallback)
// ============================================
export const COMMON_ROUTES = [
    {
        id: "busstand-to-lake",
        from: "bus-stand",
        to: "ooty-lake",
        distance: 1.0,
        duration: 5, // minutes
        polyline: [[11.4050, 76.6960], [11.4080, 76.6945], [11.4095, 76.6940], [11.4102, 76.6950]],
        instructions: [
            { text: "Head north on Station Road", tamil: "ஸ்டேஷன் சாலையில் வடக்கு நோக்கி செல்லவும்", distance: 300 },
            { text: "Turn right onto Lake Road", tamil: "ஏரி சாலையில் வலது புறம் திரும்பவும்", distance: 400 },
            { text: "Arrive at Ooty Lake", tamil: "ஊட்டி ஏரியில் வந்துவிட்டீர்கள்", distance: 300 }
        ]
    },
    {
        id: "lake-to-botanical",
        from: "ooty-lake",
        to: "botanical-garden",
        distance: 1.8,
        duration: 8,
        polyline: [[11.4102, 76.6950], [11.4080, 76.6945], [11.4123, 76.7032], [11.4140, 76.7080], [11.4150, 76.7100]],
        instructions: [
            { text: "Head east from Lake parking", tamil: "ஏரி வாகன நிறுத்துமிடத்திலிருந்து கிழக்கு நோக்கி செல்லவும்", distance: 400 },
            { text: "Continue to Charing Cross", tamil: "சாரிங் கிராஸ் வரை தொடரவும்", distance: 800 },
            { text: "Turn left onto Botanical Road", tamil: "தாவரவியல் சாலையில் இடது புறம் திரும்பவும்", distance: 400 },
            { text: "Arrive at Botanical Garden", tamil: "தாவரவியல் பூங்காவில் வந்துவிட்டீர்கள்", distance: 200 }
        ]
    },
    {
        id: "botanical-to-doddabetta",
        from: "botanical-garden",
        to: "doddabetta-peak",
        distance: 6.5,
        duration: 25,
        polyline: [[11.4150, 76.7100], [11.4140, 76.7080], [11.4080, 76.7200], [11.4050, 76.7280], [11.4012, 76.7348]],
        instructions: [
            { text: "Exit Botanical Garden east", tamil: "தாவரவியல் பூங்காவிலிருந்து கிழக்கு வழியாக வெளியேறவும்", distance: 200 },
            { text: "Take Doddabetta Road", tamil: "தொட்டபெட்டா சாலையில் செல்லவும்", distance: 2000, alert: "HAIRPIN" },
            { text: "Warning: Hairpin bends ahead", tamil: "எச்சரிக்கை: கொண்டை ஊசி வளைவுகள்", distance: 0, alert: "HAIRPIN" },
            { text: "Continue uphill", tamil: "மேல் நோக்கி தொடரவும்", distance: 3000, alert: "STEEP_CLIMB" },
            { text: "Arrive at Doddabetta Summit", tamil: "தொட்டபெட்டா சிகரத்தில் வந்துவிட்டீர்கள்", distance: 1300 }
        ],
        alerts: ["HAIRPIN_ZONE", "FOG_ZONE", "STEEP_CLIMB"]
    },
    {
        id: "busstand-to-emerald",
        from: "bus-stand",
        to: "emerald-lake",
        distance: 20.5,
        duration: 45,
        polyline: [[11.4050, 76.6960], [11.4120, 76.6850], [11.4000, 76.6500], [11.3800, 76.6200], [11.3760, 76.5810], [11.3750, 76.5800]],
        instructions: [
            { text: "Exit Bus Stand towards Finger Post", tamil: "பேருந்து நிலையத்திலிருந்து பிங்கர் போஸ்ட் நோக்கி செல்லவும்", distance: 1500 },
            { text: "Take Mysore Road West", tamil: "மைசூர் சாலையில் மேற்கு நோக்கி செல்லவும்", distance: 5000 },
            { text: "Turn left towards Emerald", tamil: "எமரால்டு நோக்கி இடது புறம் திரும்பவும்", distance: 10000 },
            { text: "Driving through tea gardens", tamil: "தேயிலை தோட்டங்கள் வழியாக பயணம்", distance: 4000 },
        ]
    },
    {
        id: "lake-to-emerald",
        from: "ooty-lake",
        to: "emerald-lake",
        distance: 22.0,
        duration: 50,
        polyline: [[11.4102, 76.6950], [11.4080, 76.6945], [11.4050, 76.6960], [11.4000, 76.6500], [11.3800, 76.6200], [11.3760, 76.5810], [11.3750, 76.5800]],
        instructions: [
            { text: "Exit Ooty Lake Parking", tamil: "ஊட்டி ஏரி வாகன நிறுத்துமிடத்திலிருந்து வெளியேறவும்", distance: 500 },
            { text: "Head towards Mysore Road junction", tamil: "மைசூர் சாலை சந்திப்பு நோக்கி செல்லவும்", distance: 1500 },
            { text: "Take West towards Emerald", tamil: "எமரால்டு நோக்கி மேற்கு திசையில் செல்லவும்", distance: 20000 },
            { text: "Arrive at Emerald Lake", tamil: "எமரால்டு ஏரியில் வந்துவிட்டீர்கள்", distance: 0 }
        ]
    },
    {
        id: "botanical-to-emerald",
        from: "botanical-garden",
        to: "emerald-lake",
        distance: 24.0,
        duration: 55,
        polyline: [[11.4150, 76.7100], [11.4123, 76.7032], [11.4050, 76.6960], [11.4000, 76.6500], [11.3800, 76.6200], [11.3760, 76.5810], [11.3750, 76.5800]],
        instructions: [
            { text: "Head West from Botanical Garden", tamil: "தாவரவியல் பூங்காவிலிருந்து மேற்கு நோக்கி செல்லவும்", distance: 2000 },
            { text: "Pass Bus Stand", tamil: "பேருந்து நிலையத்தை கடந்து செல்லவும்", distance: 1000 },
            { text: "Continue on Emerald Road", tamil: "எமரால்டு சாலையில் தொடரவும்", distance: 21000 },
            { text: "Arrive at Emerald Lake", tamil: "எமரால்டு ஏரியில் வந்துவிட்டீர்கள்", distance: 0 }
        ]
    },
    {
        id: "doddabetta-to-emerald",
        from: "doddabetta-peak",
        to: "emerald-lake",
        distance: 28.5,
        duration: 65,
        polyline: [[11.4012, 76.7348], [11.4050, 76.7280], [11.4080, 76.7200], [11.4140, 76.7080], [11.4123, 76.7032], [11.4050, 76.6960], [11.4000, 76.6500], [11.3800, 76.6200], [11.3760, 76.5810], [11.3750, 76.5800]],
        instructions: [
            { text: "Descend from Doddabetta", tamil: "தொட்டபெட்டாவிலிருந்து கீழே இறங்கவும்", distance: 4500, alert: "HAIRPIN" },
            { text: "Pass Botanical Garden", tamil: "தாவரவியல் பூங்காவை கடந்து செல்லவும்", distance: 2000 },
            { text: "Continue towards Emerald", tamil: "எமரால்டு நோக்கி தொடரவும்", distance: 22000 },
            { text: "Arrive at Emerald Lake", tamil: "எமரால்டு ஏரியில் வந்துவிட்டீர்கள்", distance: 0 }
        ]
    }
];

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getSpotById(id: string) {
    return OOTY_SPOTS.find(s => s.id === id);
}

export function getSpotByName(name: string) {
    return OOTY_SPOTS.find(s =>
        s.name.toLowerCase().includes(name.toLowerCase()) ||
        s.tamil_name.includes(name)
    );
}

export function getParkingForSpot(spotId: string) {
    return OOTY_PARKING.find(p => p.spotId === spotId);
}

export function getNearestSpot(lat: number, lng: number) {
    let nearest = OOTY_SPOTS[0];
    let minDist = Infinity;

    for (const spot of OOTY_SPOTS) {
        const dist = getDistance(lat, lng, spot.latitude, spot.longitude);
        if (dist < minDist) {
            minDist = dist;
            nearest = spot;
        }
    }

    return { spot: nearest, distance: minDist };
}

export function getHazardsNearPoint(lat: number, lng: number, radiusKm: number = 1) {
    return HILL_HAZARDS.filter(h => {
        const dist = getDistance(lat, lng, h.center.lat, h.center.lng);
        return dist <= radiusKm;
    });
}

export function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
