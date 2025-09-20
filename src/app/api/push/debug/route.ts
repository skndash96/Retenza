import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { pushSubscriptions, customers, businesses } from '@/server/db/schema';

export async function GET() {
    try {
        // Check VAPID keys
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

        // Count total customers and businesses
        const customerCount = await db.select().from(customers);
        const businessCount = await db.select().from(businesses);

        // Count push subscriptions
        const subscriptionCount = await db.select().from(pushSubscriptions);

        // Get sample subscriptions
        const sampleSubscriptions = await db
            .select()
            .from(pushSubscriptions)
            .limit(5);

        // Get sample customers
        const sampleCustomers = await db
            .select()
            .from(customers)
            .limit(5);

        return NextResponse.json({
            status: 'success',
            data: {
                vapid: {
                    publicKey: vapidPublicKey ? '✅ Configured' : '❌ Missing',
                    privateKey: vapidPrivateKey ? '✅ Configured' : '❌ Missing',
                },
                counts: {
                    customers: customerCount.length,
                    businesses: businessCount.length,
                    pushSubscriptions: subscriptionCount.length,
                },
                sampleSubscriptions: sampleSubscriptions.map(sub => ({
                    id: sub.id,
                    customerId: sub.customerId,
                    businessId: sub.businessId,
                    endpoint: sub.endpoint.substring(0, 50) + '...',
                })),
                sampleCustomers: sampleCustomers.map(cust => ({
                    id: cust.id,
                    name: cust.name,
                    phoneNumber: cust.phoneNumber,
                })),
            }
        });
    } catch (error) {
        console.error('Debug endpoint error:', error);
        return NextResponse.json(
            { error: 'Failed to get debug info', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
} 