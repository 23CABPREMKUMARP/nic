import { NextResponse } from 'next/server';
import { RedirectEngine } from '@/services/validator/redirectEngine';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { spotId } = body;

        if (!spotId) {
            return NextResponse.json({ error: 'Spot ID is required' }, { status: 400 });
        }

        const validation = await RedirectEngine.validateDestination(spotId);

        return NextResponse.json(validation);

    } catch (error) {
        console.error('Validation Error:', error);
        return NextResponse.json({ error: 'Validation failed' }, { status: 500 });
    }
}
