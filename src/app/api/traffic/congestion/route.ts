/**
 * Traffic Congestion API - Get congestion scores for all spots
 */

import { NextRequest, NextResponse } from 'next/server';
import { TrafficEngine } from '@/services/traffic/trafficEngine';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const spotId = searchParams.get('spotId');

        if (spotId) {
            // Get specific spot congestion
            const congestion = await TrafficEngine.getCongestionScore(spotId);
            return NextResponse.json({
                success: true,
                data: congestion
            });
        }

        // Get all congestion data
        const allCongestion = await TrafficEngine.getAllCongestion();
        const regionStats = await TrafficEngine.getRegionStats();

        return NextResponse.json({
            success: true,
            data: {
                spots: allCongestion,
                stats: regionStats,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error: any) {
        console.error('Congestion API error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
