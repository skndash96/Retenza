import { db } from '@/server/db';
import { pushSubscriptions, notifications } from '@/server/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import type { NotificationData } from '../pushNotifications';

interface PushSubscription {
    customer_id: number;
    business_id: number;
    endpoint: string;
    p256dh: string;
    auth: string;
    updated_at?: Date;
}

interface NotificationRow {
    id: number;
    customer_id: number;
    business_id: number;
    type: string;
    title: string;
    body: string;
    data: unknown;
    is_read: boolean | null;
    sent_at: Date;
    read_at: Date | null;
}

export interface CustomerNotification {
    id: number;
    customer_id: number;
    business_id: number;
    type: string;
    title: string;
    body: string;
    data: Record<string, unknown>;
    is_read: boolean;
    sent_at: Date;
    read_at: Date | null;
}

export class ServerPushNotificationService {
    private static instance: ServerPushNotificationService;

    public static getInstance(): ServerPushNotificationService {
        if (!ServerPushNotificationService.instance) {
            ServerPushNotificationService.instance = new ServerPushNotificationService();
        }
        return ServerPushNotificationService.instance;
    }

    // Subscribe a customer to push notifications for a specific business
    async subscribeCustomer(
        customerId: number,
        businessId: number,
        subscription: {
            endpoint: string;
            p256dh: string;
            auth: string;
        }
    ): Promise<void> {
        try {
            // Check if subscription already exists
            const existingSubscription = await db
                .select()
                .from(pushSubscriptions)
                .where(
                    and(
                        eq(pushSubscriptions.customer_id, customerId),
                        eq(pushSubscriptions.business_id, businessId)
                    )
                );

            if (existingSubscription.length > 0) {
                // Update existing subscription
                await db
                    .update(pushSubscriptions)
                    .set({
                        endpoint: subscription.endpoint,
                        p256dh: subscription.p256dh,
                        auth: subscription.auth,
                        updated_at: new Date(),
                    })
                    .where(
                        and(
                            eq(pushSubscriptions.customer_id, customerId),
                            eq(pushSubscriptions.business_id, businessId)
                        )
                    );
            } else {
                // Create new subscription
                await db.insert(pushSubscriptions).values({
                    customer_id: customerId,
                    business_id: businessId,
                    endpoint: subscription.endpoint,
                    p256dh: subscription.p256dh,
                    auth: subscription.auth,
                });
            }
        } catch (error) {
            console.error('Error subscribing customer to push notifications:', error);
            throw error;
        }
    }

    // Unsubscribe a customer from push notifications for a specific business
    async unsubscribeCustomer(
        customerId: number,
        businessId: number
    ): Promise<void> {
        try {
            await db
                .delete(pushSubscriptions)
                .where(
                    and(
                        eq(pushSubscriptions.customer_id, customerId),
                        eq(pushSubscriptions.business_id, businessId)
                    )
                );
        } catch (error) {
            console.error('Error unsubscribing customer from push notifications:', error);
            throw error;
        }
    }

    // Send notification to a specific customer
    async sendNotificationToCustomer(
        customerId: number,
        businessId: number,
        notification: NotificationData
    ): Promise<void> {
        try {
            // Get customer's push subscription
            const subscription = await db
                .select()
                .from(pushSubscriptions)
                .where(
                    and(
                        eq(pushSubscriptions.customer_id, customerId),
                        eq(pushSubscriptions.business_id, businessId)
                    )
                );

            if (subscription.length === 0) {
                console.log('No push subscription found for customer');
                return;
            }

            // Store notification in database
            const notifType = this.getNotificationType(notification.data);
            await db.insert(notifications).values({
                customer_id: customerId,
                business_id: businessId,
                type: notifType,
                title: notification.title,
                body: notification.body,
                data: notification.data ?? {},
            });

            // Send push notification
            await this.sendPushNotification(subscription[0], notification);
        } catch (error) {
            console.error('Error sending notification to customer:', error);
            throw error;
        }
    }

