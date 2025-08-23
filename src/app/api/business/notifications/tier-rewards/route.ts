import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { BusinessNotificationService } from '@/lib/businessNotificationService';

export async function POST(request: NextRequest) {
    try {
        const body = (await request.json()) as { businessId?: number; tierName?: string; businessName?: string };
        const { businessId, tierName, businessName } = body;

        if (!businessId || !tierName || !businessName) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const notificationService = BusinessNotificationService.getInstance();
        await notificationService.sendPersonalizedTierRewardsNotification(
            businessId,
            tierName,
            businessName
        );

        return NextResponse.json({ success: true, message: 'Tier rewards notification sent successfully' });
    } catch (error) {
        console.error('Error sending tier rewards notification:', error);
        return NextResponse.json(
            { error: 'Failed to send notification' },
            { status: 500 }
        );
    }
} 