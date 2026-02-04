
import React from 'react';
import { TreePine, Trophy, TrendingUp } from 'lucide-react';

interface EcoStatusBadgeProps {
    points: number;
    level: string;
    badge: string;
    compact?: boolean;
}

export const EcoStatusBadge: React.FC<EcoStatusBadgeProps> = ({ points, level, badge, compact = false }) => {
    if (compact) {
        return (
            <div className="flex items-center gap-2 bg-emerald-600/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 shadow-lg text-white">
                <span className="text-sm">{badge}</span>
                <span className="text-xs font-black uppercase tracking-tighter">{points} pts</span>
            </div>
        );
    }

    return (
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20 overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <TreePine size={80} />
            </div>

            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 shrink-0">
                    <Trophy size={24} />
                </div>
                <div>
                    <h3 className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em]">Eco Experience</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-2xl font-black text-gray-900">{level}</span>
                        <span className="text-lg">{badge}</span>
                    </div>
                </div>
            </div>

            <div className="mt-6 flex items-end justify-between">
                <div>
                    <p className="text-gray-400 text-xs font-bold">Current Progress</p>
                    <p className="text-3xl font-black text-emerald-600 mt-1">{points} <span className="text-sm text-gray-400">pts</span></p>
                </div>
                <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1 text-emerald-500 text-xs font-bold mb-1">
                        <TrendingUp size={12} />
                        <span>Top 10%</span>
                    </div>
                    <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${Math.min(100, (points / 120) * 100)}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
