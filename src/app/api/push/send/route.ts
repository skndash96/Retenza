import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import webpush from 'web-push';

const vapidKeys = {
    publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '',
    privateKey: process.env.VAPID_PRIVATE_KEY ?? '',
};

console.log('VAPID keys in send route - public:', vapidKeys.publicKey ? 'configured' : 'missing', 'private:', vapidKeys.privateKey ? 'configured' : 'missing');

if (!vapidKeys.publicKey || !vapidKeys.privateKey) {
    console.error('VAPID keys not configured in send route');
}

webpush.setVapidDetails(
    'mailto:retenza24@gmail.com',
    vapidKeys.publicKey,
    vapidKeys.privateKey
);

export async function POST(request: NextRequest) {
    try {
        const body = (await request.json()) as {
            subscription?: PushSubscription;
            notification?: {
                title: string;
                body: string;
                data?: Record<string, unknown>;
                actions?: Array<{ action: string; title: string; icon?: string }>;
                requireInteraction?: boolean;
                tag?: string;
                renotify?: boolean;
            };
        };
        const { subscription, notification } = body;

        if (!subscription || !notification) {
            return NextResponse.json(
                { error: 'Missing subscription or notification data' },
                { status: 400 }
            );
        }

        console.log('Sending notification:', notification.title, 'to subscription:', subscription.endpoint);

        // Prepare the payload
        const payload = JSON.stringify({
            title: notification.title,
            body: notification.body,
            data: notification.data ?? {},
            actions: notification.actions ?? [],
            requireInteraction: notification.requireInteraction ?? false,
            tag: notification.tag ?? 'default',
            renotify: notification.renotify ?? false,
        });

        console.log('Notification payload:', payload);

        // Send the push notification
        const result = await webpush.sendNotification(subscription as unknown as webpush.PushSubscription, payload);

        if (result.statusCode === 200 || result.statusCode === 201) {
            console.log('Push notification sent successfully');
            return NextResponse.json({ success: true, message: 'Push notification sent successfully' });
        } else {
            console.error('Push notification failed:', result);
            return NextResponse.json(
                { error: 'Failed to send push notification' },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('Error sending push notification:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 