# Map & Navigation System - Technical Test Report

## 1. System Overview
The Map & Navigation system provides a unified interface for tourist spot discovery, parking management, and real-time crowd/traffic analysis. It integrates data from Prisma (PostgreSQL), simulated historical trends, and live weather data.

## 2. Core Modules

### 2.1 Crowd Engine (`CrowdEngine.ts`)
Calculates a location's density using a weighted formula:
- **Parking Occupancy (40%)**: Real-time slots booked vs total capacity.
- **E-Pass Active Entries (35%)**: Count of active passes with the location as a destination for today.
- **Historical Trends (15%)**: Comparison of current counts with the last 24 hours average.
- **Weather Impact (10%)**: Dynamic adjustment based on current conditions (Rain reduces outdoor crowd likelihood).

**Admin Controls:** Weights can be adjusted via the "Admin Control Center".

### 2.2 Traffic Service (`TrafficService.ts`)
Estimates road status between regions:
- **Vehicle Count**: (Parking Bookings) + (20% of Active Passes).
- **Thresholds**: 
    - > 500 veh/hr: **HEAVY** (10 km/h)
    - > 300 veh/hr: **MODERATE** (22 km/h)
    - Else: **SMOOTH** (40 km/h)

### 2.3 Visual Layers (Leaflet)
- **Heatmap**: Circles with dynamic opacity based on location density score.
- **Traffic Flow**: Polylines colored by status (Red: Heavy, Yellow: Moderate, Green: Smooth).
- **Satellite View**: Integrated Google Satellite layers via Mapbox/Leaflet.

## 3. Advanced Features

### 3.1 Voice Hints
Integrated **Web Speech API** to provide automated voice guidance. 
- Trigger: User selection of a place with "Critical" density or "Heavy" traffic.
- Content: AI-generated suggestions for alternate times or caution alerts.

### 3.2 Navigation
- **One-Tap Google Maps Integration**: Directs users to external navigation apps.
- **Parking Linkage**: Context-aware "Reserve Spot" buttons that pre-select the nearest facility to the destination.

## 4. Admin Management
Located at `/admin`, provides:
- **Manual Overrides**: Force status to LOW/CRITICAL for specific spots.
- **Festival Mode**: global toggle to increase crowd baseline.
- **Road Blocks**: Comma-separated list to effectively drop speed to 0 km/h on specified routes.

## 5. Deployment Readiness (Vercel)
- **Build Status**: Verified (Next.js 15+ compatible).
- **Environment Specs**: Requires `DATABASE_URL` and `WEATHER_API_KEY`.
- **Database**: Prisma Client optimized for Edge/Serverless functions.

---
*Report Generated: Oct 2024*
