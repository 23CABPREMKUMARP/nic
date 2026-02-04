'use client';

import { useState, useEffect } from 'react';

export interface LocationState {
    latitude: number;
    longitude: number;
    speed: number | null;
    heading: number | null;
    timestamp: number;
}

export function useLiveLocation() {
    const [location, setLocation] = useState<LocationState | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [watchId, setWatchId] = useState<number | null>(null);

    useEffect(() => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser');
            return;
        }

        const id = navigator.geolocation.watchPosition(
            (position) => {
                setLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    speed: position.coords.speed ? Math.round(position.coords.speed * 3.6) : 0, // Convert m/s to km/h
                    heading: position.coords.heading,
                    timestamp: position.timestamp
                });
            },
            (err) => {
                setError(err.message);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );

        setWatchId(id);

        return () => {
            if (id !== null) navigator.geolocation.clearWatch(id);
        };
    }, []);

    return { location, error };
}
