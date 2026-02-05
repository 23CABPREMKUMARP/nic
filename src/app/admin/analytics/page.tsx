'use client';

/**
 * Admin Analytics Report Dashboard
 * Comprehensive crowd analysis visualization
 */

import { useState, useEffect } from 'react';
import {
    Users, TrendingUp, TrendingDown, AlertTriangle,
    Clock, Car, MapPin, RefreshCw, ChevronRight,
    BarChart3, Gauge, Zap, CloudSun
} from 'lucide-react';

interface SpotAnalysis {
    spotId: string;
    spotName: string;
    metrics: {
        crowdLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
        crowdScore: number;
        waitingEstimate: number;
        parkingChance: number;
        bestAlternate: string | null;
        trend: 'RISING' | 'STABLE' | 'FALLING';
        factors: {
            epass: number;
            parking: number;
            historical: number;
            weather: number;
        };
        gateLoad: Record<string, number>;
        prediction2h: number[];
    };
    recommendation: string;
    bestVisitTime: string;
    redirectionNeeded: boolean;
}

interface Summary {
    overallStatus: string;
    averageCrowd: number;
    totalActiveEntries: number;
    spotsAnalyzed: number;
    criticalAlerts: number;
    busiestSpot: { name: string; score: number };
    calmestSpot: { name: string; score: number };
    gateLoad: Record<string, { current: number; predicted: number; trend: string }>;
    lastUpdated: string;
    alerts: { spot: string; level: string; recommendation: string }[];
}

