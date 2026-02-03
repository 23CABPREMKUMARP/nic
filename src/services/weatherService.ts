
// Open-Meteo API (Free, no key required)
const BASE_URL = 'https://api.open-meteo.com/v1/forecast';

export interface WeatherData {
    current: {
        temp: number;
        feelsLike: number;
        code: number;
        windSpeed: number;
        humidity: number;
    };
    daily: {
        time: string[];
        code: number[];
        maxTemp: number[];
        minTemp: number[];
        rainProb: number[];
    };
    hourly: {
        time: string[];
        temp: number[];
        code: number[];
    };
}

export const LOCATIONS: Record<string, { lat: number; lng: number, type: 'INDOOR' | 'OUTDOOR', correction?: number }> = {
    'Ooty': { lat: 11.4102, lng: 76.6950, type: 'OUTDOOR', correction: 2 }, // Apply +2°C correction to match Google/Consumer norms
    'Coonoor': { lat: 11.3530, lng: 76.7959, type: 'OUTDOOR' },
    'Kotagiri': { lat: 11.4216, lng: 76.8616, type: 'OUTDOOR' },
    'Doddabetta': { lat: 11.4012, lng: 76.7348, type: 'OUTDOOR' },
    'Pykara': { lat: 11.4500, lng: 76.6000, type: 'OUTDOOR' },
    'Avalanche': { lat: 11.2900, lng: 76.5700, type: 'OUTDOOR' },
    'Botanical Garden': { lat: 11.4150, lng: 76.7100, type: 'OUTDOOR' },
    'Tea Factory': { lat: 11.4050, lng: 76.7150, type: 'INDOOR' },
    'Rose Garden': { lat: 11.4000, lng: 76.7100, type: 'OUTDOOR' },
    'Tribal Museum': { lat: 11.4200, lng: 76.7000, type: 'INDOOR' },
};

export const getWeather = async (location: string): Promise<WeatherData | null> => {
    const coords = LOCATIONS[location];
    if (!coords) return null;

    try {
        // Switching to GFS Seamless (US Model) which often aligns better with Google/General Search results for Indian Hill Stations
        const res = await fetch(
            `${BASE_URL}?latitude=${coords.lat}&longitude=${coords.lng}&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FKolkata&models=gfs_seamless`
        );
        const data = await res.json();

        const adjustment = coords.correction || 0;

        return {
            current: {
                temp: data.current.temperature_2m + adjustment,
                feelsLike: data.current.apparent_temperature + adjustment,
                code: data.current.weather_code,
                windSpeed: data.current.wind_speed_10m,
                humidity: data.current.relative_humidity_2m
            },
            daily: {
                time: data.daily.time,
                code: data.daily.weather_code,
                maxTemp: data.daily.temperature_2m_max.map((t: number) => t + adjustment),
                minTemp: data.daily.temperature_2m_min.map((t: number) => t + adjustment),
                rainProb: data.daily.precipitation_probability_max
            },
            hourly: {
                time: data.hourly.time.slice(0, 24), // Next 24 hours
                temp: data.hourly.temperature_2m.slice(0, 24).map((t: number) => t + adjustment),
                code: data.hourly.weather_code.slice(0, 24)
            }
        };
    } catch (error) {
        console.error("Weather fetch failed", error);
        return null;
    }
};

export const getWeatherCondition = (code: number) => {
    if (code === 0) return { label: 'Clear Sky', icon: '☀️', type: 'GOOD' };
    if (code >= 1 && code <= 3) return { label: 'Partly Cloudy', icon: '⛅', type: 'GOOD' };
    if (code >= 45 && code <= 48) return { label: 'Foggy', icon: '🌫️', type: 'CAUTION' };
    if (code >= 51 && code <= 67) return { label: 'Rainy', icon: '🌧️', type: 'BAD' };
    if (code >= 71) return { label: 'Stormy', icon: '⛈️', type: 'BAD' };
    return { label: 'Cloudy', icon: '☁️', type: 'OK' };
};

export const getTourismSuggestion = (code: number) => {
    const condition = getWeatherCondition(code);
    if (condition.type === 'GOOD' || condition.type === 'OK') {
        return {
            msg: "Great weather for outdoor activities!",
            places: ['Botanical Garden', 'Doddabetta', 'Pykara Lake', 'Rose Garden'],
            action: 'Explore Outdoors'
        };
    } else if (condition.type === 'CAUTION') {
        return {
            msg: "Visibility might be low due to fog.",
            places: ['Tea Factory', 'Chocolate Museum', 'Rose Garden'],
            action: 'Drive Carefully'
        };
    } else {
        return {
            msg: "Rain predicted. Indoor spots recommended.",
            places: ['Tea Factory', 'Tribal Museum', 'Wax World'],
            action: 'Stay Dry'
        };
    }
};
