'use client';

import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react";
import { getSmartRecommendations, getPredictionForNext3Hours, LiveSpotData } from "@/services/tourismService";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Users, Car, CloudRain, Star, ArrowRight, Video, Navigation, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import LiveMap from "@/components/map/LiveMap";
import { DashboardCardAnimator } from "@/components/DashboardAnimator";

export default function TourismPage() {
    const [places, setPlaces] = useState<LiveSpotData[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'ALL' | 'INDOOR' | 'OUTDOOR'>('ALL');

    useEffect(() => {
        getSmartRecommendations().then(data => {
            setPlaces(data);
            setLoading(false);
        });
    }, []);

    const predictions = getPredictionForNext3Hours();
    const topPick = places.length > 0 ? places[0] : null;
    const filteredPlaces = places.filter(p => filter === 'ALL' || p.type === filter);

    return (
        <div className="bg-[#f8fafc] min-h-screen">
            <Navbar />

            <main className="container mx-auto px-4 py-24 space-y-12">
                {/* Header Section */}
                <div className="max-w-4xl">
                    <h1 className="text-5xl font-black text-gray-900 tracking-tight mb-4">
                        Smart Ooty <span className="text-green-600">Guide</span>
                    </h1>
                    <p className="text-xl text-gray-500 leading-relaxed font-medium">
                        Real-time AI insights for your Nilgiris exploration. We monitor crowds, weather, and parking so you don't have to.
                    </p>
                </div>

                {/* Map Section */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <MapPin className="w-6 h-6 text-green-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">Live Exploration Map</h2>
                        </div>
                        <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Live Traffic Enabled</Badge>
                    </div>
                    <LiveMap />
                </section>

                {/* Recommendations Header & Filters */}
                <section className="space-y-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-gray-200 pb-8">
                        <div>
                            <h2 className="text-3xl font-black text-gray-900">AI-Curated Picks</h2>
                            <p className="text-gray-500 mt-2">Ranked by current conditions & visit potential.</p>
                        </div>
                        <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-gray-100">
                            {(['ALL', 'OUTDOOR', 'INDOOR'] as const).map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${filter === f
                                        ? 'bg-green-600 text-white shadow-lg shadow-green-200'
                                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                        }`}
                                >
                                    {f === 'ALL' ? 'All Spots' : f.charAt(0) + f.slice(1).toLowerCase()}
                                </button>
                            ))}
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24 space-y-4">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-100 border-b-green-600"></div>
                            <p className="text-gray-400 font-medium">Analyzing current Nilgiris conditions...</p>
                        </div>
                    ) : (
                        <div className="space-y-12">
                            {/* Hero Card & Stats Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Top Pick Hero */}
                                {topPick && filter === 'ALL' && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="lg:col-span-2 relative h-[500px] rounded-[40px] overflow-hidden group shadow-2xl"
                                    >
                                        <div className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-110" style={{ backgroundImage: `url(${topPick.image})` }} />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                                        <div className="absolute top-8 left-8 flex gap-3">
                                            <div className="bg-yellow-400 text-black font-black px-4 py-1.5 rounded-full text-[10px] uppercase tracking-wider flex items-center gap-1.5 shadow-xl">
                                                <Star size={14} fill="currentColor" /> Best Match Now
                                            </div>
                                            <div className="bg-white/10 backdrop-blur-xl text-white font-bold px-4 py-1.5 rounded-full text-[10px] uppercase tracking-wider border border-white/20">
                                                Visit Score: {Math.round(topPick.visitScore)}
                                            </div>
                                        </div>

                                        <div className="absolute bottom-10 left-10 right-10">
                                            <h2 className="text-5xl font-black text-white mb-4 leading-tight">{topPick.name}</h2>
                                            <p className="text-white/80 text-lg line-clamp-2 max-w-2xl mb-8 leading-relaxed font-medium">
                                                {topPick.description}
                                            </p>

                                            <div className="flex flex-wrap gap-4">
                                                <Metric icon={<Users size={18} />} label="Crowd" value={topPick.crowdLevel} color={topPick.crowdLevel === 'OVERFLOW' ? 'text-rose-400' : topPick.crowdLevel === 'MEDIUM' ? 'text-amber-400' : 'text-emerald-400'} />
                                                <Metric icon={<Car size={18} />} label="Parking" value={topPick.parkingAvailable ? 'Available' : 'Full'} color={topPick.parkingAvailable ? 'text-emerald-400' : 'text-rose-400'} />
                                                <Metric icon={<Clock size={18} />} label="Hours" value={`${topPick.openTime} - ${topPick.closeTime}`} color="text-blue-300" />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Side Content: Virtual & Prediction */}
                                <div className="space-y-8 flex flex-col h-full">
                                    {/* Virtual Tour Promo */}
                                    <div className="bg-indigo-950 rounded-[40px] p-8 text-white relative overflow-hidden shadow-2xl flex-1 flex flex-col justify-center border border-indigo-900">
                                        <div className="absolute -top-20 -right-20 w-80 h-80 bg-indigo-500 rounded-full blur-[100px] opacity-20"></div>
                                        <div className="relative z-10">
                                            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-6 backdrop-blur">
                                                <Video className="w-8 h-8 text-indigo-300" />
                                            </div>
                                            <h3 className="text-3xl font-black mb-4 tracking-tight">Virtual Experience</h3>
                                            <p className="text-indigo-200/80 mb-8 text-lg font-medium leading-relaxed">
                                                Preview Ooty's hotspots in stunning 360° before you arrive.
                                            </p>
                                            <Link href="/virtual-tour">
                                                <Button className="w-full bg-white text-indigo-950 hover:bg-indigo-50 font-black rounded-2xl h-14">
                                                    Start VR Tour <ArrowRight size={20} className="ml-2" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>

                                    {/* Crowd Predictor */}
                                    <div className="bg-white rounded-[40px] p-8 shadow-xl border border-gray-100/50">
                                        <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-3">
                                            <Clock className="text-purple-500 w-6 h-6" /> Hourly Forecast
                                        </h3>
                                        <div className="space-y-6">
                                            {predictions.map((p, i) => (
                                                <div key={i} className="flex items-center gap-4 group">
                                                    <span className="text-sm font-black text-gray-400 w-12">{p.time}</span>
                                                    <div className="flex-1 h-3 bg-gray-50 rounded-full overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: p.crowdTrend === 'OVERFLOW' ? '95%' : p.crowdTrend === 'MEDIUM' ? '60%' : '30%' }}
                                                            className={`h-full rounded-full ${p.crowdTrend === 'OVERFLOW' ? 'bg-rose-500' : p.crowdTrend === 'MEDIUM' ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                                        />
                                                    </div>
                                                    <span className="text-[10px] font-black text-gray-600 uppercase w-16 text-right whitespace-nowrap">{p.crowdTrend}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Explore Spots Grid */}
                            <div className="space-y-8">
                                <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                                    <Navigation className="text-green-600 w-6 h-6" />
                                    {filter === 'ALL' ? 'More Recommendations' : `${filter.charAt(0) + filter.slice(1).toLowerCase()} Spots`}
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    <AnimatePresence>
                                        {filteredPlaces.slice(filter === 'ALL' ? 1 : 0).map((place, index) => (
                                            <DashboardCardAnimator key={place.id} delay={index * 0.05}>
                                                <div className="bg-white rounded-[32px] overflow-hidden shadow-lg border border-gray-100 hover:shadow-2xl transition-all duration-300 group h-full flex flex-col">
                                                    <div className="h-56 bg-cover bg-center relative" style={{ backgroundImage: `url(${place.image})` }}>
                                                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                                                        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur px-3 py-1 rounded-xl text-xs font-black shadow-lg">
                                                            {Math.round(place.visitScore)} SCORE
                                                        </div>
                                                        <div className="absolute bottom-4 left-4 flex gap-2">
                                                            <div className="bg-white/90 backdrop-blur px-3 py-1 rounded-lg text-[10px] font-black uppercase text-gray-600">
                                                                {place.type}
                                                            </div>
                                                            <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${place.crowdLevel === 'SAFE' ? 'bg-emerald-500 text-white' : place.crowdLevel === 'OVERFLOW' ? 'bg-rose-500 text-white' : 'bg-amber-100 text-amber-700 font-bold'
                                                                }`}>
                                                                {place.crowdLevel} Crowd
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="p-6 flex-1 flex flex-col">
                                                        <h3 className="font-bold text-xl text-gray-900 mb-2 group-hover:text-green-600 transition-colors">{place.name}</h3>
                                                        <p className="text-gray-500 text-sm mb-6 line-clamp-2 leading-relaxed font-medium">
                                                            {place.description}
                                                        </p>

                                                        <div className="mt-auto flex items-center justify-between gap-4">
                                                            <Link href={`/parking?preselect=${encodeURIComponent(place.name)}`} className="flex-1">
                                                                <Button className="w-full bg-gray-900 hover:bg-black text-white font-bold h-11 rounded-xl shadow-md">
                                                                    Book Parking
                                                                </Button>
                                                            </Link>
                                                            <Link href={place.virtualTourUrl || '#'}>
                                                                <button className="p-3 bg-gray-50 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-colors">
                                                                    <Video size={18} />
                                                                </button>
                                                            </Link>
                                                        </div>
                                                    </div>
                                                </div>
                                            </DashboardCardAnimator>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}

function Metric({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string, color: string }) {
    return (
        <div className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-2xl border border-white/10 backdrop-blur-md">
            <div className={color}>{icon}</div>
            <div className="flex flex-col">
                <span className="text-[10px] text-white/50 font-bold uppercase tracking-wider">{label}</span>
                <span className={`text-sm font-black ${color}`}>{value}</span>
            </div>
        </div>
    );
}
