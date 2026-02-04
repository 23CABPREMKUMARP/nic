'use client';

/**
 * Traffic Dashboard - Admin dashboard with heatmap, graphs, and controls
 */

import React, { useState, useEffect } from 'react';

interface CongestionData {
    spotId: string;
    name: string;
    score: number;
    level: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';
    trend: 'RISING' | 'STABLE' | 'FALLING';
}

interface TrafficControl {
    id: string;
    type: string;
    title: string;
    severity: string;
    active: boolean;
}

interface RegionStats {
    totalVisitors: number;
    averageCongestion: number;
    busiestSpot: string;
    quietestSpot: string;
    entryRate: number;
}

interface Prediction {
    hour: number;
    displayTime: string;
    averageScore: number;
    level: string;
}

export default function TrafficDashboard() {
    const [congestionData, setCongestionData] = useState<CongestionData[]>([]);
    const [stats, setStats] = useState<RegionStats | null>(null);
    const [controls, setControls] = useState<TrafficControl[]>([]);
    const [predictions, setPredictions] = useState<Prediction[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'controls' | 'predictions'>('overview');

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000); // Refresh every 10 seconds
        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        try {
            const [congestionRes, controlsRes, predictRes] = await Promise.all([
                fetch('/api/traffic/congestion'),
                fetch('/api/traffic/control'),
                fetch('/api/traffic/predict')
            ]);

            const congestion = await congestionRes.json();
            const controlsData = await controlsRes.json();
            const predictions = await predictRes.json();

            if (congestion.success) {
                setCongestionData(congestion.data.spots);
                setStats(congestion.data.stats);
            }
            if (controlsData.success) {
                setControls(controlsData.data.controls || []);
            }
            if (predictions.success) {
                setPredictions(predictions.data.region || []);
            }
        } catch (error) {
            console.error('Failed to fetch traffic data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getLevelColor = (level: string) => {
        switch (level) {
            case 'GREEN': return '#22c55e';
            case 'YELLOW': return '#eab308';
            case 'ORANGE': return '#f97316';
            case 'RED': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const getTrendIcon = (trend: string) => {
        switch (trend) {
            case 'RISING': return '↑';
            case 'FALLING': return '↓';
            default: return '→';
        }
    };

    if (loading) {
        return (
            <div className="traffic-dashboard loading">
                <div className="spinner"></div>
                <p>Loading traffic data...</p>
            </div>
        );
    }

    return (
        <div className="traffic-dashboard">
            <style jsx>{`
                .traffic-dashboard {
                    padding: 20px;
                    background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
                    min-height: 100vh;
                    color: white;
                }
                
                .loading {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                }
                
                .spinner {
                    width: 40px;
                    height: 40px;
                    border: 4px solid rgba(255,255,255,0.3);
                    border-top-color: #3b82f6;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                
                .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 24px;
                }
                
                .title {
                    font-size: 24px;
                    font-weight: bold;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                
                .live-badge {
                    background: #ef4444;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    animation: pulse 2s infinite;
                }
                
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                
                .tabs {
                    display: flex;
                    gap: 10px;
                    margin-bottom: 20px;
                }
                
                .tab {
                    padding: 10px 20px;
                    background: rgba(255,255,255,0.1);
                    border: none;
                    border-radius: 8px;
                    color: white;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .tab.active {
                    background: #3b82f6;
                }
                
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 16px;
                    margin-bottom: 24px;
                }
                
                .stat-card {
                    background: rgba(255,255,255,0.1);
                    padding: 20px;
                    border-radius: 12px;
                    text-align: center;
                }
                
                .stat-value {
                    font-size: 32px;
                    font-weight: bold;
                    margin-bottom: 8px;
                }
                
                .stat-label {
                    color: rgba(255,255,255,0.7);
                    font-size: 14px;
                }
                
                .congestion-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                    gap: 16px;
                }
                
                .spot-card {
                    background: rgba(255,255,255,0.05);
                    border-radius: 12px;
                    padding: 16px;
                    border-left: 4px solid;
                    transition: transform 0.2s;
                }
                
                .spot-card:hover {
                    transform: translateY(-2px);
                }
                
                .spot-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 12px;
                }
                
                .spot-name {
                    font-weight: 600;
                    font-size: 16px;
                }
                
                .score-badge {
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-weight: bold;
                    font-size: 14px;
                }
                
                .progress-bar {
                    height: 8px;
                    background: rgba(255,255,255,0.1);
                    border-radius: 4px;
                    overflow: hidden;
                    margin-bottom: 8px;
                }
                
                .progress-fill {
                    height: 100%;
                    border-radius: 4px;
                    transition: width 0.5s ease;
                }
                
                .spot-footer {
                    display: flex;
                    justify-content: space-between;
                    font-size: 12px;
                    color: rgba(255,255,255,0.6);
                }
                
                .trend {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }
                
                .controls-list {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                
                .control-card {
                    background: rgba(255,255,255,0.05);
                    padding: 16px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                
                .control-icon {
                    font-size: 24px;
                }
                
                .control-info {
                    flex: 1;
                }
                
                .control-title {
                    font-weight: 600;
                }
                
                .control-type {
                    font-size: 12px;
                    color: rgba(255,255,255,0.6);
                }
                
                .predictions-chart {
                    display: flex;
                    gap: 20px;
                    justify-content: center;
                    padding: 20px;
                }
                
                .prediction-bar {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                }
                
                .bar-container {
                    width: 60px;
                    height: 200px;
                    background: rgba(255,255,255,0.1);
                    border-radius: 8px;
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-end;
                    overflow: hidden;
                }
                
                .bar-fill {
                    width: 100%;
                    border-radius: 8px 8px 0 0;
                    transition: height 0.5s ease;
                    display: flex;
                    align-items: flex-start;
                    justify-content: center;
                    padding-top: 8px;
                    font-weight: bold;
                    font-size: 14px;
                }
                
                .prediction-time {
                    font-size: 12px;
                    color: rgba(255,255,255,0.7);
                }
                
                .no-data {
                    text-align: center;
                    padding: 40px;
                    color: rgba(255,255,255,0.5);
                }
            `}</style>

            <div className="header">
                <div className="title">
                    🚦 Traffic Control Dashboard
                    <span className="live-badge">LIVE</span>
                </div>
            </div>

            <div className="tabs">
                <button
                    className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    📊 Overview
                </button>
                <button
                    className={`tab ${activeTab === 'controls' ? 'active' : ''}`}
                    onClick={() => setActiveTab('controls')}
                >
                    🚧 Controls ({controls.length})
                </button>
                <button
                    className={`tab ${activeTab === 'predictions' ? 'active' : ''}`}
                    onClick={() => setActiveTab('predictions')}
                >
                    🔮 3-Hour Prediction
                </button>
            </div>

            {activeTab === 'overview' && (
                <>
                    {stats && (
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-value">{stats.totalVisitors.toLocaleString()}</div>
                                <div className="stat-label">Estimated Visitors</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-value" style={{ color: getLevelColor(stats.averageCongestion < 40 ? 'GREEN' : stats.averageCongestion < 70 ? 'YELLOW' : 'RED') }}>
                                    {stats.averageCongestion}%
                                </div>
                                <div className="stat-label">Average Congestion</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-value">🔥 {stats.busiestSpot}</div>
                                <div className="stat-label">Busiest Location</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-value">🌿 {stats.quietestSpot}</div>
                                <div className="stat-label">Quietest Location</div>
                            </div>
                        </div>
                    )}

                    <div className="congestion-grid">
                        {congestionData.map(spot => (
                            <div
                                key={spot.spotId}
                                className="spot-card"
                                style={{ borderLeftColor: getLevelColor(spot.level) }}
                            >
                                <div className="spot-header">
                                    <span className="spot-name">{spot.name}</span>
                                    <span
                                        className="score-badge"
                                        style={{ backgroundColor: getLevelColor(spot.level) }}
                                    >
                                        {spot.score}%
                                    </span>
                                </div>
                                <div className="progress-bar">
                                    <div
                                        className="progress-fill"
                                        style={{
                                            width: `${spot.score}%`,
                                            backgroundColor: getLevelColor(spot.level)
                                        }}
                                    />
                                </div>
                                <div className="spot-footer">
                                    <span>{spot.level}</span>
                                    <span className="trend">
                                        {getTrendIcon(spot.trend)} {spot.trend}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {activeTab === 'controls' && (
                <div className="controls-list">
                    {controls.length === 0 ? (
                        <div className="no-data">
                            <p>✅ No active traffic controls</p>
                            <p style={{ fontSize: '14px', marginTop: '8px' }}>All roads are open and operating normally</p>
                        </div>
                    ) : (
                        controls.map(control => (
                            <div key={control.id} className="control-card">
                                <span className="control-icon">
                                    {control.type === 'ROAD_CLOSED' ? '🚧' :
                                        control.type === 'ACCIDENT' ? '⚠️' :
                                            control.type === 'VIP_MOVEMENT' ? '🚔' : '🚨'}
                                </span>
                                <div className="control-info">
                                    <div className="control-title">{control.title}</div>
                                    <div className="control-type">{control.type} • {control.severity}</div>
                                </div>
                                <span style={{
                                    color: control.active ? '#22c55e' : '#ef4444',
                                    fontSize: '12px'
                                }}>
                                    {control.active ? '● Active' : '○ Inactive'}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            )}

            {activeTab === 'predictions' && (
                <div className="predictions-chart">
                    {predictions.map((pred, idx) => (
                        <div key={idx} className="prediction-bar">
                            <div className="bar-container">
                                <div
                                    className="bar-fill"
                                    style={{
                                        height: `${pred.averageScore}%`,
                                        backgroundColor: getLevelColor(pred.level)
                                    }}
                                >
                                    {pred.averageScore}%
                                </div>
                            </div>
                            <div className="prediction-time">{pred.displayTime}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
