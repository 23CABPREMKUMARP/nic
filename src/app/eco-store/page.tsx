
"use client";

import React, { useEffect, useState } from 'react';
import { ShoppingBag, Star, Zap, ShoppingCart, Loader2, ArrowRight, TreePine } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';

interface Product {
    id: string;
    name: string;
    description: string;
    pricePoints: number;
    priceCash: number;
    category: string;
    imageUrls: string[];
}

export default function EcoStorePage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [cart, setCart] = useState<Record<string, number>>({});
    const [checkingOut, setCheckingOut] = useState(false);

    useEffect(() => {
        // Fetch products
        fetch('/api/eco/products')
            .then(res => res.json())
            .then(data => {
                setProducts(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const addToCart = (id: string) => {
        setCart(prev => ({
            ...prev,
            [id]: (prev[id] || 0) + 1
        }));
    };

    const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);
    const totalPricePoints = Array.isArray(products) ? products.reduce((acc, p) => acc + (cart[p.id] || 0) * p.pricePoints, 0) : 0;
    const totalPriceCash = Array.isArray(products) ? products.reduce((acc, p) => acc + (cart[p.id] || 0) * p.priceCash, 0) : 0;

    const handleCheckout = async () => {
        setCheckingOut(true);
        // Implement checkout API call
        setTimeout(() => {
            alert("Order placed successfully! Visit our collection point in Ooty to pick up your items.");
            setCart({});
            setCheckingOut(false);
        }, 1500);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-emerald-50">
                <Loader2 className="animate-spin text-emerald-600" size={48} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            <Navbar />
            {/* Header */}
            <div className="bg-emerald-700 text-white pt-32 pb-12 px-6 rounded-b-[48px] shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-10">
                    <ShoppingBag size={200} />
                </div>
                <div className="max-w-4xl mx-auto relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Marketplace</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight">Eco Store</h1>
                    <p className="text-emerald-100 mt-2 max-w-md font-medium">
                        Redeem your sustainable travel points for authentic Nilgiri products.
                    </p>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 -mt-8">
                {/* Stats / Point Level */}
                <div className="bg-white p-6 rounded-[32px] shadow-xl border border-emerald-100 flex flex-wrap gap-8 items-center justify-between mb-12">
                    <div className="flex items-center gap-4">
                        <div className="bg-emerald-100 p-4 rounded-2xl text-emerald-600">
                            <Zap size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-black text-slate-400">Your Balance</p>
                            <h3 className="text-2xl font-black text-slate-800">450 Pts</h3>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <div className="bg-slate-100 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 flex items-center gap-2">
                            <Star size={14} className="text-amber-500 fill-amber-500" /> Bronze Member
                        </div>
                    </div>
                </div>

                {/* Categories */}
                <div className="flex gap-4 mb-8 overflow-x-auto pb-2 scrollbar-hide">
                    {['All', 'Chocolates', 'Tea', 'Spices', 'Handicrafts'].map(cat => (
                        <button key={cat} className="px-6 py-3 whitespace-nowrap bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-600 hover:border-emerald-500 hover:text-emerald-600 transition-all">
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map(product => (
                        <motion.div
                            key={product.id}
                            whileHover={{ y: -5 }}
                            className="bg-white rounded-[32px] overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all group"
                        >
                            <div className="aspect-square bg-slate-100 relative overflow-hidden">
                                <img
                                    src={product.imageUrls?.[0] || `https://placehold.co/600x600/e2e8f0/475569?text=${product.name}`}
                                    alt={product.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute top-4 left-4">
                                    <span className="bg-emerald-600 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">
                                        {product.category}
                                    </span>
                                </div>
                            </div>
                            <div className="p-6">
                                <h3 className="font-bold text-slate-800 text-lg leading-tight">{product.name}</h3>
                                <p className="text-slate-500 text-xs mt-2 line-clamp-2">{product.description}</p>

                                <div className="mt-6 flex items-end justify-between">
                                    <div>
                                        <p className="text-[10px] uppercase font-black text-slate-400">Redeem for</p>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-2xl font-black text-emerald-600">{product.pricePoints}</span>
                                            <span className="text-xs font-bold text-emerald-500/60 lowercase italic">pts</span>
                                            <span className="text-slate-300 mx-1">+</span>
                                            <span className="text-xl font-bold text-slate-800">₹{product.priceCash}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => addToCart(product.id)}
                                        className="bg-slate-900 text-white p-4 rounded-2xl hover:bg-emerald-600 transition-all shadow-lg active:scale-95"
                                    >
                                        <ShoppingCart size={20} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Sticky Cart Bar */}
            <AnimatePresence>
                {cartCount > 0 && (
                    <motion.div
                        initial={{ y: 100 }}
                        animate={{ y: 0 }}
                        exit={{ y: 100 }}
                        className="fixed bottom-10 left-6 right-6 z-50 pointer-events-none"
                    >
                        <div className="max-w-lg mx-auto bg-slate-900 text-white p-4 pr-2 rounded-[28px] shadow-2xl flex items-center justify-between border border-white/20 pointer-events-auto overflow-hidden">
                            <div className="flex items-center gap-4 pl-4">
                                <div className="relative">
                                    <div className="bg-emerald-500 p-3 rounded-2xl">
                                        <ShoppingCart size={20} />
                                    </div>
                                    <span className="absolute -top-2 -right-2 bg-white text-slate-900 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black">
                                        {cartCount}
                                    </span>
                                </div>
                                <div className="border-l border-white/10 pl-4">
                                    <p className="text-[9px] uppercase font-black text-white/40 mb-0.5">Total Redeemable</p>
                                    <p className="font-bold text-sm">
                                        <span className="text-emerald-400">{totalPricePoints} Pts</span> + ₹{totalPriceCash}
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={handleCheckout}
                                disabled={checkingOut}
                                className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black py-4 px-8 rounded-[20px] transition-all flex items-center gap-2 group disabled:opacity-50"
                            >
                                {checkingOut ? <Loader2 className="animate-spin" /> : (
                                    <>
                                        Checkout <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Footer / Info */}
            <div className="max-w-4xl mx-auto px-6 mt-20 text-center">
                <div className="bg-emerald-50 p-10 rounded-[40px] border border-emerald-100">
                    <TreePine size={48} className="text-emerald-600 mx-auto mb-6" />
                    <h2 className="text-2xl font-black text-slate-800">Support Locals, Help Nature</h2>
                    <p className="text-slate-500 text-sm mt-4 leading-relaxed max-w-lg mx-auto font-medium">
                        Every purchase in the Eco Store helps local farmers and contributes to reforestation projects in the Nilgiri hills.
                        Scan your certificate QR code at the physical counter for an additional 10% discount!
                    </p>
                </div>
            </div>
        </div>
    );
}