    // Send notification to all customers of a business
    async sendNotificationToBusiness(
        businessId: number,
        notification: NotificationData
    ): Promise<void> {
        try {
            const subscriptions = await db
                .select()
                .from(pushSubscriptions)
                .where(eq(pushSubscriptions.business_id, businessId));

            const promises = subscriptions.map(async (subscription) => {
                try {
                    // Store notification in database
                    const notifType = this.getNotificationType(notification.data);
                    await db.insert(notifications).values({
                        customer_id: subscription.customer_id,
                        business_id: businessId,
                        type: notifType,
                        title: notification.title,
                        body: notification.body,
                        data: notification.data ?? {},
                    });

                    // Send push notification
                    await this.sendPushNotification(subscription, notification);
                } catch (error) {
                    console.error(`Error sending notification to customer ${subscription.customer_id}:`, error);
                }
            });

            await Promise.allSettled(promises);
        } catch (error) {
            console.error('Error sending notification to business:', error);
            throw error;
        }
    }

    // Helper method to extract notification type
    private getNotificationType(data: unknown): string {
        if (!data || typeof data !== 'object') {
            return 'general';
        }

        const dataRecord = data as Record<string, unknown>;
        const type = dataRecord.type;

        return typeof type === 'string' ? type : 'general';
    }

    // Send push notification using web push
    private async sendPushNotification(
        subscription: PushSubscription,
        notification: NotificationData
    ): Promise<void> {
        try {
            // Import web-push dynamically to avoid server-side import issues
            const webpush = (await import('web-push')).default;

            // Set VAPID details - use the correct environment variable names
            const vapidKeys = {
                publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '',
                privateKey: process.env.VAPID_PRIVATE_KEY ?? '',
            };

            console.log('VAPID keys - public:', vapidKeys.publicKey ? 'configured' : 'missing', 'private:', vapidKeys.privateKey ? 'configured' : 'missing');

            if (!vapidKeys.publicKey || !vapidKeys.privateKey) {
                throw new Error('VAPID keys not configured. Please set NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY environment variables.');
            }

            webpush.setVapidDetails(
                'mailto:retenza24@gmail.com',
                vapidKeys.publicKey,
                vapidKeys.privateKey
            );

            // Create proper subscription object for web-push
            const pushSubscription = {
                endpoint: subscription.endpoint,
                keys: {
                    p256dh: subscription.p256dh,
                    auth: subscription.auth
                }
            };

            console.log('Sending push notification to:', subscription.endpoint);

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

            console.log('Push notification payload:', payload);

            // Send the push notification directly
            const result = await webpush.sendNotification(pushSubscription, payload);

            if (result.statusCode !== 200 && result.statusCode !== 201) {
                throw new Error(`Push notification failed with status: ${result.statusCode}`);
            }

            console.log(`Push notification sent successfully to ${subscription.endpoint}`);
        } catch (error) {
            console.error('Error sending push notification:', error);
            throw error;
        }
    }

    // Get customer's notifications
    async getCustomerNotifications(
        customerId: number,
        businessId: number,
        limit = 50
    ): Promise<CustomerNotification[]> {
        try {
            const rows = await db
                .select()
                .from(notifications)
                .where(
                    and(
                        eq(notifications.customer_id, customerId),
                        eq(notifications.business_id, businessId)
                    )
                )
                .orderBy(desc(notifications.sent_at))
                .limit(limit);

            // Transform and validate the data
            return rows.map((row: NotificationRow): CustomerNotification => ({
                ...row,
                data: this.parseNotificationData(row.data),
                is_read: Boolean(row.is_read),
            }));
        } catch (error) {
            console.error('Error fetching customer notifications:', error);
            throw error;
        }
    }

    // Helper method to safely parse notification data
    private parseNotificationData(data: unknown): Record<string, unknown> {
        if (!data || typeof data !== 'object') {
            return {};
        }
        return data as Record<string, unknown>;
    }

    // Mark notification as read
    async markNotificationAsRead(notificationId: number): Promise<void> {
        try {
            await db
                .update(notifications)
                .set({
                    is_read: true,
                    read_at: new Date(),
                })
                .where(eq(notifications.id, notificationId));
        } catch (error) {
            console.error('Error marking notification as read:', error);
            throw error;
        }
    }
}