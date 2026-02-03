'use client';

import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react";
import { getWeather, getWeatherCondition, getTourismSuggestion, LOCATIONS, WeatherData } from "@/services/weatherService";
import { motion } from "framer-motion";
import { Cloud, MapPin, Wind, Droplets, Calendar, AlertTriangle, Navigation, Umbrella, Sun, Thermometer } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function WeatherPage() {
    const [selectedLoc, setSelectedLoc] = useState('Ooty');
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState<Date | null>(null);

    useEffect(() => {
        setCurrentTime(new Date()); // Initialize on client
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        setLoading(true);
        const fetchWeather = () => {
            getWeather(selectedLoc).then(data => {
                setWeather(data);
                setLoading(false);
            });
        };

        fetchWeather();
        const interval = setInterval(fetchWeather, 5000); // Poll every 5 seconds

        return () => clearInterval(interval);
    }, [selectedLoc]);

    const condition = weather ? getWeatherCondition(weather.current.code) : null;
    const suggestion = weather ? getTourismSuggestion(weather.current.code) : null;

    return (
        <>
            <Navbar />
            <div className="min-h-screen pt-24 pb-12 px-6 bg-[#f8fafc]">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8 text-center"
                    >
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-3">
                            <Cloud className="text-blue-500" /> Tourism Weather Guide
                        </h1>
                        <p className="text-gray-500 mt-2 flex items-center justify-center gap-2">
                            <span>{currentTime ? currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--:--'}</span>
                            <span>•</span>
                            <span>Real-time forecasts to plan your perfect Nilgiri trip.</span>
                        </p>
                    </motion.div>

                    {/* Location Selector */}
                    <div className="flex flex-wrap gap-2 justify-center mb-10">
                        {Object.keys(LOCATIONS).map(loc => (
                            <button
                                key={loc}
                                onClick={() => setSelectedLoc(loc)}
                                className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${selectedLoc === loc
                                    ? 'bg-[#0f3b28] text-white shadow-lg scale-105'
                                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                                    }`}
                            >
                                {loc}
                            </button>
                        ))}
                    </div>

                    {loading ? (
                        <div className="h-96 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
                        </div>
                    ) : (weather && condition && suggestion) ? (
                        <motion.div
                            key={selectedLoc} // Triggers animation on location change
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5 }}
                            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
                        >

                            {/* Main Weather Card */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="lg:col-span-2 bg-white rounded-3xl shadow-xl overflow-hidden relative"
                            >
                                <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${condition.type === 'GOOD' ? 'from-green-400 to-blue-500' : condition.type === 'BAD' ? 'from-gray-700 to-gray-900' : 'from-yellow-400 to-orange-500'}`}></div>

                                <div className="p-6 md:p-8">
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                        <div>
                                            <div className="flex items-center gap-2 text-gray-500 font-bold uppercase tracking-wider text-sm mb-1">
                                                <MapPin size={16} /> {selectedLoc}
                                            </div>
                                            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mt-2">{Math.round(weather.current.temp)}°C</h2>
                                            <p className="text-sm font-medium text-gray-400">Feels like {Math.round(weather.current.feelsLike)}°</p>
                                            <p className="text-xl text-gray-600 font-medium mt-1 flex items-center gap-2">
                                                {condition.icon} {condition.label}
                                            </p>
                                        </div>
                                        <div className="text-right w-full md:w-auto">
                                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border w-full md:w-auto text-center ${condition.type === 'GOOD' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                                {condition.type === 'GOOD' ? 'Ideal for Visiting' : 'Plan Carefully'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-3 md:gap-6 mt-8">
                                        <StatBox icon={<Wind />} label="Wind" value={`${weather.current.windSpeed} km/h`} />
                                        <StatBox icon={<Droplets />} label="Humidity" value={`${weather.current.humidity}%`} />
                                        <StatBox icon={<Umbrella />} label="Rain Risk" value={`${weather.daily.rainProb[0]}%`} />
                                    </div>

                                    {/* Hourly Forecast */}
                                    <div className="mt-8 border-t border-gray-100 pt-6">
                                        <h3 className="text-gray-900 font-bold mb-4 flex items-center gap-2"><Calendar size={18} /> Today's Trend</h3>
                                        <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-hide snap-x">
                                            {weather.hourly.time.filter((_, i) => i % 3 === 0).slice(0, 8).map((time, i) => (
                                                <motion.div
                                                    key={i}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: i * 0.05 }}
                                                    className="snap-start flex-shrink-0 flex flex-col items-center bg-gray-50 hover:bg-gray-100 p-3 rounded-xl min-w-[80px] transition-colors"
                                                >
                                                    <span className="text-xs text-gray-500">{new Date(time).getHours()}:00</span>
                                                    <span className="text-2xl my-2 transform hover:scale-110 transition-transform duration-200">{getWeatherCondition(weather.hourly.code[i * 3]).icon}</span>
                                                    <span className="font-bold text-gray-800">{Math.round(weather.hourly.temp[i * 3])}°</span>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Suggestion Panel */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 }}
                                className="space-y-6"
                            >
                                {/* Activity Card */}
                                <motion.div
                                    whileHover={{ y: -5 }}
                                    className={`rounded-3xl shadow-xl p-6 border transition-all duration-300 ${condition.type === 'GOOD' ? 'bg-green-600 border-green-500 text-white shadow-green-200' : 'bg-white border-gray-200 shadow-gray-200'}`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`p-3 rounded-2xl ${condition.type === 'GOOD' ? 'bg-white/20' : 'bg-blue-50 text-blue-600'}`}>
                                            <Navigation size={24} />
                                        </div>
                                        <div>
                                            <h3 className={`font-bold text-lg ${condition.type === 'GOOD' ? 'text-white' : 'text-gray-900'}`}>{suggestion.action}</h3>
                                            <p className={`text-sm mt-1 opacity-90 ${condition.type === 'GOOD' ? 'text-white' : 'text-gray-500'}`}>
                                                {suggestion.msg}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-6">
                                        <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${condition.type === 'GOOD' ? 'text-green-200' : 'text-gray-400'}`}>Recommended Spots</p>
                                        <div className="flex flex-wrap gap-2">
                                            {suggestion.places.map(place => (
                                                <span key={place} className={`px-3 py-1 rounded-lg text-sm font-medium ${condition.type === 'GOOD' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-700'}`}>
                                                    {place}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>

                                {/* 7 Day Forecast Mini */}
                                <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-200">
                                    <h3 className="font-bold text-gray-900 mb-4">7-Day Forecast</h3>
                                    <div className="space-y-3">
                                        {weather.daily.time.slice(1, 6).map((day, i) => (
                                            <motion.div
                                                key={day}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.1 }}
                                                className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors group cursor-default"
                                            >
                                                <div className="w-20">
                                                    <p className="text-sm font-bold text-gray-700">{new Date(day).toLocaleDateString('en-GB', { weekday: 'short' })}</p>
                                                    <p className="text-xs text-gray-400">{new Date(day).getDate()}/{new Date(day).getMonth() + 1}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xl group-hover:scale-125 transition-transform">{getWeatherCondition(weather.daily.code[i + 1]).icon}</span>
                                                    <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{weather.daily.rainProb[i + 1]}% Rain</span>
                                                </div>
                                                <div className="text-right w-16">
                                                    <span className="font-bold text-gray-900">{Math.round(weather.daily.maxTemp[i + 1])}°</span>
                                                    <span className="text-gray-400 text-sm ml-1">{Math.round(weather.daily.minTemp[i + 1])}°</span>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    ) : (
                        <div className="text-center py-20 text-gray-400">Unable to load weather data</div>
                    )}
                </div>
            </div>
        </>
    );
}

function StatBox({ icon, label, value }: { icon: any, label: string, value: string }) {
    return (
        <div className="bg-gray-50 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
            <div className="text-gray-400 mb-2">{icon}</div>
            <p className="text-gray-900 font-bold text-lg">{value}</p>
            <p className="text-gray-500 text-xs font-medium uppercase">{label}</p>
        </div>
    )
}
