'use client';

import Navbar from "@/components/Navbar";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Info, MapPin, Volume2, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { LiveSpotData } from "@/services/tourismService";

// Mock Data reusing the structure but specifically for the tour logic
const SCENES = [
    {
        id: 'ooty-lake',
        name: 'Ooty Lake',
        image: 'https://images.unsplash.com/photo-1559827291-72ee739d0d9a?auto=format&fit=crop&q=80&w=1920',
        audio: 'Welcome to Ooty Lake. This artificial lake was constructed in 1824.',
        hotspots: [{ x: 30, y: 40, label: 'Boat House' }, { x: 70, y: 60, label: 'Deer Park' }]
    },
    {
        id: 'doddabetta',
        name: 'Doddabetta Peak',
        image: 'https://images.unsplash.com/photo-1628163539524-ec4081c738c6?auto=format&fit=crop&q=80&w=1920',
        audio: 'Standing at 2,637 meters, this is the highest point in the Nilgiris.',
        hotspots: [{ x: 50, y: 30, label: 'Telescope House' }, { x: 20, y: 50, label: 'View Point' }]
    },
    {
        id: 'botanical',
        name: 'Botanical Garden',
        image: 'https://images.unsplash.com/photo-1585827552668-d0728b355e3d?auto=format&fit=crop&q=80&w=1920',
        audio: 'Established in 1848, these gardens sprawl over 55 hectares.',
        hotspots: [{ x: 40, y: 70, label: 'Glass House' }, { x: 80, y: 40, label: 'Fossil Tree' }]
    }
];

export default function VirtualTourPage() {
    const [currentScene, setCurrentScene] = useState(SCENES[0]);
    const [showInfo, setShowInfo] = useState(false);

    return (
        <div className="h-screen w-full bg-black overflow-hidden relative">

            {/* Immersive Background */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentScene.id}
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1 }}
                    className="absolute inset-0 z-0"
                >
                    <div
                        className="w-full h-full bg-cover bg-center"
                        style={{ backgroundImage: `url(${currentScene.image})` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />
                </motion.div>
            </AnimatePresence>

            {/* UI Overlay */}
            <div className="absolute inset-0 z-10 flex flex-col justify-between p-6">

                {/* Top Bar */}
                <div className="flex justify-between items-start">
                    <Link href="/tourism">
                        <Button variant="glass" className="text-white hover:bg-white/20 transition-colors backdrop-blur-md border-white/20">
                            <ArrowLeft className="mr-2" size={20} /> Exit Tour
                        </Button>
                    </Link>

                    <div className="flex gap-4">
                        <Button
                            variant="glass"
                            className="text-white hover:bg-white/20 backdrop-blur-md border-white/20"
                            onClick={() => setShowInfo(!showInfo)}
                        >
                            <Info className="mr-2" size={20} /> Info
                        </Button>
                        <Button variant="glass" className="text-white hover:bg-white/20 backdrop-blur-md border-white/20">
                            <Volume2 size={20} />
                        </Button>
                    </div>
                </div>

                {/* Center Hotspots */}
                <div className="absolute inset-0 pointer-events-none">
                    {currentScene.hotspots.map((spot, i) => (
                        <motion.button
                            key={i}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.5 + (i * 0.2) }}
                            className="absolute pointer-events-auto transform -translate-x-1/2 -translate-y-1/2 group"
                            style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
                        >
                            <div className="relative">
                                <div className="absolute -inset-4 bg-white/30 rounded-full blur-md animate-pulse"></div>
                                <div className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full border-2 border-white shadow-lg flex items-center justify-center text-blue-900 group-hover:scale-110 transition-transform">
                                    <Video size={14} />
                                </div>
                                <div className="absolute top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                                    {spot.label}
                                </div>
                            </div>
                        </motion.button>
                    ))}
                </div>

                {/* Bottom Controls */}
                <div className="w-full max-w-4xl mx-auto">
                    <motion.div
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h1 className="text-3xl font-bold text-white mb-1">{currentScene.name}</h1>
                                <div className="flex items-center gap-2 text-white/70 text-sm">
                                    <MapPin size={14} /> Ooty Hills • 5 min view time
                                </div>
                            </div>
                            <div className="hidden md:block text-right max-w-xs">
                                <p className="text-white/80 text-sm italic">"{currentScene.audio}"</p>
                            </div>
                        </div>

                        {/* Scene Selector */}
                        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                            {SCENES.map(scene => (
                                <button
                                    key={scene.id}
                                    onClick={() => setCurrentScene(scene)}
                                    className={`relative flex-shrink-0 w-32 h-20 rounded-xl overflow-hidden border-2 transition-all ${currentScene.id === scene.id ? 'border-green-400 scale-105 shadow-lg shadow-green-900/50' : 'border-white/20 hover:border-white/50 opacity-70 hover:opacity-100'}`}
                                >
                                    <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${scene.image})` }} />
                                    <div className="absolute inset-0 bg-black/30 flex items-end p-2">
                                        <span className="text-white text-xs font-bold truncate">{scene.name}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Info Panel Overlay */}
            <AnimatePresence>
                {showInfo && (
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        className="absolute top-0 right-0 h-full w-full md:w-96 bg-white/95 backdrop-blur-xl shadow-2xl z-20 p-8 border-l border-white/20"
                    >
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-bold text-gray-900">About Locality</h2>
                            <button onClick={() => setShowInfo(false)} className="p-2 hover:bg-gray-100 rounded-full"><ArrowLeft size={20} /></button>
                        </div>
                        <p className="text-gray-600 leading-relaxed mb-6">
                            {currentScene.audio} This location is a prime hotspot in Ooty, featuring breathtaking views and diverse flora. It connects directly to the Doddabetta peak trail.
                        </p>
                        <div className="space-y-4">
                            <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                                <h3 className="font-bold text-green-800 mb-2">Visitor Tips</h3>
                                <ul className="text-sm text-green-700 space-y-2 list-disc pl-4">
                                    <li>Best visited before 10 AM for fog views.</li>
                                    <li>Carry warm clothes, average temp 15°C.</li>
                                    <li>Binoculars recommended for viewpoints.</li>
                                </ul>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
