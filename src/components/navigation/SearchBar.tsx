'use client';

/**
 * SearchBar - Destination search with autocomplete
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, MapPin, Clock, X, Navigation, Mic } from 'lucide-react';
import { OOTY_SPOTS } from '@/data/ootyMapData';

interface Spot {
    id: string;
    name: string;
    tamil_name: string;
    category: string;
    latitude: number;
    longitude: number;
}

interface SearchBarProps {
    onSelect: (spot: Spot) => void;
    placeholder?: string;
    className?: string;
}

export default function SearchBar({
    onSelect,
    placeholder = 'Where would you like to go?',
    className = ''
}: SearchBarProps) {
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [results, setResults] = useState<Spot[]>([]);
    const [recentSearches, setRecentSearches] = useState<Spot[]>([]);
    const [isListening, setIsListening] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Load recent searches from localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem('recentSearches');
            if (saved) {
                setRecentSearches(JSON.parse(saved));
            }
        } catch (e) {
            // Ignore localStorage errors
        }
    }, []);

    // Search spots
    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            return;
        }

        const lowerQuery = query.toLowerCase();
        const filtered = OOTY_SPOTS.filter(spot =>
            spot.name.toLowerCase().includes(lowerQuery) ||
            spot.tamil_name.includes(query) ||
            spot.category.toLowerCase().includes(lowerQuery) ||
            spot.tags?.some((tag: string) => tag.toLowerCase().includes(lowerQuery))
        );

        setResults(filtered as Spot[]);
    }, [query]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Handle spot selection
    const handleSelect = useCallback((spot: Spot) => {
        // Add to recent searches
        const updated = [spot, ...recentSearches.filter(s => s.id !== spot.id)].slice(0, 5);
        setRecentSearches(updated);
        try {
            localStorage.setItem('recentSearches', JSON.stringify(updated));
        } catch (e) {
            // Ignore localStorage errors
        }

        setQuery('');
        setIsOpen(false);
        onSelect(spot);
    }, [recentSearches, onSelect]);

    // Voice search (if supported)
    const startVoiceSearch = useCallback(() => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert('Voice search is not supported in your browser');
            return;
        }

        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.lang = 'en-IN';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            setIsListening(true);
        };

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setQuery(transcript);
            setIsOpen(true);
            setIsListening(false);
        };

        recognition.onerror = () => {
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.start();
    }, []);

    // Clear input
    const clearInput = () => {
        setQuery('');
        setResults([]);
        inputRef.current?.focus();
    };

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            {/* Search Input */}
            <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <Search className="w-5 h-5" />
                </div>
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    placeholder={placeholder}
                    className="w-full pl-12 pr-20 py-4 bg-white border border-gray-200 rounded-2xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-lg"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {query && (
                        <button
                            onClick={clearInput}
                            className="p-2 hover:bg-gray-100 rounded-full transition"
                        >
                            <X className="w-4 h-4 text-gray-400" />
                        </button>
                    )}
                    <button
                        onClick={startVoiceSearch}
                        className={`p-2 rounded-full transition ${isListening
                                ? 'bg-red-100 text-red-500 animate-pulse'
                                : 'hover:bg-gray-100 text-gray-400'
                            }`}
                    >
                        <Mic className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 max-h-80 overflow-y-auto">
                    {/* Search Results */}
                    {results.length > 0 ? (
                        <div className="p-2">
                            <p className="px-3 py-2 text-xs font-medium text-gray-400 uppercase">
                                Search Results
                            </p>
                            {results.map((spot) => (
                                <button
                                    key={spot.id}
                                    onClick={() => handleSelect(spot)}
                                    className="w-full flex items-center gap-3 p-3 hover:bg-blue-50 rounded-xl transition text-left"
                                >
                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                                        <MapPin className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-800 truncate">{spot.name}</p>
                                        <p className="text-sm text-gray-500 truncate">
                                            {spot.tamil_name} • {spot.category}
                                        </p>
                                    </div>
                                    <Navigation className="w-5 h-5 text-gray-300" />
                                </button>
                            ))}
                        </div>
                    ) : query ? (
                        <div className="p-6 text-center">
                            <p className="text-gray-500">No places found for "{query}"</p>
                            <p className="text-sm text-gray-400 mt-1">Try searching for Ooty Lake, Botanical Garden, etc.</p>
                        </div>
                    ) : (
                        <>
                            {/* Recent Searches */}
                            {recentSearches.length > 0 && (
                                <div className="p-2 border-b">
                                    <p className="px-3 py-2 text-xs font-medium text-gray-400 uppercase flex items-center gap-2">
                                        <Clock className="w-3 h-3" /> Recent
                                    </p>
                                    {recentSearches.map((spot) => (
                                        <button
                                            key={spot.id}
                                            onClick={() => handleSelect(spot)}
                                            className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition text-left"
                                        >
                                            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
                                                <Clock className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-gray-700 truncate">{spot.name}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Popular Destinations */}
                            <div className="p-2">
                                <p className="px-3 py-2 text-xs font-medium text-gray-400 uppercase">
                                    Popular Destinations
                                </p>
                                {OOTY_SPOTS.slice(0, 4).map((spot) => (
                                    <button
                                        key={spot.id}
                                        onClick={() => handleSelect(spot as Spot)}
                                        className="w-full flex items-center gap-3 p-3 hover:bg-blue-50 rounded-xl transition text-left"
                                    >
                                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white">
                                            <MapPin className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-800 truncate">{spot.name}</p>
                                            <p className="text-sm text-gray-500 truncate">{spot.category}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
