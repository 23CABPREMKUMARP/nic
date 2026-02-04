/**
 * Traffic Prediction API - 3-hour predictions
 */

import { NextRequest, NextResponse } from 'next/server';
import { TrafficEngine } from '@/services/traffic/trafficEngine';
import { OOTY_SPOTS } from '@/data/ootyMapData';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const spotId = searchParams.get('spotId');
        const hours = parseInt(searchParams.get('hours') || '3');

        if (spotId) {
            // Get prediction for specific spot
            const congestion = await TrafficEngine.getCongestionScore(spotId);

            return NextResponse.json({
                success: true,
                data: {
                    spotId,
                    spotName: congestion.name,
                    currentScore: congestion.score,
                    currentLevel: congestion.level,
                    trend: congestion.trend,
                    predictions: congestion.prediction,
                    confidence: 0.75
                }
            });
        }

        // Get predictions for all spots
        const allCongestion = await TrafficEngine.getAllCongestion();

        const predictions = allCongestion.map(c => ({
            spotId: c.spotId,
            spotName: c.name,
            currentScore: c.score,
            currentLevel: c.level,
            trend: c.trend,
            predictions: c.prediction
        }));

        // Calculate region-wide prediction
        const now = new Date();
        const currentHour = now.getHours();

        const regionPrediction = [1, 2, 3].map(offset => {
            const hour = (currentHour + offset) % 24;
            const avgScore = Math.round(
                predictions.reduce((sum, p) => {
                    const hourPred = p.predictions.find(hp => hp.hour === hour);
                    return sum + (hourPred?.predictedScore || 50);
                }, 0) / predictions.length
            );

            return {
                hour,
                displayTime: formatHour(hour),
                averageScore: avgScore,
                level: avgScore < 40 ? 'GREEN' : avgScore < 70 ? 'YELLOW' : avgScore < 85 ? 'ORANGE' : 'RED',
                recommendation: getRecommendation(avgScore)
            };
        });

        return NextResponse.json({
            success: true,
            data: {
                spots: predictions,
                region: regionPrediction,
                confidence: 0.7,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error: any) {
        console.error('Prediction API error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

function formatHour(hour: number): string {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:00 ${ampm}`;
}

function getRecommendation(score: number): { en: string; ta: string } {
    if (score < 40) {
        return {
            en: 'Great time to visit',
            ta: 'பார்க்க சிறந்த நேரம்'
        };
    }
    if (score < 70) {
        return {
            en: 'Moderate crowds expected',
            ta: 'மிதமான கூட்டம் எதிர்பார்க்கப்படுகிறது'
        };
    }
    if (score < 85) {
        return {
            en: 'Consider alternatives',
            ta: 'மாற்று இடங்களை பரிசீலிக்கவும்'
        };
    }
    return {
        en: 'Visit not recommended',
        ta: 'பார்வையிட பரிந்துரைக்கப்படவில்லை'
    };
}
