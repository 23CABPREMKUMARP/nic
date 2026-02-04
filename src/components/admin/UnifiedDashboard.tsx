
import React, { useEffect, useState } from 'react';
import { UnifiedSlotData } from '@/services/admin/ParkingSync';
import { BarChart, Activity, Users, Car, AlertTriangle } from 'lucide-react';

export const UnifiedDashboard: React.FC = () => {
    const [data, setData] = useState<UnifiedSlotData[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ online: 0, offline: 0, revenue: 0 });

    const fetchData = async () => {
        try {
            // Fetch unified slot data
            const slotRes = await fetch('/api/admin/fetch-slots');
            const slotData = await slotRes.json();
            setData(slotData);

            // Fetch offline stats
            const statRes = await fetch('/api/admin/offline-ticket?mode=stats');
            const statData = await statRes.json();
            setStats({
                online: slotData.reduce((acc: number, curr: any) => acc + curr.onlineBooked, 0),
                offline: statData.totalToday || 0,
                revenue: statData.revenue || 0
            });
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, []);

    if (loading) return <div className="p-8 text-center text-slate-400">Loading Dashboard...</div>;

    return (
        <div className="space-y-6">
            {/* Top Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                            <Activity size={20} />
                        </div>
                        <span className="text-sm font-medium text-slate-500">Online Bookings</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-800">{stats.online}</div>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                            <Users size={20} />
                        </div>
                        <span className="text-sm font-medium text-slate-500">Offline Entries</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-800">{stats.offline}</div>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                            <span className="font-bold text-lg">₹</span>
                        </div>
                        <span className="text-sm font-medium text-slate-500">Est. Revenue</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-800">₹{stats.revenue}</div>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                            <Car size={20} />
                        </div>
                        <span className="text-sm font-medium text-slate-500">Occupancy Rate</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-800">
                        {Math.round(((stats.online + stats.offline) / 2000) * 100)}%
                        {/* 2000 is mock total capacity */}
                    </div>
                </div>
            </div>

            {/* Unified Slot Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <h3 className="font-semibold text-slate-700">Real-time Slot Availability</h3>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Live Sync Active</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 font-medium">
                            <tr>
                                <th className="p-4">Location</th>
                                <th className="p-4">Capacity</th>
                                <th className="p-4 text-center">Online</th>
                                <th className="p-4 text-center">Offline</th>
                                <th className="p-4 text-right">Available</th>
                                <th className="p-4 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {data.map((spot) => (
                                <tr key={spot.spotId} className="hover:bg-slate-50">
                                    <td className="p-4 font-medium text-slate-800">{spot.spotName}</td>
                                    <td className="p-4 text-slate-600">{spot.totalSlots}</td>
                                    <td className="p-4 text-center text-blue-600 font-medium">{spot.onlineBooked}</td>
                                    <td className="p-4 text-center text-purple-600 font-medium">{spot.offlineOccupied}</td>
                                    <td className="p-4 text-right font-bold text-emerald-600">{spot.availableSlots}</td>
                                    <td className="p-4 text-center">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${spot.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-700' :
                                                spot.status === 'WARNING' ? 'bg-amber-100 text-amber-700' :
                                                    'bg-red-100 text-red-700'
                                            }`}>
                                            {spot.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
