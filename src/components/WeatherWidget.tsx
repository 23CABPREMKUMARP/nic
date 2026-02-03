'use client';

import { useEffect, useState } from "react";
import { getWeather, getWeatherCondition, WeatherData } from "@/services/weatherService";
import { motion } from "framer-motion";
import Link from "next/link";
import { Cloud, Wind, Droplets, MapPin, Loader2 } from "lucide-react";

export default function WeatherWidget() {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState(true);

    const [time, setTime] = useState<Date | null>(null);

    useEffect(() => {
        setTime(new Date());
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const fetchWeather = () => {
            getWeather('Ooty').then(data => {
                setWeather(data);
                setLoading(false);
            });
        };

        fetchWeather(); // Initial fetch
        const interval = setInterval(fetchWeather, 5000); // Fetch every 5 seconds for "Real-time" feel

        return () => clearInterval(interval);
    }, []);

    if (loading) return (
        <div className="hidden md:flex flex-col gap-2 p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 w-64 animate-pulse">
            <div className="h-6 w-32 bg-white/10 rounded"></div>
            <div className="h-8 w-16 bg-white/10 rounded"></div>
        </div>
    );

    if (!weather) return null;

    const condition = getWeatherCondition(weather.current.code);
    const isGoodTime = condition.type === 'GOOD' || condition.type === 'OK';

    return (
        <Link href="/weather">
            <motion.div
                whileHover={{ scale: 1.02 }}
                className="hidden md:block absolute top-28 left-6 z-20 w-64 cursor-pointer"
            >
                <div className="bg-white/80 backdrop-blur-xl border border-white/40 shadow-xl rounded-2xl p-4 text-gray-800">
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-1 text-xs font-bold text-gray-500 uppercase tracking-wider">
                            <MapPin size={12} /> Ooty • {time ? time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                        </div>
                        {isGoodTime && (
                            <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-200">
                                Best Time Visit
                            </span>
                        )}
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-4xl">{condition.icon}</span>
                            <div>
                                <p className="text-3xl font-bold leading-none">{Math.round(weather.current.temp)}°</p>
                                <p className="text-[10px] text-gray-500 font-medium">Feels {Math.round(weather.current.feelsLike)}°</p>
                                <p className="text-xs font-semibold text-gray-600">{condition.label}</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-1.5 text-gray-600 bg-gray-50 p-1.5 rounded-lg">
                            <Wind size={14} className="text-blue-400" />
                            <span>{weather.current.windSpeed} km/h</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-600 bg-gray-50 p-1.5 rounded-lg">
                            <Droplets size={14} className="text-blue-400" />
                            <span>{weather.current.humidity}%</span>
                        </div>
                    </div>
                </div>
            </motion.div>
        </Link>
    );
}
