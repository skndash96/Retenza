'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, Smartphone, Database, TestTube, AlertCircle } from 'lucide-react';

interface DebugInfo {
    vapid: {
        publicKey: string;
        privateKey: string;
        publicKeyLength: number;
    };
    subscriptions: {
        total: number;
        details: Array<{
            id: number;
            customer: string;
            business: string;
            endpoint: string;
            hasKeys: {
                p256dh: boolean;
                auth: boolean;
            };
            createdAt: string;
            business_id: number;
        }>;
    };
    environment: {
        nodeEnv: string;
        baseUrl: string;
        vercelUrl: string;
    };
}

interface TestResult {
    success: boolean;
    message: string;
    total: number;
    successful: number;
    failed: number;
    results: Array<{
        success: boolean;
        subscriptionId: number;
        statusCode?: number;
        error?: string;
    }>;
    notification: {
        title: string;
        body: string;
        tag: string;
    };
}

export default function DebugMobilePage() {
    const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [testResult, setTestResult] = useState<TestResult | null>(null);

    const checkMobileDebugInfo = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/push/debug-mobile');
            const data = await response.json();
            if (data.status === 'success') {
                setDebugInfo(data.data);
                setMessage(`✅ Found ${data.data.subscriptions.total} push subscriptions`);
            } else {
                setMessage('❌ Failed to get mobile debug info');
            }
        } catch (error) {
            setMessage('❌ Error getting mobile debug info');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const testMobilePush = async () => {
        if (!debugInfo || debugInfo.subscriptions.total === 0) {
            setMessage('❌ No subscriptions found. Please check debug info first.');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/push/test-mobile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}) // Test all subscriptions
            });

            const data = await response.json();
            if (data.success) {
                setTestResult(data);
                setMessage(`✅ Mobile push test completed: ${data.successful} successful, ${data.failed} failed`);
            } else {
                setMessage(`❌ Failed to test mobile push: ${data.error}`);
            }
        } catch (error) {
            setMessage('❌ Error testing mobile push');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const testSpecificBusiness = async (businessId: number) => {
        setLoading(true);
        try {
            const response = await fetch('/api/push/test-mobile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ businessId })
            });

            const data = await response.json();
            if (data.success) {
                setTestResult(data);
                setMessage(`✅ Business-specific test completed: ${data.successful} successful, ${data.failed} failed`);
            } else {
                setMessage(`❌ Failed to test business push: ${data.error}`);
            }
        } catch (error) {
            setMessage('❌ Error testing business push');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto py-8 max-w-6xl">
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent mb-4">
                    Mobile Push Notification Debug
                </h1>
                <p className="text-lg text-gray-600">
                    Debug why push notifications are not appearing on mobile devices
                </p>
            </div>

            {message && (
                <div className={`p-4 rounded-lg mb-6 ${message.includes('✅') ? 'bg-green-100 text-green-800' :
                    message.includes('❌') ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                    }`}>
                    {message}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Debug Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Database className="h-5 w-5" />
                            Check Push Subscriptions
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button
                            onClick={checkMobileDebugInfo}
                            disabled={loading}
                            className="w-full"
                        >
                            {loading ? 'Checking...' : 'Check Mobile Debug Info'}
                        </Button>

                        {debugInfo && (
                            <div className="text-sm space-y-2">
                                <p><strong>VAPID Public Key:</strong> {debugInfo.vapid.publicKey}</p>
                                <p><strong>VAPID Private Key:</strong> {debugInfo.vapid.privateKey}</p>
                                <p><strong>Total Subscriptions:</strong> {debugInfo.subscriptions.total}</p>
                                <p><strong>Environment:</strong> {debugInfo.environment.nodeEnv}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Mobile Push Test */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Smartphone className="h-5 w-5" />
                            Test Mobile Push
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button
                            onClick={testMobilePush}
                            disabled={loading || !debugInfo || debugInfo.subscriptions.total === 0}
                            className="w-full"
                        >
                            <TestTube className="h-4 w-4 mr-2" />
                            {loading ? 'Testing...' : 'Test All Subscriptions'}
                        </Button>

                        <div className="text-sm text-gray-600">
                            <p>• Check debug info first</p>
                            <p>• Test mobile push delivery</p>
                            <p>• Check mobile notification center</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Subscriptions Details */}
            {debugInfo && debugInfo.subscriptions.total > 0 && (
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bell className="h-5 w-5" />
                            Push Subscriptions ({debugInfo.subscriptions.total})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {debugInfo.subscriptions.details.map((sub) => (
                                <div key={sub.id} className="border rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <div>
                                            <h4 className="font-semibold">
                                                {sub.customer} → {sub.business}
                                            </h4>
                                            <p className="text-sm text-gray-600">ID: {sub.id}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Badge variant={sub.hasKeys.p256dh ? "default" : "destructive"}>
                                                p256dh: {sub.hasKeys.p256dh ? "✅" : "❌"}
                                            </Badge>
                                            <Badge variant={sub.hasKeys.auth ? "default" : "destructive"}>
                                                auth: {sub.hasKeys.auth ? "✅" : "❌"}
                                            </Badge>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 mb-2">
                                        Endpoint: {sub.endpoint}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        Created: {new Date(sub.createdAt).toLocaleString()}
                                    </p>
                                    <Button
                                        onClick={() => testSpecificBusiness(sub.business_id)}
                                        size="sm"
                                        variant="outline"
                                        className="mt-2"
                                    >
                                        Test This Business
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Test Results */}
            {testResult && (
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TestTube className="h-5 w-5" />
                            Test Results
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                                <div className="p-4 bg-blue-50 rounded-lg">
                                    <h3 className="font-semibold text-blue-800">Total</h3>
                                    <p className="text-2xl font-bold text-blue-600">{testResult.total}</p>
                                </div>
                                <div className="p-4 bg-green-50 rounded-lg">
                                    <h3 className="font-semibold text-green-800">Successful</h3>
                                    <p className="text-2xl font-bold text-green-600">{testResult.successful}</p>
                                </div>
                                <div className="p-4 bg-red-50 rounded-lg">
                                    <h3 className="font-semibold text-red-800">Failed</h3>
                                    <p className="text-2xl font-bold text-red-600">{testResult.failed}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h4 className="font-semibold">Test Notification Sent:</h4>
                                <div className="bg-gray-50 p-3 rounded">
                                    <p><strong>Title:</strong> {testResult.notification.title}</p>
                                    <p><strong>Body:</strong> {testResult.notification.body}</p>
                                    <p><strong>Tag:</strong> {testResult.notification.tag}</p>
                                </div>
                            </div>

                            {testResult.results && (
                                <div className="space-y-2">
                                    <h4 className="font-semibold">Individual Results:</h4>
                                    <div className="space-y-1">
                                        {testResult.results.map((result, index) => (
                                            <div key={index} className={`p-2 rounded text-sm ${result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                Subscription {result.subscriptionId}: {result.success ? '✅ Success' : `❌ ${result.error}`}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Troubleshooting Guide */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5" />
                        Mobile Push Troubleshooting Guide
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <h4 className="font-semibold">Common Issues & Solutions:</h4>
                        <ol className="list-decimal list-inside space-y-2 text-sm">
                            <li><strong>Service Worker Not Active:</strong> Check if service worker is registered and active in browser DevTools → Application → Service Workers</li>
                            <li><strong>Notification Permission:</strong> Ensure notification permission is granted (Settings → Site Settings → Notifications)</li>
                            <li><strong>VAPID Keys:</strong> Verify VAPID keys are correctly set in environment variables</li>
                            <li><strong>HTTPS Required:</strong> Push notifications only work over HTTPS (except localhost)</li>
                            <li><strong>Mobile Browser:</strong> Some mobile browsers have restrictions on push notifications</li>
                            <li><strong>Subscription Format:</strong> Check if subscription keys (p256dh, auth) are properly stored</li>
                        </ol>
                    </div>

                    <div className="space-y-2">
                        <h4 className="font-semibold">Testing Steps:</h4>
                        <ol className="list-decimal list-inside space-y-1 text-sm">
                            <li>Check debug info to see subscriptions</li>
                            <li>Test mobile push delivery</li>
                            <li>Check mobile notification center</li>
                            <li>Verify service worker logs in browser console</li>
                            <li>Test on different devices/browsers</li>
                        </ol>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 