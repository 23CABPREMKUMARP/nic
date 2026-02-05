
import { NextResponse } from 'next/server';
import { EcoStoreService } from '@/services/eco/EcoStoreService';

export async function POST() {
    try {
        await EcoStoreService.seedProducts();
        return NextResponse.json({ success: true, message: "Eco Store initialized with products" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
