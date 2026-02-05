
import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

interface Spot {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    ecoRating?: number;
}

interface GoogleMapContainerProps {
    spots: Spot[];
    userId?: string;
}

export const GoogleMapContainer: React.FC<GoogleMapContainerProps> = ({ spots, userId }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const [map, setMap] = useState<google.maps.Map | null>(null);

    useEffect(() => {
        const loader = new Loader({
            apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
            version: 'weekly',
        });

        const initMap = async () => {
            try {
                const { Map } = await loader.importLibrary('maps') as google.maps.MapsLibrary;
                const { Marker } = await loader.importLibrary('marker') as google.maps.MarkerLibrary;

                if (mapRef.current) {
                    const ootyCenter = { lat: 11.4102, lng: 76.6950 };
                    const newMap = new Map(mapRef.current, {
                        center: ootyCenter,
                        zoom: 13,
                        mapId: 'OOTY_ECO_MAP',
                        styles: [
                            {
                                "featureType": "all",
                                "elementType": "labels.text.fill",
                                "stylers": [{ "color": "#2c3e50" }]
                            },
                            {
                                "featureType": "landscape",
                                "elementType": "all",
                                "stylers": [{ "color": "#f1f8e9" }]
                            },
                            {
                                "featureType": "poi.park",
                                "elementType": "all",
                                "stylers": [{ "color": "#81c784" }]
                            }
                        ]
                    });

                    setMap(newMap);

                    // Add Spot Markers
                    spots.forEach(spot => {
                        new Marker({
                            position: { lat: spot.latitude, lng: spot.longitude },
                            map: newMap,
                            title: spot.name,
                        });
                    });

                    // Real-time location tracking
                    if (navigator.geolocation && userId) {
                        navigator.geolocation.watchPosition(
                            (position) => {
                                const userPos = {
                                    lat: position.coords.latitude,
                                    lng: position.coords.longitude
                                };

                                new Marker({
                                    position: userPos,
                                    map: newMap,
                                    title: "Your Location"
                                });
                            },
                            (error) => console.error("Geolocation error:", error),
                            { enableHighAccuracy: true }
                        );
                    }
                }
            } catch (err) {
                console.error("Google Maps Load Error:", err);
            }
        };

        initMap();
    }, [spots, userId]);

    return (
        <div className="relative w-full h-[600px] rounded-[32px] overflow-hidden shadow-2xl border-4 border-white/50">
            <div ref={mapRef} className="w-full h-full" />

            {/* Overlay Info */}
            <div className="absolute bottom-10 left-10 right-10 flex justify-between items-end pointer-events-none">
                <div className="bg-white/90 backdrop-blur-md p-6 rounded-[24px] shadow-xl border border-white max-w-xs pointer-events-auto">
                    <p className="text-[10px] uppercase font-black text-emerald-600 mb-1">Live Echo Tracking</p>
                    <h3 className="text-lg font-bold text-slate-800">Sustainable Nilgiris</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Your location is being used to analyze crowd density and reward you with Eco Points.
                    </p>
                </div>

                <div className="flex flex-col gap-2 pointer-events-auto">
                    <div className="bg-emerald-600 text-white p-4 rounded-2xl shadow-lg flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-xl">
                            <span className="text-xl font-black">20</span>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-bold opacity-80">Pending Pts</p>
                            <p className="text-sm font-black">Visit Doddabetta</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
