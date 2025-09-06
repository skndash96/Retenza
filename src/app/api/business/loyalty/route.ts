import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { loyaltyPrograms, customerLoyalty, type Tier } from "@/server/db/schema";
import { getUserFromSession } from "@/lib/session";
import { eq, and } from "drizzle-orm";

// Interface for the incoming tier data from frontend
interface IncomingTier {
  id?: number;
  name: string;
  points_to_unlock: number;
  rewards: {
    id?: number;
    reward_type: 'cashback' | 'limited_usage' | 'custom';
    percentage?: number;
    reward_text?: string;
    usage_limit?: number;
    time_window?: {
      start_date: string;
      end_date: string;
    };
    one_time?: boolean;
    name?: string;
    reward?: string;
  }[];
}

async function recalcCustomerTier(businessId: number, customerId: number, tiers: Array<{ points_to_unlock: number; name: string }>) {
  tiers.sort((a, b) => a.points_to_unlock - b.points_to_unlock);
  const [cl] = await db
    .select()
    .from(customerLoyalty)
    .where(and(eq(customerLoyalty.customer_id, customerId), eq(customerLoyalty.business_id, businessId)))
    .limit(1);
  if (!cl) return;

  // Find the highest tier the customer qualifies for
  let newTier = tiers[0]?.name || cl.current_tier_name; // Default to first tier
  for (let i = tiers.length - 1; i >= 0; i--) {
    if (cl.points >= tiers[i].points_to_unlock) {
      newTier = tiers[i].name;
      break; // Found the highest qualifying tier
    }
  }

  await db
    .update(customerLoyalty)
    .set({ current_tier_name: newTier })
    .where(and(eq(customerLoyalty.customer_id, customerId), eq(customerLoyalty.business_id, businessId)));
}

async function updateAllCustomerTiers(businessId: number, tiers: Array<{ points_to_unlock: number; name: string }>) {
  const customers = await db.select().from(customerLoyalty).where(eq(customerLoyalty.business_id, businessId));
  for (const c of customers) {
    await recalcCustomerTier(businessId, c.customer_id, tiers);
  }
}

