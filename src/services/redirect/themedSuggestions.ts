/**
 * Themed Suggestions - Context-aware recommendations
 * Suggests places based on weather, time, user type
 */

import { OOTY_SPOTS } from '@/data/ootyMapData';
import { getWeather } from '@/services/weatherService';
import { TrafficEngine } from '@/services/traffic/trafficEngine';
import { TrafficShaping } from '@/services/traffic/trafficShaping';

// ============================================
// TYPES
// ============================================

export type SuggestionTheme =
    | 'RAIN'
    | 'SUNSET'
    | 'SUNRISE'
    | 'KIDS'
    | 'PHOTO'
    | 'PEACEFUL'
    | 'ADVENTURE'
    | 'SHOPPING'
    | 'FOOD'
    | 'NATURE'
    | 'CULTURE';

export interface ThemedSuggestion {
    id: string;
    name: string;
    tamilName: string;
    image: string;
    theme: SuggestionTheme;
    tagline: string;
    tamilTagline: string;
    coordinates: { lat: number; lng: number };
    congestionLevel: string;
    available: boolean;
    bestTime?: string;
}

// ============================================
// THEME CONFIGURATIONS
// ============================================

const THEME_SPOTS: Record<SuggestionTheme, string[]> = {
    'RAIN': ['tea-factory', 'wax-museum', 'chocolate-factory', 'thread-garden'],
    'SUNSET': ['doddabetta', 'ooty-lake', 'rose-garden', 'pine-forest'],
    'SUNRISE': ['doddabetta', 'elk-hill', 'upper-bhavani'],
    'KIDS': ['boat-house', 'thread-garden', 'toy-train', 'deer-park'],
    'PHOTO': ['botanical-garden', 'pine-forest', 'pykara-falls', 'doddabetta', 'ooty-lake'],
    'PEACEFUL': ['avalanche-lake', 'upper-bhavani', 'elk-hill', 'pine-forest'],
    'ADVENTURE': ['pykara-falls', 'dolphin-nose', 'lamb-rock', 'kalhatti-falls'],
    'SHOPPING': ['commercial-street', 'tibetan-market', 'charring-cross'],
    'FOOD': ['commercial-street', 'nahar-restaurant', 'earl-grey', 'quality-restaurant'],
    'NATURE': ['botanical-garden', 'rose-garden', 'pine-forest', 'deer-park'],
    'CULTURE': ['tea-factory', 'tribal-museum', 'stone-house', 'toda-huts']
};

const THEME_TAGLINES: Record<SuggestionTheme, { en: string; ta: string }> = {
    'RAIN': { en: 'Rain time best', ta: 'மழை நேரத்திற்கு சிறந்தது' },
    'SUNSET': { en: 'Sunset now', ta: 'சூரிய அஸ்தமனம் இப்போது' },
    'SUNRISE': { en: 'Best for sunrise', ta: 'சூரிய உதயத்திற்கு சிறந்தது' },
    'KIDS': { en: 'Kids friendly', ta: 'குழந்தைகளுக்கு ஏற்றது' },
    'PHOTO': { en: 'Instagram worthy', ta: 'புகைப்படத்திற்கு சிறந்தது' },
    'PEACEFUL': { en: 'Quiet escape', ta: 'அமைதியான இடம்' },
    'ADVENTURE': { en: 'Adventure awaits', ta: 'சாகச அனுபவம்' },
    'SHOPPING': { en: 'Shop local', ta: 'உள்ளூர் ஷாப்பிங்' },
    'FOOD': { en: 'Must try food', ta: 'சுவையான உணவு' },
    'NATURE': { en: 'Nature lovers', ta: 'இயற்கை அன்பர்களுக்கு' },
    'CULTURE': { en: 'Cultural gems', ta: 'கலாச்சார சிறப்புகள்' }
};

// ============================================
// THEMED SUGGESTIONS CLASS
// ============================================

export class ThemedSuggestions {
    /**
     * Get suggestions based on current conditions
     */
    static async getContextualSuggestions(
        limit: number = 5
    ): Promise<ThemedSuggestion[]> {
        const now = new Date();
        const hour = now.getHours();
        const weather = await getWeather('Ooty');

        // Determine relevant themes
        const themes: SuggestionTheme[] = [];

        // Weather-based themes
        const weatherCode = weather?.current?.code ?? 0;
        if (weatherCode >= 51) {
            themes.push('RAIN');
        } else if (weatherCode >= 45) {
            // Foggy - suggest indoor
            themes.push('CULTURE', 'SHOPPING');
        }

        // Time-based themes
        if (hour >= 5 && hour <= 7) {
            themes.push('SUNRISE');
        } else if (hour >= 16 && hour <= 18) {
            themes.push('SUNSET');
        }

        // Default themes if none matched
        if (themes.length === 0) {
            themes.push('NATURE', 'PHOTO', 'PEACEFUL');
        }

        // Get suggestions for each theme
        const suggestions: ThemedSuggestion[] = [];

        for (const theme of themes) {
            const themeSuggestions = await this.getSuggestionsForTheme(theme);
            suggestions.push(...themeSuggestions);
        }

        // Remove duplicates and limit
        const unique = this.deduplicateSuggestions(suggestions);
        return unique.slice(0, limit);
    }

