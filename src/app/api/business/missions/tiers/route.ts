import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { loyaltyPrograms } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { getUserFromSession as getBusinessFromSession } from "@/lib/session";

export async function GET() {
  try {
    const business = await getBusinessFromSession();
    if (!business) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const program = await db
      .select({ tiers: loyaltyPrograms.tiers })
      .from(loyaltyPrograms)
      .where(eq(loyaltyPrograms.business_id, business.id))
      .limit(1);

    if (!program.length) {
      return NextResponse.json({ error: "No loyalty program found" }, { status: 404 });
    }

    const tiers = Array.isArray(program[0].tiers)
      ? program[0].tiers.map(tier => tier.name)
      : [];

    
    return NextResponse.json(tiers);
  } catch (err) {
    console.error("Error fetching tiers:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