export default function AnalyticsReport() {
    const [loading, setLoading] = useState(true);
    const [spots, setSpots] = useState<SpotAnalysis[]>([]);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [selectedSpot, setSelectedSpot] = useState<SpotAnalysis | null>(null);
    const [autoRefresh, setAutoRefresh] = useState(true);

    const fetchData = async () => {
        try {
            const [spotsRes, summaryRes] = await Promise.all([
                fetch('/api/analytics'),
                fetch('/api/analytics?action=summary')
            ]);

            const spotsData = await spotsRes.json();
            const summaryData = await summaryRes.json();

            setSpots(spotsData.spots || []);
            setSummary(summaryData);
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

        if (autoRefresh) {
            const interval = setInterval(fetchData, 60000); // Refresh every minute
            return () => clearInterval(interval);
        }
    }, [autoRefresh]);

    const getLevelColor = (level: string) => {
        switch (level) {
            case 'LOW': return 'bg-green-500';
            case 'MEDIUM': return 'bg-amber-500';
            case 'HIGH': return 'bg-orange-500';
            case 'CRITICAL': return 'bg-red-500';
            default: return 'bg-gray-400';
        }
    };

    const getLevelBg = (level: string) => {
        switch (level) {
            case 'LOW': return 'bg-green-50 border-green-200 text-green-800';
            case 'MEDIUM': return 'bg-amber-50 border-amber-200 text-amber-800';
            case 'HIGH': return 'bg-orange-50 border-orange-200 text-orange-800';
            case 'CRITICAL': return 'bg-red-50 border-red-200 text-red-800';
            default: return 'bg-gray-50 border-gray-200 text-gray-800';
        }
    };

    const getTrendIcon = (trend: string) => {
        switch (trend) {
            case 'RISING': return <TrendingUp className="w-4 h-4 text-red-500" />;
            case 'FALLING': return <TrendingDown className="w-4 h-4 text-green-500" />;
            default: return <span className="text-gray-400">→</span>;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <RefreshCw className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
                    <p className="text-white/60">Loading Analytics...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 text-white p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-black flex items-center gap-3">
                        <BarChart3 className="w-8 h-8 text-orange-500" />
                        Crowd Analytics Dashboard
                    </h1>
                    <p className="text-white/50 mt-1">Real-time congestion analysis & predictions</p>
                </div>
                <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm text-white/60">
                        <input
                            type="checkbox"
                            checked={autoRefresh}
                            onChange={(e) => setAutoRefresh(e.target.checked)}
                            className="rounded"
                        />
                        Auto-refresh
                    </label>
                    <button
                        onClick={fetchData}
                        className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded-lg transition"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            {summary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-4">
                        <div className="flex items-center gap-2 text-white/50 text-sm mb-2">
                            <Gauge className="w-4 h-4" />
                            Overall Status
                        </div>
                        <div className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${getLevelBg(summary.overallStatus)}`}>
                            {summary.overallStatus}
                        </div>
                        <p className="text-2xl font-black mt-2">{summary.averageCrowd}%</p>
                    </div>

                    <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-4">
                        <div className="flex items-center gap-2 text-white/50 text-sm mb-2">
                            <Users className="w-4 h-4" />
                            Active Entries
                        </div>
                        <p className="text-3xl font-black">{summary.totalActiveEntries}</p>
                        <p className="text-white/40 text-sm">Across all gates</p>
                    </div>

                    <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-4">
                        <div className="flex items-center gap-2 text-white/50 text-sm mb-2">
                            <AlertTriangle className="w-4 h-4 text-red-400" />
                            Critical Alerts
                        </div>
                        <p className="text-3xl font-black text-red-400">{summary.criticalAlerts}</p>
                        <p className="text-white/40 text-sm">Spots need attention</p>
                    </div>

                    <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-4">
                        <div className="flex items-center gap-2 text-white/50 text-sm mb-2">
                            <Zap className="w-4 h-4 text-amber-400" />
                            Busiest Now
                        </div>
                        <p className="text-lg font-bold truncate">{summary.busiestSpot.name}</p>
                        <p className="text-amber-400 font-mono">{summary.busiestSpot.score}%</p>
                    </div>
                </div>
            )}

            {/* Gate Load Table */}
            {summary && (
                <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 mb-8">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-blue-400" />
                        Gate-wise Entry Load
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.entries(summary.gateLoad).map(([gate, data]) => (
                            <div key={gate} className="bg-black/30 rounded-xl p-4">
                                <p className="text-white/60 text-sm">{gate}</p>
                                <div className="flex items-end gap-2 mt-1">
                                    <span className="text-2xl font-black">{data.current}</span>
                                    <span className="text-white/40 text-sm mb-1">vehicles</span>
                                    <span className={`ml-auto text-lg ${data.trend === '↑' ? 'text-red-400' : data.trend === '↓' ? 'text-green-400' : 'text-gray-400'}`}>
                                        {data.trend}
                                    </span>
                                </div>
                                <div className="mt-2 bg-white/10 rounded-full h-2">
                                    <div
                                        className="bg-blue-500 h-2 rounded-full transition-all"
                                        style={{ width: `${Math.min(100, (data.current / 200) * 100)}%` }}
                                    />
                                </div>
                                <p className="text-xs text-white/40 mt-1">
                                    Predicted: {data.predicted} in 2h
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Spots Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {spots.map((spot) => (
                    <div
                        key={spot.spotId}
                        onClick={() => setSelectedSpot(spot)}
                        className={`bg-white/5 backdrop-blur border rounded-2xl p-5 cursor-pointer transition hover:bg-white/10 ${selectedSpot?.spotId === spot.spotId ? 'border-orange-500' : 'border-white/10'
                            }`}
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <h3 className="font-bold text-lg">{spot.spotName}</h3>
                                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${getLevelColor(spot.metrics.crowdLevel)} text-white mt-1`}>
                                    {spot.metrics.crowdLevel}
                                </span>
                            </div>
                            <div className="text-right">
                                <p className="text-3xl font-black">{spot.metrics.crowdScore}</p>
                                <div className="flex items-center justify-end gap-1">
                                    {getTrendIcon(spot.metrics.trend)}
                                    <span className="text-xs text-white/50">{spot.metrics.trend}</span>
                                </div>
                            </div>
                        </div>

                        {/* Mini Chart */}
                        <div className="flex items-end gap-1 h-12 mb-3">
                            {spot.metrics.prediction2h.map((val, i) => (
                                <div
                                    key={i}
                                    className={`flex-1 rounded-t transition-all ${val <= 60 ? 'bg-green-500' : val <= 80 ? 'bg-amber-500' : 'bg-red-500'
                                        }`}
                                    style={{ height: `${val}%` }}
                                    title={`${i * 30}min: ${val}%`}
                                />
                            ))}
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-3 gap-2 text-sm">
                            <div className="bg-black/30 rounded-lg p-2 text-center">
                                <Clock className="w-4 h-4 mx-auto text-blue-400 mb-1" />
                                <p className="text-white/50 text-xs">Wait</p>
                                <p className="font-bold">{spot.metrics.waitingEstimate}m</p>
                            </div>
                            <div className="bg-black/30 rounded-lg p-2 text-center">
                                <Car className="w-4 h-4 mx-auto text-green-400 mb-1" />
                                <p className="text-white/50 text-xs">Parking</p>
                                <p className="font-bold">{spot.metrics.parkingChance}%</p>
                            </div>
                            <div className="bg-black/30 rounded-lg p-2 text-center">
                                <CloudSun className="w-4 h-4 mx-auto text-cyan-400 mb-1" />
                                <p className="text-white/50 text-xs">Best</p>
                                <p className="font-bold text-xs">{spot.bestVisitTime}</p>
                            </div>
                        </div>

                        {/* Recommendation */}
                        <p className="mt-3 text-sm text-white/60 italic">
                            {spot.recommendation}
                        </p>

                        {spot.redirectionNeeded && (
                            <div className="mt-3 flex items-center gap-2 text-amber-400 text-sm">
                                <AlertTriangle className="w-4 h-4" />
                                <span>Redirection recommended → {spot.metrics.bestAlternate}</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Selected Spot Details */}
            {selectedSpot && (
                <div className="bg-white/5 backdrop-blur border border-orange-500/50 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-orange-500" />
                            {selectedSpot.spotName} - Detailed Analysis
                        </h2>
                        <button
                            onClick={() => setSelectedSpot(null)}
                            className="text-white/50 hover:text-white"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="grid md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-black/30 rounded-xl p-4">
                            <p className="text-white/50 text-sm flex items-center gap-1">
                                <Users className="w-4 h-4" /> E-Pass Factor
                            </p>
                            <p className="text-2xl font-black mt-1">{selectedSpot.metrics.factors.epass}%</p>
                            <div className="bg-white/10 rounded-full h-2 mt-2">
                                <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${selectedSpot.metrics.factors.epass}%` }} />
                            </div>
                        </div>
                        <div className="bg-black/30 rounded-xl p-4">
                            <p className="text-white/50 text-sm flex items-center gap-1">
                                <Car className="w-4 h-4" /> Parking Factor
                            </p>
                            <p className="text-2xl font-black mt-1">{selectedSpot.metrics.factors.parking}%</p>
                            <div className="bg-white/10 rounded-full h-2 mt-2">
                                <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${selectedSpot.metrics.factors.parking}%` }} />
                            </div>
                        </div>
                        <div className="bg-black/30 rounded-xl p-4">
                            <p className="text-white/50 text-sm flex items-center gap-1">
                                <BarChart3 className="w-4 h-4" /> Historical Factor
                            </p>
                            <p className="text-2xl font-black mt-1">{selectedSpot.metrics.factors.historical}%</p>
                            <div className="bg-white/10 rounded-full h-2 mt-2">
                                <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${selectedSpot.metrics.factors.historical}%` }} />
                            </div>
                        </div>
                        <div className="bg-black/30 rounded-xl p-4">
                            <p className="text-white/50 text-sm flex items-center gap-1">
                                <CloudSun className="w-4 h-4" /> Weather Factor
                            </p>
                            <p className="text-2xl font-black mt-1">{selectedSpot.metrics.factors.weather}%</p>
                            <div className="bg-white/10 rounded-full h-2 mt-2">
                                <div className="bg-cyan-500 h-2 rounded-full" style={{ width: `${selectedSpot.metrics.factors.weather}%` }} />
                            </div>
                        </div>
                    </div>

                    {/* 2-Hour Prediction Chart */}
                    <div className="bg-black/30 rounded-xl p-4">
                        <h3 className="text-sm text-white/50 mb-3">Next 2 Hours Prediction</h3>
                        <div className="flex items-end gap-2 h-32">
                            {selectedSpot.metrics.prediction2h.map((val, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center">
                                    <div
                                        className={`w-full rounded-t transition-all ${val <= 60 ? 'bg-green-500' : val <= 80 ? 'bg-amber-500' : 'bg-red-500'
                                            }`}
                                        style={{ height: `${val}%` }}
                                    />
                                    <p className="text-xs text-white/40 mt-2">+{i * 30}m</p>
                                    <p className="text-xs font-bold">{val}%</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Alerts Section */}
            {summary && summary.alerts.length > 0 && (
                <div className="mt-8 bg-red-500/10 border border-red-500/30 rounded-2xl p-6">
                    <h2 className="text-lg font-bold flex items-center gap-2 text-red-400 mb-4">
                        <AlertTriangle className="w-5 h-5" />
                        Active Alerts
                    </h2>
                    <div className="space-y-3">
                        {summary.alerts.map((alert, i) => (
                            <div key={i} className="bg-black/30 rounded-xl p-4 flex items-center gap-4">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${getLevelColor(alert.level)} text-white`}>
                                    {alert.level}
                                </span>
                                <div className="flex-1">
                                    <p className="font-bold">{alert.spot}</p>
                                    <p className="text-sm text-white/60">{alert.recommendation}</p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-white/30" />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className="mt-8 text-center text-white/30 text-sm">
                Last updated: {summary?.lastUpdated ? new Date(summary.lastUpdated).toLocaleString() : 'N/A'}
            </div>
        </div>
    );
}
