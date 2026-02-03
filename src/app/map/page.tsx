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
            <div className="relative w-full h-screen overflow-hidden bg-gray-100">
                {/* Map Background */}
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-90"
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
                        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white text-gray-900 text-xs px-2 py-1 rounded whitespace-nowrap font-bold shadow-lg border border-gray-200">
                            {loc.name}
                        </div>
                    </motion.div>
                ))}

                {/* Sidebar / Overlay */}
                <div className="absolute bottom-0 left-0 w-full md:w-96 md:h-full bg-white/95 backdrop-blur-xl border-t md:border-r border-white/20 p-6 flex flex-col pt-24 overflow-y-auto z-20 shadow-2xl">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Navigation className="text-green-600" /> Smart Navigation
                    </h2>

                    {selectedLoc ? (
                        <div className="space-y-6">
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 shadow-sm">
                                <h3 className="text-xl font-bold text-gray-900">{selectedLoc.name}</h3>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${selectedLoc.status === 'AVAILABLE' ? 'bg-green-100 text-green-700' :
                                        selectedLoc.status === 'CROWDED' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-red-100 text-red-700'
                                        }`}>
                                        {selectedLoc.status}
                                    </span>
                                    <span className="text-gray-600 text-sm">Traffic: {selectedLoc.traffic}</span>
                                </div>
                            </div>

                            {(selectedLoc.status === 'CROWDED' || selectedLoc.status === 'FULL') && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-yellow-600 text-sm font-semibold">
                                        <AlertTriangle size={16} /> High Crowd Alert
                                    </div>
                                    <p className="text-gray-600 text-sm">We recommend visiting these alternative spots to avoid delays:</p>

                                    {RECOMMENDATIONS.map((rec, i) => (
                                        <div key={i} className="bg-white hover:bg-gray-50 p-3 rounded-lg border border-gray-200 cursor-pointer transition-colors shadow-sm">
                                            <div className="flex justify-between items-start">
                                                <h4 className="text-green-700 font-medium">{rec.name}</h4>
                                                <span className="text-xs text-gray-400">{rec.dist}</span>
                                            </div>
                                            <div className="flex justify-between items-center mt-1">
                                                <span className="text-xs text-gray-500">{rec.reason}</span>
                                                <span className="text-xs text-gray-500">{rec.time}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <button
                                onClick={() => setSelectedLoc(null)}
                                className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium rounded-lg mt-4 transition-colors"
                            >
                                Back to Overview
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl shadow-sm">
                                <div className="flex gap-3">
                                    <Info className="text-blue-500 shrink-0" />
                                    <div>
                                        <h4 className="font-bold text-blue-800">Weather Update</h4>
                                        <p className="text-sm text-blue-700/80 mt-1">Mist expected in Ooty. Drive carefully.</p>
                                    </div>
                                </div>
                            </div>

                            <h3 className="text-gray-900 font-semibold mb-2">Live Status</h3>
                            {LOCATIONS.map(loc => (
                                <div
                                    key={loc.id}
                                    onClick={() => setSelectedLoc(loc)}
                                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer border border-transparent hover:border-gray-200 transition-all"
                                >
                                    <span className="text-gray-800 font-medium">{loc.name}</span>
                                    <div className={`w-3 h-3 rounded-full shadow-sm ${loc.status === 'AVAILABLE' ? 'bg-green-500' :
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
