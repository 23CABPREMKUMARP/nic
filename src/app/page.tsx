'use client';
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, MapPin, QrCode, ShieldCheck, Car } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 px-6 overflow-hidden">
        <div className="max-w-5xl mx-auto text-center z-10 space-y-8">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60 drop-shadow-2xl"
          >
            Explore Nilgiris Responsibly
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-xl text-white/80 max-w-2xl mx-auto"
          >
            Smart E-Pass System with Real-time Parking & Crowd Analytics.
            Protecting nature while ensuring a seamless graphical experience.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link href="/dashboard">
              <Button variant="primary" className="text-lg px-8 py-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-500 border-none shadow-[0_0_40px_-10px_rgba(16,185,129,0.5)]">
                Get E-Pass Now <ArrowRight className="ml-2" />
              </Button>
            </Link>
            <Link href="/map">
              <Button variant="glass" className="text-lg px-8 py-6 rounded-2xl">
                Live Map Status
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6 relative z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <FeatureCard
            icon={<QrCode className="w-8 h-8 text-green-400" />}
            title="Instant QR Pass"
            desc="Generate entry passes instantly. Contactless verification at all checkpoints."
          />
          <FeatureCard
            icon={<Car className="w-8 h-8 text-blue-400" />}
            title="Smart Parking"
            desc="Check real-time slot availability before you reach the destination."
          />
          <FeatureCard
            icon={<ShieldCheck className="w-8 h-8 text-yellow-400" />}
            title="Crowd Control"
            desc="AI-driven crowd density monitoring to suggest less crowded spots."
          />
          <FeatureCard
            icon={<MapPin className="w-8 h-8 text-red-400" />}
            title="GPS Navigation"
            desc="Offline-ready maps guiding you to verified tourist spots safely."
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-white/40 text-sm relative z-10 glass border-t border-white/5">
        <p>© 2024 Nilgiri E-Pass System. Built for Sustainable Tourism.</p>
      </footer>
    </>
  );
}

function FeatureCard({ icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="glass-card p-8 flex flex-col gap-4 bg-black/20 border-white/5 hover:border-white/20"
    >
      <div className="bg-white/5 w-14 h-14 rounded-full flex items-center justify-center border border-white/10">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-white">{title}</h3>
      <p className="text-white/60 leading-relaxed">{desc}</p>
    </motion.div>
  )
}
