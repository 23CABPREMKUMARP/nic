'use client';

import { MapContainer, TileLayer, Marker, Polyline, Circle, LayersControl, ZoomControl, LayerGroup, useMap, Popup, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import { Navigation, Star, CloudRain, Users, X, MapPin, Search, Locate, Info, Volume2, AlertTriangle, Sparkles, Flag, Camera, Clock, ArrowRight, Car, Bike, Footprints, Save, Share2, MessageSquare, Zap, Activity, ListChecks, LayoutGrid, CalendarPlus, Mic } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Badge } from "@/components/ui/badge";
import { useLiveLocation } from "@/hooks/useLiveLocation";
import { RealtimeEngine } from "@/services/realtimeEngine";
import { socket } from "@/services/socketService";
import { RedirectLive } from "@/services/redirectLive";
import SmartNavigationHUD from "@/components/navigation/SmartNavigationHUD";
import FilterPanel from "./FilterPanel";
import { CrowdService } from "@/services/navigation/crowdService";

// Fix Leaflet Icons
const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const iconRetinaUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl,
    iconRetinaUrl,
    shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const ParkingIcon = (color: string) => L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>`,
    iconSize: [14, 14]
});

const AttractionIcon = (color: string = '#3b82f6') => L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: ${color}; width: 18px; height: 18px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"><div style="width: 100%; height: 100%; border-radius: 50%; background: white; opacity: 0.2; transform: scale(0.5); border: 1px solid white;"></div></div>`,
    iconSize: [18, 18]
});

function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.setView(center, zoom, { animate: true, duration: 1.5 });
        }
    }, [center, zoom, map]);
    return null;
}

