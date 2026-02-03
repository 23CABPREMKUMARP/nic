'use client';

import Navbar from "@/components/Navbar";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BarChart, Users, Car, AlertTriangle, Bell, Settings, QrCode, PlusCircle, IndianRupee, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart as RechartsBar, Bar, XAxis, Tooltip } from 'recharts';
import { motion } from "framer-motion";

export default function AdminDashboard() {
    const [crowdThreshold, setCrowdThreshold] = useState(5000);
    const [stats, setStats] = useState<any>(null);
    const [lockdown, setLockdown] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchStats();
        fetchSettings();
    }, []);

    const fetchStats = () => {
        fetch('/api/admin/stats')
            .then(res => {
                if (!res.ok) throw new Error('API Error');
                return res.json();
            })
            .then(data => setStats(data))
            .catch(err => console.error("Stats fetch error:", err));
    };

    const fetchSettings = () => {
        fetch('/api/admin/settings')
            .then(res => {
                if (!res.ok) throw new Error('API Error');
                return res.json();
            })
            .then(data => {
                if (data.global_threshold) setCrowdThreshold(parseInt(data.global_threshold));
                if (data.lockdown === 'true') setLockdown(true);
            })
            .catch(err => console.error("Settings fetch error:", err));
    };

    const updateSetting = async (key: string, value: string | number) => {
        await fetch('/api/admin/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key, value })
        });
        fetchSettings(); // Refresh
    };

    const handleAction = async (type: string, details: string) => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ actionType: type, details })
            });
            if (res.ok) {
                alert(`${type} executed successfully.`);
                fetchStats(); // Update logs
            }
        } catch (e) {
            alert('Action failed');
        } finally {
            setLoading(false);
        }
    };

    const toggleLockdown = async () => {
        const newState = !lockdown;
        setLockdown(newState);
        await updateSetting('lockdown', newState ? 'true' : 'false');
        handleAction('EMERGENCY_LOCKDOWN', newState ? 'ENABLED' : 'DISABLED');
    };

    const handleThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value);
        setCrowdThreshold(val);
        updateSetting('global_threshold', val);
    };

    const data = [
        { name: 'Ooty Lake', value: stats?.activeNow ? 45 + stats.activeNow : 4000 },
        { name: 'Doddabetta', value: 3000 },
        { name: 'Coonoor', value: 2000 },
        { name: 'Pykara', value: 2780 },
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <>
            <Navbar />
            <motion.div
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="pt-24 px-6 pb-12 w-full max-w-7xl mx-auto"
            >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <motion.h1 layout className="text-3xl font-bold text-white flex items-center gap-3">
                        <Settings className="text-green-400" /> Admin Control Center
                    </motion.h1>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                            onClick={toggleLockdown}
                            variant={lockdown ? "primary" : "danger"}
                            className={`text-sm ${lockdown ? 'bg-green-600 hover:bg-green-500' : 'bg-red-600 hover:bg-red-500'}`}
                        >
                            {lockdown ? 'Resume Operations' : 'Emergency Lockdown'}
                        </Button>
                    </motion.div>
                </div>

                {lockdown && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="w-full bg-red-600/20 border border-red-500 p-4 mb-6 rounded-xl flex items-center gap-4 text-white"
                    >
                        <AlertTriangle className="text-red-500 fill-current animate-pulse" />
                        <div>
                            <h3 className="font-bold text-lg">SYSTEM LOCKDOWN ACTIVE</h3>
                            <p className="text-sm opacity-80">New pass issuance is suspended globally. Only active passes can exit.</p>
                        </div>
                    </motion.div>
                )}

                {/* Action Bar */}
                <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 mb-6">
                    <Link href="/scan" className="flex-1">
                        <Button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-6 px-8 rounded-xl shadow-lg border border-indigo-400/30 flex items-center justify-center gap-2 transition-transform hover:scale-[1.02]">
                            <QrCode size={24} /> Launch QC Scanner
                        </Button>
                    </Link>
                    <Link href="/apply" className="flex-1">
                        <Button className="w-full bg-white hover:bg-gray-100 text-gray-900 font-bold py-6 px-8 rounded-xl shadow-lg border border-white/30 flex items-center justify-center gap-2 transition-transform hover:scale-[1.02]">
                            <PlusCircle size={24} /> New Manual Entry
                        </Button>
                    </Link>
                </motion.div>

                {/* Stats Grid */}
                <motion.div variants={containerVariants} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
                    <StatCard icon={<Users className="text-blue-500" />} title="Today's Pass" value={stats?.todayVisitors || '0'} delay={0.1} />
                    <StatCard icon={<Car className="text-green-500" />} title="Parking Occupied" value={stats?.parkingOccupied || '0'} delay={0.2} />
                    <StatCard icon={<AlertTriangle className="text-yellow-500" />} title="Active Now" value={stats?.activeNow || '0'} delay={0.3} />
                    <StatCard icon={<IndianRupee className="text-purple-500" />} title="Total Revenue" value={`₹${stats?.totalRevenue || '0'}`} delay={0.4} />
                    <StatCard icon={<CheckCircle2 className="text-emerald-500" />} title="Total Issued" value={stats?.totalVisitors || '0'} delay={0.5} />
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Crowd Control Panel */}
                    <motion.div
                        variants={itemVariants}
                        className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-white/20"
                    >
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Crowd Density Control</h2>
                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between text-sm text-gray-500 mb-2">
                                    <span>Global Threshold limit</span>
                                    <span className="font-mono text-green-600 font-bold">{crowdThreshold} visitors</span>
                                </div>
                                <input
                                    type="range"
                                    min="1000"
                                    max="10000"
                                    step="100"
                                    value={crowdThreshold}
                                    onChange={handleThresholdChange}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                    <Button
                                        onClick={() => handleAction('REDIRECT_TRAFFIC', 'Route A to Route B diverts triggered')}
                                        variant="secondary"
                                        className="w-full justify-center border-none bg-blue-100 text-blue-700 hover:bg-blue-200 py-6"
                                    >
                                        Redirect Traffic
                                    </Button>
                                </motion.div>
                                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                    <Button
                                        onClick={() => handleAction('BROADCAST_SMS', 'Safety alert sent to all active visitors')}
                                        variant="secondary"
                                        className="w-full justify-center border-none bg-yellow-100 text-yellow-700 hover:bg-yellow-200 py-6"
                                    >
                                        Broadcast SMS
                                    </Button>
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Live Analytics */}
                    <motion.div
                        variants={itemVariants}
                        className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-white/20 min-h-[300px]"
                    >
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Live Location Density</h2>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <RechartsBar data={data}>
                                    <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb', color: '#111827' }}
                                        itemStyle={{ color: '#111827' }}
                                    />
                                    <Bar dataKey="value" fill="#4b5563" radius={[4, 4, 0, 0]} animationDuration={1500} />
                                </RechartsBar>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>
                </div>

                {/* Recent Logs (Real) */}
                <motion.div
                    variants={itemVariants}
                    className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl p-6 mt-8 border border-white/20"
                >
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity Logs</h2>
                    <div className="space-y-0">
                        {stats?.recentActivity?.map((pass: any, i: number) => (
                            <LogItem
                                key={pass.id}
                                time={new Date(pass.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                msg={`${pass.status} - ${pass.vehicleNo} (${pass.user?.name || 'User'})`}
                                type={pass.status === 'PENDING' ? 'warning' : 'info'}
                                delay={i * 0.05}
                            />
                        ))}
                        {!stats?.recentActivity?.length && <p className="text-gray-500 text-sm">No recent activity.</p>}
                    </div>
                </motion.div>
            </motion.div>
        </>
    );
}

function StatCard({ icon, title, value, delay }: { icon: any, title: string, value: string, delay: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl p-6 flex flex-col justify-between border border-white/20 h-full hover:shadow-2xl transition-shadow"
        >
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">{title}</h3>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
                </div>
                <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                    {icon}
                </div>
            </div>
        </motion.div>
    )
}

function LogItem({ time, msg, type = 'info', delay }: { time: string, msg: string, type?: 'info' | 'warning', delay: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay }}
            className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 -mx-2 px-2 rounded cursor-default"
        >
            <span className="text-xs font-mono text-gray-400 w-20 shrink-0">{time}</span>
            <span className={`text-sm ${type === 'warning' ? 'text-yellow-600 font-bold' : 'text-gray-700 font-medium'}`}>{msg}</span>
        </motion.div>
    )
}
