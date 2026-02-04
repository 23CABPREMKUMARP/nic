
import { NextResponse } from 'next/server';
import { ParkingSync } from '@/services/admin/ParkingSync';

export async function GET() {
    try {
        const unifiedData = await ParkingSync.getUnifiedData();
        return NextResponse.json(unifiedData);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch unified slot data' }, { status: 500 });
    }
}
