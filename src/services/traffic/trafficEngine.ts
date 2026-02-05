/**
 * Traffic Engine - Core traffic analysis and monitoring
 * Aggregates data from E-Pass, Parking, Weather for real-time congestion scoring
 */

import { CrowdEngine, CrowdLevel } from '@/services/crowdEngine';
import { CrowdAnalyzer } from '@/services/analytics/crowdAnalyzer';
import { TrafficService } from '@/services/trafficService';
import { getWeather } from '@/services/weatherService';
import { OOTY_SPOTS, OOTY_ROADS, OOTY_JUNCTIONS } from '@/data/ootyMapData';
import { CongestionModel, CongestionScore } from '@/services/traffic/congestionModel';
import { TrafficShaping, TrafficLevel } from '@/services/traffic/trafficShaping';

// ============================================
// TYPES
// ============================================

export interface SpotCongestion {
    spotId: string;
    name: string;
    score: number; // 0-100
    level: TrafficLevel;
    trend: 'RISING' | 'STABLE' | 'FALLING';
    factors: CongestionFactors;
    lastUpdated: Date;
    prediction: HourlyPrediction[];
}

export interface RoadCongestion {
    roadId: string;
    name: string;
    score: number;
    level: TrafficLevel;
    delayMinutes: number;
    speedKmh: number;
    incidents: Incident[];
}

export interface CongestionFactors {
    ePassScore: number;
    parkingScore: number;
    historicalScore: number;
    weatherScore: number;
    eventScore: number; // Kept for future use, processed within history or reports if needed
    userReportsScore: number;
}

export interface HourlyPrediction {
    hour: number;
    predictedScore: number;
    confidence: number;
}

export interface Incident {
    type: 'ACCIDENT' | 'ROAD_WORK' | 'LANDSLIDE' | 'VIP' | 'FESTIVAL';
    location: { lat: number; lng: number };
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    message: string;
}

export interface HeatmapData {
    lat: number;
    lng: number;
    intensity: number; // 0-1
    spotId?: string;
}

export interface RegionStats {
    totalVisitors: number;
    averageCongestion: number;
    busiestSpot: string;
    quietestSpot: string;
    entryRate: number; // per hour
}

// ============================================
// TRAFFIC ENGINE CLASS
// ============================================

export class TrafficEngine {
    private static cache = new Map<string, { data: SpotCongestion; expires: number }>();
    private static monitoringInterval: NodeJS.Timeout | null = null;
    private static listeners: ((data: SpotCongestion[]) => void)[] = [];
    private static readonly CACHE_TTL = 10000; // 10 seconds
    private static readonly UPDATE_INTERVAL = 10000; // 10 seconds

    /**
     * Get congestion score for a specific spot
     */
    static async getCongestionScore(spotId: string): Promise<SpotCongestion> {
        // Check cache
        const cached = this.cache.get(spotId);
        if (cached && cached.expires > Date.now()) {
            return cached.data;
        }

        const spot = OOTY_SPOTS.find(s => s.id === spotId);
        if (!spot) {
            throw new Error(`Spot not found: ${spotId}`);
        }

        // Calculate congestion using the new CrowdAnalyzer module
        const analysis = await CrowdAnalyzer.analyzeSpot(spot.name);

        const score = analysis.metrics.crowdScore;
        const level = analysis.metrics.crowdLevel === 'CRITICAL' ? 'CRITICAL' as TrafficLevel
            : analysis.metrics.crowdLevel === 'HIGH' ? 'HEAVY' as TrafficLevel
                : analysis.metrics.crowdLevel === 'MEDIUM' ? 'MODERATE' as TrafficLevel
                    : 'LOW' as TrafficLevel;

        const congestion: SpotCongestion = {
            spotId,
            name: spot.name,
            score,
            level,
            trend: analysis.metrics.trend,
            factors: {
                ePassScore: analysis.metrics.factors.epass,
                parkingScore: analysis.metrics.factors.parking,
                historicalScore: analysis.metrics.factors.historical,
                weatherScore: analysis.metrics.factors.weather,
                eventScore: 0,
                userReportsScore: 0
            },
            lastUpdated: new Date(),
            prediction: analysis.metrics.prediction2h.map((s, i) => ({
                hour: new Date().getHours() + i,
                predictedScore: s,
                confidence: 0.9 - (i * 0.1)
            }))
        };

        // Cache result
        this.cache.set(spotId, {
            data: congestion,
            expires: Date.now() + this.CACHE_TTL
        });

        return congestion;
    }

    /**
     * Get congestion for all spots
     */
    static async getAllCongestion(): Promise<SpotCongestion[]> {
        const results = await Promise.all(
            OOTY_SPOTS.map(spot => this.getCongestionScore(spot.id))
        );
        return results.sort((a, b) => b.score - a.score);
    }

    /**
     * Get road congestion
     */
    static async getRoadCongestion(roadId: string): Promise<RoadCongestion> {
        const road = OOTY_ROADS.find(r => r.id === roadId);
        if (!road) {
            throw new Error(`Road not found: ${roadId}`);
        }

        // Get traffic data
        const traffic = await TrafficService.estimateTraffic(road.name);

        // Calculate score based on delay and flow
        const delayScore = Math.min(100, traffic.delayMinutes * 10);
        const flowScore = Math.min(100, (traffic.estimatedVehicles / 100) * 50);
        const score = Math.round((delayScore + flowScore) / 2);

        // Get incidents from admin controls
        const incidents = await this.getActiveIncidents(roadId);

        return {
            roadId,
            name: road.name,
            score,
            level: TrafficShaping.getLevel(score),
            delayMinutes: traffic.delayMinutes,
            speedKmh: road.speedLimit * (1 - score / 200), // Reduce speed based on congestion
            incidents
        };
    }

