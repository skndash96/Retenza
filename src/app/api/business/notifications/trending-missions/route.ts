import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { BusinessNotificationService } from '@/lib/businessNotificationService';

export async function POST(request: NextRequest) {
    try {
        const body = (await request.json()) as { businessId?: number; missionTitle?: string; businessName?: string };
        const { businessId, missionTitle, businessName } = body;

        console.log('Trending missions notification request:', { businessId, missionTitle, businessName });

        if (!businessId || !missionTitle || !businessName) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const notificationService = BusinessNotificationService.getInstance();
        console.log('Sending trending missions notification...');

        await notificationService.sendTrendingMissionsNotification(
            businessId,
            missionTitle,
            businessName
        );

        console.log('Trending missions notification sent successfully');
        return NextResponse.json({ success: true, message: 'Trending missions notification sent successfully' });
    } catch (error) {
        console.error('Error sending trending missions notification:', error);
        return NextResponse.json(
            { error: 'Failed to send notification', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
} 