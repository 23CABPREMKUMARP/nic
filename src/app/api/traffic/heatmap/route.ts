/**
 * Traffic Heatmap API - Get heatmap data for visualization
 */

import { NextRequest, NextResponse } from 'next/server';
import { TrafficEngine } from '@/services/traffic/trafficEngine';

export async function GET(request: NextRequest) {
    try {
        const heatmapData = await TrafficEngine.getRegionHeatmap();
        const roadCongestion = await TrafficEngine.getAllRoadCongestion();

        return NextResponse.json({
            success: true,
            data: {
                spots: heatmapData,
                roads: roadCongestion.map(road => ({
                    id: road.roadId,
                    name: road.name,
                    score: road.score,
                    level: road.level,
                    incidents: road.incidents
                })),
                timestamp: new Date().toISOString(),
                refreshInterval: 10000 // 10 seconds
            }
        });
    } catch (error: any) {
        console.error('Heatmap API error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
