import { NextRequest, NextResponse } from 'next/server';
import { uploadCompanyLogo } from '@/lib/gcp/storage';

export async function POST(request: NextRequest) {
    try {
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

        // Generate a unique filename for signup (using timestamp + random string)
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        const fileExtension = file.name.split('.').pop() ?? 'png';
        const uniqueFilename = `signup-${timestamp}-${randomString}.${fileExtension}`;

        // Upload to GCP with a temporary signup ID
        const result = await uploadCompanyLogo(buffer, uniqueFilename, 'signup');

        return NextResponse.json({
            success: true,
            logo_url: result.url,
            filename: result.filename,
            size: result.size,
        });

    } catch (error) {
        console.error('Error uploading logo during signup:', error);
        return NextResponse.json(
            { error: 'Failed to upload logo' },
            { status: 500 }
        );
    }
} 