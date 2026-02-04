'use client';

import Navbar from "@/components/Navbar";
import { motion } from "framer-motion";
import { Info, Target, Shield, Users, Leaf, Navigation } from "lucide-react";

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-[#051c14] text-white">
            <Navbar />

            <main className="pt-32 pb-20 px-6">
                <div className="max-w-4xl mx-auto space-y-16">
                    {/* Hero Section */}
                    <div className="text-center space-y-4">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium"
                        >
                            <Info size={16} />
                            About the Project
                        </motion.div>
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-4xl md:text-6xl font-black tracking-tight"
                        >
                            Sustainable Tourism <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-300">
                                for the Nilgiris
                            </span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-white/60 text-lg max-w-2xl mx-auto"
                        >
                            Nilgiri Smart Pass is an AI-powered initiative to manage tourism flow,
                            preserve the fragile ecosystem of the Blue Mountains, and provide
                            a seamless experience for every traveler.
                        </motion.p>
                    </div>

                    {/* Mission Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
                        <MissionCard
                            icon={<Target className="text-emerald-400" />}
                            title="Our Vision"
                            description="To transform Nilgiris into a world-class example of sustainable and tech-driven tourism management."
                            delay={0.3}
                        />
                        <MissionCard
                            icon={<Shield className="text-blue-400" />}
                            title="Safe & Secure"
                            description="AI-driven crowd monitoring and real-time traffic updates ensure your journey is safe and predictable."
                            delay={0.4}
                        />
                        <MissionCard
                            icon={<Leaf className="text-green-400" />}
                            title="Eco-Preservation"
                            description="By controlling vehicle inflow, we reduce the carbon footprint and protect the unique flora and fauna."
                            delay={0.5}
                        />
                        <MissionCard
                            icon={<Navigation className="text-purple-400" />}
                            title="Smart Navigation"
                            description="Hyper-local data and parking-first routing to help you spend more time exploring and less time in traffic."
                            delay={0.6}
                        />
                    </div>

                    {/* Narrative Section */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        className="p-8 md:p-12 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl space-y-6"
                    >
                        <h2 className="text-2xl font-bold">The Problem We're Solving</h2>
                        <div className="space-y-4 text-white/70 leading-relaxed text-lg">
                            <p>
                                Every year, millions of tourists visit Ooty and the surrounding Nilgiris.
                                While tourism is vital for the local economy, the sudden surge in traffic
                                often leads to massive congestion, lack of parking, and environmental strain.
                            </p>
                            <p>
                                Nilgiri Smart Pass solves this by integrating an <strong>E-Pass system</strong> with
                                <strong> Real-time Crowd Analytics</strong>. We don't just issue passes; we guide
                                you to spots that are less crowded, recommend optimal travel times, and even
                                help you book parking before you arrive.
                            </p>
                        </div>
                    </motion.div>

                    {/* Values */}
                    <div className="flex flex-wrap justify-center gap-12 pt-8 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                        <div className="flex items-center gap-2 font-bold tracking-widest text-xs uppercase">
                            <Users size={18} />
                            Community First
                        </div>
                        <div className="flex items-center gap-2 font-bold tracking-widest text-xs uppercase">
                            <Leaf size={18} />
                            100% Sustainable
                        </div>
                        <div className="flex items-center gap-2 font-bold tracking-widest text-xs uppercase">
                            <Shield size={18} />
                            Data Privacy
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="py-12 border-t border-white/5 bg-black/20 text-center text-white/40 text-sm">
                <p>© 2024 Nilgiri E-Pass & Smart Tourism Management System.</p>
            </footer>
        </div>
    );
}

function MissionCard({ icon, title, description, delay }: { icon: React.ReactNode, title: string, description: string, delay: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay }}
            className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/30 transition-all group"
        >
            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                {icon}
            </div>
            <h3 className="text-xl font-bold mb-2">{title}</h3>
            <p className="text-white/50 leading-relaxed">{description}</p>
        </motion.div>
    );
}
