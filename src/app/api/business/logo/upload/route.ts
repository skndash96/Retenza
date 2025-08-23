import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/session';
import { uploadCompanyLogo } from '@/lib/gcp/storage';

export async function POST(request: NextRequest) {
    try {
        // Check authentication
        const business = await getUserFromSession();
        if (!business) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get form data
        const formData = await request.formData();
        const file = formData.get('logo') as File;

        if (!file) {
            return NextResponse.json({ error: 'No logo file provided' }, { status: 400 });
        }

        // Validate file type
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({
                error: 'Invalid file type. Only PNG, JPEG, GIF, WebP, and SVG files are allowed.'
            }, { status: 400 });
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            return NextResponse.json({
                error: 'File too large. Maximum size is 5MB.'
            }, { status: 400 });
        }

        // Convert file to buffer
        const buffer = Buffer.from(await file.arrayBuffer());

        // Upload to GCP
        const result = await uploadCompanyLogo(buffer, file.name, business.id.toString());

        return NextResponse.json({
            success: true,
            logo_url: result.url,
            filename: result.filename,
            size: result.size,
        });

    } catch (error) {
        console.error('Error uploading logo:', error);
        return NextResponse.json(
            { error: 'Failed to upload logo' },
            { status: 500 }
        );
    }
} 