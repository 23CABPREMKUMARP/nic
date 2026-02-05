/**
 * Analytics API Routes
 * Endpoints for crowd analysis, predictions, and reports
 */

import { NextRequest, NextResponse } from 'next/server';
import { CrowdAnalyzer } from '@/services/analytics/crowdAnalyzer';
import { PredictionModel } from '@/services/analytics/predictionModel';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const spot = searchParams.get('spot');

    try {
        switch (action) {
            case 'analyze':
                if (spot) {
                    const analysis = await CrowdAnalyzer.analyzeSpot(spot);
                    return NextResponse.json(analysis);
                }
                const allAnalysis = await CrowdAnalyzer.analyzeAll();
                return NextResponse.json({ spots: allAnalysis });

            case 'predict':
                if (!spot) {
                    return NextResponse.json({ error: 'Spot name required' }, { status: 400 });
                }
                const baseScore = parseInt(searchParams.get('baseScore') || '50');
                const predictions = await PredictionModel.predictNext24Hours(spot, baseScore);
                return NextResponse.json({ spot, predictions });

            case 'predictDay':
                if (!spot) {
                    return NextResponse.json({ error: 'Spot name required' }, { status: 400 });
                }
                const dateStr = searchParams.get('date');
                const targetDate = dateStr ? new Date(dateStr) : new Date();
                const dayPrediction = await PredictionModel.predictDay(spot, targetDate);
                return NextResponse.json(dayPrediction);

            case 'trend':
                if (!spot) {
                    return NextResponse.json({ error: 'Spot name required' }, { status: 400 });
                }
                const trend = await PredictionModel.analyzeTrend(spot);
                return NextResponse.json({ spot, trend });

            case 'gates':
                const gateLoad = await PredictionModel.predictGateLoad();
                return NextResponse.json({ gates: gateLoad });

            case 'summary':
                const summary = await generateSummary();
                return NextResponse.json(summary);

            case 'heatmap':
                const heatmapData = await generateHeatmapData();
                return NextResponse.json({ heatmap: heatmapData });

            default:
                // Default: return all spots analysis
                const defaultAnalysis = await CrowdAnalyzer.analyzeAll();
                return NextResponse.json({
                    spots: defaultAnalysis,
                    timestamp: new Date().toISOString(),
                    refreshInterval: 300 // 5 minutes
                });
        }
    } catch (error: any) {
        console.error('Analytics API Error:', error);
        return NextResponse.json(
            { error: 'Failed to process analytics', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * Generate overall summary
 */
async function generateSummary() {
    const allSpots = await CrowdAnalyzer.analyzeAll();
    const gateLoad = await PredictionModel.predictGateLoad();

    const totalCrowd = allSpots.reduce((sum, s) => sum + s.metrics.crowdScore, 0);
    const avgCrowd = Math.round(totalCrowd / allSpots.length);

    const criticalSpots = allSpots.filter(s => s.metrics.crowdLevel === 'CRITICAL' || s.metrics.crowdLevel === 'HIGH');
    const busiestSpot = allSpots.reduce((max, s) => s.metrics.crowdScore > max.metrics.crowdScore ? s : max, allSpots[0]);
    const calmestSpot = allSpots.reduce((min, s) => s.metrics.crowdScore < min.metrics.crowdScore ? s : min, allSpots[0]);

    const totalGateEntries = Object.values(gateLoad).reduce((sum, g) => sum + g.current, 0);

    return {
        overallStatus: avgCrowd <= 60 ? 'LOW' : avgCrowd <= 80 ? 'MEDIUM' : 'HIGH',
        averageCrowd: avgCrowd,
        totalActiveEntries: totalGateEntries,
        spotsAnalyzed: allSpots.length,
        criticalAlerts: criticalSpots.length,
        busiestSpot: {
            name: busiestSpot.spotName,
            score: busiestSpot.metrics.crowdScore
        },
        calmestSpot: {
            name: calmestSpot.spotName,
            score: calmestSpot.metrics.crowdScore
        },
        gateLoad,
        lastUpdated: new Date().toISOString(),
        alerts: criticalSpots.map(s => ({
            spot: s.spotName,
            level: s.metrics.crowdLevel,
            recommendation: s.recommendation
        }))
    };
}

/**
 * Generate heatmap data for visualization
 */
async function generateHeatmapData() {
    const allSpots = await CrowdAnalyzer.analyzeAll();

    // Map spots to heatmap format with lat/lng and intensity
    const defaultCoords: Record<string, [number, number]> = {
        'Ooty Lake': [11.4130, 76.6980],
        'Botanical Garden': [11.4160, 76.6975],
        'Doddabetta Peak': [11.4006, 76.7350],
        'Rose Garden': [11.4127, 76.7008],
        'Tea Factory': [11.3950, 76.7120],
        'Emerald Lake': [11.3710, 76.5750],
        'Pykara Lake': [11.4570, 76.6100]
    };

    return allSpots.map(spot => ({
        lat: defaultCoords[spot.spotName]?.[0] || 11.41,
        lng: defaultCoords[spot.spotName]?.[1] || 76.69,
        intensity: spot.metrics.crowdScore / 100,
        name: spot.spotName,
        level: spot.metrics.crowdLevel
    }));
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action } = body;

        // For future: admin controls, manual overrides, etc.
        if (action === 'refresh') {
            const analysis = await CrowdAnalyzer.analyzeAll();
            return NextResponse.json({
                success: true,
                spots: analysis,
                refreshedAt: new Date().toISOString()
            });
        }

        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    } catch (error: any) {
        return NextResponse.json(
            { error: 'Failed to process request', details: error.message },
            { status: 500 }
        );
    }
}