    /**
     * Get suggestions for a specific theme
     */
    static async getSuggestionsForTheme(
        theme: SuggestionTheme
    ): Promise<ThemedSuggestion[]> {
        const spotIds = THEME_SPOTS[theme] || [];
        const tagline = THEME_TAGLINES[theme];
        const suggestions: ThemedSuggestion[] = [];

        for (const spotId of spotIds) {
            const spot = OOTY_SPOTS.find(s => s.id === spotId);
            if (!spot) continue;

            // Get congestion
            let congestionLevel = 'GREEN';
            let available = true;

            try {
                const congestion = await TrafficEngine.getCongestionScore(spotId);
                congestionLevel = congestion.level;
                available = congestion.level !== 'RED';
            } catch {
                // Continue with defaults
            }

            suggestions.push({
                id: spot.id,
                name: spot.name,
                tamilName: spot.tamil_name,
                image: spot.image,
                theme,
                tagline: tagline.en,
                tamilTagline: tagline.ta,
                coordinates: { lat: spot.latitude, lng: spot.longitude },
                congestionLevel,
                available,
                bestTime: this.getBestTime(theme)
            });
        }

        // Sort by availability and congestion
        return suggestions.sort((a, b) => {
            if (a.available && !b.available) return -1;
            if (!a.available && b.available) return 1;
            return 0;
        });
    }

    /**
     * Get all themed suggestions grouped by theme
     */
    static async getAllThemed(): Promise<Record<SuggestionTheme, ThemedSuggestion[]>> {
        const result: Partial<Record<SuggestionTheme, ThemedSuggestion[]>> = {};

        const themes: SuggestionTheme[] = [
            'RAIN', 'SUNSET', 'SUNRISE', 'KIDS', 'PHOTO',
            'PEACEFUL', 'ADVENTURE', 'SHOPPING', 'FOOD', 'NATURE', 'CULTURE'
        ];

        for (const theme of themes) {
            result[theme] = await this.getSuggestionsForTheme(theme);
        }

        return result as Record<SuggestionTheme, ThemedSuggestion[]>;
    }

    /**
     * Generate themed message for display
     */
    static generateThemedMessage(
        suggestion: ThemedSuggestion,
        language: 'en' | 'ta' = 'en'
    ): string {
        if (language === 'ta') {
            return `${suggestion.tamilTagline}: ${suggestion.tamilName}`;
        }
        return `${suggestion.tagline}: ${suggestion.name}`;
    }

    /**
     * Get best time to visit for a theme
     */
    private static getBestTime(theme: SuggestionTheme): string {
        switch (theme) {
            case 'SUNRISE': return '5:30 - 7:00 AM';
            case 'SUNSET': return '5:00 - 6:30 PM';
            case 'RAIN': return 'During rain';
            case 'PHOTO': return '6:00 - 9:00 AM (Golden hour)';
            case 'SHOPPING': return '10:00 AM - 6:00 PM';
            case 'FOOD': return '12:00 - 2:00 PM, 7:00 - 9:00 PM';
            default: return '9:00 AM - 5:00 PM';
        }
    }

    /**
     * Remove duplicate suggestions
     */
    private static deduplicateSuggestions(
        suggestions: ThemedSuggestion[]
    ): ThemedSuggestion[] {
        const seen = new Set<string>();
        return suggestions.filter(s => {
            if (seen.has(s.id)) return false;
            seen.add(s.id);
            return true;
        });
    }

    /**
     * Get themed cards for UI display
     */
    static getThemeCards(): { theme: SuggestionTheme; icon: string; label: string; tamilLabel: string }[] {
        return [
            { theme: 'RAIN', icon: '🌧️', label: 'Rain Perfect', tamilLabel: 'மழைக்கு ஏற்றது' },
            { theme: 'SUNSET', icon: '🌅', label: 'Sunset Views', tamilLabel: 'சூரிய அஸ்தமனம்' },
            { theme: 'KIDS', icon: '👨‍👩‍👧‍👦', label: 'Family Fun', tamilLabel: 'குடும்பத்திற்கு' },
            { theme: 'PHOTO', icon: '📸', label: 'Photo Spots', tamilLabel: 'புகைப்படம்' },
            { theme: 'PEACEFUL', icon: '🧘', label: 'Peaceful', tamilLabel: 'அமைதி' },
            { theme: 'ADVENTURE', icon: '🏔️', label: 'Adventure', tamilLabel: 'சாகசம்' },
            { theme: 'NATURE', icon: '🌿', label: 'Nature', tamilLabel: 'இயற்கை' },
            { theme: 'CULTURE', icon: '🏛️', label: 'Culture', tamilLabel: 'கலாச்சாரம்' }
        ];
    }
}

export default ThemedSuggestions;
export { getThemedSuggestions };

/**
 * Convenience function to get themed suggestions
 */
async function getThemedSuggestions(
    theme?: SuggestionTheme,
    limit?: number
): Promise<ThemedSuggestion[]> {
    if (theme) {
        return ThemedSuggestions.getSuggestionsForTheme(theme);
    }
    return ThemedSuggestions.getContextualSuggestions(limit);
}
