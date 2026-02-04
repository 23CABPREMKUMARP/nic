/**
 * Themed Suggestions API - Get context-aware themed recommendations
 */

import { NextRequest, NextResponse } from 'next/server';
import { ThemedSuggestions, SuggestionTheme } from '@/services/redirect/themedSuggestions';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const theme = searchParams.get('theme') as SuggestionTheme | null;
        const limit = parseInt(searchParams.get('limit') || '5');
        const all = searchParams.get('all') === 'true';

        if (all) {
            // Get all themed suggestions grouped by theme
            const allThemed = await ThemedSuggestions.getAllThemed();
            const themeCards = ThemedSuggestions.getThemeCards();

            return NextResponse.json({
                success: true,
                data: {
                    themes: themeCards,
                    suggestions: allThemed,
                    timestamp: new Date().toISOString()
                }
            });
        }

        if (theme) {
            // Get suggestions for specific theme
            const suggestions = await ThemedSuggestions.getSuggestionsForTheme(theme);

            return NextResponse.json({
                success: true,
                data: {
                    theme,
                    suggestions,
                    timestamp: new Date().toISOString()
                }
            });
        }

        // Get contextual suggestions based on current conditions
        const suggestions = await ThemedSuggestions.getContextualSuggestions(limit);
        const themeCards = ThemedSuggestions.getThemeCards();

        return NextResponse.json({
            success: true,
            data: {
                contextual: true,
                suggestions,
                availableThemes: themeCards,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error: any) {
        console.error('Themed API error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
