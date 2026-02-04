import React, { useEffect, useState } from 'react';
import { ParkingValidator, ParkingAnalytics } from '@/services/validator/ParkingValidator';
import { Shield, Car, AlertOctagon, Clock, StopCircle, RefreshCw, X } from 'lucide-react';

export const AdminValidator: React.FC = () => {
    const [stats, setStats] = useState<ParkingAnalytics[]>([]);
    const [loading, setLoading] = useState(true);

    const loadStats = async () => {
        setLoading(true);
        try {
            const data = await ParkingValidator.getAllSpots();
            setStats(data);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStats();
        // Poll every 30s
        const interval = setInterval(loadStats, 30000);
        return () => clearInterval(interval);
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'CRITICAL': return 'bg-red-600 text-white animate-pulse';
            case 'FULL': return 'bg-red-100 text-red-700 border-red-200';
            case 'WARNING': return 'bg-orange-100 text-orange-700 border-orange-200';
            default: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden text-slate-900">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900">
                        <Shield className="text-blue-600" />
                        Validator Panel
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">Real-time Parking Intelligence & Validation</p>
                </div>
                <button
                    onClick={loadStats}
                    className="p-2 bg-white rounded-lg border border-slate-200 hover:bg-slate-100"
                >
                    <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                </button>
            </div>

            {/* Content Table */}
            <div className={`overflow-x-auto ${loading ? 'opacity-50' : ''}`}>
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs">
                        <tr>
                            <th className="p-4 border-b">Zone / Spot</th>
                            <th className="p-4 border-b text-center">Occupancy</th>
                            <th className="p-4 border-b text-center">Status</th>
                            <th className="p-4 border-b text-center">Vehicles</th>
                            <th className="p-4 border-b text-center">Wait Time</th>
                            <th className="p-4 border-b text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {stats.map((spot) => (
                            <tr key={spot.spotId} className="hover:bg-slate-50">
                                <td className="p-4">
                                    <div className="font-bold text-slate-800">{spot.spotId.toUpperCase()}</div>
                                    <div className="text-xs text-slate-400">Total Slots: {spot.totalSlots}</div>
                                </td>

                                <td className="p-4">
                                    <div className="w-full max-w-[120px] mx-auto">
                                        <div className="flex justify-between text-xs mb-1">
                                            <span>{spot.occupancyRate}% filled</span>
                                        </div>
                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${spot.occupancyRate > 90 ? 'bg-red-500' :
                                                    spot.occupancyRate > 80 ? 'bg-orange-500' : 'bg-emerald-500'
                                                    }`}
                                                style={{ width: `${spot.occupancyRate}%` }}
                                            />
                                        </div>
                                    </div>
                                </td>

                                <td className="p-4 text-center">
                                    <span className={`px-2 py-1 rounded-md text-xs font-bold border ${getStatusColor(spot.status)}`}>
                                        {spot.status}
                                    </span>
                                </td>

                                <td className="p-4 text-center">
                                    <div className="flex flex-col items-center">
                                        <div className="flex items-center gap-1 font-medium">
                                            <Car size={14} className="text-blue-500" /> {spot.activeVehicles}
                                        </div>
                                        <div className="text-xs text-slate-400 mt-1">
                                            {spot.bookedSlots} Booked
                                        </div>
                                    </div>
                                </td>

                                <td className="p-4 text-center">
                                    {spot.waitTimeMinutes > 0 ? (
                                        <div className="inline-flex items-center gap-1 text-orange-600 font-bold bg-orange-50 px-2 py-1 rounded">
                                            <Clock size={14} /> {spot.waitTimeMinutes}m
                                        </div>
                                    ) : (
                                        <span className="text-emerald-600 text-xs font-medium">No Wait</span>
                                    )}
                                </td>

                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                                            title="Force Close"
                                        >
                                            <StopCircle size={18} />
                                        </button>
                                        <button
                                            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                                            title="View Details"
                                        >
                                            <AlertOctagon size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Footer Summary */}
            <div className="bg-slate-50 p-4 text-xs text-slate-500 border-t border-slate-100 flex gap-4">
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Active System
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div> Connected to E-Pass DB
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-purple-500"></div> AI Cancellations Prediction ON
                </div>
            </div>
        </div>
    );
};
