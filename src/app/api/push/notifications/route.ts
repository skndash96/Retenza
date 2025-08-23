import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { ServerPushNotificationService } from '@/lib/server/pushNotificationService';
import { getCustomerFromSession } from '@/lib/session';

export async function GET(request: NextRequest) {
    try {
        const sessionUser = await getCustomerFromSession();

        if (!sessionUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const businessId = searchParams.get('businessId');
        const limit = parseInt(searchParams.get('limit') ?? '50');

        if (!businessId) {
            return NextResponse.json(
                { error: 'Missing businessId parameter' },
                { status: 400 }
            );
        }

        const pushService = ServerPushNotificationService.getInstance();
        const items = await pushService.getCustomerNotifications(
            sessionUser.id,
            parseInt(businessId, 10),
            limit
        );

        return NextResponse.json({ notifications: items });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return NextResponse.json(
            { error: 'Failed to fetch notifications' },
            { status: 500 }
        );
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const sessionUser = await getCustomerFromSession();

        if (!sessionUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = (await request.json()) as { notificationId?: number };
        const { notificationId } = body;

        if (!notificationId) {
            return NextResponse.json(
                { error: 'Missing notificationId' },
                { status: 400 }
            );
        }

        const pushService = ServerPushNotificationService.getInstance();
        await pushService.markNotificationAsRead(notificationId);

        return NextResponse.json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        return NextResponse.json(
            { error: 'Failed to mark notification as read' },
            { status: 500 }
        );
    }
} 