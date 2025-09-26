import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/session';
import { db } from '@/server/db';
import { businesses } from '@/server/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
    try {
        const business = await getUserFromSession();

        if (!business) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get business profile
        const businessData = await db
            .select({
                id: businesses.id,
                name: businesses.name,
                business_type: businesses.business_type,
                description: businesses.description,
                address: businesses.address,
                contact_number: businesses.contact_number,
                contact_number_2: businesses.contact_number_2,
                email: businesses.email,
                gmap_link: businesses.gmap_link,
                logo_url: businesses.logo_url,
                additional_info: businesses.additional_info,
                region: businesses.region,
            })
            .from(businesses)
            .where(eq(businesses.id, business.id))
            .limit(1);

        if (businessData.length === 0) {
            return NextResponse.json({ error: 'Business not found' }, { status: 404 });
        }

        return NextResponse.json(businessData[0]);
    } catch (error) {
        console.error('Error fetching business profile:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const business = await getUserFromSession();

        if (!business) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();

        // Validate required fields
        const allowedFields = [
            'name',
            'business_type',
            'description',
            'address',
            'contact_number',
            'contact_number_2',
            'email',
            'gmap_link',
            'logo_url',
            'additional_info',
            'region'
        ];

        // Filter out invalid fields
        const updateData: Record<string, any> = {};
        for (const [key, value] of Object.entries(body)) {
            if (allowedFields.includes(key)) {
                updateData[key] = value;
            }
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json(
                { error: 'No valid fields to update' },
                { status: 400 }
            );
        }

        // Update business profile
        const updatedBusiness = await db
            .update(businesses)
            .set({
                ...updateData,
                updated_at: new Date(),
            })
            .where(eq(businesses.id, business.id))
            .returning({
                id: businesses.id,
                name: businesses.name,
                business_type: businesses.business_type,
                description: businesses.description,
                address: businesses.address,
                contact_number: businesses.contact_number,
                contact_number_2: businesses.contact_number_2,
                email: businesses.email,
                gmap_link: businesses.gmap_link,
                logo_url: businesses.logo_url,
                additional_info: businesses.additional_info,
                region: businesses.region,
            });

        if (updatedBusiness.length === 0) {
            return NextResponse.json(
                { error: 'Business not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(updatedBusiness[0]);
    } catch (error) {
        console.error('Error updating business profile:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 