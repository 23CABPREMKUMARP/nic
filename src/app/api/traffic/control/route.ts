/**
 * Traffic Control API - Admin control for road closures, VIP, festivals
 */

import { NextRequest, NextResponse } from 'next/server';
import { AdminControl, ControlType, ControlSeverity } from '@/services/admin/adminControl';
import { auth } from '@clerk/nextjs/server';

// GET - Retrieve active controls
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const near = searchParams.get('near'); // lat,lng
        const routeId = searchParams.get('routeId');

        if (routeId) {
            const controls = await AdminControl.getControlsForRoute(routeId);
            return NextResponse.json({ success: true, data: controls });
        }

        if (near) {
            const [lat, lng] = near.split(',').map(Number);
            const controls = await AdminControl.getControlsNearLocation(lat, lng);
            return NextResponse.json({ success: true, data: controls });
        }

        const controls = await AdminControl.getActiveControls();
        const stats = await AdminControl.getStats();

        return NextResponse.json({
            success: true,
            data: {
                controls,
                stats,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error: any) {
        console.error('Control GET error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

// POST - Create new control (Admin only)
export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const {
            action,
            type,
            title,
            location,
            radius,
            startTime,
            endTime,
            severity,
            affectedRoutes,
            alternateRoutes,
            message,
            // Quick action params
            roadName,
            reason,
            durationHours,
            description,
            route,
            festivalName,
            affectedAreas,
            alertType
        } = body;

        let control;

        // Handle quick actions
        switch (action) {
            case 'CLOSE_ROAD':
                control = await AdminControl.closeRoad(
                    roadName,
                    location,
                    reason,
                    durationHours,
                    userId
                );
                break;

            case 'REPORT_ACCIDENT':
                control = await AdminControl.reportAccident(
                    location,
                    severity as ControlSeverity,
                    description,
                    userId
                );
                break;

            case 'VIP_MOVEMENT':
                control = await AdminControl.createVIPMovement(
                    route,
                    new Date(startTime),
                    new Date(endTime),
                    userId
                );
                break;

            case 'FESTIVAL':
                control = await AdminControl.createFestivalRestriction(
                    festivalName,
                    affectedAreas,
                    new Date(startTime),
                    new Date(endTime),
                    userId
                );
                break;

            case 'WEATHER_ALERT':
                control = await AdminControl.createWeatherAlert(
                    alertType,
                    affectedRoutes,
                    severity as ControlSeverity,
                    userId
                );
                break;

            default:
                // Create custom control
                control = await AdminControl.createControl({
                    type: type as ControlType,
                    title,
                    location,
                    radius: radius || 500,
                    startTime: new Date(startTime),
                    endTime: endTime ? new Date(endTime) : undefined,
                    severity: severity as ControlSeverity,
                    affectedRoutes: affectedRoutes || [],
                    alternateRoutes: alternateRoutes || [],
                    message: message || { en: title, ta: title },
                    createdBy: userId
                });
        }

        return NextResponse.json({
            success: true,
            data: control,
            message: 'Traffic control created successfully'
        });
    } catch (error: any) {
        console.error('Control POST error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

// DELETE - Deactivate control
export async function DELETE(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const controlId = searchParams.get('id');

        if (!controlId) {
            return NextResponse.json(
                { success: false, error: 'Control ID required' },
                { status: 400 }
            );
        }

        const success = await AdminControl.deactivateControl(controlId, userId);

        if (!success) {
            return NextResponse.json(
                { success: false, error: 'Control not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Control deactivated'
        });
    } catch (error: any) {
        console.error('Control DELETE error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
