import { useState, useEffect, useCallback } from 'react';
import { PushNotificationService, notificationTemplates } from '@/lib/pushNotifications';

interface UsePushNotificationsProps {
    businessId: number;
    businessName: string;
}

export const usePushNotifications = ({ businessId, businessName }: UsePushNotificationsProps) => {
    const [isSupported, setIsSupported] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Check if push notifications are supported
    useEffect(() => {
        const checkSupport = () => {
            const supported = 'serviceWorker' in navigator && 'PushManager' in window;
            console.log('Push notifications supported:', supported);
            setIsSupported(supported);
            return supported;
        };

        checkSupport();
    }, []);

    const checkSubscriptionStatus = useCallback(async () => {
        try {
            if (!('serviceWorker' in navigator)) {
                console.log('Service Worker not supported');
                return;
            }

            const registration = await navigator.serviceWorker.ready;
            console.log('Service Worker ready:', registration);

            const subscription = await registration.pushManager.getSubscription();
            console.log('Current subscription:', subscription);

            setIsSubscribed(!!subscription);
        } catch (err) {
            console.error('Error checking subscription status:', err);
        }
    }, []);

    // Check subscription status on mount
    useEffect(() => {
        if (isSupported) {
            void checkSubscriptionStatus();
        }
    }, [isSupported, businessId, checkSubscriptionStatus]);

    const subscribe = useCallback(async () => {
        if (!isSupported) {
            setError('Push notifications are not supported in this browser');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            console.log('Starting subscription process...');

            // Request notification permission
            const permission = await Notification.requestPermission();
            console.log('Notification permission:', permission);

            if (permission !== 'granted') {
                throw new Error('Notification permission denied');
            }

            // Check if service worker is already registered
            let registration = await navigator.serviceWorker.getRegistration('/sw-standalone.js');

            if (!registration) {
                console.log('Registering service worker...');
                // Register our standalone service worker
                registration = await navigator.serviceWorker.register('/sw-standalone.js', {
                    scope: '/'
                });
            }

            console.log('Service Worker registration:', registration);

            // Wait for service worker to be ready
            await navigator.serviceWorker.ready;
            console.log('Service Worker ready for subscription');

            // Get VAPID public key
            const vapidPublicKey = PushNotificationService.getInstance().getVapidPublicKey();
            console.log('VAPID public key:', vapidPublicKey);

            if (!vapidPublicKey) {
                throw new Error('VAPID public key not configured');
            }

            // Convert VAPID key to Uint8Array
            const vapidKeyArray = urlBase64ToUint8Array(vapidPublicKey);

            // Subscribe to push notifications
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: vapidKeyArray,
            });

            console.log('Push subscription created:', subscription);

            // Convert subscription keys to base64
            const p256dh = btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh') ?? new ArrayBuffer(0))));
            const auth = btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth') ?? new ArrayBuffer(0))));

            console.log('Subscription keys - p256dh:', p256dh, 'auth:', auth);

            // Send subscription to server
            const response = await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    businessId,
                    subscription: {
                        endpoint: subscription.endpoint,
                        p256dh,
                        auth,
                    },
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error ?? 'Failed to subscribe to push notifications');
            }

            console.log('Subscription saved to server successfully');
            setIsSubscribed(true);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to subscribe to push notifications';
            setError(errorMessage);
            console.error('Error subscribing to push notifications:', err);
        } finally {
            setIsLoading(false);
        }
    }, [isSupported, businessId]);

    const unsubscribe = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Get current subscription
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                // Unsubscribe from push manager
                await subscription.unsubscribe();

                // Remove subscription from server
                const response = await fetch('/api/push/subscribe', {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ businessId }),
                });

                if (!response.ok) {
                    console.warn('Failed to remove subscription from server');
                }
            }

            setIsSubscribed(false);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to unsubscribe from push notifications';
            setError(errorMessage);
            console.error('Error unsubscribing from push notifications:', err);
        } finally {
            setIsLoading(false);
        }
    }, [businessId]);

    // Helper function to convert VAPID key
    const urlBase64ToUint8Array = (base64String: string) => {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    };

    // Helper functions for sending different types of notifications
    const sendPointsEarnedNotification = useCallback(async (points: number) => {
        try {
            const notification = notificationTemplates.pointsEarned(points, businessName);
            await fetch('/api/push/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notification }),
            });
        } catch (err) {
            console.error('Error sending points earned notification:', err);
        }
    }, [businessName]);

    const sendRewardUnlockedNotification = useCallback(async (rewardName: string) => {
        try {
            const notification = notificationTemplates.rewardUnlocked(rewardName, businessName);
            await fetch('/api/push/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notification }),
            });
        } catch (err) {
            console.error('Error sending reward unlocked notification:', err);
        }
    }, [businessName]);

    const sendGoalGradientNudgeNotification = useCallback(async (percentage: number) => {
        try {
            const notification = notificationTemplates.goalGradientNudge(percentage, businessName);
            await fetch('/api/push/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notification }),
            });
        } catch (err) {
            console.error('Error sending goal gradient nudge notification:', err);
        }
    }, [businessName]);

    const sendInactivityWinbackNotification = useCallback(async () => {
        try {
            const notification = notificationTemplates.inactivityWinback(businessName);
            await fetch('/api/push/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notification }),
            });
        } catch (err) {
            console.error('Error sending inactivity winback notification:', err);
        }
    }, [businessName]);

    const sendTrendingMissionsNotification = useCallback(async (missionTitle: string) => {
        try {
            const notification = notificationTemplates.trendingMissions(missionTitle, businessName);
            await fetch('/api/push/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notification }),
            });
        } catch (err) {
            console.error('Error sending trending missions notification:', err);
        }
    }, [businessName]);

    const sendPersonalizedTierRewardsNotification = useCallback(async (tierName: string) => {
        try {
            const notification = notificationTemplates.personalizedTierRewards(tierName, businessName);
            await fetch('/api/push/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notification }),
            });
        } catch (err) {
            console.error('Error sending personalized tier rewards notification:', err);
        }
    }, [businessName]);

    return {
        isSupported,
        isSubscribed,
        isLoading,
        error,
        subscribe,
        unsubscribe,
        sendPointsEarnedNotification,
        sendRewardUnlockedNotification,
        sendGoalGradientNudgeNotification,
        sendInactivityWinbackNotification,
        sendTrendingMissionsNotification,
        sendPersonalizedTierRewardsNotification,
    };
}; 