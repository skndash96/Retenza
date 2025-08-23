import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { ServerPushNotificationService } from '@/lib/server/pushNotificationService';
import { getCustomerFromSession } from '@/lib/session';

export async function POST(request: NextRequest) {
    try {
        const sessionUser = await getCustomerFromSession();

        if (!sessionUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = (await request.json()) as {
            businessId?: number;
            subscription?: { endpoint: string; p256dh: string; auth: string };
        };
        const { businessId, subscription } = body;

        if (!businessId || !subscription) {
            return NextResponse.json(
                { error: 'Missing businessId or subscription data' },
                { status: 400 }
            );
        }

        const pushService = ServerPushNotificationService.getInstance();
        await pushService.subscribeCustomer(
            sessionUser.id,
            businessId,
            subscription
        );

        return NextResponse.json({ success: true, message: 'Successfully subscribed to push notifications' });
    } catch (error) {
        console.error('Error subscribing to push notifications:', error);
        return NextResponse.json(
            { error: 'Failed to subscribe to push notifications' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const sessionUser = await getCustomerFromSession();

        if (!sessionUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = (await request.json()) as { businessId?: number };
        const { businessId } = body;

        if (!businessId) {
            return NextResponse.json(
                { error: 'Missing businessId' },
                { status: 400 }
            );
        }

        const pushService = ServerPushNotificationService.getInstance();
        await pushService.unsubscribeCustomer(sessionUser.id, businessId);

        return NextResponse.json({ success: true, message: 'Successfully unsubscribed from push notifications' });
    } catch (error) {
        console.error('Error unsubscribing from push notifications:', error);
        return NextResponse.json(
            { error: 'Failed to unsubscribe from push notifications' },
            { status: 500 }
        );
    }
} 