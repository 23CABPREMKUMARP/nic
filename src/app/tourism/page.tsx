'use client';

import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react";
import { getSmartRecommendations, getPredictionForNext3Hours, LiveSpotData } from "@/services/tourismService";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Users, Car, CloudRain, Star, ArrowRight, Video, Navigation, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
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
        <>
            <Navbar />
            <div className="min-h-screen pt-24 pb-12 px-6 bg-[#f8fafc]">
                <div className="max-w-7xl mx-auto space-y-8">

                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-end border-b border-gray-200 pb-6 gap-4">
                        <div>
                            <h1 className="text-4xl font-bold text-gray-900">Smart Ooty Guide</h1>
                            <p className="text-gray-500 mt-2">AI-driven recommendations based on live crowd, weather & traffic.</p>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant={filter === 'ALL' ? 'primary' : 'outline'}
                                onClick={() => setFilter('ALL')}
                                className={filter === 'ALL' ? 'bg-green-600' : ''}
                            >
                                All Spots
                            </Button>
                            <Button
                                variant={filter === 'OUTDOOR' ? 'primary' : 'outline'}
                                onClick={() => setFilter('OUTDOOR')}
                                className={filter === 'OUTDOOR' ? 'bg-green-600' : ''}
                            >
                                Outdoor
                            </Button>
                            <Button
                                variant={filter === 'INDOOR' ? 'primary' : 'outline'}
                                onClick={() => setFilter('INDOOR')}
                                className={filter === 'INDOOR' ? 'bg-green-600' : ''}
                            >
                                Indoor
                            </Button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div></div>
                    ) : (
                        <>
                            {/* Top Recommendation & Predictions */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Hero Card: Top Pick */}
                                {topPick && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="lg:col-span-2 relative h-[400px] rounded-3xl overflow-hidden group shadow-2xl"
                                    >
                                        <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" style={{ backgroundImage: `url(${topPick.image})` }} />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                                        <div className="absolute top-6 left-6 flex gap-2">
                                            <span className="bg-yellow-400 text-black font-bold px-3 py-1 rounded-full text-xs flex items-center gap-1 shadow-lg">
                                                <Star size={12} fill="currentColor" /> Top Recommendation
                                            </span>
                                            <span className="bg-white/20 backdrop-blur-md text-white font-bold px-3 py-1 rounded-full text-xs shadow-lg border border-white/20">
                                                Visit Score: {Math.round(topPick.visitScore)}/100
                                            </span>
                                        </div>

                                        <div className="absolute bottom-6 left-6 right-6">
                                            <h2 className="text-4xl font-bold text-white mb-2">{topPick.name}</h2>
                                            <p className="text-white/80 line-clamp-2 max-w-xl mb-6">{topPick.description}</p>

                                            <div className="flex flex-wrap gap-4 text-white/90 text-sm font-medium">
                                                <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 backdrop-blur-sm">
                                                    <Users size={16} className={topPick.crowdLevel === 'EXTREME' ? 'text-red-400' : 'text-green-400'} />
                                                    {topPick.crowdLevel} Crowd
                                                </div>
                                                <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 backdrop-blur-sm">
                                                    <Car size={16} className={topPick.parkingAvailable ? 'text-green-400' : 'text-red-400'} />
                                                    {topPick.parkingAvailable ? `${topPick.parkingSlots} Slots` : 'Full'}
                                                </div>
                                                <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 backdrop-blur-sm">
                                                    <Clock size={16} className="text-blue-400" />
                                                    {topPick.openTime} - {topPick.closeTime}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Right Side: Virtual Tour & Prediction */}
                                <div className="space-y-6 flex flex-col">
                                    {/* Virtual Tour Promo */}
                                    <motion.div
                                        whileHover={{ y: -5 }}
                                        className="bg-indigo-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl flex-1 flex flex-col justify-center"
                                    >
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full blur-3xl opacity-20 -mr-16 -mt-16"></div>
                                        <Video className="w-12 h-12 mb-4 text-indigo-300" />
                                        <h3 className="text-2xl font-bold mb-2">Virtual Tour</h3>
                                        <p className="text-indigo-200 mb-6 text-sm">Experience the Nilgiris from home. Immersive 3D views of Ooty's best spots.</p>
                                        <Link href="/virtual-tour">
                                            <Button className="w-full bg-white text-indigo-900 hover:bg-indigo-50 font-bold group">
                                                Start Tour <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                                            </Button>
                                        </Link>
                                    </motion.div>

                                    {/* Crowd Predictor */}
                                    <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
                                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                            <Users size={18} className="text-purple-500" /> Crowd Prediction
                                        </h3>
                                        <div className="space-y-4">
                                            {predictions.map((p, i) => (
                                                <div key={i} className="flex items-center gap-4">
                                                    <span className="text-sm font-mono text-gray-500">{p.time}</span>
                                                    <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full ${p.crowdTrend === 'HIGH' ? 'bg-red-500' : p.crowdTrend === 'MODERATE' ? 'bg-yellow-500' : 'bg-green-500'}`}
                                                            style={{ width: p.crowdTrend === 'HIGH' ? '80%' : p.crowdTrend === 'MODERATE' ? '50%' : '20%' }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-xs font-bold text-gray-700">{p.crowdTrend}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Explore Spots Grid */}
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <Navigation className="text-green-600" /> Explore Recommendations
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <AnimatePresence>
                                        {filteredPlaces.map((place, index) => (
                                            <DashboardCardAnimator key={place.id} delay={index * 0.1}>
                                                <div className="bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100 hover:shadow-xl transition-all group h-full flex flex-col">
                                                    <div className="h-48 bg-cover bg-center relative" style={{ backgroundImage: `url(${place.image})` }}>
                                                        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-xs font-bold shadow-sm">
                                                            {place.visitScore}/100 Score
                                                        </div>
                                                        {place.type === 'INDOOR' && (
                                                            <div className="absolute top-3 left-3 bg-blue-100 text-blue-700 px-2 py-1 rounded-lg text-xs font-bold shadow-sm border border-blue-200">
                                                                Indoor
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="p-5 flex-1 flex flex-col">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <h3 className="font-bold text-lg text-gray-900 group-hover:text-green-700 transition-colors">{place.name}</h3>
                                                        </div>
                                                        <p className="text-sm text-gray-500 mb-4 line-clamp-2">{place.description}</p>

                                                        <div className="grid grid-cols-2 gap-2 mb-4 text-xs font-medium text-gray-600">
                                                            <div className="flex items-center gap-1.5 bg-gray-50 p-1.5 rounded">
                                                                <Users size={14} /> {place.crowdLevel}
                                                            </div>
                                                            <div className="flex items-center gap-1.5 bg-gray-50 p-1.5 rounded">
                                                                <Car size={14} /> {place.parkingAvailable ? 'Parking OK' : 'No Parking'}
                                                            </div>
                                                        </div>

                                                        <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                                                            <span className="text-green-600 text-xs font-bold uppercase tracking-wider">{place.recommendationReason}</span>
                                                            <Link href={place.virtualTourUrl || '#'}>
                                                                <Button variant="ghost" className="h-8 text-xs hover:bg-green-50 hover:text-green-700">Details</Button>
                                                            </Link>
                                                        </div>
                                                    </div>
                                                </div>
                                            </DashboardCardAnimator>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}
