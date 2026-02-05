'use client';

/**
 * Ooty Navigation Map Page
 * Full navigation experience with GraphHopper routing
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import {
    MapPin, Navigation, Layers, ParkingCircle,
    AlertTriangle, RefreshCw, Compass, ChevronUp, ChevronDown,
    Car, Bike, Footprints, Filter, X, LayoutGrid, Image as ImageIcon, TreePine
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import SearchBar from '@/components/navigation/SearchBar';
import NavigationUI from '@/components/navigation/NavigationUI';
import BigIconMode from '@/components/navigation/BigIconMode';
import ImageSelector from '@/components/navigation/ImageSelector';
import { VoiceGuide } from '@/services/navigation/VoiceGuide';
import { HillSafety } from '@/services/navigation/HillSafety';
import { OOTY_SPOTS } from '@/data/ootyMapData';
import { RedirectAdvisor, SuggestionCard } from '@/services/redirect/RedirectAdvisor';
import { ThumbnailUI } from '@/components/traffic/ThumbnailUI';
import { LiveConsent } from '@/components/eco/LiveConsent';
import { GoogleMapContainer } from '@/components/maps/GoogleMapContainer';
import CrowdAnalysisPanel from '@/components/admin/CrowdAnalysisPanel';
import CrowdHeatmap from '@/components/analytics/CrowdHeatmap';


// Dynamic import for MapContainer (Leaflet doesn't work well with SSR)
const MapContainer = dynamic(
    () => import('@/components/navigation/MapContainer'),
    {
        ssr: false,
        loading: () => (
            <div className="w-full h-full bg-gray-100 animate-pulse flex items-center justify-center">
                <div className="text-center text-gray-400">
                    <Compass className="w-12 h-12 mx-auto mb-2 animate-spin" />
                    <p>Loading Map...</p>
                </div>
            </div>
        )
    }
);

interface RouteData {
    distance: number;
    duration: number;
    polyline: [number, number][];
    instructions: any[];
    hillAlerts: any[];
    source: string;
}

type VehicleType = 'car' | 'bike' | 'foot';

export default function MapPage() {
    // Location state
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [destination, setDestination] = useState<{ lat: number; lng: number; name: string; id: string } | null>(null);

    // Route state
    const [route, setRoute] = useState<RouteData | null>(null);
    const [isNavigating, setIsNavigating] = useState(false);
    const [currentInstructionIndex, setCurrentInstructionIndex] = useState(0);
    const [vehicle, setVehicle] = useState<VehicleType>('car');

    // UI state
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [showParking, setShowParking] = useState(true);
    const [showHazards, setShowHazards] = useState(false);
    const [language, setLanguage] = useState<'en' | 'ta'>('en');
    const [bottomSheetExpanded, setBottomSheetExpanded] = useState(true);
    const [showBigIconMode, setShowBigIconMode] = useState(false);
    const [showImageSelector, setShowImageSelector] = useState(false);
    const [redirectSuggestion, setRedirectSuggestion] = useState<SuggestionCard | null>(null);
    const [showAdminPanel, setShowAdminPanel] = useState(false);
    const [ecoConsent, setEcoConsent] = useState(false);
    const [isEcoMode, setIsEcoMode] = useState(false);
    const [showHeatmap, setShowHeatmap] = useState(false);


    const watchIdRef = useRef<number | null>(null);

    // Get user location on mount
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                (error) => {
                    console.warn('Geolocation error:', error);
                    // Default to Ooty center
                    setUserLocation({ lat: 11.4102, lng: 76.6950 });
                },
                { enableHighAccuracy: true, timeout: 10000 }
            );
        } else {
            // Default to Ooty center
            setUserLocation({ lat: 11.4102, lng: 76.6950 });
        }

        // Initialize voice guide
        VoiceGuide.init();

        return () => {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
        };
    }, []);

    // Calculate route when destination is set
    const calculateRoute = useCallback(async () => {
        if (!userLocation || !destination) return;

        setIsLoading(true);
        setError(null);

        try {
            // STEP 1: VALIDATE DESTINATION (PARKING & CROWD)
            const validationRes = await fetch('/api/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ spotId: destination.id })
            });
            const validation = await validationRes.json();

            // Handle Redirection / Blocking
            if (validation.action === 'REDIRECT' || validation.action === 'BLOCK') {
                setError(validation.message);

                // Show suggestion if available
                if (validation.suggestion) {
                    setRedirectSuggestion(validation.suggestion);
                }

                // Stop routing if blocked/redirected
                setIsLoading(false);
                return;
            }

            // STEP 2: CALCULATE ROUTE
            const response = await fetch('/api/navigation/route', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    start: userLocation,
                    destinationId: destination.id,
                    vehicle,
                    options: {
                        avoidCrowds: true,
                        parkingFirst: vehicle === 'car'
                    }
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to calculate route');
            }

            // Handle parking-first route
            if (data.type === 'parking-first') {
                setRoute({
                    distance: data.totalDistance,
                    duration: data.totalDuration,
                    polyline: data.route.polyline,
                    instructions: [
                        ...data.route.instructions,
                        { text: 'Park your vehicle', tamil: 'வாகனத்தை நிறுத்தவும்', distance: 0, time: 0, coordinate: [data.parking.coordinates.lat, data.parking.coordinates.lng] },
                        ...data.walking.instructions
                    ],
                    hillAlerts: data.hillAlerts || [],
                    source: data.route.source
                });
            } else {
                setRoute({
                    distance: data.route.distance,
                    duration: data.route.duration,
                    polyline: data.route.polyline,
                    instructions: data.route.instructions,
                    hillAlerts: data.hillAlerts || [],
                    source: data.route.source
                });
            }

            // Check for reroute suggestions
            if (data.reroute?.shouldReroute) {
                VoiceGuide.announceReroute(data.reroute.reason);
            }

        } catch (err: any) {
            console.error('Route calculation error:', err);
            // Simple generic error for API failures
            setError(err.message || 'Failed to calculate route. Please check your connection.');
        } finally {
            setIsLoading(false);
        }
    }, [userLocation, destination, vehicle]);

    // Recalculate route when destination or vehicle changes
    useEffect(() => {
        if (destination) {
            calculateRoute();
        }
    }, [destination, vehicle, calculateRoute]);

    // Handle spot selection from search
    const handleSpotSelect = useCallback((spot: any) => {
        setDestination({
            lat: spot.latitude,
            lng: spot.longitude,
            name: spot.name,
            id: spot.id
        });
        setBottomSheetExpanded(true);

        // Check for crowd and redirects
        RedirectAdvisor.checkAndSuggest(spot.id).then(suggestion => {
            if (suggestion) {
                setRedirectSuggestion(suggestion);
                // Announce redirect if voice is active
                VoiceGuide.announceReroute(`Crowd alert: ${spot.name} is busy. Suggesting ${suggestion.suggestedSpot.name} instead.`);
            } else {
                setRedirectSuggestion(null);
            }
        });
    }, []);

    // Handle spot click from map
    const handleMapSpotClick = useCallback((spotId: string) => {
        const spot = OOTY_SPOTS.find(s => s.id === spotId);
        if (spot) {
            handleSpotSelect(spot);
        }
    }, [handleSpotSelect]);

    // Start navigation
    const startNavigation = useCallback(() => {
        if (!route) return;

        setIsNavigating(true);
        setCurrentInstructionIndex(0);
        HillSafety.startTrip();

        // Start watching location
        if (navigator.geolocation) {
            watchIdRef.current = navigator.geolocation.watchPosition(
                (position) => {
                    const newLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    setUserLocation(newLocation);

                    // Check for hill hazards
                    const alerts = HillSafety.checkLocation(newLocation.lat, newLocation.lng);
                    // Alerts are announced via VoiceGuide inside HillSafety

                    // TODO: Update current instruction based on proximity
                },
                (error) => {
                    console.warn('Location watch error:', error);
                },
                { enableHighAccuracy: true, maximumAge: 1000 }
            );
        }

        // Announce first instruction
        if (route.instructions[0]) {
            VoiceGuide.announceInstruction(route.instructions[0]);
        }
    }, [route]);

    // End navigation
    const endNavigation = useCallback(() => {
        setIsNavigating(false);
        setCurrentInstructionIndex(0);
        HillSafety.endTrip();

        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }

        VoiceGuide.stop();
    }, []);

    // Clear destination
    const clearDestination = useCallback(() => {
        setDestination(null);
        setRoute(null);
        setIsNavigating(false);
        endNavigation();
    }, [endNavigation]);

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Navbar />

            <main className="flex-1 relative">
                {/* Map */}
                <div className="absolute inset-0">
                    {isEcoMode ? (
                        <GoogleMapContainer spots={OOTY_SPOTS} userId="test-user" />
                    ) : (
                        <MapContainer
                            center={[11.4102, 76.6950]}
                            zoom={13}
                            userLocation={userLocation}
                            destination={destination}
                            route={route?.polyline}
                            onSpotClick={handleMapSpotClick}
                            showParking={showParking}
                            showHazards={showHazards}
                            className="w-full h-full"
                        />
                    )}
                </div>

                {/* Navigation UI (when navigating) */}
                {isNavigating && route && (
                    <NavigationUI
                        instructions={route.instructions}
                        hillAlerts={route.hillAlerts}
                        currentIndex={currentInstructionIndex}
                        distance={route.distance}
                        duration={route.duration}
                        isNavigating={isNavigating}
                        onClose={endNavigation}
                        language={language}
                        onLanguageChange={setLanguage}
                    />
                )}

                {/* Search Bar (when not navigating) */}
                {!isNavigating && (
                    <div className="absolute top-24 left-4 right-4 z-[500]">
                        <SearchBar
                            onSelect={handleSpotSelect}
                            placeholder="Where would you like to go?"
                        />
                    </div>
                )}

                {/* Filter Button */}
                {!isNavigating && (
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="absolute top-44 right-4 z-[500] bg-white p-3 rounded-full shadow-lg hover:bg-gray-50 transition"
                    >
                        <Filter className="w-5 h-5 text-gray-600" />
                    </button>
                )}

                {/* Visual Navigation Buttons */}
                {!isNavigating && (
                    <div className="absolute top-44 left-4 z-[500] flex flex-col gap-2">
                        {/* Admin Toggle */}
                        <button
                            onClick={() => setShowAdminPanel(!showAdminPanel)}
                            className="bg-white p-3 rounded-full shadow-lg hover:bg-gray-50 transition"
                            title="Crowd Control"
                        >
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                        </button>

                        {/* Eco Mode Toggle */}
                        <button
                            onClick={() => setIsEcoMode(!isEcoMode)}
                            className={`p-3 rounded-full shadow-lg transition ${isEcoMode ? 'bg-emerald-600 text-white' : 'bg-white text-emerald-600'}`}
                            title="Eco Mode (Google Maps)"
                        >
                            <TreePine className="w-5 h-5" />
                        </button>
                    </div>
                )}

                {/* Crowd Analysis Panel */}
                {showAdminPanel && !isNavigating && (
                    <CrowdAnalysisPanel onClose={() => setShowAdminPanel(false)} />
                )}

                {/* Heatmap Overlay */}
                {showHeatmap && (
                    <CrowdHeatmap />
                )}

                {/* Filter Panel */}
                {showFilters && !isNavigating && (
                    <div className="absolute top-56 right-4 z-[500] bg-white rounded-2xl shadow-xl p-4 w-64">
                        <div className="flex items-center justify-between mb-4">
                            <span className="font-medium">Map Layers</span>
                            <button onClick={() => setShowFilters(false)}>
                                <X className="w-4 h-4 text-gray-400" />
                            </button>
                        </div>
                        <label className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                            <input
                                type="checkbox"
                                checked={showParking}
                                onChange={(e) => setShowParking(e.target.checked)}
                                className="w-4 h-4 rounded text-blue-500"
                            />
                            <ParkingCircle className="w-5 h-5 text-green-500" />
                            <span>Parking</span>
                        </label>
                        <label className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                            <input
                                type="checkbox"
                                checked={showHazards}
                                onChange={(e) => setShowHazards(e.target.checked)}
                                className="w-4 h-4 rounded text-blue-500"
                            />
                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                            <span>Hill Alerts</span>
                        </label>
                        <label className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                            <input
                                type="checkbox"
                                checked={showHeatmap}
                                onChange={(e) => setShowHeatmap(e.target.checked)}
                                className="w-4 h-4 rounded text-blue-500"
                            />
                            <Layers className="w-5 h-5 text-purple-500" />
                            <span>Crowd Heatmap</span>
                        </label>
                    </div>
                )}

                {/* Bottom Sheet (Route Details) */}
                {destination && !isNavigating && (
                    <div className={`absolute bottom-0 left-0 right-0 z-[500] bg-white rounded-t-3xl shadow-2xl transition-transform duration-300 ${bottomSheetExpanded ? 'translate-y-0' : 'translate-y-[calc(100%-80px)]'}`}>
                        {/* Handle */}
                        <button
                            onClick={() => setBottomSheetExpanded(!bottomSheetExpanded)}
                            className="w-full py-3 flex items-center justify-center"
                        >
                            <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
                        </button>

                        {/* Collapsed View */}
                        {!bottomSheetExpanded && (
                            <div className="px-6 pb-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold">{destination.name}</p>
                                        {route && (
                                            <p className="text-sm text-gray-500">
                                                {route.distance.toFixed(1)} km • {Math.round(route.duration)} min
                                            </p>
                                        )}
                                    </div>
                                    <ChevronUp className="w-5 h-5 text-gray-400" />
                                </div>
                            </div>
                        )}

                        {/* Expanded View */}
                        {bottomSheetExpanded && (
                            <div className="px-6 pb-6">
                                {/* Destination Info */}
                                <div className="flex items-start gap-4 mb-6">
                                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                        <MapPin className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <h2 className="text-lg font-semibold">{destination.name}</h2>
                                            <button onClick={clearDestination} className="p-2 hover:bg-gray-100 rounded-full">
                                                <X className="w-5 h-5 text-gray-400" />
                                            </button>
                                        </div>
                                        {route ? (
                                            <div className="flex items-center gap-4 mt-1">
                                                <span className="text-gray-600">{route.distance.toFixed(1)} km</span>
                                                <span className="text-gray-400">•</span>
                                                <span className="text-gray-600">{Math.round(route.duration)} min</span>
                                                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                                    via {route.source}
                                                </span>
                                            </div>
                                        ) : isLoading ? (
                                            <p className="text-sm text-gray-400">Calculating route...</p>
                                        ) : null}
                                    </div>
                                </div>

                                {/* Vehicle Type Selector */}
                                <div className="flex gap-2 mb-6">
                                    {[
                                        { id: 'car' as const, icon: Car, label: 'Car' },
                                        { id: 'bike' as const, icon: Bike, label: 'Bike' },
                                        { id: 'foot' as const, icon: Footprints, label: 'Walk' }
                                    ].map(({ id, icon: Icon, label }) => (
                                        <button
                                            key={id}
                                            onClick={() => setVehicle(id)}
                                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition ${vehicle === id
                                                ? 'bg-blue-500 text-white'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                        >
                                            <Icon className="w-5 h-5" />
                                            <span className="text-sm font-medium">{label}</span>
                                        </button>
                                    ))}
                                </div>

                                {/* Error Message */}
                                {error && (
                                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                                        {error}
                                    </div>
                                )}

                                {/* Hill Alerts Preview */}
                                {route?.hillAlerts && route.hillAlerts.length > 0 && (
                                    <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                                        <div className="flex items-center gap-2 mb-2">
                                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                                            <span className="font-medium text-amber-800">Route Warnings</span>
                                        </div>
                                        <ul className="space-y-1">
                                            {route.hillAlerts.slice(0, 2).map((alert, idx) => (
                                                <li key={idx} className="text-sm text-amber-700">
                                                    • {alert.name}
                                                </li>
                                            ))}
                                            {route.hillAlerts.length > 2 && (
                                                <li className="text-sm text-amber-500">
                                                    +{route.hillAlerts.length - 2} more alerts
                                                </li>
                                            )}
                                        </ul>
                                    </div>
                                )}

                                {/* Start Navigation Button */}
                                <button
                                    onClick={startNavigation}
                                    disabled={!route || isLoading}
                                    className="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl font-semibold flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-600 hover:to-blue-700 transition shadow-lg shadow-blue-500/30"
                                >
                                    {isLoading ? (
                                        <>
                                            <RefreshCw className="w-5 h-5 animate-spin" />
                                            Calculating...
                                        </>
                                    ) : (
                                        <>
                                            <Navigation className="w-5 h-5" />
                                            Start Navigation
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Default state message */}
                {!destination && !isNavigating && (
                    <div className="absolute bottom-8 left-4 right-4 z-[500]">
                        <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
                            <Navigation className="w-10 h-10 text-blue-500 mx-auto mb-3" />
                            <h3 className="font-semibold text-gray-800 mb-1">Ooty Navigation</h3>
                            <p className="text-sm text-gray-500">
                                Search for a destination or tap on a spot to start navigating
                            </p>
                        </div>
                    </div>
                )}

                {/* Accessibility Components */}
                <BigIconMode
                    active={showBigIconMode}
                    onClose={() => setShowBigIconMode(false)}
                    onSelectDestination={(id) => {
                        handleMapSpotClick(id);
                        setShowBigIconMode(false);
                    }}
                    onStartNavigation={() => { }}
                    onGoSafe={() => { }}
                />

                <ImageSelector
                    active={showImageSelector}
                    onClose={() => setShowImageSelector(false)}
                    onSelect={(id) => {
                        handleMapSpotClick(id);
                        setShowImageSelector(false);
                    }}
                />

                {/* Redirect Suggestion Overlay */}
                {redirectSuggestion && !isNavigating && (
                    <ThumbnailUI
                        suggestion={redirectSuggestion}
                        onNavigate={(spotId) => {
                            handleMapSpotClick(spotId);
                            setRedirectSuggestion(null);
                        }}
                        onDismiss={() => setRedirectSuggestion(null)}
                        onBook={(spotId) => {
                            // Mock booking logic
                            alert(`Parking slot reserved at ${redirectSuggestion.suggestedSpot.name}! Navigation starting...`);
                            handleMapSpotClick(spotId);
                            setRedirectSuggestion(null);
                        }}
                    />
                )}

                <LiveConsent onConsent={(granted) => {

                    setEcoConsent(granted);
                    if (granted) {
                        fetch('/api/eco/location', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ userId: 'test-user', consent: true })
                        }).then(() => {
                            // Award initial points for consenting
                            fetch('/api/eco/points', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ userId: 'test-user', action: 'SHARE_LOCATION' })
                            });
                        });
                    }
                }} />
            </main>
        </div>

    );
}
