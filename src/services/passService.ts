import { prisma } from "@/lib/prisma";
import crypto from 'crypto';

export async function createPass(userId: string, userEmail: string, userName: string, data: any) {
    const {
        vehicleNo, vehicleType, membersCount, visitDate,
        fullName, fatherName, dob, gender, mobile, email,
        address, currentStay, purpose, fromLocation, toLocation,
        driverName, driverLicense
    } = data;

    // 1. Validation
    const count = parseInt(membersCount);
    if (!vehicleNo || !visitDate || isNaN(count)) {
        throw new Error("Missing or invalid fields");
    }

    // Heavy Vehicle Logic Checks
    const isHeavy = ['TRUCK', 'BUS', 'LORRY'].includes(vehicleType);
    let assignedSlotId = null;
    let finalStatus = 'SUBMITTED'; // Default to submitted for admin review

    if (isHeavy) {
        // In real app, we would look for an open HeavyVehicleSlot here
        // For now, we auto-assign a mock or leave null
    }

    // Upsert User
    await prisma.user.upsert({
        where: { id: userId },
        update: { email: userEmail, name: userName },
        create: { id: userId, email: userEmail, name: userName }
    });

    // Generate Secure QR Token
    const qrString = `NIC-V1-${crypto.randomUUID()}-${Date.now().toString(36)}`;

    // Mock Parking Allocation
    const demoLocation = await prisma.location.upsert({
        where: { name: 'Ooty Lake Parking A' },
        create: {
            name: 'Ooty Lake Parking A',
            latitude: 11.4037,
            longitude: 76.6961,
            type: 'PARKING',
            crowdThreshold: 200,
            currentCount: 45
        },
        update: {}
    });

    const randomSlotNum = `S-${Math.floor(Math.random() * 100) + 1}`;

    // Create Pass with ALL Attributes
    return await prisma.pass.create({
        data: {
            userId,
            vehicleNo: vehicleNo.toUpperCase(),
            vehicleType,
            membersCount: count,
            visitDate: new Date(visitDate),

            // Extended Data
            fullName, fatherName, dob: dob ? new Date(dob) : null, gender, mobile, email: email || userEmail,
            address, currentStay, purpose, fromLocation, toLocation,
            driverName, driverLicense,

            // Heavy Vehicle
            isHeavyVehicle: isHeavy,
            slotId: assignedSlotId,

            qrCode: qrString,
            status: finalStatus, // SUBMITTED (Needs verification) or PENDING (Auto-verified)

            parkingSlot: {
                create: {
                    slotNumber: randomSlotNum,
                    locationId: demoLocation.id,
                    type: vehicleType,
                    isOccupied: true
                }
            }
        },
        include: {
            parkingSlot: {
                include: { location: true }
            },
            bookedSlot: true // Include slot info if heavy
        }
    });
}
