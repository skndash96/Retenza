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
        businessId: missions.businessId,
        title: missions.title,
        description: missions.description,
        offer: missions.offer,
        applicableTiers: missions.applicable_tiers,
        expiresAt: missions.expiresAt,
        filters: missions.filters,
        businessName: businesses.name,
        businessAddress: businesses.address,
      })
      .from(missions)
      .innerJoin(businesses, eq(missions.businessId, businesses.id))
      .where(and(
        sql`${missions.expiresAt} > now()`,
        eq(missions.isActive, true)
      ));

    // Get customer's completed missions to filter them out
    const completedMissions = await db
      .select({ mission_id: missionRegistry.missionId })
      .from(missionRegistry)
      .where(and(
        eq(missionRegistry.customerId, sessionUser.id),
        eq(missionRegistry.status, 'completed')
      ));

    const completedMissionIds = new Set(completedMissions.map(m => m.mission_id));

    const eligibleMissions = [];

    const customerLoyaltyRecords = await db.select().from(customerLoyalty)
      .where(eq(customerLoyalty.customerId, sessionUser.id));

    const loyaltyMap = new Map(customerLoyaltyRecords.map(rec => [rec.businessId, rec]));

    for (const mission of allActiveMissions) {
      let isEligible = false;
      if (mission.applicableTiers.includes('all')) {
        isEligible = true;
      }
      else {
        const loyaltyRecord = loyaltyMap.get(mission.businessId);
        if (loyaltyRecord?.currentTierName) {
          if (mission.applicableTiers.includes(loyaltyRecord.currentTierName)) {
            isEligible = true;
          }
        }
      }

      if (isEligible && !completedMissionIds.has(mission.id)) {
        eligibleMissions.push(mission);
      }
    }

    // Group missions by business
    const missionsByCompany = new Map<number, {
      business_id: number;
      business_name: string;
      business_address: string;
      missions: typeof eligibleMissions;
    }>();

    for (const mission of eligibleMissions) {
      const companyKey = mission.businessId;
      if (!missionsByCompany.has(companyKey)) {
        missionsByCompany.set(companyKey, {
          business_id: mission.businessId,
          business_name: mission.businessName,
          business_address: mission.businessAddress ?? '',
          missions: []
        });
      }
      const company = missionsByCompany.get(companyKey);
      if (company) {
        company.missions.push(mission);
      }
    }

    const result = Array.from(missionsByCompany.values());
    return NextResponse.json(result);

  } catch (error) {
    console.error('Error fetching missions:', error);
    return NextResponse.json({ error: 'Failed to fetch missions.' }, { status: 500 });
  }
}