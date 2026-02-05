'use client';

/**
 * Hourly Chart Component
 * Bar chart showing crowd predictions over time
 */

import { useState } from 'react';

interface HourlyPrediction {
    hour: string;
    predictedScore: number;
    confidence: number;
    level: 'LOW' | 'MEDIUM' | 'HIGH';
}

interface HourlyChartProps {
    predictions: HourlyPrediction[];
    title?: string;
    showConfidence?: boolean;
}

export default function HourlyChart({
    predictions,
    title = "Hourly Predictions",
    showConfidence = false
}: HourlyChartProps) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    const getBarColor = (level: string) => {
        switch (level) {
            case 'LOW': return 'bg-green-500';
            case 'MEDIUM': return 'bg-amber-500';
            case 'HIGH': return 'bg-red-500';
            default: return 'bg-gray-400';
        }
    };

    const maxScore = Math.max(...predictions.map(p => p.predictedScore), 100);

    return (
        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-4">
            <h3 className="text-sm font-bold text-white/70 mb-4">{title}</h3>

            <div className="relative h-48">
                {/* Y-axis labels */}
                <div className="absolute left-0 top-0 bottom-6 w-8 flex flex-col justify-between text-xs text-white/40">
                    <span>100</span>
                    <span>50</span>
                    <span>0</span>
                </div>

                {/* Chart area */}
                <div className="ml-10 h-full flex items-end gap-1 overflow-x-auto pb-6">
                    {predictions.map((pred, index) => (
                        <div
                            key={index}
                            className="flex-1 min-w-[20px] flex flex-col items-center relative"
                            onMouseEnter={() => setHoveredIndex(index)}
                            onMouseLeave={() => setHoveredIndex(null)}
                        >
                            {/* Bar */}
                            <div
                                className={`w-full rounded-t transition-all duration-300 ${getBarColor(pred.level)} ${hoveredIndex === index ? 'opacity-100 scale-105' : 'opacity-80'
                                    }`}
                                style={{
                                    height: `${(pred.predictedScore / maxScore) * 100}%`,
                                    minHeight: '4px'
                                }}
                            />

                            {/* X-axis label */}
                            <span className="text-[10px] text-white/40 mt-1 absolute -bottom-5">
                                {pred.hour.split(':')[0]}
                            </span>

                            {/* Tooltip */}
                            {hoveredIndex === index && (
                                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-black/90 text-white text-xs rounded-lg p-2 whitespace-nowrap z-10 shadow-xl">
                                    <p className="font-bold">{pred.hour}</p>
                                    <p>Score: {pred.predictedScore}%</p>
                                    <p className={`${getBarColor(pred.level).replace('bg-', 'text-')}`}>
                                        {pred.level}
                                    </p>
                                    {showConfidence && (
                                        <p className="text-white/50">
                                            Confidence: {pred.confidence}%
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Threshold lines */}
                <div className="absolute left-10 right-0 top-0 bottom-6 pointer-events-none">
                    <div
                        className="absolute w-full border-t border-red-500/30 border-dashed"
                        style={{ top: `${100 - 80}%` }}
                    >
                        <span className="absolute right-0 -top-2 text-[10px] text-red-400">High</span>
                    </div>
                    <div
                        className="absolute w-full border-t border-amber-500/30 border-dashed"
                        style={{ top: `${100 - 60}%` }}
                    >
                        <span className="absolute right-0 -top-2 text-[10px] text-amber-400">Medium</span>
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 mt-4 text-xs text-white/50">
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-green-500" />
                    <span>Low (0-60)</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-amber-500" />
                    <span>Medium (61-80)</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-red-500" />
                    <span>High (81+)</span>
                </div>
            </div>
        </div>
    );
}
