import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db, customers, customerLoyalty, transactions, loyaltyPrograms } from "@/server/db";
import { getUserFromSession } from "@/lib/session";
import { eq, sql, and, desc } from "drizzle-orm";

export async function GET(_req: NextRequest) {
  const business = await getUserFromSession();
  if (!business) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const businessId = business.id;

  const rows = await db
    .select({
      c: customers,
      cl: customerLoyalty,
      last_txn_at: sql`MAX(${transactions.created_at})`,
    })
    .from(customers)
    .innerJoin(
      customerLoyalty,
      and(eq(customerLoyalty.customer_id, customers.id), eq(customerLoyalty.business_id, businessId))
    )
    .leftJoin(transactions, eq(transactions.customer_id, customers.id))
    .groupBy(
      customers.id,
      customerLoyalty.customer_id,
      customerLoyalty.points,
      customerLoyalty.current_tier_name,
      customerLoyalty.created_at,
      customerLoyalty.business_id
    )
    .orderBy(desc(customerLoyalty.updated_at));

  const formatted = rows.map((row) => ({
    id: row.c.id,
    phone_number: row.c.phone_number,
    name: row.c.name,
    gender: row.c.gender,
    dob: row.c.dob,
    anniversary: row.c.anniversary,
    is_setup_complete: row.c.is_setup_complete,
    created_at: row.c.created_at,
    updated_at: row.c.updated_at,
    points: row.cl.points,
    current_tier_name: row.cl.current_tier_name,
    last_txn_at: row.last_txn_at,
  }));

  return NextResponse.json({ customers: formatted });
}

export async function POST(req: NextRequest) {
  const business = await getUserFromSession();
  if (!business) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const businessId = business.id;
  const body = await req.json() as { phone_number?: string };

  const phoneNumber: string | undefined = body?.phone_number;
  if (!phoneNumber || typeof phoneNumber !== "string") {
    return NextResponse.json({ error: "phone_number required" }, { status: 400 });
  }

  const existing = await db
    .select({
      c: customers,
      cl: customerLoyalty,
    })
    .from(customers)
    .innerJoin(
      customerLoyalty,
      and(eq(customerLoyalty.customer_id, customers.id), eq(customerLoyalty.business_id, businessId))
    )
    .where(eq(customers.phone_number, phoneNumber))
    .limit(1);

  if (existing.length) {
    const c = existing[0].c;
    return NextResponse.json({
      added: false,
      customer_id: c.id,
      customer: {
        id: c.id,
        phone_number: c.phone_number,
        name: c.name,
      },
    });
  }

  const globalCustomer = await db
    .select()
    .from(customers)
    .where(eq(customers.phone_number, phoneNumber))
    .limit(1);

  const customer = globalCustomer[0];
  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  const programArr = await db
    .select()
    .from(loyaltyPrograms)
    .where(eq(loyaltyPrograms.business_id, businessId))
    .limit(1);

  let program = programArr[0];
  if (!program) {
         const bronzeTier = { id: 1, name: "Bronze", points_to_unlock: 0, rewards: [] as { reward_type: string; description: string; value: number; }[] };
    const ins = await db
      .insert(loyaltyPrograms)
      .values({
        business_id: businessId,
        points_rate: 1,
        tiers: [bronzeTier],
      })
      .returning();
    program = ins[0];
  } else {
         const bronzeExists = program.tiers.some((t: unknown) => (t as { name: string })?.name?.toLowerCase() === "bronze");
    if (!bronzeExists) {
             const nextId = program.tiers.length ? Math.max(...program.tiers.map((t: unknown) => (t as { id: number })?.id ?? 0)) + 1 : 1;
       const bronzeTier = { id: nextId, name: "Bronze", points_to_unlock: 0, rewards: [] as { reward_type: string; description: string; value: number; }[] };
      const upd = await db
        .update(loyaltyPrograms)
        .set({ tiers: [...program.tiers, bronzeTier] })
        .where(eq(loyaltyPrograms.business_id, businessId))
        .returning();
      program = upd[0];
    }
  }

  const inserted = await db
    .insert(customerLoyalty)
    .values({
      customer_id: customer.id,
      business_id: businessId,
      points: 0,
      current_tier_name: "Bronze",
    })
    .returning();

  return NextResponse.json({
    added: true,
    customer_id: customer.id,
    customer: {
      id: customer.id,
      phone_number: customer.phone_number,
      name: customer.name,
    },
    loyalty: inserted[0],
  });
}