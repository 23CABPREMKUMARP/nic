'use client';

/**
 * Image Selector - Visual navigation component
 * Allows users to select destinations by recognizing photos
 */

import React, { useState } from 'react';
import Image from 'next/image';
import { Camera, MapPin, Info } from 'lucide-react';

interface ImageSpot {
    id: string;
    name: string;
    tamilName: string;
    image: string; // URL
    category: string;
    distance?: string;
}

interface ImageSelectorProps {
    onSelect: (spotId: string) => void;
    active: boolean;
    onClose: () => void;
}

// Mock data - would normally come from API/Props
const MOCK_SPOTS: ImageSpot[] = [
    {
        id: 'botanical-garden',
        name: 'Botanical Garden',
        tamilName: 'தாவரவியல் பூங்கா',
        image: 'https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?q=80&w=800&auto=format&fit=crop',
        category: 'NATURE',
        distance: '2.5 km'
    },
    {
        id: 'ooty-lake',
        name: 'Ooty Lake',
        tamilName: 'ஊட்டி ஏரி',
        image: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?q=80&w=800&auto=format&fit=crop',
        category: 'WATER',
        distance: '1.2 km'
    },
    {
        id: 'doddabetta',
        name: 'Doddabetta Peak',
        tamilName: 'தொட்டபெட்டா சிகரம்',
        image: 'https://images.unsplash.com/photo-1627894483216-2138af692e32?q=80&w=800&auto=format&fit=crop',
        category: 'VIEW',
        distance: '8.5 km'
    },
    {
        id: 'rose-garden',
        name: 'Rose Garden',
        tamilName: 'ரோஜா பூங்கா',
        image: 'https://images.unsplash.com/photo-1606041011872-596597980539?q=80&w=800&auto=format&fit=crop',
        category: 'NATURE',
        distance: '3.0 km'
    },
    {
        id: 'pykara',
        name: 'Pykara Falls',
        tamilName: 'பைக்காரா நீர்வீழ்ச்சி',
        image: 'https://images.unsplash.com/photo-1632808064973-2e21b778c42b?q=80&w=800&auto=format&fit=crop',
        category: 'WATER',
        distance: '21 km'
    },
    {
        id: 'tea-factory',
        name: 'Tea Factory',
        tamilName: 'தேயிலை தொழிற்சாலை',
        image: 'https://images.unsplash.com/photo-1563822249548-9a72b6353cd1?q=80&w=800&auto=format&fit=crop',
        category: 'CULTURE',
        distance: '4.5 km'
    }
];

export default function ImageSelector({ onSelect, active, onClose }: ImageSelectorProps) {
    const [filter, setFilter] = useState<string>('ALL');

    if (!active) return null;

    const categories = [
        { id: 'ALL', label: 'All', icon: '🔍' },
        { id: 'NATURE', label: 'Nature', icon: '🌿' },
        { id: 'WATER', label: 'Lakes', icon: '💧' },
        { id: 'VIEW', label: 'Views', icon: '🏔️' },
        { id: 'CULTURE', label: 'Culture', icon: '🏛️' }
    ];

    const filteredSpots = filter === 'ALL'
        ? MOCK_SPOTS
        : MOCK_SPOTS.filter(s => s.category === filter);

    return (
        <div className="image-selector">
            <style jsx>{`
                .image-selector {
                    position: fixed;
                    top: 0;
                    right: 0;
                    width: 100%;
                    max-width: 450px;
                    height: 100vh;
                    background: #0f172a;
                    z-index: 1500;
                    display: flex;
                    flex-direction: column;
                    box-shadow: -5px 0 25px rgba(0,0,0,0.5);
                    animation: slideIn 0.3s ease-out;
                }

                @keyframes slideIn {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }

                .header {
                    padding: 20px;
                    background: rgba(15, 23, 42, 0.95);
                    backdrop-filter: blur(10px);
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                    z-index: 10;
                }

                .title-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 15px;
                }

                .title {
                    font-size: 20px;
                    font-weight: bold;
                    color: white;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .close-btn {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    background: rgba(255,255,255,0.1);
                    border: none;
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                }

                .filters {
                    display: flex;
                    gap: 10px;
                    overflow-x: auto;
                    padding-bottom: 5px;
                    scrollbar-width: none;
                }

                .filter-chip {
                    padding: 8px 16px;
                    border-radius: 20px;
                    background: rgba(255,255,255,0.1);
                    border: none;
                    color: white;
                    font-size: 14px;
                    white-space: nowrap;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .filter-chip.active {
                    background: #3b82f6;
                    transform: scale(1.05);
                }

                .grid {
                    flex: 1;
                    overflow-y: auto;
                    padding: 20px;
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 15px;
                }

                .img-card {
                    position: relative;
                    aspect-ratio: 4/5;
                    border-radius: 16px;
                    overflow: hidden;
                    cursor: pointer;
                    break-inside: avoid;
                    background: #1e293b;
                    transition: transform 0.2s;
                    border: none;
                    text-align: left;
                    padding: 0;
                    width: 100%;
                }

                .img-card:active {
                    transform: scale(0.95);
                }

                .card-img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .card-overlay {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    padding: 15px;
                    background: linear-gradient(to top, rgba(0,0,0,0.9), transparent);
                    color: white;
                }

                .card-name {
                    font-weight: bold;
                    font-size: 16px;
                    text-shadow: 0 2px 4px rgba(0,0,0,0.5);
                }

                .card-tamil {
                    font-size: 13px;
                    opacity: 0.9;
                    margin-top: 2px;
                }

                .distance-badge {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: rgba(0,0,0,0.6);
                    backdrop-filter: blur(4px);
                    padding: 4px 8px;
                    border-radius: 12px;
                    color: white;
                    font-size: 12px;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }
            `}</style>

            <div className="header">
                <div className="title-row">
                    <div className="title">
                        <Camera size={24} className="text-blue-400" />
                        <span>Visual Search</span>
                    </div>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </div>

                <div className="filters">
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            className={`filter-chip ${filter === cat.id ? 'active' : ''}`}
                            onClick={() => setFilter(cat.id)}
                        >
                            <span>{cat.icon}</span>
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid">
                {filteredSpots.map(spot => (
                    <button
                        key={spot.id}
                        className="img-card"
                        onClick={() => onSelect(spot.id)}
                    >
                        {/* Note: Using normal img for this standalone component to work without config */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={spot.image}
                            alt={spot.name}
                            className="card-img"
                            loading="lazy"
                        />

                        <div className="distance-badge">
                            <MapPin size={10} />
                            {spot.distance}
                        </div>

                        <div className="card-overlay">
                            <div className="card-name">{spot.name}</div>
                            <div className="card-tamil">{spot.tamilName}</div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
