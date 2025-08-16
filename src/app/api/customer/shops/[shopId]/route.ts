import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { businesses, customerLoyalty, transactions, loyaltyPrograms } from '@/server/db/schema';
import { getCustomerFromSession } from '@/lib/session';
import { eq, and } from 'drizzle-orm';

export async function GET(req: NextRequest, { params }: { params: { shopId: string } }) {
  try {
    const sessionUser = await getCustomerFromSession();
    const { shopId: shopIdString } = await params;
    const shopId = parseInt(shopIdString);

    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [shopData] = await db
      .select({
        id: businesses.id,
        name: businesses.name,
        business_type: businesses.business_type,
        address: businesses.address,
        loyaltyProgram: loyaltyPrograms, 
      })
      .from(businesses)
      .leftJoin(loyaltyPrograms, eq(loyaltyPrograms.business_id, businesses.id))
      .where(eq(businesses.id, shopId));

    if (!shopData) {
      return NextResponse.json({ error: 'Shop not found.' }, { status: 404 });
    }

    const [customerLoyaltyRecord] = await db
      .select()
      .from(customerLoyalty)
      .where(and(eq(customerLoyalty.customer_id, sessionUser.id), eq(customerLoyalty.business_id, shopId)));

    const customerTransactions = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.customer_id, sessionUser.id), eq(transactions.business_id, shopId)));

    return NextResponse.json({
      shop: {
        id: shopData.id,
        name: shopData.name,
        business_type: shopData.business_type,
        address: shopData.address,
      },
      loyaltyProgram: shopData.loyaltyProgram || null,
      loyalty: customerLoyaltyRecord || null,
      transactions: customerTransactions,
    });
  } catch (error) {
    console.error(`Error fetching shop details for shopId ${params.shopId}:`, error);
    return NextResponse.json({ error: 'Failed to fetch shop details.' }, { status: 500 });
  }
}