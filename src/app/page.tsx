'use client';
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, MapPin, QrCode, ShieldCheck, Car } from "lucide-react";
import Link from "next/link";

import CloudIntro from "@/components/CloudIntro";
import WeatherWidget from "@/components/WeatherWidget";

export default function Home() {
  return (
    <>
      <CloudIntro />
      <Navbar />
      <WeatherWidget />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 px-6 overflow-hidden">
        <div className="max-w-5xl mx-auto text-center z-10 space-y-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="inline-block relative"
          >
            {/* Stronger dark backdrop for contrast */}
            <div className="absolute -inset-8 bg-black/60 blur-3xl rounded-full" />

            <h1 className="relative text-6xl md:text-8xl font-black text-white tracking-tight leading-tight drop-shadow-2xl">
              Explore Nilgiris <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-400 to-yellow-300 animate-gradient-x py-2 block">
                Responsibly
              </span>
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="inline-block relative px-6 py-2 rounded-2xl bg-black/30 backdrop-blur-sm border border-white/10"
          >
            <p className="text-xl md:text-2xl text-white font-medium drop-shadow-md max-w-2xl mx-auto">
              Smart E-Pass System with Real-time Parking & Crowd Analytics.
              Protecting nature while ensuring a seamless graphical experience.
            </p>
          </motion.div>

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
              <Button variant="secondary" className="text-lg px-8 py-6 rounded-2xl text-emerald-900 border border-emerald-100 shadow-[0_0_30px_-5px_rgba(255,255,255,0.3)]">
                <MapPin className="w-5 h-5" /> Live Map Status
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      {/* Features Grid */}
      <section className="py-24 px-6 relative z-10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.2
              }
            }
          }}
          className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <FeatureCard
            icon={<QrCode className="w-8 h-8 text-white" />}
            title="Instant QR Pass"
            desc="Generate entry passes instantly. Contactless verification at all checkpoints."
          />
          <FeatureCard
            icon={<Car className="w-8 h-8 text-white" />}
            title="Smart Parking"
            desc="Check real-time slot availability before you reach the destination."
          />
          <FeatureCard
            icon={<ShieldCheck className="w-8 h-8 text-white" />}
            title="Crowd Control"
            desc="AI-driven crowd density monitoring to suggest less crowded spots."
          />
          <FeatureCard
            icon={<MapPin className="w-8 h-8 text-white" />}
            title="GPS Navigation"
            desc="Offline-ready maps guiding you to verified tourist spots safely."
          />
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-black/60 text-sm relative z-10 glass border-t border-white/5 bg-white/10 backdrop-blur-md">
        <p>© 2024 Nilgiri E-Pass System. Built for Sustainable Tourism.</p>
      </footer>
    </>
  );
}

function FeatureCard({ icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 50 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
      }}
      whileHover={{ y: -10, scale: 1.02 }}
      className="p-8 flex flex-col gap-4 bg-black/40 backdrop-blur-xl rounded-xl border border-white/10 hover:border-emerald-500/50 shadow-2xl transition-all group"
    >
      <div className="bg-emerald-500/20 w-14 h-14 rounded-full flex items-center justify-center border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)] group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white tracking-wide">{title}</h3>
      <p className="text-gray-300 leading-relaxed font-medium">{desc}</p>
    </motion.div>
  )
}
