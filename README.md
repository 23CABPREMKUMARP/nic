# Nilgiri E-Pass & Crowd Management System

A Production-ready Full Stack Web Application built with Next.js 14, Tailwind CSS (Glassmorphism), Prisma, and Clerk Authentication.

## 🚀 Features

- **Standardized E-Pass**: Generate encrypted QR passes for entry.
- **Smart Parking**: Real-time slot visibility.
- **Crowd Control**: Live density monitoring and alerts.
- **Smart Map**: GPS navigation to alternate locations if crowded.
- **Admin Scanner**: Built-in QR scanner for verification.
- **Premium UI**: 3D Parallax Nilgiri Hills theme with glassmorphism.

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS v4 + Framer Motion
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: Clerk (Email/Social Login)
- **Scanning**: HTML5-QRCode
- **Maps**: Custom Interactive Map (Leaflet/Google Maps placeholder)

## 📦 Installation

1. **Clone & Install**
   ```bash
   npm install
   ```

2. **Environment Setup**
   Copy `.env.example` to `.env` and fill in your keys:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `DATABASE_URL`

3. **Database Migration**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Run Locally**
   ```bash
   npm run dev
   ```

## 📱 User Flow

1. **Tourist**: Logs in -> Applies for Pass -> Gets QR -> Views Smart Map.
2. **Admin**: Logs in -> Scans QR at Gate (Allowed/Denied) -> Monitors Crowd Stats.

## 🎨 Theme

The application uses a "Nilgiri Mist" theme with dark greens, white mist overlays, and glass-morphism cards to reflect the local environment.
