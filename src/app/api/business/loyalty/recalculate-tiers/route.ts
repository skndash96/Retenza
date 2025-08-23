import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { loyaltyPrograms, customerLoyalty } from "@/server/db/schema";
import { getUserFromSession } from "@/lib/session";
import { eq, and } from "drizzle-orm";

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

export async function POST() {
    try {
        const business = await getUserFromSession();
        if (!business) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Get the business loyalty program
        const [program] = await db
            .select()
            .from(loyaltyPrograms)
            .where(eq(loyaltyPrograms.business_id, business.id))
            .limit(1);

        if (!program) {
            return NextResponse.json({ error: "No loyalty program found" }, { status: 404 });
        }

        const tiers = program.tiers || [];
        if (tiers.length === 0) {
            return NextResponse.json({ error: "No tiers configured" }, { status: 400 });
        }

        // Recalculate tiers for all customers
        await updateAllCustomerTiers(business.id, tiers.map(tier => ({
            points_to_unlock: tier.points_to_unlock,
            name: tier.name
        })));

        return NextResponse.json({
            success: true,
            message: "Tiers recalculated for all customers",
            tiers_processed: tiers.length
        });

    } catch (error) {
        console.error("Error recalculating tiers:", error);
        return NextResponse.json({ error: "Failed to recalculate tiers" }, { status: 500 });
    }
} 