'use client';

/**
 * NavigationUI - Turn-by-turn navigation HUD component
 */

import { useState, useEffect, useCallback } from 'react';
import {
    ArrowUp, ArrowLeft, ArrowRight, RotateCcw, Flag,
    Volume2, VolumeX, MapPin, Clock, Navigation,
    AlertTriangle, ChevronDown, ChevronUp, Car, Footprints
} from 'lucide-react';
import { VoiceGuide, Language } from '@/services/navigation/VoiceGuide';

interface RouteInstruction {
    text: string;
    tamil: string;
    distance: number;
    time: number;
    coordinate: [number, number];
    sign?: number;
    alert?: string;
}

interface HillAlert {
    type: string;
    name: string;
    message: string;
    tamilMessage: string;
}

interface NavigationUIProps {
    instructions: RouteInstruction[];
    hillAlerts: HillAlert[];
    currentIndex: number;
    distance: number; // km
    duration: number; // minutes
    isNavigating: boolean;
    onClose: () => void;
    onSkip?: () => void;
    onRecenter?: () => void;
    language?: Language;
    onLanguageChange?: (lang: Language) => void;
}

export default function NavigationUI({
    instructions,
    hillAlerts,
    currentIndex,
    distance,
    duration,
    isNavigating,
    onClose,
    onSkip,
    onRecenter,
    language = 'en',
    onLanguageChange
}: NavigationUIProps) {
    const [isMinimized, setIsMinimized] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [showAlerts, setShowAlerts] = useState(hillAlerts.length > 0);

    const currentInstruction = instructions[currentIndex];
    const nextInstruction = instructions[currentIndex + 1];

    // Initialize voice guide
    useEffect(() => {
        VoiceGuide.init();
        VoiceGuide.setSettings({ language, enabled: !isMuted });
    }, []);

    // Update voice settings
    useEffect(() => {
        VoiceGuide.setSettings({ language, enabled: !isMuted });
    }, [language, isMuted]);

    // Announce current instruction when it changes
    useEffect(() => {
        if (currentInstruction && isNavigating && !isMuted) {
            VoiceGuide.announceInstruction({
                text: currentInstruction.text,
                tamil: currentInstruction.tamil,
                distance: currentInstruction.distance
            });

            // Announce hill alerts
            if (currentInstruction.alert) {
                setTimeout(() => {
                    VoiceGuide.announceHillAlert(currentInstruction.alert!);
                }, 2000);
            }
        }
    }, [currentIndex, isNavigating, isMuted]);

    // Get direction icon based on instruction
    const getDirectionIcon = (instruction?: RouteInstruction) => {
        if (!instruction) return <Flag className="w-8 h-8" />;

        const text = instruction.text.toLowerCase();
        if (text.includes('left')) return <ArrowLeft className="w-8 h-8" />;
        if (text.includes('right')) return <ArrowRight className="w-8 h-8" />;
        if (text.includes('u-turn') || text.includes('turn around')) return <RotateCcw className="w-8 h-8" />;
        if (text.includes('arrive')) return <Flag className="w-8 h-8" />;
        return <ArrowUp className="w-8 h-8" />;
    };

    // Format distance
    const formatDistance = (meters: number) => {
        if (meters < 1000) return `${Math.round(meters)} m`;
        return `${(meters / 1000).toFixed(1)} km`;
    };

    // Format ETA
    const formatETA = (minutes: number) => {
        if (minutes < 60) return `${Math.round(minutes)} min`;
        const hours = Math.floor(minutes / 60);
        const mins = Math.round(minutes % 60);
        return `${hours}h ${mins}m`;
    };

    // Toggle mute
    const toggleMute = () => {
        const newMuted = !isMuted;
        setIsMuted(newMuted);
        VoiceGuide.setSettings({ enabled: !newMuted });

        if (!newMuted) {
            VoiceGuide.speak('Voice navigation enabled', 'குரல் வழிகாட்டுதல் செயல்படுத்தப்பட்டது');
        }
    };

    // Toggle language
    const toggleLanguage = () => {
        const newLang = VoiceGuide.toggleLanguage();
        if (onLanguageChange) {
            onLanguageChange(newLang);
        }
    };

    if (isMinimized) {
        return (
            <div
                className="fixed top-24 left-4 right-4 bg-white rounded-2xl shadow-xl p-4 z-[1000] cursor-pointer"
                onClick={() => setIsMinimized(false)}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white">
                            {getDirectionIcon(currentInstruction)}
                        </div>
                        <div>
                            <p className="font-medium text-sm">
                                {language === 'ta' ? currentInstruction?.tamil : currentInstruction?.text}
                            </p>
                            <p className="text-xs text-gray-500">
                                {formatDistance(currentInstruction?.distance || 0)}
                            </p>
                        </div>
                    </div>
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                </div>
            </div>
        );
    }

    return (
        <div className="fixed top-24 left-4 right-4 z-[1000] flex flex-col gap-3">
            {/* Main Navigation Card */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                {/* Header with ETA */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <Navigation className="w-5 h-5" />
                            <span className="text-sm font-medium">Navigation Active</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={toggleMute}
                                className="p-2 hover:bg-white/20 rounded-full transition"
                            >
                                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                            </button>
                            <button
                                onClick={() => setIsMinimized(true)}
                                className="p-2 hover:bg-white/20 rounded-full transition"
                            >
                                <ChevronUp className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                <span className="text-lg font-bold">{distance.toFixed(1)} km</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                <span className="text-lg font-bold">{formatETA(duration)}</span>
                            </div>
                        </div>
                        <button
                            onClick={toggleLanguage}
                            className="px-3 py-1 bg-white/20 rounded-full text-sm hover:bg-white/30 transition"
                        >
                            {language === 'en' ? 'தமிழ்' : 'English'}
                        </button>
                    </div>
                </div>

                {/* Current Instruction */}
                <div className="p-4">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                            {getDirectionIcon(currentInstruction)}
                        </div>
                        <div className="flex-1">
                            <p className="text-lg font-semibold text-gray-800">
                                {language === 'ta' ? currentInstruction?.tamil : currentInstruction?.text}
                            </p>
                            <p className="text-sm text-gray-500">
                                {formatDistance(currentInstruction?.distance || 0)}
                            </p>
                        </div>
                    </div>

                    {/* Alert badge */}
                    {currentInstruction?.alert && (
                        <div className="mt-3 flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                            <span className="text-sm text-amber-700">
                                {language === 'ta'
                                    ? 'எச்சரிக்கை: கொண்டை ஊசி வளைவு'
                                    : `Warning: ${currentInstruction.alert.replace('_', ' ').toLowerCase()}`}
                            </span>
                        </div>
                    )}

                    {/* Next instruction preview */}
                    {nextInstruction && (
                        <div className="mt-3 flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                            <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500">
                                {getDirectionIcon(nextInstruction)}
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-gray-600">
                                    Then: {language === 'ta' ? nextInstruction.tamil : nextInstruction.text}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Action buttons */}
                <div className="px-4 pb-4 flex gap-2">
                    {onRecenter && (
                        <button
                            onClick={onRecenter}
                            className="flex-1 py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium text-gray-700 transition"
                        >
                            Recenter
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="flex-1 py-2 px-4 bg-red-50 hover:bg-red-100 rounded-xl text-sm font-medium text-red-600 transition"
                    >
                        End Navigation
                    </button>
                </div>
            </div>

            {/* Hill Alerts Panel */}
            {hillAlerts.length > 0 && showAlerts && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl shadow-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                            <span className="font-medium text-amber-800">Route Alerts</span>
                        </div>
                        <button
                            onClick={() => setShowAlerts(false)}
                            className="text-amber-500 hover:text-amber-600"
                        >
                            ✕
                        </button>
                    </div>
                    <div className="space-y-2">
                        {hillAlerts.slice(0, 2).map((alert, idx) => (
                            <div key={idx} className="text-sm text-amber-700">
                                <span className="font-medium">{alert.name}:</span>{' '}
                                {language === 'ta' ? alert.tamilMessage : alert.message}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
