'use client';

/**
 * Crowd Heatmap Component
 * Visual overlay for map showing crowd density
 */

import { useEffect, useState } from 'react';

interface HeatmapPoint {
    lat: number;
    lng: number;
    intensity: number;
    name: string;
    level: string;
}

interface CrowdHeatmapProps {
    onPointClick?: (name: string) => void;
}

export default function CrowdHeatmap({ onPointClick }: CrowdHeatmapProps) {
    const [points, setPoints] = useState<HeatmapPoint[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHeatmapData();
        const interval = setInterval(fetchHeatmapData, 60000); // Refresh every minute
        return () => clearInterval(interval);
    }, []);

    const fetchHeatmapData = async () => {
        try {
            const res = await fetch('/api/analytics?action=heatmap');
            const data = await res.json();
            setPoints(data.heatmap || []);
        } catch (error) {
            console.error('Failed to fetch heatmap:', error);
        } finally {
            setLoading(false);
        }
    };

    const getColor = (intensity: number) => {
        if (intensity <= 0.4) return '#22c55e'; // Green
        if (intensity <= 0.6) return '#eab308'; // Yellow
        if (intensity <= 0.8) return '#f97316'; // Orange
        return '#ef4444'; // Red
    };

    const getGlow = (intensity: number) => {
        const color = getColor(intensity);
        return `0 0 ${20 + intensity * 30}px ${color}`;
    };

    if (loading) {
        return (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <div className="bg-white/90 rounded-xl p-4 shadow-lg">
                    <div className="animate-pulse flex items-center gap-2">
                        <div className="w-3 h-3 bg-orange-500 rounded-full animate-ping" />
                        <span className="text-sm text-gray-600">Loading heatmap...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="absolute inset-0 pointer-events-none">
            {/* Legend */}
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur rounded-xl p-3 shadow-lg pointer-events-auto z-10">
                <p className="text-xs font-bold text-gray-700 mb-2">Crowd Density</p>
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        <span className="text-xs text-gray-600">Low</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-500" />
                        <span className="text-xs text-gray-600">Medium</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-orange-500" />
                        <span className="text-xs text-gray-600">High</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <span className="text-xs text-gray-600">Critical</span>
                    </div>
                </div>
            </div>

            {/* Heatmap Points */}
            <svg className="absolute inset-0 w-full h-full">
                <defs>
                    {points.map((point, i) => (
                        <radialGradient key={`gradient-${i}`} id={`heatGradient-${i}`}>
                            <stop offset="0%" stopColor={getColor(point.intensity)} stopOpacity="0.8" />
                            <stop offset="50%" stopColor={getColor(point.intensity)} stopOpacity="0.3" />
                            <stop offset="100%" stopColor={getColor(point.intensity)} stopOpacity="0" />
                        </radialGradient>
                    ))}
                </defs>

                {points.map((point, i) => {
                    // Convert lat/lng to screen position (simplified - assumes map centered on Ooty)
                    const centerLat = 11.41;
                    const centerLng = 76.69;
                    const scale = 5000; // Adjust based on zoom

                    const x = 50 + (point.lng - centerLng) * scale;
                    const y = 50 + (centerLat - point.lat) * scale;
                    const radius = 30 + point.intensity * 50;

                    return (
                        <g key={i}>
                            <circle
                                cx={`${x}%`}
                                cy={`${y}%`}
                                r={radius}
                                fill={`url(#heatGradient-${i})`}
                                className="animate-pulse"
                                style={{ animationDuration: `${2 + Math.random()}s` }}
                            />
                        </g>
                    );
                })}
            </svg>

            {/* Point Labels */}
            {points.map((point, i) => {
                const centerLat = 11.41;
                const centerLng = 76.69;
                const scale = 5000;

                const x = 50 + (point.lng - centerLng) * scale;
                const y = 50 + (centerLat - point.lat) * scale;

                return (
                    <div
                        key={`label-${i}`}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto cursor-pointer"
                        style={{ left: `${x}%`, top: `${y}%` }}
                        onClick={() => onPointClick?.(point.name)}
                    >
                        <div
                            className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-bold text-white shadow-lg transition-transform hover:scale-125"
                            style={{
                                backgroundColor: getColor(point.intensity),
                                boxShadow: getGlow(point.intensity)
                            }}
                        >
                            {Math.round(point.intensity * 100)}
                        </div>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-black/80 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity">
                            {point.name}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
