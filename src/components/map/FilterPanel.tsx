'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trees, Binoculars, Flower2, Waves, Zap, Heart,
    Palmtree, ShoppingBag, UtensilsCrossed, Baby,
    Sun, Sunrise, CloudRain, Cloud, Moon,
    Users, Heart as HeartIcon, GraduationCap, UserRound,
    Accessibility, Wallet, LocateFixed, X
} from 'lucide-react';

interface FilterPanelProps {
    onFilterChange: (type: string, value: string | null) => void;
    activeFilters: any;
    onClose: () => void;
}

export default function FilterPanel({ onFilterChange, activeFilters, onClose }: FilterPanelProps) {
    const categories = [
        { id: 'Nature', icon: <Trees size={16} /> },
        { id: 'View Points', icon: <Binoculars size={16} /> },
        { id: 'Gardens', icon: <Flower2 size={16} /> },
        { id: 'Lakes', icon: <Waves size={16} /> },
        { id: 'Adventure', icon: <Zap size={16} /> },
        { id: 'Religious', icon: <Heart size={16} /> },
        { id: 'Heritage', icon: <Palmtree size={16} /> },
        { id: 'Shopping', icon: <ShoppingBag size={16} /> },
        { id: 'Food', icon: <UtensilsCrossed size={16} /> },
        { id: 'Kids Friendly', icon: <Baby size={16} /> }
    ];

    const timeFilters = [
        { id: 'Morning spots', icon: <Sunrise size={16} /> },
        { id: 'Sunset spots', icon: <Sun size={16} /> },
        { id: 'Rain suitable', icon: <CloudRain size={16} /> },
        { id: 'Mist view', icon: <Cloud size={16} /> },
        { id: 'Night safe', icon: <Moon size={16} /> }
    ];

    const personalFilters = [
        { id: 'Family', icon: <Users size={16} /> },
        { id: 'Couples', icon: <HeartIcon size={16} /> },
        { id: 'Students', icon: <GraduationCap size={16} /> },
        { id: 'Senior citizens', icon: <UserRound size={16} /> },
        { id: 'Wheelchair accessible', icon: <Accessibility size={16} /> },
        { id: 'Budget friendly', icon: <Wallet size={16} /> }
    ];

    const distanceFilters = [
        { id: '2', label: 'Within 2 km' },
        { id: '5', label: 'Within 5 km' },
        { id: '10', label: 'Within 10 km' }
    ];

    const Section = ({ title, items, type }: any) => (
        <div className="mb-6">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-2">{title}</h4>
            <div className="flex flex-wrap gap-2 px-1">
                {items.map((item: any) => (
                    <motion.button
                        key={item.id}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onFilterChange(type, activeFilters[type] === item.id ? null : item.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[11px] font-bold transition-all border-2 ${activeFilters[type] === item.id
                                ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/30'
                                : 'bg-slate-50 border-slate-100 text-slate-600 hover:border-blue-200'
                            }`}
                    >
                        {item.icon} {item.label || item.id}
                    </motion.button>
                ))}
            </div>
        </div>
    );

    return (
        <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="fixed top-0 right-0 w-full md:w-[400px] h-full bg-white z-[6000] shadow-[-20px_0_60px_rgba(0,0,0,0.1)] overflow-y-auto flex flex-col"
        >
            <div className="p-8 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur-md z-10">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tighter leading-none mb-1">Advanced Filters</h2>
                    <p className="text-xs font-bold text-slate-400">Tailor your Ooty experience</p>
                </div>
                <button onClick={onClose} className="p-3 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all">
                    <X size={20} />
                </button>
            </div>

            <div className="p-6 flex-1">
                <Section title="Categories" items={categories} type="category" />
                <Section title="Perfect Timing" items={timeFilters} type="time" />
                <Section title="Personal Choice" items={personalFilters} type="personal" />
                <Section title="Distance" items={distanceFilters} type="distance" />
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
                <button
                    onClick={() => {
                        onFilterChange('category', null);
                        onFilterChange('time', null);
                        onFilterChange('personal', null);
                        onFilterChange('distance', null);
                    }}
                    className="flex-1 py-4 text-slate-500 font-black text-xs uppercase tracking-widest hover:text-slate-900 transition-all"
                >
                    Clear All
                </button>
                <button
                    onClick={onClose}
                    className="flex-[2] py-4 bg-slate-900 text-white rounded-[24px] font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:bg-black"
                >
                    Apply Filters
                </button>
            </div>
        </motion.div>
    );
}
