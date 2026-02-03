import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
    try {
        const locations = [
            {
                name: "Ooty Lake", type: "ATTRACTION", facilities: [
                    { vehicleType: "CAR", totalSlots: 200, hourlyRate: 40 },
                    { vehicleType: "BIKE", totalSlots: 500, hourlyRate: 15 },
                    { vehicleType: "BUS", totalSlots: 50, hourlyRate: 100 },
                ]
            },
            {
                name: "Botanical Garden", type: "ATTRACTION", facilities: [
                    { vehicleType: "CAR", totalSlots: 150, hourlyRate: 50 },
                    { vehicleType: "BIKE", totalSlots: 300, hourlyRate: 20 },
                    { vehicleType: "BUS", totalSlots: 40, hourlyRate: 120 },
                ]
            },
            {
                name: "Doddabetta Peak", type: "ATTRACTION", facilities: [
                    { vehicleType: "CAR", totalSlots: 80, hourlyRate: 60 },
                    { vehicleType: "BIKE", totalSlots: 200, hourlyRate: 25 },
                ]
            },
            {
                name: "Rose Garden", type: "ATTRACTION", facilities: [
                    { vehicleType: "CAR", totalSlots: 100, hourlyRate: 40 },
                    { vehicleType: "BIKE", totalSlots: 250, hourlyRate: 15 },
                ]
            },
            {
                name: "Pykara Falls", type: "ATTRACTION", facilities: [
                    { vehicleType: "CAR", totalSlots: 120, hourlyRate: 30 },
                    { vehicleType: "BIKE", totalSlots: 300, hourlyRate: 10 },
                ]
            }
        ];

        for (const loc of locations) {
            // Upsert Location
            const location = await prisma.location.upsert({
                where: { name: loc.name },
                update: {},
                create: {
                    name: loc.name,
                    type: loc.type,
                    latitude: 0, // Placeholder
                    longitude: 0, // Placeholder
                    description: `Famous tourist spot: ${loc.name}`
                }
            });

            // Upsert Facilities
            for (const fac of loc.facilities) {
                await prisma.parkingFacility.upsert({
                    where: {
                        locationId_vehicleType: {
                            locationId: location.id,
                            vehicleType: fac.vehicleType
                        }
                    },
                    update: {},
                    create: {
                        locationId: location.id,
                        vehicleType: fac.vehicleType,
                        totalSlots: fac.totalSlots,
                        hourlyRate: fac.hourlyRate
                    }
                });
            }
        }

        return NextResponse.json({ success: true, message: "Parking locations initialized" });
    } catch (error) {
        console.error("Init Error:", error);
        return NextResponse.json({ error: "Failed to init" }, { status: 500 });
    }
}
