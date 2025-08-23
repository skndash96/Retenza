import { type NextRequest, NextResponse } from "next/server";
import { db, customers, customerLoyalty, transactions, missions, businesses } from "@/server/db";
import { getUserFromSession } from "@/lib/session";
import { eq, sql, and, desc, gte, count, sum } from "drizzle-orm";

export async function GET(_req: NextRequest) {
  try {
    const business = await getUserFromSession();
    if (!business) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const businessId = business.id;

    const now = new Date();
    const lastWeekDate = new Date();
    lastWeekDate.setDate(now.getDate() - 7);
    const lastMonthDate = new Date();
    lastMonthDate.setMonth(now.getMonth() - 1);

    // Get customer data
    const rows = await db
      .select({
        c: customers,
        cl: customerLoyalty,
      })
      .from(customers)
      .innerJoin(customerLoyalty, eq(customerLoyalty.customer_id, customers.id))
      .where(eq(customerLoyalty.business_id, businessId))
      .orderBy(desc(customerLoyalty.updated_at));

    // Get transaction counts
    const lastWeekCountResult = await db
      .select({ count: count() })
      .from(transactions)
      .where(and(
        eq(transactions.business_id, businessId),
        gte(transactions.created_at, lastWeekDate)
      ));
    const lastWeekCount = Number(lastWeekCountResult[0]?.count ?? 0);

    const lastMonthCountResult = await db
      .select({ count: count() })
      .from(transactions)
      .where(and(
        eq(transactions.business_id, businessId),
        gte(transactions.created_at, lastMonthDate)
      ));
    const lastMonthCount = Number(lastMonthCountResult[0]?.count ?? 0);

    // Get revenue data
    const revenueResult = await db
      .select({
        totalRevenue: sum(transactions.bill_amount),
        totalPoints: sum(transactions.points_awarded),
        avgBillAmount: sql<number>`AVG(${transactions.bill_amount})`
      })
      .from(transactions)
      .where(eq(transactions.business_id, businessId));

    // Get mission statistics
    const totalMissionsResult = await db
      .select({
        totalMissions: count()
      })
      .from(missions)
      .where(eq(missions.business_id, businessId));

    const activeMissionsResult = await db
      .select({
        activeMissions: count()
      })
      .from(missions)
      .where(and(
        eq(missions.business_id, businessId),
        eq(missions.is_active, true)
      ));

    // Get customer retention metrics
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const retentionResult = await db
      .select({
        activeCustomers: count()
      })
      .from(transactions)
      .where(and(
        eq(transactions.business_id, businessId),
        gte(transactions.created_at, thirtyDaysAgo)
      ));

    // Get customer acquisition data
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(now.getDate() - 90);

    const weekResult = await db
      .select({
        newThisWeek: count()
      })
      .from(customerLoyalty)
      .where(and(
        eq(customerLoyalty.business_id, businessId),
        gte(customerLoyalty.created_at, sevenDaysAgo)
      ));

    const monthResult = await db
      .select({
        newThisMonth: count()
      })
      .from(customerLoyalty)
      .where(and(
        eq(customerLoyalty.business_id, businessId),
        gte(customerLoyalty.created_at, lastMonthDate)
      ));

    const quarterResult = await db
      .select({
        newThisQuarter: count()
      })
      .from(customerLoyalty)
      .where(and(
        eq(customerLoyalty.business_id, businessId),
        gte(customerLoyalty.created_at, ninetyDaysAgo)
      ));

    // Get top customers
    const topCustomersResult = await db
      .select({
        customer_id: customerLoyalty.customer_id,
        points: customerLoyalty.points,
        tier: customerLoyalty.current_tier_name
      })
      .from(customerLoyalty)
      .where(eq(customerLoyalty.business_id, businessId))
      .orderBy(desc(customerLoyalty.points))
      .limit(10);

    // Get recent transactions
    const recentTransactionsResult = await db
      .select({
        id: transactions.id,
        customer_id: transactions.customer_id,
        bill_amount: transactions.bill_amount,
        points_awarded: transactions.points_awarded,
        created_at: transactions.created_at
      })
      .from(transactions)
      .where(eq(transactions.business_id, businessId))
      .orderBy(desc(transactions.created_at))
      .limit(10);

    // Get business profile information
    const businessProfileResult = await db
      .select({
        name: businesses.name,
        description: businesses.description,
        logo_url: businesses.logo_url,
        business_type: businesses.business_type
      })
      .from(businesses)
      .where(eq(businesses.id, businessId))
      .limit(1);

    const businessProfile = businessProfileResult[0];

    return NextResponse.json({
      customers: rows,
      transactionsLastWeek: lastWeekCount,
      transactionsLastMonth: lastMonthCount,
      totalRevenue: Number(revenueResult[0]?.totalRevenue ?? 0),
      totalPoints: Number(revenueResult[0]?.totalPoints ?? 0),
      avgBillAmount: Number(revenueResult[0]?.avgBillAmount ?? 0),
      totalMissions: Number(totalMissionsResult[0]?.totalMissions ?? 0),
      activeMissions: Number(activeMissionsResult[0]?.activeMissions ?? 0),
      activeCustomers: Number(retentionResult[0]?.activeCustomers ?? 0),
      newThisWeek: Number(weekResult[0]?.newThisWeek ?? 0),
      newThisMonth: Number(monthResult[0]?.newThisMonth ?? 0),
      newThisQuarter: Number(quarterResult[0]?.newThisQuarter ?? 0),
      topCustomers: topCustomersResult,
      recentTransactions: recentTransactionsResult,
      businessProfile: {
        name: businessProfile?.name ?? '',
        description: businessProfile?.description ?? '',
        logo_url: businessProfile?.logo_url ?? '',
        business_type: businessProfile?.business_type ?? ''
      }
    });
  } catch (error) {
    console.error('Dashboard API Error:', error);
    return NextResponse.json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
