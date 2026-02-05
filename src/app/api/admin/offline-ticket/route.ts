
import { NextResponse } from 'next/server';
import { OfflineTicketService } from '@/services/admin/OfflineTicketService';
import { z } from 'zod';

// Schema for validation
const ticketSchema = z.object({
    vehicleNo: z.string().min(2),
    name: z.string().min(2),
    mobile: z.string().optional(),
    members: z.number().min(1),
    vehicleType: z.enum(['CAR', 'BUS', 'BIKE', 'EMERGENCY']),
    spotId: z.string(),
    type: z.enum(['OFFLINE_PAID', 'GOVT_PASS', 'EMERGENCY', 'STAFF']),
    createdBy: z.string().default('admin'), // In prod, get from session
});

// GET: Fetch stats or tickets
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode'); // 'stats' or 'list'
    const spotId = searchParams.get('spotId');

    try {
        if (mode === 'stats') {
            const stats = await OfflineTicketService.getStats();
            return NextResponse.json(stats);
        }

        const query = searchParams.get('query');
        if (query) {
            const ticket = await OfflineTicketService.verifyTicket(query);
            return NextResponse.json({ ticket });
        }

        if (spotId) {
            const tickets = await OfflineTicketService.getTicketsBySpot(spotId);
            return NextResponse.json(tickets);
        }

        const allTickets = await OfflineTicketService.getAllTickets();
        return NextResponse.json(allTickets);

    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 });
    }
}

// POST: Create new ticket
export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Validate input
        const validation = ticketSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ error: validation.error.flatten() }, { status: 400 });
        }

        // Create ticket
        const ticket = await OfflineTicketService.createTicket(validation.data);

        return NextResponse.json({ success: true, ticket });

    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Failed to create ticket' }, { status: 400 });
    }
}

// PATCH: Mark Exit or Update Status
export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { id, source } = body;

        if (!id) {
            return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
        }

        const ticket = await OfflineTicketService.markExit(id, source);
        return NextResponse.json({ success: true, ticket });

    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Failed to update status' }, { status: 400 });
    }
}
