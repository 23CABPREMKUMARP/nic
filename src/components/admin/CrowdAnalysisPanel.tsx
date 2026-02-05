'use client';

import { useState, useEffect } from 'react';
import { X, Users, Car, Cloud, TrendingUp, AlertTriangle, RefreshCw } from 'lucide-react';

interface CrowdData {
    score: number;
    level: 'SAFE' | 'MEDIUM' | 'OVERFLOW';
    factors: {
        parking: number;
        passes: number;
        history: number;
        weather: number;
    };
    recommendation: string;
    caption: string;
}

interface LocationCrowd {
    name: string;
    crowd: CrowdData;
}

interface CrowdAnalysisPanelProps {
    onClose: () => void;
}

export default function CrowdAnalysisPanel({ onClose }: CrowdAnalysisPanelProps) {
    const [loading, setLoading] = useState(true);
    const [locations, setLocations] = useState<LocationCrowd[]>([]);
    const [error, setError] = useState<string | null>(null);

    const fetchCrowdData = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/analytics');
            if (!res.ok) throw new Error('Failed to fetch crowd data');
            const data = await res.json();
            // Transform to expected format
            const transformed = (data.spots || []).map((spot: any) => ({
                name: spot.spotName,
                crowd: {
                    score: spot.metrics.crowdScore,
                    level: spot.metrics.crowdLevel,
                    factors: spot.metrics.factors,
                    recommendation: spot.recommendation
                }
            }));
            setLocations(transformed);
        } catch (err: any) {
            setError(err.message || 'Error loading crowd data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCrowdData();
    }, []);

    const getLevelColor = (level: string) => {
        switch (level) {
            case 'SAFE': return 'bg-green-500';
            case 'MEDIUM': return 'bg-amber-500';
            case 'OVERFLOW': return 'bg-red-500';
            default: return 'bg-gray-400';
        }
    };

    const getLevelBg = (level: string) => {
        switch (level) {
            case 'SAFE': return 'bg-green-50 border-green-200';
            case 'MEDIUM': return 'bg-amber-50 border-amber-200';
            case 'OVERFLOW': return 'bg-red-50 border-red-200';
            default: return 'bg-gray-50 border-gray-200';
        }
    };

    return (
        <div className="absolute top-32 left-4 z-[600] bg-white rounded-2xl shadow-2xl w-80 max-h-[70vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-red-500 p-4 text-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        <h2 className="font-bold">Crowd Analysis</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={fetchCrowdData}
                            className="p-1.5 hover:bg-white/20 rounded-full transition"
                            title="Refresh"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-1.5 hover:bg-white/20 rounded-full transition"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
                <p className="text-xs text-white/80 mt-1">Real-time crowd density at popular spots</p>
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto max-h-[50vh]">
                {loading && (
                    <div className="flex items-center justify-center py-8">
                        <RefreshCw className="w-6 h-6 text-orange-500 animate-spin" />
                    </div>
                )}

                {error && (
                    <div className="text-center py-8">
                        <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                        <p className="text-sm text-red-600">{error}</p>
                        <button
                            onClick={fetchCrowdData}
                            className="mt-2 text-xs text-blue-500 hover:underline"
                        >
                            Try again
                        </button>
                    </div>
                )}

                {!loading && !error && locations.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No crowd data available</p>
                    </div>
                )}

                {!loading && !error && locations.map((loc, index) => (
                    <div
                        key={index}
                        className={`mb-3 p-3 rounded-xl border ${getLevelBg(loc.crowd.level)}`}
                    >
                        <div className="flex items-start justify-between mb-2">
                            <div>
                                <h3 className="font-semibold text-gray-800 text-sm">{loc.name}</h3>
                                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${getLevelColor(loc.crowd.level)}`}>
                                    {loc.crowd.level}
                                </span>
                            </div>
                            <div className="text-right">
                                <span className="text-2xl font-black text-gray-800">{loc.crowd.score}</span>
                                <span className="text-xs text-gray-500 block">/ 100</span>
                            </div>
                        </div>

                        {/* Factor Bars */}
                        <div className="space-y-1.5 mt-3">
                            <div className="flex items-center gap-2 text-xs">
                                <Car className="w-3 h-3 text-blue-500" />
                                <span className="w-14 text-gray-600">Parking</span>
                                <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                                    <div
                                        className="bg-blue-500 h-1.5 rounded-full transition-all"
                                        style={{ width: `${loc.crowd.factors.parking}%` }}
                                    />
                                </div>
                                <span className="w-8 text-right text-gray-500">{loc.crowd.factors.parking}%</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                                <Users className="w-3 h-3 text-purple-500" />
                                <span className="w-14 text-gray-600">Passes</span>
                                <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                                    <div
                                        className="bg-purple-500 h-1.5 rounded-full transition-all"
                                        style={{ width: `${loc.crowd.factors.passes}%` }}
                                    />
                                </div>
                                <span className="w-8 text-right text-gray-500">{loc.crowd.factors.passes}%</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                                <TrendingUp className="w-3 h-3 text-amber-500" />
                                <span className="w-14 text-gray-600">History</span>
                                <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                                    <div
                                        className="bg-amber-500 h-1.5 rounded-full transition-all"
                                        style={{ width: `${loc.crowd.factors.history}%` }}
                                    />
                                </div>
                                <span className="w-8 text-right text-gray-500">{loc.crowd.factors.history}%</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                                <Cloud className="w-3 h-3 text-cyan-500" />
                                <span className="w-14 text-gray-600">Weather</span>
                                <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                                    <div
                                        className="bg-cyan-500 h-1.5 rounded-full transition-all"
                                        style={{ width: `${loc.crowd.factors.weather}%` }}
                                    />
                                </div>
                                <span className="w-8 text-right text-gray-500">{loc.crowd.factors.weather}%</span>
                            </div>
                        </div>

                        {/* Recommendation */}
                        <p className="mt-2 text-[11px] text-gray-600 italic">
                            💡 {loc.crowd.recommendation}
                        </p>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-4 py-2 border-t text-center">
                <p className="text-[10px] text-gray-400">Data updates every 5 minutes</p>
            </div>
        </div>
    );
}
