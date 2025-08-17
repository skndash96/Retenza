import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { campaigns, customerLoyalty } from '@/server/db/schema';
import { getCustomerFromSession } from '@/lib/session';
import { eq, and, sql } from 'drizzle-orm';

export async function GET(_req: NextRequest) {
  try {
    const sessionUser = await getCustomerFromSession();

    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allActiveCampaigns = await db.select().from(campaigns).where(and(
      sql`${campaigns.expires_at} > now()`,
    ));

    const eligibleMissions = [];

    const customerLoyaltyRecords = await db.select().from(customerLoyalty)
      .where(eq(customerLoyalty.customer_id, sessionUser.id));
      
    const loyaltyMap = new Map(customerLoyaltyRecords.map(rec => [rec.business_id, rec]));

    for (const campaign of allActiveCampaigns) {
      let isEligible = false;
      if (campaign.applicable_tiers.includes('all')) {
        isEligible = true;
      }
      else {
        const loyaltyRecord = loyaltyMap.get(campaign.business_id);
        if (loyaltyRecord?.current_tier_name) {
          if (campaign.applicable_tiers.includes(loyaltyRecord.current_tier_name)) {
            isEligible = true;
          }
        }
      }

      if (isEligible) {
        eligibleMissions.push(campaign);
      }
    }

    return NextResponse.json(eligibleMissions);

  } catch (error) {
    console.error('Error fetching missions:', error);
    return NextResponse.json({ error: 'Failed to fetch missions.' }, { status: 500 });
  }
}