import { db } from "@/server/db";
import { businesses, loyaltyPrograms } from "@/server/db/schema";
import type { Tier } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from 'zod';

const cashbackRewardSchema = z.object({
  reward_type: z.literal('cashback'),
  percentage: z.number().int().positive('Percentage must be a positive number.').max(100, 'Cashback cannot exceed 100%.'),
});

const limitedUsageRewardSchema = z.object({
  reward_type: z.literal('limited_usage'),
  reward_text: z.string().min(1, 'Reward description is required.'),
  usage_limit_per_month: z.number().positive('Usage limit per month must be a positive number.').max(12, 'Cannot exceed 12 times per month.'),
  one_time: z.boolean(),
});

const customRewardSchema = z.object({
  reward_type: z.literal('custom'),
  name: z.string().min(1, 'Reward name is required.'),
  reward: z.string().min(1, 'Reward description is required.'),
});

const loyaltyProgramSchema = z.object({
  pointsRate: z.number().int().positive('Points rate must be a positive integer.').min(1, 'Points rate must be at least 1.'),
  description: z.string().min(10, 'A loyalty program description is required.'),
  tiers: z.array(z.object({
    name: z.string().min(1, 'Tier name is required.'),
    points_to_unlock: z.number().int().positive('Points must be a positive integer.').min(1, 'Points must be at least 1.'),
    rewards: z.array(z.discriminatedUnion('reward_type', [
      cashbackRewardSchema,
      limitedUsageRewardSchema,
      customRewardSchema,
    ])).min(1, 'At least one reward is required per tier.'),
  })).min(1, 'At least one loyalty tier is required.'),
});

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session_id")?.value;

  if (!sessionId) {
    return NextResponse.json({ error: "Session not found. Please log in again." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validatedData = loyaltyProgramSchema.parse(body);
    const { pointsRate, description, tiers } = validatedData;

    const session = await db.query.sessions.findFirst({
      where: (s, { eq }) => eq(s.id, sessionId),
    });

    if (!session) {
      return NextResponse.json({ error: "Invalid session." }, { status: 401 });
    }

    await db.transaction(async (tx) => {
      let rewardIdCounter = 1; // Global counter for unique reward IDs

      const tiersWithIds: Tier[] = tiers.map((tier, index) => ({
        ...tier,
        id: index + 1,
        rewards: tier.rewards.map((reward) => {
          // Preserve the original detailed structure, just add unique ID
          if (reward.reward_type === 'cashback') {
            return {
              id: rewardIdCounter++, // Assign unique ID
              ...reward, // Keep all original fields
            };
          } else if (reward.reward_type === 'limited_usage') {
            return {
              id: rewardIdCounter++, // Assign unique ID
              ...reward, // Keep all original fields
            };
          } else if (reward.reward_type === 'custom') {
            return {
              id: rewardIdCounter++, // Assign unique ID
              ...reward, // Keep all original fields
            };
          }
          throw new Error(`Invalid reward type: ${(reward as any).reward_type}`);
        }),
      }));

      await tx.insert(loyaltyPrograms).values({
        businessId: session.userId,
        pointsRate,
        description,
        tiers: tiersWithIds,
      });

      await tx.update(businesses).set({ isSetupComplete: true }).where(eq(businesses.id, session.userId));
    });

    return NextResponse.json({ success: true, message: "Loyalty program setup complete." }, { status: 200 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed.", details: error.flatten() }, { status: 400 });
    }
    console.error("Loyalty program setup failed:", error);
    return NextResponse.json({ error: "Setup failed.", details: error instanceof Error ? error.message : "An unexpected error occurred." }, { status: 500 });
  }
}