'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Navigation, AlertTriangle, Wind, Info, Mic, ChevronRight,
    ShieldAlert, Zap, Thermometer, ArrowUpCircle, Map as MapIcon,
    X, Volume2, Settings, Footprints, Car, Bike, AlertCircle, Sparkles, MapPin
} from 'lucide-react';
import { OOTY_JUNCTIONS } from '@/data/ooty_map_data';
import { RoutingEngine, Step } from '@/services/navigation/routingEngine';
import { VoiceGuide } from '@/services/navigation/voiceGuide';
import { CrowdPredictor, CrowdBrain } from '@/services/navigation/crowdPredictor';
import { SafetyModule, RoadStatus } from '@/services/navigation/safetyModule';
import { Badge } from "@/components/ui/badge";

interface SmartNavigationHUDProps {
    destination: any;
    userLocation: [number, number];
    onClose: () => void;
}

export default function SmartNavigationHUD({ destination, userLocation, onClose }: SmartNavigationHUDProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [routeData, setRouteData] = useState<any>(null);
    const [language, setLanguage] = useState<'en' | 'ta'>('en');
    const [prediction, setPrediction] = useState<CrowdBrain | null>(null);
    const [safetyAlerts, setSafetyAlerts] = useState<RoadStatus[]>([]);
    const [brakeHeat, setBrakeHeat] = useState(35); // simulated temp
    const [showRerouteDialog, setShowRerouteDialog] = useState(false);

    useEffect(() => {
        // Init Route
        const calculated = RoutingEngine.calculateRoute(userLocation, [destination.latitude, destination.longitude], {
            avoidCrowds: true,
            hillOptimized: true,
            localRoutes: false
        });
        setRouteData(calculated);

        // Initial Voice Greeting
        VoiceGuide.setLanguage(language);
        VoiceGuide.speak(
            `Starting navigation to ${destination.name}. Drive safely in the hills.`,
            `${destination.name} இடத்திற்கு பயணத்தை தொடங்குகிறோம். மலைப்பாதையில் கவனமாக ஓட்டவும்.`
        );

        // Crowd Prediction Logic
        CrowdPredictor.predict(destination.id, destination).then(setPrediction);

        // Safety Check
        const alerts = SafetyModule.checkRouteSafety([[0, 0]]); // mock polyline
        setSafetyAlerts(alerts);
    }, [destination, language]);

    // Simulated "Driving" - Move through steps
    useEffect(() => {
        const interval = setInterval(() => {
            setBrakeHeat(prev => Math.min(100, prev + (Math.random() * 2)));
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const speakStep = (step: Step) => {
        VoiceGuide.speak(step.instruction, step.tamil_instruction);
        if (step.alert) VoiceGuide.announceHillAlert(step.alert);
    };

    if (!routeData) return null;

    const activeStep = routeData.steps[currentStep];

    return (
        <div className="fixed inset-0 z-[5000] bg-slate-950 flex flex-col md:flex-row overflow-hidden font-sans text-white">

            {/* LEFT: NAV HUD & CONTROLS */}
            <div className="flex-1 relative flex flex-col p-6 md:p-10">

                {/* Header: Exit & Settings */}
                <div className="flex justify-between items-center mb-8">
                    <button onClick={onClose} className="p-4 bg-white/10 rounded-full hover:bg-white/20 transition-all">
                        <X size={24} />
                    </button>
                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                const newLang = language === 'en' ? 'ta' : 'en';
                                setLanguage(newLang);
                                VoiceGuide.setLanguage(newLang);
                            }}
                            className="px-6 py-3 bg-blue-600 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20"
                        >
                            {language === 'en' ? 'தமிழ்' : 'English'}
                        </button>
                    </div>
                </div>

                {/* MAIN INSTRUCTION CARD */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                    className="flex-1 flex flex-col justify-center"
                >
                    <div className="flex items-start gap-8">
                        <div className="w-24 h-24 bg-blue-600 rounded-[32px] flex items-center justify-center shadow-[0_20px_40px_rgba(37,99,235,0.4)]">
                            <Navigation size={48} />
                        </div>
                        <div>
                            <p className="text-[14px] font-black uppercase text-blue-400 tracking-[0.3em] mb-4">Current Instruction</p>
                            <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-tight mb-4">
                                {language === 'en' ? activeStep.instruction : activeStep.tamil_instruction}
                            </h1>
                            <div className="flex items-center gap-4">
                                <span className="text-2xl font-black text-white/50">{activeStep.distance}m</span>
                                <div className="h-1 w-20 bg-white/10 rounded-full overflow-hidden">
                                    <motion.div className="h-full bg-blue-500" initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 5 }} />
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* HILL SPECIFIC TELEMETRY */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-auto">
                    <div className="bg-white/5 backdrop-blur-md p-6 rounded-[32px] border border-white/10">
                        <div className="flex items-center gap-3 mb-2 opacity-50"><Thermometer size={16} /><span className="text-[10px] font-black uppercase">Brake Recovery</span></div>
                        <div className="flex items-end gap-2">
                            <span className={`text-3xl font-black ${brakeHeat > 80 ? 'text-rose-500' : 'text-emerald-500'}`}>{Math.round(brakeHeat)}°</span>
                            <span className="text-xs font-bold opacity-40 mb-1">Optimum</span>
                        </div>
                    </div>
                    <div className="bg-white/5 backdrop-blur-md p-6 rounded-[32px] border border-white/10">
                        <div className="flex items-center gap-3 mb-2 opacity-50"><ArrowUpCircle size={16} /><span className="text-[10px] font-black uppercase">Gear Suggest</span></div>
                        <div className="flex items-end gap-2">
                            <span className="text-3xl font-black text-amber-500">L2</span>
                            <span className="text-xs font-bold opacity-40 mb-1">Engine Brake</span>
                        </div>
                    </div>
                    <div className="bg-white/5 backdrop-blur-md p-6 rounded-[32px] border border-white/10">
                        <div className="flex items-center gap-3 mb-2 opacity-50"><Wind size={16} /><span className="text-[10px] font-black uppercase">Visibility</span></div>
                        <div className="flex items-end gap-2">
                            <span className="text-3xl font-black text-blue-400">92%</span>
                            <span className="text-xs font-bold opacity-40 mb-1">Clear</span>
                        </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md p-6 rounded-[32px] border border-blue-500/50">
                        <div className="flex items-center gap-3 mb-2 text-blue-400"><Clock size={16} className="animate-pulse" /><span className="text-[10px] font-black uppercase">Live ETA</span></div>
                        <div className="flex items-end gap-2">
                            <span className="text-3xl font-black">{routeData.estimatedTime}</span>
                            <span className="text-xs font-bold opacity-40 mb-1">mins</span>
                        </div>
                    </div>
                </div>

                {/* SAFETY ALERT OVERLAY (LANDSLIDE / CLOSED) */}
                <AnimatePresence>
                    {safetyAlerts.length > 0 && (
                        <motion.div
                            initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                            className="absolute bottom-40 left-6 right-6 p-6 bg-rose-600 rounded-[32px] shadow-2xl flex items-center gap-6 border-4 border-rose-400"
                        >
                            <ShieldAlert size={40} className="shrink-0" />
                            <div>
                                <h4 className="text-xl font-black leading-none mb-1">EMERGENCY: {safetyAlerts[0].roadId}</h4>
                                <p className="text-sm font-bold opacity-90">{language === 'en' ? safetyAlerts[0].reason : safetyAlerts[0].tamil_reason}</p>
                            </div>
                            <button className="ml-auto px-8 py-4 bg-white text-rose-600 rounded-2xl font-black text-xs uppercase shadow-xl">Reroute Now</button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* RIGHT: TOURIST CARDS & PREDICTIONS */}
            <div className="w-full md:w-[450px] bg-white text-slate-900 p-8 md:p-12 flex flex-col gap-8 shadow-[-20px_0_60px_rgba(0,0,0,0.5)] z-10 overflow-y-auto">

                {/* Tourist Logic: Prediction Card */}
                <div className="bg-slate-50 rounded-[40px] p-8 border border-slate-100">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Live Prediction</p>
                            <h3 className="text-2xl font-black text-slate-900 leading-tight">Crowd Insight</h3>
                        </div>
                        <div className={`p-4 rounded-2xl ${prediction?.trend === 'RISING' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                            {prediction?.trend === 'RISING' ? <ArrowUpCircle size={24} /> : <ArrowDownCircle size={24} />}
                        </div>
                    </div>
                    <div className="flex items-center gap-4 mb-6">
                        <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden">
                            <motion.div
                                className={`h-full ${prediction?.currentDensity && prediction.currentDensity > 70 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                initial={{ width: 0 }} animate={{ width: `${prediction?.currentDensity || 0}%` }}
                            />
                        </div>
                        <span className="text-sm font-black text-slate-800">{prediction?.currentDensity || 0}%</span>
                    </div>
                    <p className="text-sm font-medium text-slate-600 leading-relaxed italic">
                        "{language === 'en' ? prediction?.recommendation : prediction?.tamil_recommendation}"
                    </p>
                </div>

                {/* Attractive Thumbnail (Google Style) */}
                <div className="rounded-[44px] overflow-hidden relative group shadow-2xl aspect-[4/5] bg-slate-100">
                    {destination.image && <img src={destination.image} className="w-full h-full object-cover transition-transform duration-[5s] group-hover:scale-110" />}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent flex flex-col justify-end p-10">
                        <div className="flex items-center gap-3 mb-4">
                            <Badge className="bg-white/20 backdrop-blur-md text-white border-none py-1.5 px-4 font-black text-[10px] uppercase">{destination.type}</Badge>
                            <Badge className="bg-amber-500 text-white border-none py-1.5 px-4 font-black text-[10px] uppercase">Peak Visuals</Badge>
                        </div>
                        <h2 className="text-4xl font-black text-white tracking-tighter mb-2">{destination.name}</h2>
                        <div className="flex items-center gap-2 text-white/60 text-xs font-bold">
                            <MapPin size={14} /> <span>Near {OOTY_JUNCTIONS[0].name} Junction</span>
                        </div>
                    </div>
                </div>

                {/* "Better than Google Maps" Features: Local Intelligence */}
                <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Hill Station Specials</h4>
                    <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 flex items-center gap-5">
                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm text-blue-600"><AlertTriangle size={24} /></div>
                        <div>
                            <p className="text-xs font-black text-slate-900">Hairpin Counter</p>
                            <p className="text-[11px] font-medium text-slate-500">12 total on this route</p>
                        </div>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 flex items-center gap-5">
                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm text-emerald-600"><Zap size={24} /></div>
                        <div>
                            <p className="text-xs font-black text-slate-900">One-Way Logic</p>
                            <p className="text-[11px] font-medium text-slate-500">Police enforced Loop active</p>
                        </div>
                    </div>
                </div>

                <div className="mt-auto pt-8 border-t border-slate-100">
                    <button
                        onClick={() => {
                            speakStep(routeData.steps[currentStep]);
                        }}
                        className="w-full bg-slate-900 text-white py-8 rounded-[36px] font-black text-lg flex items-center justify-center gap-4 hover:bg-black transition-all shadow-xl"
                    >
                        <Volume2 size={24} /> Repeat Instruction
                    </button>
                    <button
                        onClick={() => {
                            if (currentStep < routeData.steps.length - 1) {
                                const next = currentStep + 1;
                                setCurrentStep(next);
                                speakStep(routeData.steps[next]);
                            } else {
                                onClose();
                            }
                        }}
                        className="w-full mt-4 bg-blue-600 text-white py-8 rounded-[36px] font-black text-lg flex items-center justify-center gap-4 hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20"
                    >
                        {currentStep < routeData.steps.length - 1 ? 'Next Turn' : 'Arrive at Destination'} <ChevronRight size={24} />
                    </button>
                </div>
            </div>

        </div>
    );
}

function Clock({ size, className = "" }: { size: number, className?: string }) {
    return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;
}

function ArrowDownCircle({ size, className = "" }: { size: number, className?: string }) {
    return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10" /><polyline points="8 12 12 16 16 12" /><line x1="12" y1="8" x2="12" y2="16" /></svg>;
}