export async function GET() {
  try {
    const business = await getUserFromSession();
    if (!business) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const programs = await db
      .select()
      .from(loyaltyPrograms)
      .where(eq(loyaltyPrograms.business_id, business.id));
    return NextResponse.json(programs);
  } catch (error) {
    console.error("Error fetching loyalty programs:", error);
    return NextResponse.json({ error: "Failed to fetch loyalty programs" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const business = await getUserFromSession();
    if (!business) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as { tier: IncomingTier; points_rate?: number };
    if (!body.tier || typeof body.tier !== 'object') {
      return NextResponse.json({ error: "Missing or invalid tier" }, { status: 400 });
    }

    // Transform the tier data to match the detailed structure used in signup
    const transformedTier: Tier = {
      id: body.tier.id ?? Date.now(), // Ensure tier has ID
      name: body.tier.name,
      points_to_unlock: body.tier.points_to_unlock,
      rewards: body.tier.rewards.map((reward, index) => {
        // Preserve the original detailed structure, just add unique ID
        return {
          id: reward.id ?? Date.now() + index, // Ensure unique ID
          ...reward, // Keep all original fields
        };
      }),
    };

    const existingPrograms = await db.select()
      .from(loyaltyPrograms)
      .where(eq(loyaltyPrograms.business_id, business.id));

    function rewardsMatch(r1: Tier['rewards'], r2: Tier['rewards']) {
      if (r1.length !== r2.length) return false;
      return r1.every((reward, idx) => {
        const r2Reward = r2[idx];
        if (reward.reward_type !== r2Reward.reward_type) return false;

        // For the detailed reward structure, compare by type and relevant fields
        if (reward.reward_type === 'cashback') {
          return reward.percentage === r2Reward.percentage;
        } else if (reward.reward_type === 'limited_usage') {
          return reward.reward_text === r2Reward.reward_text &&
            reward.usage_limit_per_month === r2Reward.usage_limit_per_month;
        } else if (reward.reward_type === 'custom') {
          return reward.reward === r2Reward.reward &&
            reward.name === r2Reward.name;
        }
        return false;
      });
    }

    if (existingPrograms.length > 0) {
      const existingProgram = existingPrograms[0];
      const existingTiers = existingProgram.tiers;

      const duplicateTier = existingTiers.find((existingTier: Tier) => {
        return existingTier.name === transformedTier.name &&
          rewardsMatch(existingTier.rewards, transformedTier.rewards);
      });

      if (duplicateTier) {
        return NextResponse.json({ error: "Duplicate tier found. Cannot add." }, { status: 409 });
      }

      const updatedTiers = [...existingTiers, transformedTier];

      const updated = await db.update(loyaltyPrograms).set({
        tiers: updatedTiers,
      }).where(eq(loyaltyPrograms.business_id, business.id)).returning();

      // Update all customer tiers after modifying the loyalty program
      await updateAllCustomerTiers(business.id, updatedTiers.map(tier => ({ points_to_unlock: tier.points_to_unlock, name: tier.name })));

      return NextResponse.json(updated[0]);
    } else {
      if (typeof body.points_rate !== "number") {
        return NextResponse.json({ error: "Missing points_rate for new loyalty program" }, { status: 400 });
      }

      const inserted = await db.insert(loyaltyPrograms).values({
        business_id: business.id,
        points_rate: body.points_rate,
        tiers: [transformedTier],
      }).returning();

      await updateAllCustomerTiers(business.id, [{ points_to_unlock: transformedTier.points_to_unlock, name: transformedTier.name }]);

      return NextResponse.json(inserted[0]);
    }
  } catch (error) {
    console.error("Error creating/updating loyalty program:", error);
    return NextResponse.json({ error: "Failed to create/update loyalty program" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const business = await getUserFromSession();
    if (!business) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as { tiers: Tier[] };
    if (!body.tiers || !Array.isArray(body.tiers)) {
      return NextResponse.json({ error: "Missing or invalid tiers array" }, { status: 400 });
    }

    const existingPrograms = await db.select()
      .from(loyaltyPrograms)
      .where(eq(loyaltyPrograms.business_id, business.id));

    if (existingPrograms.length === 0) {
      return NextResponse.json({ error: "No loyalty program found" }, { status: 404 });
    }

    // No need to ensure reward IDs in the new structure
    const tiersWithIds = body.tiers;

    // Update the program with new tiers
    const updated = await db.update(loyaltyPrograms).set({
      tiers: tiersWithIds
    }).where(eq(loyaltyPrograms.business_id, business.id)).returning();

    // Recalculate customer tiers based on new tier structure
    await updateAllCustomerTiers(business.id, body.tiers);

    return NextResponse.json({ message: "Tiers updated successfully", program: updated[0] });
  } catch (error) {
    console.error("Error updating loyalty program tiers:", error);
    return NextResponse.json({ error: "Failed to update loyalty program tiers" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const business = await getUserFromSession();
    if (!business) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as { tierName: string; reward?: { reward_type: 'cashback' | 'limited_usage' | 'custom'; percentage?: number; reward_text?: string; usage_limit_per_month?: number; name?: string; reward?: string } };
    const { tierName, reward } = body;

    if (!tierName || typeof tierName !== "string") {
      return NextResponse.json({ error: "Missing or invalid tierName" }, { status: 400 });
    }

    const existingPrograms = await db.select()
      .from(loyaltyPrograms)
      .where(eq(loyaltyPrograms.business_id, business.id));

    if (existingPrograms.length === 0) {
      return NextResponse.json({ error: "No loyalty program found" }, { status: 404 });
    }

    const program = existingPrograms[0];
    const tiers = program.tiers;
    const tierIndex = tiers.findIndex((t: Tier) => t.name === tierName);
    if (tierIndex === -1) {
      return NextResponse.json({ error: `Tier "${tierName}" does not exist` }, { status: 404 });
    }

    if (reward) {
      if (typeof reward !== "object" || !reward.reward_type) {
        return NextResponse.json({ error: "Invalid reward object" }, { status: 400 });
      }

      const rewards = tiers[tierIndex].rewards;
      const rewardIndex = rewards.findIndex((r) => {
        if (r.reward_type !== reward.reward_type) return false;

        // For the detailed reward structure, compare by type and relevant fields
        if (r.reward_type === 'cashback') {
          return r.percentage === reward.percentage;
        } else if (r.reward_type === 'limited_usage') {
          return r.reward_text === reward.reward_text &&
            r.usage_limit_per_month === reward.usage_limit_per_month;
        } else if (r.reward_type === 'custom') {
          return r.reward === reward.reward &&
            r.name === reward.name;
        }
        return false;
      });

      if (rewardIndex === -1) {
        return NextResponse.json({ error: "Reward not found in tier" }, { status: 404 });
      }

      rewards.splice(rewardIndex, 1);

      if (rewards.length === 0) tiers.splice(tierIndex, 1);
      else tiers[tierIndex].rewards = rewards;

      const updated = await db.update(loyaltyPrograms).set({ tiers }).where(eq(loyaltyPrograms.business_id, business.id)).returning();

      await updateAllCustomerTiers(business.id, tiers.map(tier => ({ points_to_unlock: tier.points_to_unlock, name: tier.name })));

      return NextResponse.json({
        message: rewards.length === 0
          ? `Reward removed and tier "${tierName}" deleted (no rewards left)`
          : `Reward removed from tier "${tierName}"`,
        updatedProgram: updated[0],
      });
    }

    tiers.splice(tierIndex, 1);
    const updated = await db.update(loyaltyPrograms).set({ tiers }).where(eq(loyaltyPrograms.business_id, business.id)).returning();

    await updateAllCustomerTiers(business.id, tiers.map(tier => ({ points_to_unlock: tier.points_to_unlock, name: tier.name })));

    return NextResponse.json({
      message: `Tier "${tierName}" deleted successfully`,
      updatedProgram: updated[0],
    });

  } catch (error) {
    console.error("Error deleting tier or reward:", error);
    return NextResponse.json({ error: "Failed to delete tier or reward" }, { status: 500 });
  }
}