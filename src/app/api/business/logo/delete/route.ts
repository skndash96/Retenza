import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/session';
import { deleteCompanyLogo } from '@/lib/gcp/storage';

export async function DELETE(request: NextRequest) {
    try {
        // Check authentication
        const business = await getUserFromSession();
        if (!business) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get filename from query params
        const { searchParams } = new URL(request.url);
        const filename = searchParams.get('filename');

        if (!filename) {
            return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
        }

        // Verify the file belongs to this business
        if (!filename.startsWith(`business-logos/${business.id}/`)) {
            return NextResponse.json({ error: 'Unauthorized to delete this file' }, { status: 403 });
        }

        // Delete from GCP
        const result = await deleteCompanyLogo(filename);

        if (!result.success) {
            return NextResponse.json({ error: result.message }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: result.message,
        });

    } catch (error) {
        console.error('Error deleting logo:', error);
        return NextResponse.json(
            { error: 'Failed to delete logo' },
            { status: 500 }
        );
    }
} 