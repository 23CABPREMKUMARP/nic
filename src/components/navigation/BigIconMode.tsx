'use client';

/**
 * Big Icon Mode - Simplified navigation for accessibility
 * Features large touch targets, picture-based selection, and voice focus
 */

import React, { useState } from 'react';
import { MapPin, Navigation, Car, Menu } from 'lucide-react';
import Image from 'next/image';

interface BigIconOption {
    id: string;
    label: string;
    tamilLabel: string;
    icon: string;
    image?: string;
    color: string;
    action: () => void;
}

interface BigIconModeProps {
    onSelectDestination: (spotId: string) => void;
    onStartNavigation: () => void;
    onGoSafe: () => void;
    active: boolean;
    onClose: () => void;
}

export default function BigIconMode({
    onSelectDestination,
    onStartNavigation,
    onGoSafe,
    active,
    onClose
}: BigIconModeProps) {
    const [view, setView] = useState<'HOME' | 'DESTINATIONS'>('HOME');

    if (!active) return null;

    const mainOptions: BigIconOption[] = [
        {
            id: 'go-safe',
            label: 'GO SAFE',
            tamilLabel: 'பாதுகாப்பாக செல்',
            icon: '🛡️',
            color: '#22c55e',
            action: onGoSafe
        },
        {
            id: 'places',
            label: 'PLACES',
            tamilLabel: 'இடங்கள்',
            icon: '🏔️',
            color: '#3b82f6',
            action: () => setView('DESTINATIONS')
        },
        {
            id: 'food',
            label: 'FOOD',
            tamilLabel: 'உணவு',
            icon: '🍲',
            color: '#f97316',
            action: () => { } // Expand in future
        },
        {
            id: 'help',
            label: 'HELP',
            tamilLabel: 'உதவி',
            icon: '🆘',
            color: '#ef4444',
            action: () => window.location.href = 'tel:100'
        }
    ];

    const popularDestinations = [
        { id: 'botanical-garden', name: 'Garden', ta: 'பூங்கா', img: '/images/garden.jpg' },
        { id: 'ooty-lake', name: 'Lake', ta: 'ஏரி', img: '/images/lake.jpg' },
        { id: 'doddabetta', name: 'Peak', ta: 'சிகரம்', img: '/images/peak.jpg' },
        { id: 'rose-garden', name: 'Roses', ta: 'ரோஜா', img: '/images/rose.jpg' }
    ];

    return (
        <div className="big-icon-mode">
            <style jsx>{`
                .big-icon-mode {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background: #1a1a2e;
                    z-index: 2000;
                    display: flex;
                    flex-direction: column;
                    padding: 20px;
                    overflow-y: auto;
                }
                
                .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 30px;
                }
                
                .title {
                    color: white;
                    font-size: 24px;
                    font-weight: bold;
                }
                
                .close-btn {
                    padding: 12px 20px;
                    background: rgba(255,255,255,0.1);
                    border: none;
                    border-radius: 12px;
                    color: white;
                    font-size: 16px;
                }
                
                .grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                    flex: 1;
                }
                
                .big-btn {
                    background: white;
                    border: none;
                    border-radius: 20px;
                    padding: 20px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 15px;
                    cursor: pointer;
                    transition: transform 0.2s;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                    min-height: 160px;
                }
                
                .big-btn:active {
                    transform: scale(0.95);
                }
                
                .icon {
                    font-size: 48px;
                }
                
                .label {
                    font-size: 20px;
                    font-weight: 800;
                    color: #1f2937;
                    text-transform: uppercase;
                }
                
                .sub-label {
                    font-size: 18px;
                    color: #4b5563;
                    margin-top: -10px;
                }
                
                .dest-card {
                    background: white;
                    border-radius: 20px;
                    overflow: hidden;
                    border: none;
                    text-align: left;
                }
                
                .dest-img {
                    width: 100%;
                    height: 120px;
                    background: #e5e7eb;
                    object-fit: cover;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 40px;
                }
                
                .dest-info {
                    padding: 15px;
                    text-align: center;
                }
                
                .back-btn {
                    width: 100%;
                    padding: 20px;
                    background: rgba(255,255,255,0.1);
                    border: none;
                    border-radius: 16px;
                    color: white;
                    font-size: 20px;
                    margin-top: 20px;
                }
            `}</style>

            <div className="header">
                <div className="title">
                    {view === 'HOME' ? 'EASY MODE' : 'SELECT PLACE'}
                </div>
                <button className="close-btn" onClick={onClose}>Exit ✕</button>
            </div>

            {view === 'HOME' ? (
                <div className="grid">
                    {mainOptions.map(opt => (
                        <button
                            key={opt.id}
                            className="big-btn"
                            style={{ backgroundColor: opt.id === 'go-safe' ? '#dcfce7' : 'white' }}
                            onClick={opt.action}
                        >
                            <span className="icon">{opt.icon}</span>
                            <span className="label" style={{ color: opt.color }}>{opt.label}</span>
                            <span className="sub-label">{opt.tamilLabel}</span>
                        </button>
                    ))}
                </div>
            ) : (
                <>
                    <div className="grid">
                        {popularDestinations.map(dest => (
                            <button
                                key={dest.id}
                                className="dest-card"
                                onClick={() => {
                                    onSelectDestination(dest.id);
                                    onClose();
                                }}
                            >
                                <div className="dest-img">Image</div>
                                <div className="dest-info">
                                    <div className="label">{dest.name}</div>
                                    <div className="sub-label">{dest.ta}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                    <button className="back-btn" onClick={() => setView('HOME')}>
                        ⬅️ Back / பின்னே
                    </button>
                </>
            )}
        </div>
    );
}
