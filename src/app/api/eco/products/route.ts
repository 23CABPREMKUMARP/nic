import { NextResponse } from 'next/server';
import { EcoStoreService } from '@/services/eco/EcoStoreService';

export async function GET() {
    try {
        const products = await EcoStoreService.getProducts();
        return NextResponse.json(products || []);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
