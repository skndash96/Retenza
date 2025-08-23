'use client';

import { useState, useEffect } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export default function DebugPushPage() {
    const [subscriptionInfo, setSubscriptionInfo] = useState<any>(null);
    const [testResult, setTestResult] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);

    const {
        isSupported,
        isSubscribed,
        isLoading: hookLoading,
        error,
        subscribe,
        unsubscribe
    } = usePushNotifications({
        businessId: 1,
        businessName: 'Test Business'
    });

    useEffect(() => {
        void checkSubscriptionStatus();
    }, []);

    const checkSubscriptionStatus = async () => {
        try {
            if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
                const registration = await navigator.serviceWorker.ready;
                const subscription = await registration.pushManager.getSubscription();

                if (subscription) {
                    setSubscriptionInfo({
                        endpoint: subscription.endpoint,
                        keys: {
                            p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh') ?? new ArrayBuffer(0)))),
                            auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth') ?? new ArrayBuffer(0))))
                        }
                    });
                } else {
                    setSubscriptionInfo(null);
                }
            }
        } catch (error) {
            console.error('Error checking subscription:', error);
        }
    };

    const testPushNotification = async () => {
        setIsLoading(true);
        setTestResult('');

        try {
            if (!subscriptionInfo) {
                setTestResult('No subscription found. Please subscribe first.');
                return;
            }

            const response = await fetch('/api/push/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    subscription: subscriptionInfo,
                    notification: {
                        title: 'Test Notification',
                        body: 'This is a test push notification from Retenza!',
                        data: { type: 'test', timestamp: Date.now() },
                        tag: 'test-notification',
                    },
                }),
            });

            const result = await response.json();

            if (response.ok) {
                setTestResult('Test notification sent successfully! Check your device for the notification.');
            } else {
                setTestResult(`Failed to send notification: ${result.error}`);
            }
        } catch (error) {
            setTestResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsLoading(false);
        }
    };

    const sendTestNotificationToBusiness = async () => {
        setIsLoading(true);
        setTestResult('');

        try {
            const response = await fetch('/api/business/notifications/custom', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    businessId: 1,
                    title: 'Test Business Notification',
                    body: 'This is a test notification sent to all customers of this business',
                    type: 'custom',
                    data: { type: 'test', timestamp: Date.now() },
                }),
            });

            const result = await response.json();

            if (response.ok) {
                setTestResult('Test business notification sent successfully!');
            } else {
                setTestResult(`Failed to send business notification: ${result.error}`);
            }
        } catch (error) {
            setTestResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <h1 className="text-3xl font-bold mb-6">Push Notification Debug</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Status Section */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4">Status</h2>
                    <div className="space-y-2">
                        <p><strong>Supported:</strong> {isSupported ? '✅ Yes' : '❌ No'}</p>
                        <p><strong>Subscribed:</strong> {isSubscribed ? '✅ Yes' : '❌ No'}</p>
                        <p><strong>Loading:</strong> {hookLoading ? '🔄 Yes' : '❌ No'}</p>
                        {error && <p><strong>Error:</strong> <span className="text-red-600">{error}</span></p>}
                    </div>
                </div>

                {/* Actions Section */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4">Actions</h2>
                    <div className="space-y-3">
                        <button
                            onClick={subscribe}
                            disabled={hookLoading || !isSupported}
                            className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                            {hookLoading ? 'Subscribing...' : 'Subscribe'}
                        </button>

                        <button
                            onClick={unsubscribe}
                            disabled={hookLoading || !isSubscribed}
                            className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
                        >
                            {hookLoading ? 'Unsubscribing...' : 'Unsubscribe'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Subscription Info */}
            {subscriptionInfo && (
                <div className="bg-white p-6 rounded-lg shadow-md mt-6">
                    <h2 className="text-xl font-semibold mb-4">Subscription Info</h2>
                    <div className="bg-gray-100 p-4 rounded">
                        <pre className="text-sm overflow-x-auto">
                            {JSON.stringify(subscriptionInfo, null, 2)}
                        </pre>
                    </div>
                </div>
            )}

            {/* Test Section */}
            <div className="bg-white p-6 rounded-lg shadow-md mt-6">
                <h2 className="text-xl font-semibold mb-4">Test Notifications</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                        onClick={testPushNotification}
                        disabled={isLoading || !subscriptionInfo}
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                    >
                        {isLoading ? 'Sending...' : 'Test Direct Push'}
                    </button>

                    <button
                        onClick={sendTestNotificationToBusiness}
                        disabled={isLoading}
                        className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
                    >
                        {isLoading ? 'Sending...' : 'Test Business Notification'}
                    </button>
                </div>

                {testResult && (
                    <div className="mt-4 p-4 bg-gray-100 rounded">
                        <p className="font-semibold">Result:</p>
                        <p>{testResult}</p>
                    </div>
                )}
            </div>

            {/* Environment Check */}
            <div className="bg-white p-6 rounded-lg shadow-md mt-6">
                <h2 className="text-xl font-semibold mb-4">Environment Check</h2>
                <div className="space-y-2">
                    <p><strong>VAPID Public Key:</strong> {process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ? '✅ Configured' : '❌ Missing'}</p>
                    <p><strong>Service Worker:</strong> {typeof window !== 'undefined' && 'serviceWorker' in navigator ? '✅ Supported' : '❌ Not Supported'}</p>
                    <p><strong>Push Manager:</strong> {typeof window !== 'undefined' && 'PushManager' in window ? '✅ Supported' : '❌ Not Supported'}</p>
                    <p><strong>Notifications:</strong> {typeof window !== 'undefined' && 'Notification' in window ? '✅ Supported' : '❌ Not Supported'}</p>
                </div>
            </div>
        </div>
    );
} 