import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { pushSubscriptions } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { env } from '@/env';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as { businessId?: number; message?: string };
        const { businessId, message = 'Test notification from Retenza' } = body;

        if (!businessId) {
            return NextResponse.json(
                { error: 'Missing businessId' },
                { status: 400 }
            );
        }

        // Get all subscriptions for this business
        const subscriptions = await db
            .select()
            .from(pushSubscriptions)
            .where(eq(pushSubscriptions.business_id, businessId));

        if (subscriptions.length === 0) {
            return NextResponse.json(
                { error: 'No push subscriptions found for this business' },
                { status: 404 }
            );
        }

        console.log(`Found ${subscriptions.length} subscriptions for business ${businessId}`);

        // Send test notification to all subscriptions
        const results = await Promise.allSettled(
            subscriptions.map(async (subscription) => {
                try {
                    // Use request origin or configurable base URL
                    const baseUrl = request.headers.get('origin') ?? env.BASE_URL ?? process.env.VERCEL_URL ?? 'http://localhost:3000';
                    const response = await fetch(`${baseUrl}/api/push/send`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            subscription: {
                                endpoint: subscription.endpoint,
                                p256dh: subscription.p256dh,
                                auth: subscription.auth,
                            },
                            notification: {
                                title: 'Test Notification',
                                body: message,
                                data: {
                                    type: 'test',
                                    businessId: businessId,
                                    timestamp: Date.now(),
                                },
                                tag: 'test',
                                renotify: true,
                            },
                        }),
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }

                    return { success: true, customerId: subscription.customer_id };
                } catch (error) {
                    console.error(`Failed to send to customer ${subscription.customer_id}:`, error);
                    return {
                        success: false,
                        customerId: subscription.customer_id,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    };
                }
            })
        );

        const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
        const failed = results.length - successful;

        return NextResponse.json({
            success: true,
            message: `Test notification sent to ${successful} customers, ${failed} failed`,
            total: results.length,
            successful,
            failed,
            results: results.map(r => r.status === 'fulfilled' ? r.value : { success: false, error: r.reason })
        });

    } catch (error) {
        console.error('Error sending test notification:', error);
        return NextResponse.json(
            { error: 'Failed to send test notification', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
} 