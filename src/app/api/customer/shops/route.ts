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
      businessType: businesses.businessType,
      address: businesses.address,
      gmapLink: businesses.gmapLink,
      logoUrl: businesses.logoUrl,
    }).from(businesses);

    return NextResponse.json(allBusinesses);
  } catch (error) {
    console.error('Error fetching shops:', error);
    return NextResponse.json({ error: 'Failed to fetch shops.' }, { status: 500 });
  }
}
