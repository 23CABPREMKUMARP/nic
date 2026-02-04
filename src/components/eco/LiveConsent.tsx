
import React, { useState, useEffect } from 'react';
import { MapPin, ShieldCheck, TreePine, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LiveConsentProps {
    onConsent: (granted: boolean) => void;
}

export const LiveConsent: React.FC<LiveConsentProps> = ({ onConsent }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [granted, setGranted] = useState<boolean | null>(null);

    useEffect(() => {
        // Check local storage for previous consent
        const saved = localStorage.getItem('nilgiri-eco-consent');
        if (saved === null) {
            const timer = setTimeout(() => setIsVisible(true), 2000);
            return () => clearTimeout(timer);
        } else {
            setGranted(saved === 'true');
        }
    }, []);

    const handleAction = (isGranted: boolean) => {
        setGranted(isGranted);
        setIsVisible(false);
        localStorage.setItem('nilgiri-eco-consent', isGranted.toString());
        onConsent(isGranted);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-white rounded-[32px] shadow-2xl overflow-hidden max-w-md w-full border border-white/20"
                    >
                        {/* Header Image/Pattern */}
                        <div className="bg-emerald-600 p-8 flex flex-col items-center text-center text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <TreePine size={120} />
                            </div>
                            <div className="bg-white/20 p-4 rounded-3xl backdrop-blur-md mb-4">
                                <MapPin size={32} className="text-white" />
                            </div>
                            <h2 className="text-2xl font-black tracking-tight">Eco-Tracker Access</h2>
                            <p className="text-emerald-50 text-sm mt-2 font-medium">Earn +20 Eco Points by sharing live status</p>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="space-y-4">
                                <div className="flex gap-4 items-start">
                                    <div className="bg-emerald-50 p-2 rounded-xl text-emerald-600 shrink-0">
                                        <ShieldCheck size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800 text-sm">Privacy Guaranteed</h4>
                                        <p className="text-slate-500 text-xs leading-relaxed mt-1">
                                            Your path is anonymized and used only for crowd prediction to help others avoid traffic.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-start">
                                    <div className="bg-emerald-50 p-2 rounded-xl text-emerald-600 shrink-0">
                                        <TreePine size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800 text-sm">Plant a Tree</h4>
                                        <p className="text-slate-500 text-xs leading-relaxed mt-1">
                                            High eco scores lead to real tree planting initiatives in the Nilgiris.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => handleAction(false)}
                                    className="flex-1 py-4 text-slate-400 font-bold text-sm hover:bg-slate-50 rounded-2xl transition-all"
                                >
                                    Not Now
                                </button>
                                <button
                                    onClick={() => handleAction(true)}
                                    className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-2xl shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 transition-all active:scale-95"
                                >
                                    <Check size={20} /> I'm In!
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
