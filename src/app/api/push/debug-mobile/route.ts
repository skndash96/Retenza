import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { pushSubscriptions, customers, businesses } from '@/server/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
    try {
        // Get all push subscriptions with customer and business details
        const subscriptions = await db
            .select({
                subscription: pushSubscriptions,
                customer: customers,
                business: businesses,
            })
            .from(pushSubscriptions)
            .innerJoin(customers, eq(pushSubscriptions.customer_id, customers.id))
            .innerJoin(businesses, eq(pushSubscriptions.business_id, businesses.id));

        // Check VAPID configuration
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

        // Test a real push notification to the first subscription
        let testResult = null;
        if (subscriptions.length > 0) {
            const firstSub = subscriptions[0];
            testResult = {
                customer: firstSub.customer.name,
                business: firstSub.business.name,
                endpoint: firstSub.subscription.endpoint.substring(0, 100) + '...',
                hasKeys: {
                    p256dh: !!firstSub.subscription.p256dh,
                    auth: !!firstSub.subscription.auth,
                }
            };
        }

        return NextResponse.json({
            status: 'success',
            data: {
                vapid: {
                    publicKey: vapidPublicKey ? '✅ Configured' : '❌ Missing',
                    privateKey: vapidPrivateKey ? '✅ Configured' : '❌ Missing',
                    publicKeyLength: vapidPublicKey?.length ?? 0,
                },
                subscriptions: {
                    total: subscriptions.length,
                    details: subscriptions.map(sub => ({
                        id: sub.subscription.id,
                        customer: sub.customer.name,
                        business: sub.business.name,
                        endpoint: sub.subscription.endpoint.substring(0, 80) + '...',
                        hasKeys: {
                            p256dh: !!sub.subscription.p256dh,
                            auth: !!sub.subscription.auth,
                        },
                        createdAt: sub.subscription.created_at,
                    }))
                },
                testSubscription: testResult,
                environment: {
                    nodeEnv: process.env.NODE_ENV,
                    baseUrl: process.env.BASE_URL ?? 'Not set',
                    vercelUrl: process.env.VERCEL_URL ?? 'Not set',
                }
            }
        });
    } catch (error) {
        console.error('Mobile debug endpoint error:', error);
        return NextResponse.json(
            { error: 'Failed to get mobile debug info', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
} 