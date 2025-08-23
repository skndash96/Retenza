import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { BusinessNotificationService } from '@/lib/businessNotificationService';

export async function POST(request: NextRequest) {
    try {
        const body = (await request.json()) as { businessId?: number; title?: string; body?: string };
        const { businessId, title, body: msg } = body;

        if (!businessId || !title || !msg) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const notificationService = BusinessNotificationService.getInstance();
        await notificationService.sendCustomBusinessNotification(
            businessId,
            title,
            msg
        );

        return NextResponse.json({ success: true, message: 'Custom notification sent successfully' });
    } catch (error) {
        console.error('Error sending custom notification:', error);
        return NextResponse.json(
            { error: 'Failed to send notification' },
            { status: 500 }
        );
    }
} 