import { NextRequest, NextResponse } from "next/server";
import { db, customers, customerLoyalty, transactions, loyaltyPrograms } from "@/server/db";
import { getUserFromSession } from "@/lib/session";
import { eq, sql, and, desc, gte } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const business = await getUserFromSession();
  if (!business) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const businessId = business.id;

  const now = new Date();
  const lastWeekDate = new Date();
  lastWeekDate.setDate(now.getDate() - 7);
  const lastMonthDate = new Date();
  lastMonthDate.setMonth(now.getMonth() - 1);

  const rows = await db
    .select({
      c: customers,
      cl: customerLoyalty,
      last_txn_at: sql`MAX(${transactions.created_at})`,
    })
    .from(customers)
    .leftJoin(customerLoyalty, eq(customerLoyalty.customer_id, customers.id))
    .leftJoin(transactions, eq(transactions.customer_id, customers.id))
    .where(eq(customerLoyalty.business_id, businessId))
    .groupBy(
      customers.id,
      customerLoyalty.customer_id,
      customerLoyalty.points,
      customerLoyalty.current_tier_name,
      customerLoyalty.created_at,
      customerLoyalty.business_id
    )
    .orderBy(desc(customerLoyalty.updated_at));

  const lastWeekCountResult = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(transactions)
    .where(and(
      eq(transactions.business_id, businessId),
      gte(transactions.created_at, lastWeekDate)
    ));
  const lastWeekCount = Number(lastWeekCountResult[0]?.count || 0);

  const lastMonthCountResult = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(transactions)
    .where(and(
      eq(transactions.business_id, businessId),
      gte(transactions.created_at, lastMonthDate)
    ));
  const lastMonthCount = Number(lastMonthCountResult[0]?.count || 0);

  return NextResponse.json({
    customers: rows,
    transactionsLastWeek: lastWeekCount,
    transactionsLastMonth: lastMonthCount,
  });
}