    /**
     * Get all road congestion
     */
    static async getAllRoadCongestion(): Promise<RoadCongestion[]> {
        const results = await Promise.all(
            OOTY_ROADS.map(road => this.getRoadCongestion(road.id))
        );
        return results;
    }

    /**
     * Get heatmap data for the region
     */
    static async getRegionHeatmap(): Promise<HeatmapData[]> {
        const spotCongestion = await this.getAllCongestion();

        return spotCongestion.map(spot => {
            const spotData = OOTY_SPOTS.find(s => s.id === spot.spotId);
            return {
                lat: spotData?.latitude || 0,
                lng: spotData?.longitude || 0,
                intensity: spot.score / 100,
                spotId: spot.spotId
            };
        });
    }

    /**
     * Get region-wide statistics
     */
    static async getRegionStats(): Promise<RegionStats> {
        const allCongestion = await this.getAllCongestion();

        const totalScore = allCongestion.reduce((sum, c) => sum + c.score, 0);
        const avgCongestion = Math.round(totalScore / allCongestion.length);

        // Estimate visitors from congestion scores
        const totalVisitors = allCongestion.reduce((sum, c) => {
            return sum + Math.round((c.score / 100) * 500); // Rough estimate
        }, 0);

        const sorted = [...allCongestion].sort((a, b) => b.score - a.score);

        return {
            totalVisitors,
            averageCongestion: avgCongestion,
            busiestSpot: sorted[0]?.name || 'Unknown',
            quietestSpot: sorted[sorted.length - 1]?.name || 'Unknown',
            entryRate: Math.round(totalVisitors / 8) // Spread over 8 hours
        };
    }

    /**
     * Calculate congestion trend
     */
    private static async calculateTrend(
        spotId: string,
        currentScore: number
    ): Promise<'RISING' | 'STABLE' | 'FALLING'> {
        // Check previous cached value
        const previous = this.cache.get(`${spotId}_prev`);

        if (!previous) {
            // Store current for next comparison
            this.cache.set(`${spotId}_prev`, {
                data: { score: currentScore } as any,
                expires: Date.now() + 60000 // 1 minute
            });
            return 'STABLE';
        }

        const diff = currentScore - previous.data.score;

        // Update previous
        this.cache.set(`${spotId}_prev`, {
            data: { score: currentScore } as any,
            expires: Date.now() + 60000
        });

        if (diff > 5) return 'RISING';
        if (diff < -5) return 'FALLING';
        return 'STABLE';
    }

    /**
     * Get 3-hour prediction for a spot
     */
    private static async getPrediction(spotId: string): Promise<HourlyPrediction[]> {
        const now = new Date();
        const currentHour = now.getHours();

        return [1, 2, 3].map(offset => {
            const hour = (currentHour + offset) % 24;

            // Use historical patterns
            const peakMultiplier = this.getPeakMultiplier(hour);
            const baseScore = 50; // Average score

            return {
                hour,
                predictedScore: Math.round(baseScore * peakMultiplier),
                confidence: 0.7 - (offset * 0.1) // Confidence decreases with time
            };
        });
    }

    /**
     * Get peak hour multiplier
     */
    private static getPeakMultiplier(hour: number): number {
        // Peak hours: 10-12, 15-17
        if (hour >= 10 && hour <= 12) return 1.5;
        if (hour >= 15 && hour <= 17) return 1.4;
        if (hour >= 9 && hour <= 18) return 1.2;
        return 0.6; // Off-peak
    }

    /**
     * Get active incidents on a road
     */
    private static async getActiveIncidents(roadId: string): Promise<Incident[]> {
        // Check admin controls for active incidents
        try {
            const { AdminControl } = await import('@/services/admin/adminControl');
            const controls = await AdminControl.getActiveControls();

            return controls
                .filter(c => c.affectedRoutes?.includes(roadId))
                .map(c => ({
                    type: c.type as any,
                    location: c.location,
                    severity: c.severity || 'MEDIUM',
                    message: c.message.en
                }));
        } catch {
            return [];
        }
    }

    /**
     * Start real-time monitoring (10-second updates)
     */
    static startMonitoring() {
        if (this.monitoringInterval) {
            console.log('🚦 TrafficEngine: Monitoring already active');
            return;
        }

        console.log('🚦 TrafficEngine: Starting 10-second monitoring');

        this.monitoringInterval = setInterval(async () => {
            try {
                // Clear cache to force fresh data
                this.cache.clear();

                // Get fresh congestion data
                const allCongestion = await this.getAllCongestion();

                // Notify listeners
                this.listeners.forEach(listener => listener(allCongestion));
            } catch (error) {
                console.error('TrafficEngine monitoring error:', error);
            }
        }, this.UPDATE_INTERVAL);
    }

    /**
     * Stop monitoring
     */
    static stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
            console.log('🚦 TrafficEngine: Monitoring stopped');
        }
    }

    /**
     * Subscribe to congestion updates
     */
    static subscribe(listener: (data: SpotCongestion[]) => void): () => void {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    /**
     * Check if a spot should be recommended
     */
    static async shouldRecommend(spotId: string): Promise<{
        recommend: boolean;
        reason?: string;
        alternative?: string;
    }> {
        const congestion = await this.getCongestionScore(spotId);
        const action = TrafficShaping.getAction(congestion.level);

        if (action.recommend) {
            return { recommend: true };
        }

        // Find best alternative
        const alternatives = await TrafficShaping.getAlternatives(spotId);

        return {
            recommend: false,
            reason: action.message.en,
            alternative: alternatives[0]?.name
        };
    }
}

export default TrafficEngine;
