'use client';

import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "./ui/button";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [lang, setLang] = useState<'EN' | 'TA'>('EN');
    const pathname = usePathname();
    const isDashboard = pathname === '/dashboard';

    const { user } = useUser();
    const [isAdmin, setIsAdmin] = useState(false);

    const toggleLang = () => setLang(l => l === 'EN' ? 'TA' : 'EN');

    useEffect(() => {
        if (!user) {
            setIsAdmin(false);
            return;
        }

        fetch('/api/user/role')
            .then(res => res.json())
            .then(data => {
                if (data.role === 'ADMIN') setIsAdmin(true);
                else setIsAdmin(false);
            })
            .catch(err => console.error(err));
    }, [user]);

    const textColor = isDashboard ? 'text-orange-600' : 'text-white/80';
    const hoverColor = isDashboard ? 'hover:text-orange-800' : 'hover:text-white';
    const activeColor = 'text-orange-700 font-bold underline decoration-2 underline-offset-4';

    return (
        <nav
            className={`fixed top-0 left-0 w-full z-[1000] px-6 py-4 border-b transition-all duration-300 ${isDashboard ? 'shadow-md border-[#145a32]/20' : 'glass border-white/10'}`}
            style={isDashboard ? {
                backgroundImage: `linear-gradient(to bottom, rgba(232, 245, 233, 0.9), rgba(200, 230, 201, 0.95)), url('/images/nilgiri_header_bg.png')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center bottom'
            } : {}}
        >
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <Link href="/" className="text-2xl font-bold tracking-tighter flex items-center gap-2 group">
                    <motion.div whileHover={{ rotate: 10 }} transition={{ type: "spring", stiffness: 300 }}>
                        {/* Logo Icon Placeholder */}
                        <span className="text-3xl">🏔️</span>
                    </motion.div>
                    <span className={`${isDashboard ? 'text-orange-600' : 'text-green-400'} group-hover:opacity-80 transition-opacity`}>Nilgiri</span>
                    <span className={`${isDashboard ? 'text-orange-700' : 'text-white/80 group-hover:text-white'} transition-colors`}>{lang === 'EN' ? 'Pass' : 'பாஸ்'}</span>
                </Link>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center gap-8">
                    <Link href="/dashboard">
                        <motion.div whileHover={{ scale: 1.05 }} className={`${pathname === '/dashboard' ? activeColor : textColor} ${hoverColor} transition-colors cursor-pointer`}>
                            {lang === 'EN' ? 'Dashboard' : 'டாஷ்போர்டு'}
                        </motion.div>
                    </Link>
                    <Link href="/parking">
                        <motion.div whileHover={{ scale: 1.05 }} className={`${pathname === '/parking' ? activeColor : textColor} ${hoverColor} transition-colors cursor-pointer`}>
                            {lang === 'EN' ? 'Parking' : 'வாகன நிறுத்தம்'}
                        </motion.div>
                    </Link>
                    <Link href="/eco-store">
                        <motion.div whileHover={{ scale: 1.05 }} className={`${pathname === '/eco-store' ? activeColor : textColor} ${hoverColor} transition-colors cursor-pointer font-bold ${isDashboard ? 'text-orange-600' : 'text-emerald-400'}`}>
                            {lang === 'EN' ? 'Eco Store' : 'ஈகோ ஸ்டோர்'}
                        </motion.div>
                    </Link>
                    <Link href="/tourism">
                        <motion.div whileHover={{ scale: 1.05 }} className={`${pathname === '/tourism' ? activeColor : textColor} ${hoverColor} transition-colors cursor-pointer`}>
                            {lang === 'EN' ? 'Tourism' : 'சுற்றுலா'}
                        </motion.div>
                    </Link>
                    {isAdmin && (
                        <Link href="/admin">
                            <motion.div whileHover={{ scale: 1.05 }} className={`${isDashboard ? 'text-orange-600 border-orange-600/30 bg-orange-600/10' : 'text-red-400 border-red-500/30 bg-red-500/10'} hover:opacity-80 font-bold transition-all cursor-pointer border px-2 py-1 rounded`}>
                                {lang === 'EN' ? 'ADMIN PANEL' : 'நிர்வாகம்'}
                            </motion.div>
                        </Link>
                    )}
                    <Link href="/map">
                        <div className={`flex items-center gap-1 text-xs font-mono border px-2 py-1 rounded cursor-help ${isDashboard ? 'text-orange-600 border-orange-600/30 bg-orange-600/5' : 'text-orange-400 border-orange-500/30 bg-orange-500/10'}`} title="Live Validator Active">
                            <span className="animate-pulse">●</span> Crowd Density
                        </div>
                    </Link>
                    <Link href="/map">
                        <motion.div whileHover={{ scale: 1.05 }} className={`${pathname === '/map' ? activeColor : textColor} ${hoverColor} transition-colors cursor-pointer`}>
                            {lang === 'EN' ? 'Smart Map' : 'வரைபடம்'}
                        </motion.div>
                    </Link>
                    <Link href="/validator">
                        <motion.div whileHover={{ scale: 1.05 }} className={`${isDashboard ? 'text-orange-600' : 'text-purple-400 hover:text-purple-300'} transition-colors cursor-pointer font-bold flex items-center gap-1`}>
                            <span className="text-lg">🎫</span>
                            {lang === 'EN' ? 'Validator' : 'டிக்கெட்'}
                        </motion.div>
                    </Link>
                    <Link href="/about">
                        <motion.div whileHover={{ scale: 1.05 }} className={`${pathname === '/about' ? activeColor : textColor} ${hoverColor} transition-colors cursor-pointer`}>
                            About
                        </motion.div>
                    </Link>
                    <button onClick={toggleLang} className={`${textColor} ${hoverColor} transition-colors font-mono border ${isDashboard ? 'border-orange-600/20' : 'border-white/20'} rounded px-2 py-1 text-xs`}>
                        {lang === 'EN' ? 'TA' : 'EN'}
                    </button>

                    <SignedOut>
                        <div className="flex gap-4">
                            <SignInButton mode="modal">
                                <Button variant="glass" className={`py-2 px-4 text-sm ${isDashboard ? 'text-orange-600 border-orange-600/20 hover:bg-orange-600/5' : ''}`}>Login</Button>
                            </SignInButton>
                            <SignUpButton mode="modal">
                                <Button variant="primary" className="py-2 px-4 text-sm bg-green-500/20 hover:bg-green-500/30 border-green-400/30">Register</Button>
                            </SignUpButton>
                        </div>
                    </SignedOut>
                    <SignedIn>
                        <UserButton
                            appearance={{
                                elements: {
                                    avatarBox: `w-10 h-10 border-2 ${isDashboard ? 'border-orange-600/20' : 'border-white/20'}`
                                }
                            }}
                        />
                    </SignedIn>
                </div>

                {/* Mobile Toggle */}
                <button onClick={() => setIsOpen(!isOpen)} className={`md:hidden p-2 ${isDashboard ? 'text-orange-600' : 'text-white'}`}>
                    {isOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className={`md:hidden overflow-hidden backdrop-blur-xl border-t ${isDashboard
                            ? 'bg-orange-50/95 border-orange-600/10'
                            : 'bg-[#0f3b28]/95 border-white/10'
                            }`}
                    >
                        <div className="p-4 flex flex-col gap-4">
                            <Link href="/dashboard" className={`block ${isDashboard ? 'text-orange-600 hover:bg-orange-600/5' : 'text-emerald-400 hover:bg-white/5'} py-2 rounded px-2`}>Dashboard</Link>
                            <Link href="/parking" className={`block ${isDashboard ? 'text-orange-600 hover:bg-orange-600/5' : 'text-white/90 hover:bg-white/5'} py-2 rounded px-2`}>Parking</Link>
                            <Link href="/eco-store" className={`block ${isDashboard ? 'text-orange-600 hover:bg-orange-600/5' : 'text-white/90 hover:bg-white/5'} py-2 rounded px-2`}>Eco Store</Link>
                            <Link href="/tourism" className={`block ${isDashboard ? 'text-orange-600 hover:bg-orange-600/5' : 'text-white/90 hover:bg-white/5'} py-2 rounded px-2`}>Tourism</Link>
                            {isAdmin && <Link href="/admin" className={`block ${isDashboard ? 'text-orange-600' : 'text-red-400'} font-bold py-2 hover:bg-black/5 rounded px-2`}>ADMIN PANEL</Link>}
                            <Link href="/map" className={`block ${isDashboard ? 'text-orange-600 hover:bg-orange-600/5' : 'text-white/90 hover:bg-white/5'} py-2 rounded px-2`}>Smart Map</Link>
                            <div className={`pt-2 border-t mt-2 ${isDashboard ? 'border-orange-600/10' : 'border-white/10'}`}>
                                <SignedOut>
                                    <div className="flex flex-col gap-3">
                                        <SignInButton mode="modal">
                                            <Button variant="glass" className={`w-full justify-center ${isDashboard ? 'text-orange-600 border-orange-600/20' : ''}`}>Sign In</Button>
                                        </SignInButton>
                                        <SignUpButton mode="modal">
                                            <Button variant="primary" className="w-full justify-center">Register</Button>
                                        </SignUpButton>
                                    </div>
                                </SignedOut>
                                <SignedIn>
                                    <div className="flex items-center gap-4 py-2">
                                        <UserButton />
                                        <span className={`${isDashboard ? 'text-orange-600/70' : 'text-white/70'} text-sm`}>Manage Account</span>
                                    </div>
                                </SignedIn>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav >
    );
}
