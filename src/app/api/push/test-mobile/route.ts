import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { pushSubscriptions } from '@/server/db/schema';
import { eq, and } from 'drizzle-orm';
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
        const body = await request.json() as { businessId?: number; customerId?: number };
        const { businessId, customerId } = body;

        // Get subscriptions
        let subscriptions;
        if (customerId && businessId) {
            // Specific customer subscription
            subscriptions = await db
                .select()
                .from(pushSubscriptions)
                .where(and(eq(pushSubscriptions.customerId, customerId), eq(pushSubscriptions.businessId, businessId)));
        } else if (businessId) {
            // All subscriptions for a business
            subscriptions = await db
                .select()
                .from(pushSubscriptions)
                .where(eq(pushSubscriptions.businessId, businessId));
        } else {
            // All subscriptions
            subscriptions = await db.select().from(pushSubscriptions);
        }

        if (subscriptions.length === 0) {
            return NextResponse.json(
                { error: 'No push subscriptions found' },
                { status: 404 }
            );
        }

        console.log(`Found ${subscriptions.length} subscriptions`);

        // Test notification payload
        const testNotification = {
            title: '🧪 Mobile Push Test',
            body: 'This is a test push notification for mobile! Check your notification center.',
            data: {
                type: 'test',
                timestamp: Date.now(),
                message: 'If you see this, mobile push is working!'
            },
            tag: 'mobile-test',
            renotify: true,
            requireInteraction: false,
        };

        const payload = JSON.stringify(testNotification);

        // Send to all subscriptions
        const results = await Promise.allSettled(
            subscriptions.map(async (subscription, index) => {
                try {
                    console.log(`Sending to subscription ${index + 1}:`, {
                        id: subscription.id,
                        customer_id: subscription.customerId,
                        business_id: subscription.businessId,
                        endpoint: subscription.endpoint.substring(0, 50) + '...'
                    });

                    // Create proper subscription object for web-push
                    const pushSubscription = {
                        endpoint: subscription.endpoint,
                        keys: {
                            p256dh: subscription.p256dh,
                            auth: subscription.auth
                        }
                    };

                    const result = await webpush.sendNotification(pushSubscription, payload);

                    console.log(`Success for subscription ${index + 1}:`, result.statusCode);

                    return {
                        success: true,
                        subscriptionId: subscription.id,
                        statusCode: result.statusCode,
                        customerId: subscription.customerId,
                        businessId: subscription.businessId
                    };
                } catch (error) {
                    console.error(`Failed for subscription ${index + 1}:`, error);
                    return {
                        success: false,
                        subscriptionId: subscription.id,
                        error: error instanceof Error ? error.message : 'Unknown error',
                        customerId: subscription.customerId,
                        businessId: subscription.businessId
                    };
                }
            })
        );

        const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
        const failed = results.length - successful;

        return NextResponse.json({
            success: true,
            message: `Mobile push test completed: ${successful} successful, ${failed} failed`,
            total: results.length,
            successful,
            failed,
            results: results.map(r => r.status === 'fulfilled' ? r.value : { success: false, error: 'Promise rejected' }),
            notification: testNotification
        });

    } catch (error) {
        console.error('Error testing mobile push:', error);
        return NextResponse.json(
            { error: 'Failed to test mobile push', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
} 