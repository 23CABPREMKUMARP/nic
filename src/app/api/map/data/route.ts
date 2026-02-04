import { NextResponse } from 'next/server';
import { getMapData } from '@/services/mapService';

export async function GET() {
    try {
        const data = await getMapData();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: "Failed to load map data" }, { status: 500 });
    }
}
