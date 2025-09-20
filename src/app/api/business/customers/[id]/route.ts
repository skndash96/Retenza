import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db, customers, customerLoyalty, transactions, loyaltyPrograms } from "@/server/db";
import { getUserFromSession } from "@/lib/session";
import { eq, and, desc } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getUserFromSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const businessId = session.id;
  const customerId = Number(id);

  const [cust] = await db.select().from(customers).where(eq(customers.id, customerId)).limit(1);
  if (!cust) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

  const [cl] = await db
    .select()
    .from(customerLoyalty)
    .where(and(eq(customerLoyalty.customerId, customerId), eq(customerLoyalty.businessId, businessId)))
    .limit(1);

  const txns = await db
    .select()
    .from(transactions)
    .where(and(eq(transactions.customerId, customerId), eq(transactions.businessId, businessId)))
    .orderBy(desc(transactions.createdAt))
    .limit(50);

  return NextResponse.json({ customer: cust, loyalty: cl ?? null, transactions: txns });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getUserFromSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const businessId = session.id;
  const customerId = Number(id);
  const body = await req.json() as { bill_amount?: number };

  if (!body.bill_amount) return NextResponse.json({ error: "bill_amount required" }, { status: 400 });

  const billAmountInt = Math.round(body.bill_amount);

  const [lp] = await db.select().from(loyaltyPrograms).where(eq(loyaltyPrograms.businessId, businessId)).limit(1);
  const pointsRate = lp?.pointsRate ?? 1;
  const pointsAwarded = Math.floor(billAmountInt * pointsRate);

  const insertedTxn = await db.insert(transactions).values({
    customerId: customerId,
    businessId: businessId,
    billAmount: billAmountInt.toFixed(2),
    pointsAwarded: pointsAwarded,
  }).returning();

  const [cl] = await db
    .select()
    .from(customerLoyalty)
    .where(and(eq(customerLoyalty.customerId, customerId), eq(customerLoyalty.businessId, businessId)))
    .limit(1);

  if (cl) {
    const newPoints = cl.points + pointsAwarded;
    let newTier = cl.currentTierName;

    if (lp?.tiers?.length) {
      const tiers = lp.tiers as Array<{ points_to_unlock: number; name: string }>;
      tiers.sort((a, b) => a.points_to_unlock - b.points_to_unlock);
      // Find the highest tier the customer qualifies for
      for (let i = tiers.length - 1; i >= 0; i--) {
        if (newPoints >= tiers[i].points_to_unlock) {
          newTier = tiers[i].name;
          break; // Found the highest qualifying tier
        }
      }
    }

    await db
      .update(customerLoyalty)
      .set({
        ...(customerLoyalty.points && { [customerLoyalty.points.name]: newPoints }),
        ...(customerLoyalty.currentTierName && { [customerLoyalty.currentTierName.name]: newTier })
      })
      .where(and(eq(customerLoyalty.customerId, customerId), eq(customerLoyalty.businessId, businessId)));
  } else {
    let initialTier = null;
    if (lp?.tiers?.length) {
      const tiers = lp.tiers as Array<{ points_to_unlock: number; name: string }>;
      tiers.sort((a, b) => a.points_to_unlock - b.points_to_unlock);
      // Find the highest tier the customer qualifies for
      for (let i = tiers.length - 1; i >= 0; i--) {
        if (pointsAwarded >= tiers[i].points_to_unlock) {
          initialTier = tiers[i].name;
          break; // Found the highest qualifying tier
        }
      }
    }
    await db.insert(customerLoyalty).values({
      customerId,
      businessId,
      ...(customerLoyalty.points && { points: pointsAwarded }),
      ...(customerLoyalty.currentTierName && { current_tier_name: initialTier }),
    });
  }

  return NextResponse.json({ transaction: insertedTxn[0] });
}
