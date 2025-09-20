import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import {
  businesses,
  customerLoyalty,
  transactions,
  loyaltyPrograms,
} from "@/server/db/schema";
import { getCustomerFromSession } from "@/lib/session";
import { eq, and } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ shopId: string }> },
) {
  try {
    const sessionUser = await getCustomerFromSession();
    const { shopId: shopIdString } = await params;
    const shopId = parseInt(shopIdString);

    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [shopData] = await db
      .select({
        id: businesses.id,
        name: businesses.name,
        business_type: businesses.businessType,
        address: businesses.address,
        gmapLink: businesses.gmapLink,
        logoUrl: businesses.logoUrl,
        loyaltyProgramId: loyaltyPrograms.id,
        pointsRate: loyaltyPrograms.pointsRate,
        description: loyaltyPrograms.description,
        tiers: loyaltyPrograms.tiers,
      })
      .from(businesses)
      .leftJoin(loyaltyPrograms, eq(loyaltyPrograms.businessId, businesses.id))
      .where(eq(businesses.id, shopId));

    if (!shopData) {
      return NextResponse.json({ error: "Shop not found." }, { status: 404 });
    }

    const [customerLoyaltyRecord] = await db
      .select()
      .from(customerLoyalty)
      .where(
        and(
          eq(customerLoyalty.customerId, sessionUser.id),
          eq(customerLoyalty.businessId, shopId),
        ),
      );

    const customerTransactions = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.customerId, sessionUser.id),
          eq(transactions.businessId, shopId),
        ),
      );

    console.log("Shop tiers:", JSON.stringify(shopData.tiers, null, 2));
    return NextResponse.json({
      shop: {
        id: shopData.id,
        name: shopData.name,
        businessType: shopData.business_type,
        address: shopData.address,
        gmapLink: shopData.gmapLink,
        logoUrl: shopData.logoUrl,
      },
      loyaltyProgram: shopData.loyaltyProgramId
        ? {
            id: shopData.loyaltyProgramId,
            businessId: shopId,
            pointsRate: shopData.pointsRate,
            description: shopData.description,
            tiers: shopData.tiers ?? [],
          }
        : null,
      loyalty: customerLoyaltyRecord ?? null,
      transactions: customerTransactions,
    });
  } catch (error) {
    console.error(`Error fetching shop details:`, error);
    return NextResponse.json(
      { error: "Failed to fetch shop details." },
      { status: 500 },
    );
  }
}
