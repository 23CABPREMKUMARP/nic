import React from 'react';
import { SuggestionCard } from '@/services/redirect/RedirectAdvisor';
import { Navigation2, Car, CloudRain } from 'lucide-react';

interface ThumbnailUIProps {
    suggestion: SuggestionCard;
    onNavigate: (spotId: string) => void;
    onDismiss: () => void;
    onBook?: (spotId: string) => void;
}

export const ThumbnailUI: React.FC<ThumbnailUIProps> = ({ suggestion, onNavigate, onDismiss, onBook }) => {
    // Crowd score color logic
    const getScoreColor = (score: number) => {
        if (score < 40) return 'bg-emerald-500';
        if (score < 70) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    return (
        <div className="fixed bottom-24 left-4 right-4 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
            {/* Glassmorphism Card */}
            <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 overflow-hidden max-w-md mx-auto">
                <div className="relative h-32">
                    <img
                        src={suggestion.suggestedSpot.image}
                        alt={suggestion.suggestedSpot.name}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />

                    {/* Badge: Reason */}
                    <div className="absolute top-3 left-3 bg-red-500/90 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm flex items-center shadow-sm">
                        ⚠️ {suggestion.reason}
                    </div>

                    <div className="absolute bottom-3 left-3 text-white">
                        <h3 className="text-lg font-bold leading-none shadow-black drop-shadow-md">
                            {suggestion.suggestedSpot.name}
                        </h3>
                        <p className="text-xs text-gray-200 mt-1 flex items-center gap-1">
                            <span className="bg-emerald-500/80 px-1.5 rounded text-[10px]">Recommended</span>
                            {suggestion.distanceDiff} from here
                        </p>
                    </div>
                </div>

                <div className="p-4">
                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        {/* Live Crowd Meter */}
                        <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                            <div className="text-xs text-slate-500 mb-1">Live Crowd</div>
                            <div className="flex items-center gap-2">
                                <div className="h-2 flex-1 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${getScoreColor(suggestion.crowdScore)}`}
                                        style={{ width: `${suggestion.crowdScore}%` }}
                                    />
                                </div>
                                <span className="text-xs font-bold text-slate-700">{suggestion.crowdScore}%</span>
                            </div>
                        </div>

                        {/* Parking Availability */}
                        <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 flex items-center justify-between">
                            <div>
                                <div className="text-xs text-slate-500 mb-1">Parking</div>
                                <div className="text-sm font-bold text-slate-800">
                                    {suggestion.parkingAvailable} <span className="text-[10px] font-normal text-slate-400">Slots</span>
                                </div>
                            </div>
                            <Car size={18} className="text-emerald-500" />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2">
                        <button
                            onClick={() => onBook?.(suggestion.suggestedSpot.id)}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-blue-200 flex items-center justify-center gap-2 transition-all active:scale-95"
                        >
                            <Car size={16} />
                            Book Parking & Go
                        </button>

                        <div className="flex gap-2">
                            <button
                                onClick={onDismiss}
                                className="flex-1 py-3 text-slate-500 font-medium text-sm hover:bg-slate-50 rounded-xl transition-colors border border-slate-100"
                            >
                                Dismiss
                            </button>
                            <button
                                onClick={() => onNavigate(suggestion.suggestedSpot.id)}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 transition-all active:scale-95"
                            >
                                <Navigation2 size={16} />
                                Just Go
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
