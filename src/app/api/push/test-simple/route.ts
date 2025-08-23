import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import webpush from 'web-push';

const vapidKeys = {
    publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '',
    privateKey: process.env.VAPID_PRIVATE_KEY ?? '',
};

webpush.setVapidDetails(
    'mailto:retenza24@gmail.com',
    vapidKeys.publicKey,
    vapidKeys.privateKey
);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { subscription } = body;

        if (!subscription) {
            return NextResponse.json({ error: 'Missing subscription' }, { status: 400 });
        }

        console.log('Testing push notification to:', subscription.endpoint);

        // Simple test payload
        const payload = JSON.stringify({
            title: 'Test Notification',
            body: 'This is a test push notification!',
            data: { type: 'test', timestamp: Date.now() },
            tag: 'test-simple',
        });

        console.log('Sending payload:', payload);

        // Send the push notification
        const result = await webpush.sendNotification(subscription, payload);

        console.log('Push result:', result);

        if (result.statusCode === 200 || result.statusCode === 201) {
            return NextResponse.json({
                success: true,
                message: 'Test notification sent successfully',
                statusCode: result.statusCode
            });
        } else {
            return NextResponse.json({
                error: 'Failed to send notification',
                statusCode: result.statusCode,
                headers: result.headers
            }, { status: 500 });
        }
    } catch (error) {
        console.error('Error in test-simple:', error);
        return NextResponse.json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 