'use client';

import Navbar from "@/components/Navbar";
import dynamic from "next/dynamic";
import { Suspense } from "react";

// Dynamically import LiveMapComponent to avoid SSR issues with Leaflet
const LiveMapComponent = dynamic(
    () => import("@/components/map/LiveMapComponent"),
    {
        ssr: false,
        loading: () => (
            <div className="w-full h-full flex items-center justify-center bg-gray-900">
                <div className="text-white font-bold flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="animate-pulse">Initializing Live Intelligent Map...</p>
                </div>
            </div>
        )
    }
);

export default function SmartMapPage() {
    return (
        <main className="relative w-full h-screen overflow-hidden bg-gray-900">
            <Navbar />
            <div className="w-full h-full pt-20">
                <Suspense fallback={null}>
                    <LiveMapComponent />
                </Suspense>
            </div>

            {/* Legend Overlay for quick reference */}
            <div className="absolute bottom-10 right-10 z-[1000] hidden md:block">
                <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-white/20 space-y-3">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Live Legend</h4>
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
                        <span className="text-[10px] font-bold text-gray-700">Heavy Traffic / Critical Crowd</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                        <span className="text-[10px] font-bold text-gray-700">Moderate Traffic / Busy</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="text-[10px] font-bold text-gray-700">Smooth / Low Density</span>
                    </div>
                </div>
            </div>
        </main>
    );
}
