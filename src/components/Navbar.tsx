'use client';

import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "./ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [lang, setLang] = useState<'EN' | 'TA'>('EN');

    const toggleLang = () => setLang(l => l === 'EN' ? 'TA' : 'EN');

    return (
        <nav className="fixed top-0 left-0 w-full z-50 glass border-b border-white/10 px-6 py-4">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <Link href="/" className="text-2xl font-bold tracking-tighter flex items-center gap-2">
                    {/* Logo Icon could go here */}
                    <span className="text-green-400">Nilgiri</span>
                    <span className="text-white/80">{lang === 'EN' ? 'Pass' : 'பாஸ்'}</span>
                </Link>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center gap-8">
                    <Link href="/dashboard" className="text-white/80 hover:text-white transition-colors">{lang === 'EN' ? 'Dashboard' : 'டாஷ்போர்டு'}</Link>
                    <Link href="/map" className="text-white/80 hover:text-white transition-colors">{lang === 'EN' ? 'Smart Map' : 'வரைபடம்'}</Link>
                    <Link href="/about" className="text-white/80 hover:text-white transition-colors">About</Link>
                    <button onClick={toggleLang} className="text-white/80 hover:text-white transition-colors font-mono border border-white/20 rounded px-2 py-1 text-xs">
                        {lang === 'EN' ? 'TA' : 'EN'}
                    </button>

                    <SignedOut>
                        <div className="flex gap-4">
                            <SignInButton mode="modal">
                                <Button variant="glass" className="py-2 px-4 text-sm">Login</Button>
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
                                    avatarBox: "w-10 h-10 border-2 border-white/20"
                                }
                            }}
                        />
                    </SignedIn>
                </div>

                {/* Mobile Toggle */}
                <button onClick={() => setIsOpen(!isOpen)} className="md:hidden text-white p-2">
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
                        className="md:hidden overflow-hidden bg-[#0f3b28]/95 backdrop-blur-xl border-t border-white/10"
                    >
                        <div className="p-4 flex flex-col gap-4">
                            <Link href="/dashboard" className="block text-white/90 py-2 hover:bg-white/5 rounded px-2">Dashboard</Link>
                            <Link href="/map" className="block text-white/90 py-2 hover:bg-white/5 rounded px-2">Smart Map</Link>
                            <div className="pt-2 border-t border-white/10 mt-2">
                                <SignedOut>
                                    <div className="flex flex-col gap-3">
                                        <SignInButton mode="modal">
                                            <Button variant="glass" className="w-full justify-center">Sign In</Button>
                                        </SignInButton>
                                        <SignUpButton mode="modal">
                                            <Button variant="primary" className="w-full justify-center">Register</Button>
                                        </SignUpButton>
                                    </div>
                                </SignedOut>
                                <SignedIn>
                                    <div className="flex items-center gap-4 py-2">
                                        <UserButton />
                                        <span className="text-white/70 text-sm">Manage Account</span>
                                    </div>
                                </SignedIn>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
