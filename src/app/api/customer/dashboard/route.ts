import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { businesses, customerLoyalty } from '@/server/db/schema';
import { getCustomerFromSession } from '@/lib/session';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getCustomerFromSession();

    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const customerShops = await db
      .select({
        shopId: businesses.id,
        shopName: businesses.name,
        shopType: businesses.business_type,
        loyaltyPoints: customerLoyalty.points,
        currentTier: customerLoyalty.current_tier_name,
      })
      .from(customerLoyalty)
      .innerJoin(businesses, eq(customerLoyalty.business_id, businesses.id))
      .where(eq(customerLoyalty.customer_id, sessionUser.id));

    return NextResponse.json({ shops: customerShops });
  } catch (error) {
    console.error('Error fetching customer dashboard data:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data.' }, { status: 500 });
  }
}