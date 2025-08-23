import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { missions, customerLoyalty, businesses, missionRegistry } from '@/server/db/schema';
import { getCustomerFromSession } from '@/lib/session';
import { eq, and, sql } from 'drizzle-orm';

export async function GET(_req: NextRequest) {
  try {
    const sessionUser = await getCustomerFromSession();

    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allActiveMissions = await db
      .select({
        id: missions.id,
        business_id: missions.business_id,
        title: missions.title,
        description: missions.description,
        offer: missions.offer,
        applicable_tiers: missions.applicable_tiers,
        expires_at: missions.expires_at,
        filters: missions.filters,
        business_name: businesses.name,
        business_address: businesses.address,
      })
      .from(missions)
      .innerJoin(businesses, eq(missions.business_id, businesses.id))
      .where(and(
        sql`${missions.expires_at} > now()`,
        eq(missions.is_active, true)
      ));

    // Get customer's completed missions to filter them out
    const completedMissions = await db
      .select({ mission_id: missionRegistry.mission_id })
      .from(missionRegistry)
      .where(and(
        eq(missionRegistry.customer_id, sessionUser.id),
        eq(missionRegistry.status, 'completed')
      ));

    const completedMissionIds = new Set(completedMissions.map(m => m.mission_id));

    const eligibleMissions = [];

    const customerLoyaltyRecords = await db.select().from(customerLoyalty)
      .where(eq(customerLoyalty.customer_id, sessionUser.id));

    const loyaltyMap = new Map(customerLoyaltyRecords.map(rec => [rec.business_id, rec]));

    for (const mission of allActiveMissions) {
      let isEligible = false;
      if (mission.applicable_tiers.includes('all')) {
        isEligible = true;
      }
      else {
        const loyaltyRecord = loyaltyMap.get(mission.business_id);
        if (loyaltyRecord?.current_tier_name) {
          if (mission.applicable_tiers.includes(loyaltyRecord.current_tier_name)) {
            isEligible = true;
          }
        }
      }

      if (isEligible && !completedMissionIds.has(mission.id)) {
        eligibleMissions.push(mission);
      }
    }

    return NextResponse.json(eligibleMissions);

  } catch (error) {
    console.error('Error fetching missions:', error);
    return NextResponse.json({ error: 'Failed to fetch missions.' }, { status: 500 });
  }
}