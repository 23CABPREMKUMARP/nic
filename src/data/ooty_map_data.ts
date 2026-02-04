export const OOTY_SPOTS = [
    {
        id: "botanical-garden",
        name: "Botanical Garden",
        tamil_name: "தாவரவியல் பூங்கா",
        latitude: 11.4190,
        longitude: 76.7145,
        type: "ATTRACTION",
        category: "Gardens",
        tags: ["Kids Friendly", "Family", "Wheelchair Accessible"],
        suitability: ["Family", "Senior citizens", "Students"],
        timeOfDay: ["Morning spots", "Morning"],
        image: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae",
        description: "55-hectare garden established in 1848.",
        bestTime: "9:00 AM - 11:30 AM",
        parking: "MODERATE",
        weatherTip: "Best during light sunlight",
        priceRange: "Budget friendly"
    },
    {
        id: "rose-garden",
        name: "Rose Garden",
        tamil_name: "ரோஜா பூங்கா",
        latitude: 11.4080,
        longitude: 76.7100,
        type: "ATTRACTION",
        category: "Gardens",
        tags: ["Couples", "Family"],
        suitability: ["Couples", "Family"],
        timeOfDay: ["Sunset spots", "Afternoon"],
        image: "https://images.unsplash.com/photo-1496062031456-07b8f1620322",
        description: "One of the largest rose gardens in India.",
        bestTime: "4:00 PM - 6:00 PM",
        parking: "EASY",
        weatherTip: "Perfect for sunset photography",
        priceRange: "Budget friendly"
    },
    {
        id: "ooty-boat-house",
        name: "Ooty Boat House",
        tamil_name: "ஊட்டி படகு இல்லம்",
        latitude: 11.4050,
        longitude: 76.6910,
        type: "ATTRACTION",
        category: "Lakes",
        tags: ["Kids Friendly", "Adventure"],
        suitability: ["Family", "Students"],
        timeOfDay: ["Rain suitable", "Morning"],
        image: "https://images.unsplash.com/photo-1562916194-686bd29111c1",
        description: "Boating in the heart of Ooty town.",
        bestTime: "10:00 AM - 4:00 PM",
        parking: "LIMITED",
        weatherTip: "Carry umbrellas for lake mist",
        priceRange: "Moderate"
    },
    {
        id: "doddabetta-peak",
        name: "Doddabetta Peak",
        tamil_name: "தொட்டபெட்டா சிகரம்",
        latitude: 11.3980,
        longitude: 76.7350,
        type: "ATTRACTION",
        category: "View Points",
        tags: ["Nature", "Photography"],
        suitability: ["Travelers", "Couples"],
        timeOfDay: ["Mist view", "Morning"],
        image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4",
        description: "Highest point in the Nilgiri Mountains.",
        bestTime: "6:30 AM - 8:30 AM",
        parking: "DIFFICULT",
        weatherTip: "Often foggy before 10 AM",
        priceRange: "Budget friendly"
    },
    {
        id: "pykara-falls",
        name: "Pykara Falls",
        tamil_name: "பைக்காரா நீர்வீழ்ச்சி",
        latitude: 11.4780,
        longitude: 76.6020,
        type: "ATTRACTION",
        category: "Nature",
        tags: ["Nature", "Adventure"],
        suitability: ["Students", "Couples"],
        timeOfDay: ["Morning spots", "Morning"],
        image: "https://images.unsplash.com/photo-1516733725897-1aa73b87c8e8",
        description: "Cascading water and scenic landscapes.",
        bestTime: "9:00 AM - 1:00 PM",
        parking: "EASY",
        weatherTip: "Slippery rocks during rain",
        priceRange: "Moderate"
    },
    {
        id: "tea-factory",
        name: "Tea Factory",
        tamil_name: "தேயிலை தொழிற்சாலை",
        latitude: 11.4150,
        longitude: 76.7250,
        type: "ATTRACTION",
        category: "Heritage",
        tags: ["Shopping", "Educational"],
        suitability: ["Family", "Senior citizens"],
        timeOfDay: ["Rain suitable", "Anytime"],
        image: "https://images.unsplash.com/photo-1594488687126-043c16c6ddff",
        description: "Learning the process of tea making.",
        bestTime: "10:00 AM - 5:00 PM",
        parking: "GOOD",
        weatherTip: "Indoor activity - perfect for rain",
        priceRange: "Budget friendly"
    },
    {
        id: "9th-mile",
        name: "9th Mile",
        tamil_name: "9-வது மைல்",
        latitude: 11.4500,
        longitude: 76.6500,
        type: "ATTRACTION",
        category: "Adventure",
        tags: ["Nature", "Filming"],
        suitability: ["Couples", "Students"],
        timeOfDay: ["Sunset spots", "Afternoon"],
        image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
        description: "A popular filming location and scenic viewpoint.",
        bestTime: "3:00 PM - 6:30 PM",
        parking: "EASY",
        weatherTip: "Wide open space, very windy",
        priceRange: "Budget friendly"
    },
    {
        id: "finger-post-view",
        name: "Finger Post View",
        tamil_name: "பிங்கர் போஸ்ட்",
        latitude: 11.4120,
        longitude: 76.6850,
        type: "ATTRACTION",
        category: "View Points",
        tags: ["Nature", "Heritage"],
        suitability: ["Family", "Travelers"],
        timeOfDay: ["Mist view", "Morning"],
        image: "https://images.unsplash.com/photo-1501785888041-af3ef285b470",
        description: "Historic landmark and view.",
        bestTime: "7:00 AM",
        parking: "MODERATE",
        weatherTip: "Foggy mornings",
        priceRange: "Free"
    }
];

export const OOTY_JUNCTIONS = [
    { id: "finger-post", name: "Finger Post", lat: 11.4120, lng: 76.6850 },
    { id: "charring-cross", name: "Charring Cross", lat: 11.4145, lng: 76.7032 },
    { id: "chamundi-jn", name: "Chamundi Junction", lat: 11.4085, lng: 76.7120 },
    { id: "main-bus-stand", name: "Main Bus Stand", lat: 11.4050, lng: 76.6960 },
    { id: "lovedale-jn", name: "Lovedale Jn", lat: 11.3970, lng: 76.7150 },
    { id: "chamundi-top", name: "Chamundi Hill Top", lat: 11.4100, lng: 76.7150 }
];

export const OOTY_ROADS = {
    type: "FeatureCollection",
    features: [
        // Simulated roads based on the police map connectivity
        {
            type: "Feature",
            geometry: { type: "LineString", coordinates: [[76.6850, 11.4120], [76.7032, 11.4145]] },
            properties: { name: "Finger Post to Charring Cross", oneWay: true, direction: "EAST" }
        },
        {
            type: "Feature",
            geometry: { type: "LineString", coordinates: [[76.7032, 11.4145], [76.7120, 11.4085]] },
            properties: { name: "Charring Cross to Chamundi Jn", oneWay: true, direction: "SOUTH-EAST" }
        },
        {
            type: "Feature",
            geometry: { type: "LineString", coordinates: [[76.7120, 11.4085], [76.6960, 11.4050]] },
            properties: { name: "Chamundi Jn to Bus Stand", oneWay: true, direction: "WEST" }
        },
        {
            type: "Feature",
            geometry: { type: "LineString", coordinates: [[76.6960, 11.4050], [76.6910, 11.4050]] },
            properties: { name: "Bus Stand to Boat House", oneWay: false }
        }
    ]
};