export default function LiveMapComponent() {
    const [locations, setLocations] = useState<any>({ attractions: [], parking: [], heatmap: [], trafficFlow: [], junctions: [] });
    const [selectedPlace, setSelectedPlace] = useState<any>(null);
    const [showRedirectHUD, setShowRedirectHUD] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false);
    const [route, setRoute] = useState<[number, number][] | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [mapCenter, setMapCenter] = useState<[number, number]>([11.4102, 76.6950]);
    const [mapZoom, setMapZoom] = useState(14);
    const [navMode, setNavMode] = useState<'driving' | 'walking' | 'cycling'>('driving');
    const [isStreamActive, setIsStreamActive] = useState(false);
    const [activeFilter, setActiveFilter] = useState<string | null>(null);
    const [activeLoop, setActiveLoop] = useState<string | null>(null);
    const [weatherCondition, setWeatherCondition] = useState<'misty' | 'sunny' | 'rainy'>('sunny');
    const [showFullNav, setShowFullNav] = useState(false);
    const [localTime, setLocalTime] = useState(new Date());
    const [showAdvFilters, setShowAdvFilters] = useState(false);
    const [advFilters, setAdvFilters] = useState<any>({ category: null, time: null, personal: null, distance: null });
    const [travelPlan, setTravelPlan] = useState<any[]>([]);
    const [showPlanner, setShowPlanner] = useState(false);

    const { location: gps, error: gpsError } = useLiveLocation();

    const currentHour = localTime.getHours();
    const isSchoolRush = (currentHour >= 8 && currentHour <= 9) || (currentHour >= 15 && currentHour <= 16);
    const isMarketRush = currentHour >= 16 && currentHour <= 19;

    const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    const addToPlan = (spot: any) => {
        if (!travelPlan.find(s => s.id === spot.id)) {
            setTravelPlan([...travelPlan, spot]);
        }
    };

    const getAISuggestion = () => {
        if (weatherCondition === 'misty') return { title: "Misty Magic", text: "Perfect for Rose Garden selfies & Boat House rowing.", icon: <CloudRain className="text-blue-400" /> };
        if (weatherCondition === 'sunny') return { title: "Clear Views", text: "Ideal visibility for Doddabetta Peak & Pykara Falls.", icon: <Sparkles className="text-amber-400" /> };
        return { title: "Stay Safe", text: "Heavy rain detected. Stick to indoor Tea Factory tours.", icon: <AlertTriangle className="text-rose-400" /> };
    };

    const suggestion = getAISuggestion();

    useEffect(() => {
        setIsStreamActive(true);
        const unsubscribe = RealtimeEngine.subscribe((data) => {
            if (data) {
                setLocations((prev: any) => ({ ...prev, ...data }));
                if (selectedPlace) {
                    const fresh = [...(data.attractions || []), ...(data.parking || [])].find(p => p.id === selectedPlace.id);
                    if (fresh) setSelectedPlace((prev: any) => ({ ...prev, ...fresh }));
                }
            }
        });
        RedirectLive.initWatcher();
        socket.on('REDIRECT_TRIGGER', (event: any) => {
            if (isNavigating && selectedPlace?.id === event.spotId) {
                setShowRedirectHUD(true);
                if (typeof window !== 'undefined' && window.speechSynthesis) {
                    window.speechSynthesis.speak(new SpeechSynthesisUtterance(`Rerouting due to ${event.reason} at ${event.name}`));
                }
            }
        });
        return () => {
            unsubscribe();
            setIsStreamActive(false);
        };
    }, [isNavigating, selectedPlace?.id]);

    useEffect(() => {
        if (gps) socket.trackBackground('user_demo_1', gps);
    }, [gps]);

    const userLocation: [number, number] | null = gps ? [gps.latitude, gps.longitude] : null;

    const drawRoute = (lat: number, lng: number) => {
        if (!userLocation) return;
        setIsNavigating(true);
        setShowFullNav(true);
        setRoute([userLocation, [lat, lng]]);
        setMapCenter([lat, lng]);
        setMapZoom(16);
    };

    const handleRedirect = (newPlace: any) => {
        setShowRedirectHUD(false);
        setSelectedPlace(newPlace);
        drawRoute(newPlace.latitude, newPlace.longitude);
    };

    const locateMe = () => {
        if (gps) {
            setMapCenter([gps.latitude, gps.longitude]);
            setMapZoom(17);
        } else {
            alert("Searching for GPS signal...");
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const found = locations.attractions.find((a: any) =>
            a.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
        if (found) {
            setSelectedPlace(found);
            setMapCenter([found.latitude, found.longitude]);
            setMapZoom(16);
            setShowSearchResults(false);
        }
    };

    useEffect(() => {
        if (activeLoop === 'City Loop') setMapCenter([11.4102, 76.6950]);
        if (activeLoop === 'Lake Loop') setMapCenter([11.4050, 76.6910]);
        if (activeLoop === 'Hill Top') setMapCenter([11.3980, 76.7350]);
        if (activeLoop) setMapZoom(15);
    }, [activeLoop]);

    return (
        <div className="relative w-full h-[calc(100vh-80px)] rounded-[32px] overflow-hidden shadow-2xl border-4 border-white">
            <MapContainer
                center={mapCenter}
                zoom={mapZoom}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
            >
                <ChangeView center={mapCenter} zoom={mapZoom} />

                <LayersControl position="topright">
                    <LayersControl.BaseLayer checked name="Satellite View">
                        <TileLayer url="https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}" subdomains={['mt0', 'mt1', 'mt2', 'mt3']} />
                    </LayersControl.BaseLayer>
                    <LayersControl.BaseLayer name="Terrain View">
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    </LayersControl.BaseLayer>

                    <LayersControl.Overlay checked name="Traffic Flow">
                        <LayerGroup>
                            {locations.trafficFlow?.map((flow: any, i: number) => (
                                <Polyline
                                    key={i} positions={[flow.start, flow.end]}
                                    pathOptions={{
                                        color: flow.status === 'BLOCKED' || flow.status === 'HEAVY' ? '#ef4444' : flow.status === 'MODERATE' ? '#f59e0b' : '#22c55e',
                                        weight: 6, opacity: 0.6, lineCap: 'round'
                                    }}
                                />
                            ))}
                        </LayerGroup>
                    </LayersControl.Overlay>
                </LayersControl>

                {locations.attractions
                    .filter((loc: any) => {
                        if (activeLoop === 'City Loop' && ['botanical-garden', 'charring-cross', 'main-bus-stand'].includes(loc.id)) return true;
                        if (activeLoop === 'Garden Loop' && ['botanical-garden', 'rose-garden', 'karnataka-garden'].includes(loc.id)) return true;
                        if (activeLoop === 'Lake Loop' && ['ooty-boat-house', '9th-mile', 'pykara-falls'].includes(loc.id)) return true;
                        if (activeLoop === 'Hill Top' && ['doddabetta-peak', 'finger-post-view'].includes(loc.id)) return true;
                        if (activeLoop) return false;

                        if (activeFilter === 'Attractions') return true;
                        if (activeFilter === 'Safest') return loc.crowdLevel === 'SAFE' || loc.crowdLevel === 'LOW';
                        if (activeFilter === 'Parking') return false;

                        if (advFilters.category && loc.category !== advFilters.category) return false;
                        if (advFilters.time && !loc.timeOfDay?.includes(advFilters.time)) return false;
                        if (advFilters.personal && !loc.suitability?.includes(advFilters.personal)) return false;
                        if (advFilters.distance && userLocation) {
                            const d = getDistance(userLocation[0], userLocation[1], loc.latitude, loc.longitude);
                            if (d > parseInt(advFilters.distance)) return false;
                        }

                        if (searchQuery) {
                            const query = searchQuery.toLowerCase();
                            return loc.name.toLowerCase().includes(query) || loc.category?.toLowerCase().includes(query);
                        }
                        return !activeFilter;
                    })
                    .map((loc: any) => {
                        const metrics = CrowdService.getMetrics(loc.id, loc);
                        const statusColor = metrics.crowdLevel === 'OVERFLOW' ? '#ef4444' : metrics.crowdLevel === 'HIGH' ? '#f59e0b' : '#22c55e';
                        return (
                            <Marker
                                key={loc.id}
                                position={[loc.latitude, loc.longitude]}
                                icon={AttractionIcon(statusColor)}
                                eventHandlers={{
                                    click: () => setSelectedPlace({ ...loc, metrics })
                                }}
                            >
                                <Popup>
                                    <div className="p-2 min-w-[240px] font-sans">
                                        {loc.image && <img src={loc.image} className="w-full h-28 object-cover rounded-xl mb-3" />}
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className="font-black text-sm text-slate-900">{loc.name}</h3>
                                            <Badge className="text-[8px] bg-slate-100 text-slate-600 border-none">{loc.category}</Badge>
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-bold mb-3">{loc.tamil_name}</p>
                                        <div className="grid grid-cols-2 gap-2 mb-4">
                                            <div className="bg-slate-50 p-2 rounded-lg">
                                                <p className="text-[8px] font-black text-slate-400 uppercase">Crowd</p>
                                                <p className={`text-[10px] font-black ${metrics.crowdLevel === 'OVERFLOW' ? 'text-rose-600' : 'text-emerald-600'}`}>{metrics.density}%</p>
                                            </div>
                                            <div className="bg-slate-50 p-2 rounded-lg">
                                                <p className="text-[8px] font-black text-slate-400 uppercase">Wait</p>
                                                <p className="text-[10px] font-black text-slate-900">{metrics.waitTime}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => drawRoute(loc.latitude, loc.longitude)} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase">Navigate</button>
                                            <button onClick={() => addToPlan(loc)} className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:text-emerald-600"><CalendarPlus size={16} /></button>
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    })}

                {(locations.junctions || []).map((jn: any) => (
                    <Circle key={jn.id} center={[jn.lat, jn.lng]} radius={15} pathOptions={{ color: '#1e40af', fillColor: '#1e40af', fillOpacity: 1 }}>
                        <Tooltip permanent direction="top" className="police-label">
                            <span className="text-[8px] font-black uppercase text-blue-900">{jn.name}</span>
                        </Tooltip>
                    </Circle>
                ))}

                {locations.parking?.filter((loc: any) => activeFilter === 'Parking' || !activeFilter).map((loc: any) => (
                    <Marker
                        key={loc.id}
                        position={[loc.latitude, loc.longitude]}
                        icon={ParkingIcon(loc.crowdLevel === 'SAFE' ? '#22c55e' : loc.crowdLevel === 'OVERFLOW' ? '#ef4444' : '#f59e0b')}
                        eventHandlers={{ click: () => setSelectedPlace({ ...loc, isParking: true }) }}
                    />
                ))}

                {route && <Polyline positions={route} pathOptions={{ color: '#3b82f6', dashArray: '8, 8', weight: 5, opacity: 0.9 }} />}

                {userLocation && (
                    <Marker position={userLocation} icon={L.divIcon({
                        className: 'user-loc',
                        html: '<div style="background-color: #3b82f6; width: 22px; height: 22px; border-radius: 50%; border: 4px solid white; box-shadow: 0 0 20px rgba(59,130,246,0.6);"></div>',
                        iconSize: [22, 22]
                    })} />
                )}

                {isSchoolRush && <Marker position={[11.4120, 76.6910]} icon={L.divIcon({ html: '<div class="bg-amber-500 p-2 rounded-lg border-2 border-white text-[8px] text-white">SCHOOL ZONE</div>' })} />}
                {isMarketRush && <Marker position={[11.4050, 76.7032]} icon={L.divIcon({ html: '<div class="bg-rose-500 p-2 rounded-lg border-2 border-white text-[8px] text-white">MARKET AREA</div>' })} />}

                <ZoomControl position="bottomright" />
            </MapContainer>

            <AnimatePresence>
                {showAdvFilters && (
                    <FilterPanel activeFilters={advFilters} onFilterChange={(type, value) => setAdvFilters({ ...advFilters, [type]: value })} onClose={() => setShowAdvFilters(false)} />
                )}
            </AnimatePresence>

            <div className="absolute bottom-6 left-6 z-[1001]">
                <button onClick={() => setShowPlanner(!showPlanner)} className="flex items-center gap-3 px-6 py-4 bg-slate-900 text-white rounded-full shadow-2xl border-2 border-white/20">
                    <ListChecks size={20} />
                    <span className="text-xs font-black uppercase tracking-widest">{travelPlan.length} in Plan</span>
                </button>
            </div>

            <AnimatePresence>
                {showPlanner && (
                    <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="absolute bottom-24 left-6 right-6 z-[1001] bg-white/95 backdrop-blur-xl p-6 rounded-[32px] border border-slate-200 shadow-2xl max-h-[40%] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-slate-900">Your Ooty Trip Plan</h3>
                            <button onClick={() => setTravelPlan([])} className="text-[10px] font-black uppercase text-rose-500">Clear</button>
                        </div>
                        {travelPlan.length === 0 ? <p className="text-sm font-bold text-slate-400 text-center py-8">Your plan is empty.</p> : travelPlan.map((p, i) => (
                            <div key={i} className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-2">
                                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 font-black">{i + 1}</div>
                                <div className="flex-1">
                                    <p className="text-[13px] font-black text-slate-900">{p.name}</p>
                                    <p className="text-[10px] font-bold text-slate-400">{p.category}</p>
                                </div>
                                <button onClick={() => setTravelPlan(travelPlan.filter(s => s.id !== p.id))}><X size={16} className="text-slate-300" /></button>
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showFullNav && selectedPlace && userLocation && (
                    <SmartNavigationHUD destination={selectedPlace} userLocation={userLocation} onClose={() => { setShowFullNav(false); setIsNavigating(false); }} />
                )}
            </AnimatePresence>

            <div className="absolute top-24 left-6 z-[1001] flex items-center gap-2 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 shadow-xl">
                <div className={`w-2 h-2 rounded-full ${isStreamActive ? 'bg-emerald-500 shadow-[0_0_10px_#10b981] animate-pulse' : 'bg-gray-500'}`} />
                <span className="text-[10px] font-black text-white uppercase tracking-widest">Live 1s Stream</span>
            </div>

            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[1001] w-[95%] max-w-xl">
                <form onSubmit={handleSearch} className="relative group">
                    <div className="absolute inset-x-0 -top-1 -bottom-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[32px] blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
                    <div className="relative bg-white/90 backdrop-blur-2xl rounded-[28px] shadow-2xl border border-white/50 p-2 flex items-center gap-3">
                        <div className="p-3 bg-blue-50 rounded-2xl"><Search className="text-blue-600" size={20} /></div>
                        <input type="text" placeholder="Search spot, mood, or category..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-transparent border-none outline-none flex-1 text-sm font-bold text-slate-800" />
                        <button type="button" onClick={() => setShowAdvFilters(true)} className={`p-3 rounded-2xl transition-all ${Object.values(advFilters).some(v => v !== null) ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}><LayoutGrid size={20} /></button>
                    </div>
                </form>
            </div>

            <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[2000] flex gap-2 overflow-x-auto pb-4 px-4 scrollbar-none w-full max-w-xl justify-center pointer-events-none">
                {['City Loop', 'Garden Loop', 'Lake Loop', 'Hill Top'].map((loop) => (
                    <motion.button key={loop} whileTap={{ scale: 0.95 }} onClick={() => setActiveLoop(activeLoop === loop ? null : loop)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border-2 transition-all pointer-events-auto backdrop-blur-md ${activeLoop === loop ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg' : 'bg-white/80 border-white text-indigo-900'}`}>{loop}</motion.button>
                ))}
            </div>

            <motion.div initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="absolute top-44 right-6 z-[1001] bg-white/90 backdrop-blur-xl p-4 rounded-[24px] border border-blue-100 shadow-2xl max-w-[220px]">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-50 rounded-xl">{suggestion.icon}</div>
                    <span className="text-[10px] font-black text-blue-600 uppercase">{suggestion.title}</span>
                </div>
                <p className="text-[11px] font-bold text-gray-600 leading-tight mb-3">"{suggestion.text}"</p>
                <div className="flex gap-2">
                    <button onClick={() => setWeatherCondition('misty')} className={`w-3 h-3 rounded-full bg-blue-200 ${weatherCondition === 'misty' ? 'ring-2 ring-blue-500' : ''}`} />
                    <button onClick={() => setWeatherCondition('sunny')} className={`w-3 h-3 rounded-full bg-amber-200 ${weatherCondition === 'sunny' ? 'ring-2 ring-amber-500' : ''}`} />
                    <button onClick={() => setWeatherCondition('rainy')} className={`w-3 h-3 rounded-full bg-rose-200 ${weatherCondition === 'rainy' ? 'ring-2 ring-rose-500' : ''}`} />
                </div>
            </motion.div>

            <div className="absolute top-[85%] left-1/2 -translate-x-1/2 z-[2000] flex gap-3 overflow-x-auto pb-6 px-6 scrollbar-none w-full max-w-2xl justify-center pointer-events-none">
                {[
                    { label: 'Attractions', icon: <Star size={16} /> },
                    { label: 'Parking', icon: <Car size={16} /> },
                    { label: 'Safest', icon: <Activity size={16} /> }
                ].map((filter, i) => (
                    <motion.button key={i} whileTap={{ scale: 0.9 }} onClick={() => setActiveFilter(activeFilter === filter.label ? null : filter.label)} className={`flex items-center gap-3 px-6 py-3.5 backdrop-blur-xl border-2 rounded-full text-[12px] font-black uppercase transition-all pointer-events-auto ${activeFilter === filter.label ? 'bg-red-600 border-red-400 text-white' : 'bg-[#1e40af] border-blue-400 text-white'}`}>{filter.icon} {filter.label}</motion.button>
                ))}
                {(activeFilter || activeLoop) && (
                    <motion.button onClick={() => { setActiveFilter(null); setActiveLoop(null); }} className="p-3.5 bg-white text-rose-600 rounded-full shadow-lg pointer-events-auto border-2 border-rose-100"><X size={20} /></motion.button>
                )}
            </div>

            <AnimatePresence>
                {selectedPlace && (
                    <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 200 }} className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-4xl bg-white z-[1200] rounded-t-[56px] shadow-2xl flex flex-col border-t border-gray-100 max-h-[85vh] overflow-hidden">
                        <div className="w-full h-12 flex justify-center items-center cursor-pointer" onClick={() => setSelectedPlace(null)}><div className="w-24 h-1.5 bg-gray-200 rounded-full"></div></div>
                        <div className="px-10 pb-12 overflow-y-auto scrollbar-none">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h2 className="text-4xl font-black text-gray-900 tracking-tighter mb-2">{selectedPlace.name}</h2>
                                    <div className="flex items-center gap-2"><Badge className="bg-blue-100 text-blue-600 border-none">{selectedPlace.category}</Badge><span className="text-[10px] text-gray-400 font-bold uppercase">{selectedPlace.tamil_name}</span></div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => setSelectedPlace(null)} className="p-4 bg-gray-100 rounded-full"><X size={24} /></button>
                                </div>
                            </div>
                            <div className="rounded-[40px] overflow-hidden aspect-video mb-8 shadow-xl">
                                {selectedPlace.image && <img src={selectedPlace.image} className="w-full h-full object-cover" />}
                            </div>
                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="bg-slate-950 p-8 rounded-[32px] text-white">
                                    <p className="text-[10px] font-black uppercase text-slate-500 mb-2">Crowd Density</p>
                                    <h4 className={`text-4xl font-black ${selectedPlace.metrics?.crowdLevel === 'OVERFLOW' ? 'text-rose-500' : 'text-emerald-500'}`}>{selectedPlace.metrics?.density}%</h4>
                                    <p className="text-xs font-bold opacity-60 mt-2">{selectedPlace.metrics?.description}</p>
                                </div>
                                <div className="bg-blue-50 p-8 rounded-[32px] border border-blue-100">
                                    <p className="text-[10px] font-black uppercase text-blue-400 mb-2">Parking Status</p>
                                    <h4 className="text-4xl font-black text-blue-900">{selectedPlace.metrics?.parkingSlots} <span className="text-sm opacity-40">SLOTS</span></h4>
                                    <p className="text-xs font-bold text-blue-600 mt-2">Available Now</p>
                                </div>
                            </div>
                            <div className="space-y-6 mb-8">
                                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl">
                                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm"><Info size={20} /></div>
                                    <div><p className="text-[10px] font-black text-slate-400 uppercase">Description</p><p className="text-sm font-bold text-slate-700">{selectedPlace.description}</p></div>
                                </div>
                                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl">
                                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm"><Clock size={20} /></div>
                                    <div><p className="text-[10px] font-black text-slate-400 uppercase">Best Time to Visit</p><p className="text-sm font-bold text-slate-700">{selectedPlace.bestTime} ({selectedPlace.weatherTip})</p></div>
                                </div>
                            </div>
                            <button onClick={() => drawRoute(selectedPlace.latitude, selectedPlace.longitude)} className="w-full py-8 bg-blue-600 text-white rounded-[32px] font-black text-xl flex items-center justify-center gap-4 shadow-xl shadow-blue-500/20 hover:bg-blue-700">
                                <Navigation size={24} fill="white" /> Launch Live Guide
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {!selectedPlace && (
                <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} onClick={locateMe} className="absolute bottom-12 right-6 z-[1001] bg-white p-6 rounded-full shadow-2xl border border-white/40"><Locate className="text-blue-600" size={32} /></motion.button>
            )}
        </div>
    );
}
