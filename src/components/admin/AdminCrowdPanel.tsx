import React, { useEffect, useState } from 'react';
import { TrafficEngine, SpotCongestion } from '@/services/traffic/trafficEngine';
import { Shield, AlertTriangle, Users, MinusCircle, RefreshCw } from 'lucide-react';

export const AdminCrowdPanel: React.FC = () => {
    const [spots, setSpots] = useState<SpotCongestion[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Start monitoring
        TrafficEngine.startMonitoring();

        // Subscribe to updates
        const unsubscribe = TrafficEngine.subscribe((data) => {
            setSpots(data);
            setLoading(false);
        });

        // Initial fetch
        TrafficEngine.getAllCongestion().then(data => {
            setSpots(data);
            setLoading(false);
        });

        return () => {
            unsubscribe();
            TrafficEngine.stopMonitoring();
        };
    }, []);

    const getStatusColor = (score: number) => {
        if (score < 40) return 'text-emerald-600 bg-emerald-100 border-emerald-200';
        if (score < 70) return 'text-yellow-600 bg-yellow-100 border-yellow-200';
        return 'text-red-600 bg-red-100 border-red-200';
    };

    return (
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden max-w-4xl mx-auto my-8">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
                        <Shield className="text-indigo-600" />
                        Crowd Control Center
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">Real-time crowd intelligence & safety controls</p>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-2">
                        <RefreshCw size={14} /> Refresh
                    </button>
                    <button className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold shadow-red-200 shadow-lg hover:bg-red-700 flex items-center gap-2">
                        <AlertTriangle size={16} /> Emergency Mode
                    </button>
                </div>
            </div>

            <div className="p-0">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                        <tr>
                            <th className="p-4 border-b">Zone Name</th>
                            <th className="p-4 border-b">Crowd Score</th>
                            <th className="p-4 border-b">Status</th>
                            <th className="p-4 border-b">Parking %</th>
                            <th className="p-4 border-b text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {spots.map((spot) => (
                            <tr key={spot.spotId} className="hover:bg-slate-50 transition-colors">
                                <td className="p-4 font-medium text-slate-800">
                                    {spot.name}
                                    <div className="text-xs text-slate-400 font-normal mt-0.5">ID: {spot.spotId}</div>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${spot.score > 70 ? 'bg-red-500' : spot.score > 40 ? 'bg-yellow-500' : 'bg-emerald-500'
                                                    }`}
                                                style={{ width: `${spot.score}%` }}
                                            />
                                        </div>
                                        <span className="font-bold text-slate-700">{spot.score}</span>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(spot.score)}`}>
                                        {spot.level}
                                    </span>
                                </td>
                                <td className="p-4 text-slate-600 flex items-center gap-2">
                                    <Users size={14} className="text-slate-400" />
                                    {spot.factors.parkingScore}%
                                </td>
                                <td className="p-4 text-right">
                                    <button
                                        className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors inline-flex items-center gap-1"
                                        title="Mark as Temporarily Closed"
                                    >
                                        <MinusCircle size={12} /> Force Close
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {loading && (
                    <div className="p-8 text-center text-slate-400">Loading live data...</div>
                )}
            </div>
        </div>
    );
};
