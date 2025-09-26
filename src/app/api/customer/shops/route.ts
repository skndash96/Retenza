import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { businesses } from '@/server/db/schema';
import { getCustomerFromSession } from '@/lib/session';

export async function GET(_req: NextRequest) {
  try {
    const sessionUser = await getCustomerFromSession();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const allBusinesses = await db.select({
      id: businesses.id,
      name: businesses.name,
      business_type: businesses.business_type,
      address: businesses.address,
      gmap_link: businesses.gmap_link,
      logo_url: businesses.logo_url,
      region: businesses.region,
    }).from(businesses);

    return NextResponse.json(allBusinesses);
  } catch (error) {
    console.error('Error fetching shops:', error);
    return NextResponse.json({ error: 'Failed to fetch shops.' }, { status: 500 });
  }
}
