import { db } from "@/server/db";
import { businesses, loyaltyPrograms, sessions } from "@/server/db/schema";
import type { Tier } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from 'zod';

const loyaltyProgramSchema = z.object({
  points_rate: z.number().int().positive('Points rate must be a positive integer.').min(1, 'Points rate must be at least 1.'),
  description: z.string().min(10, 'A loyalty program description is required.'), 
  tiers: z.array(z.object({
    name: z.string().min(1, 'Tier name is required.'),
    points_to_unlock: z.number().int().positive('Points must be a positive integer.').min(1, 'Points must be at least 1.'),
    rewards: z.array(z.discriminatedUnion('reward_type', [
      z.object({ reward_type: z.literal('Free Item'), description: z.string().min(1, 'Item name is required.'), value: z.number().optional() }),
      z.object({ reward_type: z.literal('Discount'), description: z.string().optional(), value: z.number().int().positive().min(1).max(100) }),
      z.object({ reward_type: z.literal('Cashback'), description: z.string().optional(), value: z.number().int().positive().min(1) }),
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
    const { points_rate, description, tiers } = validatedData;

    const session = await db.query.sessions.findFirst({
      where: (s, { eq }) => eq(s.id, sessionId),
    });

    if (!session) {
      return NextResponse.json({ error: "Invalid session." }, { status: 401 });
    }

    await db.transaction(async (tx) => {
      const tiersWithIds: Tier[] = tiers.map((tier, index) => ({
        ...tier,
        id: index + 1,
        rewards: tier.rewards.map((reward: any) => ({
          ...reward,
          value: reward.value !== undefined ? reward.value : 0,
          description: reward.description !== undefined ? reward.description : "",
        })),
      }));

      await tx.insert(loyaltyPrograms).values({
        business_id: session.userId,
        points_rate,
        description,
        tiers: tiersWithIds,
      });

      await tx.update(businesses).set({ is_setup_complete: true }).where(eq(businesses.id, session.userId));
    });

    return NextResponse.json({ success: true, message: "Loyalty program setup complete." }, { status: 200 });

  } catch (error) {
    if (error instanceof z.ZodError) { return NextResponse.json({ error: "Validation failed.", details: error.flatten() }, { status: 400 }); }
    console.error("Loyalty program setup failed:", error);
    return NextResponse.json({ error: "Setup failed.", details: error instanceof Error ? error.message : "An unexpected error occurred." }, { status: 500 });
  }
}