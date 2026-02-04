'use client';

/**
 * MapContainer - Main Leaflet map component with navigation support
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { OOTY_SPOTS, OOTY_PARKING, HILL_HAZARDS } from '@/data/ootyMapData';

// Fix Leaflet default icon issue in Next.js
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom icons
const createIcon = (color: string, emoji: string) => {
    return L.divIcon({
        className: 'custom-marker',
        html: `
            <div style="
                background: ${color};
                width: 36px;
                height: 36px;
                border-radius: 50% 50% 50% 0;
                transform: rotate(-45deg);
                display: flex;
                align-items: center;
                justify-content: center;
                border: 2px solid white;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            ">
                <span style="transform: rotate(45deg); font-size: 16px;">${emoji}</span>
            </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36]
    });
};

const ICONS = {
    attraction: createIcon('#3b82f6', '📍'),
    parking: createIcon('#10b981', '🅿️'),
    user: createIcon('#ef4444', '📍'),
    hazard: createIcon('#f59e0b', '⚠️'),
    destination: createIcon('#8b5cf6', '🎯')
};

interface MapContainerProps {
    center?: [number, number];
    zoom?: number;
    userLocation?: { lat: number; lng: number } | null;
    destination?: { lat: number; lng: number; name?: string } | null;
    route?: [number, number][];
    onMapReady?: (map: L.Map) => void;
    onSpotClick?: (spotId: string) => void;
    showSpots?: boolean;
    showParking?: boolean;
    showHazards?: boolean;
    className?: string;
}

export default function MapContainer({
    center = [11.4102, 76.6950],
    zoom = 13,
    userLocation,
    destination,
    route,
    onMapReady,
    onSpotClick,
    showSpots = true,
    showParking = true,
    showHazards = false,
    className = ''
}: MapContainerProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const routeLayerRef = useRef<L.Polyline | null>(null);
    const userMarkerRef = useRef<L.Marker | null>(null);
    const [isMapReady, setIsMapReady] = useState(false);

    // Initialize map
    useEffect(() => {
        if (!mapRef.current || mapInstanceRef.current) return;

        // Create map instance
        const map = L.map(mapRef.current, {
            center: center,
            zoom: zoom,
            zoomControl: true,
            scrollWheelZoom: true
        });

        // Add OpenStreetMap tiles (free, no API key needed)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 18
        }).addTo(map);

        mapInstanceRef.current = map;
        setIsMapReady(true);

        if (onMapReady) {
            onMapReady(map);
        }

        console.log('🗺️ MapContainer: Initialized');

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);

    // Add tourist spots
    useEffect(() => {
        if (!mapInstanceRef.current || !showSpots) return;

        const map = mapInstanceRef.current;
        const markers: L.Marker[] = [];

        OOTY_SPOTS.forEach(spot => {
            const marker = L.marker([spot.latitude, spot.longitude], {
                icon: ICONS.attraction
            }).addTo(map);

            const popupContent = `
                <div style="min-width: 200px;">
                    <img src="${spot.image}" alt="${spot.name}" 
                        style="width: 100%; height: 100px; object-fit: cover; border-radius: 8px; margin-bottom: 8px;" />
                    <h3 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600;">${spot.name}</h3>
                    <p style="margin: 0 0 4px 0; font-size: 11px; color: #666;">${spot.tamil_name}</p>
                    <p style="margin: 0 0 8px 0; font-size: 12px; color: #444;">${spot.description.slice(0, 80)}...</p>
                    <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                        <span style="background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-size: 10px;">
                            ${spot.openTime} - ${spot.closeTime}
                        </span>
                        <span style="background: #dcfce7; color: #166534; padding: 2px 6px; border-radius: 4px; font-size: 10px;">
                            ${spot.category}
                        </span>
                    </div>
                    ${onSpotClick ? `
                        <button 
                            onclick="window.dispatchEvent(new CustomEvent('spotClick', { detail: '${spot.id}' }))"
                            style="margin-top: 8px; width: 100%; padding: 6px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px;">
                            Navigate Here
                        </button>
                    ` : ''}
                </div>
            `;

            marker.bindPopup(popupContent);
            markers.push(marker);
        });

        // Listen for spot click events
        const handleSpotClick = (e: CustomEvent) => {
            if (onSpotClick) {
                onSpotClick(e.detail);
            }
        };
        window.addEventListener('spotClick', handleSpotClick as EventListener);

        return () => {
            markers.forEach(m => m.remove());
            window.removeEventListener('spotClick', handleSpotClick as EventListener);
        };
    }, [isMapReady, showSpots, onSpotClick]);

    // Add parking markers
    useEffect(() => {
        if (!mapInstanceRef.current || !showParking) return;

        const map = mapInstanceRef.current;
        const markers: L.Marker[] = [];

        OOTY_PARKING.forEach(parking => {
            const marker = L.marker([parking.latitude, parking.longitude], {
                icon: ICONS.parking
            }).addTo(map);

            marker.bindPopup(`
                <div style="min-width: 150px;">
                    <h3 style="margin: 0 0 4px 0; font-size: 14px;">${parking.name}</h3>
                    <p style="margin: 0 0 4px 0; font-size: 12px; color: #666;">
                        ${parking.totalSlots} slots • ${parking.type === 'FREE' ? 'Free' : `₹${parking.ratePerHour}/hr`}
                    </p>
                </div>
            `);

            markers.push(marker);
        });

        return () => {
            markers.forEach(m => m.remove());
        };
    }, [isMapReady, showParking]);

    // Add hazard zones
    useEffect(() => {
        if (!mapInstanceRef.current || !showHazards) return;

        const map = mapInstanceRef.current;
        const layers: L.Circle[] = [];

        HILL_HAZARDS.forEach(hazard => {
            const color = hazard.type.includes('HAIRPIN') ? '#ef4444' :
                hazard.type === 'FOG_ZONE' ? '#6b7280' :
                    hazard.type === 'WILDLIFE' ? '#22c55e' : '#f59e0b';

            const circle = L.circle([hazard.center.lat, hazard.center.lng], {
                radius: hazard.radius,
                color: color,
                fillColor: color,
                fillOpacity: 0.2,
                weight: 2
            }).addTo(map);

            circle.bindPopup(`
                <div>
                    <h3 style="margin: 0 0 4px 0; font-size: 14px;">⚠️ ${hazard.name}</h3>
                    <p style="margin: 0; font-size: 12px;">${hazard.alert_en}</p>
                </div>
            `);

            layers.push(circle);
        });

        return () => {
            layers.forEach(l => l.remove());
        };
    }, [isMapReady, showHazards]);

    // Update user location marker
    useEffect(() => {
        if (!mapInstanceRef.current) return;

        const map = mapInstanceRef.current;

        // Remove old marker
        if (userMarkerRef.current) {
            userMarkerRef.current.remove();
            userMarkerRef.current = null;
        }

        // Add new marker if location available
        if (userLocation) {
            const marker = L.marker([userLocation.lat, userLocation.lng], {
                icon: L.divIcon({
                    className: 'user-location-marker',
                    html: `
                        <div style="
                            width: 20px;
                            height: 20px;
                            background: #3b82f6;
                            border: 3px solid white;
                            border-radius: 50%;
                            box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
                        "></div>
                    `,
                    iconSize: [20, 20],
                    iconAnchor: [10, 10]
                })
            }).addTo(map);

            marker.bindPopup('You are here');
            userMarkerRef.current = marker;
        }
    }, [userLocation, isMapReady]);

    // Update destination marker
    useEffect(() => {
        if (!mapInstanceRef.current || !destination) return;

        const map = mapInstanceRef.current;

        const marker = L.marker([destination.lat, destination.lng], {
            icon: ICONS.destination
        }).addTo(map);

        marker.bindPopup(destination.name || 'Destination');

        return () => {
            marker.remove();
        };
    }, [destination, isMapReady]);

    // Update route polyline
    useEffect(() => {
        if (!mapInstanceRef.current) return;

        const map = mapInstanceRef.current;

        // Remove old route
        if (routeLayerRef.current) {
            routeLayerRef.current.remove();
            routeLayerRef.current = null;
        }

        // Add new route if available
        if (route && route.length > 1) {
            const polyline = L.polyline(route, {
                color: '#3b82f6',
                weight: 5,
                opacity: 0.8,
                smoothFactor: 1
            }).addTo(map);

            // Fit map to route bounds
            map.fitBounds(polyline.getBounds(), { padding: [50, 50] });

            routeLayerRef.current = polyline;
        }
    }, [route, isMapReady]);

    return (
        <div
            ref={mapRef}
            className={`w-full h-full ${className}`}
            style={{ minHeight: '400px', background: '#e5e7eb' }}
        />
    );
}
