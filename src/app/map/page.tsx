'use client';

import Navbar from "@/components/Navbar";
import { useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, MapPin, Navigation, Info } from "lucide-react";

const LOCATIONS = [
    { id: 1, name: "Ooty Lake", status: "CROWDED", x: 30, y: 40, traffic: 'High' },
    { id: 2, name: "Doddabetta Peak", status: "FULL", x: 60, y: 20, traffic: 'Jam' },
    { id: 3, name: "Coonoor Sims Park", status: "AVAILABLE", x: 70, y: 70, traffic: 'Low' },
    { id: 4, name: "Avalanche", status: "AVAILABLE", x: 20, y: 80, traffic: 'Moderate' },
];

const RECOMMENDATIONS = [
    { name: "Emerald Lake", dist: "15 km", time: "30 mins", reason: "Serene & Empty" },
    { name: "Pykara Falls", dist: "22 km", time: "45 mins", reason: "Good weather now" },
    { name: "Tea Park", dist: "8 km", time: "15 mins", reason: "Nearby Alternative" },
];

export default function SmartMapPage() {
    const [selectedLoc, setSelectedLoc] = useState<any>(null);

    return (
        <>
            <Navbar />
            <div className="relative w-full h-screen overflow-hidden bg-black">
                {/* Map Background */}
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-80"
                    style={{ backgroundImage: "url('/map-bg.png')" }}
                ></div>

                {/* Interactive Points */}
                {LOCATIONS.map(loc => (
                    <motion.div
                        key={loc.id}
                        className="absolute cursor-pointer"
                        style={{ top: `${loc.y}%`, left: `${loc.x}%` }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        whileHover={{ scale: 1.2 }}
                        onClick={() => setSelectedLoc(loc)}
                    >
                        <div className={`relative flex items-center justify-center w-8 h-8 rounded-full border-2 ${loc.status === 'AVAILABLE' ? 'bg-green-500 border-green-300 shadow-[0_0_15px_rgba(34,197,94,0.8)]' :
                                loc.status === 'CROWDED' ? 'bg-yellow-500 border-yellow-300 shadow-[0_0_15px_rgba(234,179,8,0.8)]' :
                                    'bg-red-500 border-red-300 shadow-[0_0_15px_rgba(239,68,68,0.8)]'
                            }`}>
                            <MapPin size={16} className="text-white" />
                        </div>
                        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                            {loc.name}
                        </div>
                    </motion.div>
                ))}

                {/* Sidebar / Overlay */}
                <div className="absolute bottom-0 left-0 w-full md:w-96 md:h-full bg-glass backdrop-blur-xl border-t md:border-r border-white/10 p-6 flex flex-col pt-24 overflow-y-auto z-20 bg-[#0f1d16]/90">
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                        <Navigation className="text-green-400" /> Smart Navigation
                    </h2>

                    {selectedLoc ? (
                        <div className="space-y-6">
                            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                                <h3 className="text-xl font-bold text-white">{selectedLoc.name}</h3>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${selectedLoc.status === 'AVAILABLE' ? 'bg-green-500/20 text-green-300' :
                                            selectedLoc.status === 'CROWDED' ? 'bg-yellow-500/20 text-yellow-300' :
                                                'bg-red-500/20 text-red-300'
                                        }`}>
                                        {selectedLoc.status}
                                    </span>
                                    <span className="text-white/60 text-sm">Traffic: {selectedLoc.traffic}</span>
                                </div>
                            </div>

                            {(selectedLoc.status === 'CROWDED' || selectedLoc.status === 'FULL') && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-yellow-400 text-sm font-semibold">
                                        <AlertTriangle size={16} /> High Crowd Alert
                                    </div>
                                    <p className="text-white/60 text-sm">We recommend visiting these alternative spots to avoid delays:</p>

                                    {RECOMMENDATIONS.map((rec, i) => (
                                        <div key={i} className="bg-white/5 hover:bg-white/10 p-3 rounded-lg border border-white/5 cursor-pointer transition-colors">
                                            <div className="flex justify-between items-start">
                                                <h4 className="text-green-300 font-medium">{rec.name}</h4>
                                                <span className="text-xs text-white/40">{rec.dist}</span>
                                            </div>
                                            <div className="flex justify-between items-center mt-1">
                                                <span className="text-xs text-white/50">{rec.reason}</span>
                                                <span className="text-xs text-white/50">{rec.time}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <button
                                onClick={() => setSelectedLoc(null)}
                                className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg mt-4"
                            >
                                Back to Overview
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl">
                                <div className="flex gap-3">
                                    <Info className="text-blue-400 shrink-0" />
                                    <div>
                                        <h4 className="font-bold text-blue-200">Weather Update</h4>
                                        <p className="text-sm text-blue-200/60 mt-1">Mist expected in Ooty. Drive carefully.</p>
                                    </div>
                                </div>
                            </div>

                            <h3 className="text-white/80 font-semibold mb-2">Live Status</h3>
                            {LOCATIONS.map(loc => (
                                <div
                                    key={loc.id}
                                    onClick={() => setSelectedLoc(loc)}
                                    className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 cursor-pointer"
                                >
                                    <span className="text-white">{loc.name}</span>
                                    <div className={`w-2 h-2 rounded-full ${loc.status === 'AVAILABLE' ? 'bg-green-500' :
                                            loc.status === 'CROWDED' ? 'bg-yellow-500' : 'bg-red-500'
                                        }`} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
