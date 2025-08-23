import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/session';
import { db } from '@/server/db';
import { customers, customerLoyalty, loyaltyPrograms, rewardRedemptions, pushSubscriptions } from '@/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { Tier } from '@/server/db/schema';
import { ServerPushNotificationService } from '@/lib/server/pushNotificationService';

export async function GET(req: NextRequest) {
    try {
        const business = await getUserFromSession();
        if (!business) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const phone = searchParams.get('phone');

        if (!phone) {
            return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
        }

        // Find customer by phone number
        const customer = await db.select()
            .from(customers)
            .where(eq(customers.phone_number, phone))
            .limit(1);

        if (customer.length === 0) {
            return NextResponse.json({ error: "Customer not found. They need to register first." }, { status: 404 });
        }

        const customerData = customer[0];

        // Get customer loyalty status for this business
        let customerLoyaltyData = await db.select()
            .from(customerLoyalty)
            .where(and(
                eq(customerLoyalty.customer_id, customerData.id),
                eq(customerLoyalty.business_id, business.id)
            ))
            .limit(1);

        // If customer is not enrolled, auto-enroll them
        let isNewlyEnrolled = false;
        if (customerLoyaltyData.length === 0) {
            await db.insert(customerLoyalty).values({
                customer_id: customerData.id,
                business_id: business.id,
                points: 0,
                current_tier_name: 'Bronze' // Default tier
            });

            // Fetch the newly created loyalty data
            customerLoyaltyData = await db.select()
                .from(customerLoyalty)
                .where(and(
                    eq(customerLoyalty.customer_id, customerData.id),
                    eq(customerLoyalty.business_id, business.id)
                ))
                .limit(1);

            isNewlyEnrolled = true;

            // Auto-subscribe customer to push notifications for this business
            // Check if customer has any existing push subscriptions (global permission)
            const globalSubscriptions = await db.select()
                .from(pushSubscriptions)
                .where(eq(pushSubscriptions.customer_id, customerData.id))
                .limit(1);

            if (globalSubscriptions.length > 0) {
                // Customer has given notification permission, auto-subscribe to this business
                const globalSub = globalSubscriptions[0];
                await db.insert(pushSubscriptions).values({
                    customer_id: customerData.id,
                    business_id: business.id,
                    endpoint: globalSub.endpoint,
                    p256dh: globalSub.p256dh,
                    auth: globalSub.auth,
                });
            }
        }

        const loyaltyData = customerLoyaltyData[0];

        // Get business loyalty program
        const businessLoyalty = await db.select()
            .from(loyaltyPrograms)
            .where(eq(loyaltyPrograms.business_id, business.id))
            .limit(1);

        if (businessLoyalty.length === 0) {
            return NextResponse.json({ error: "No loyalty program found for this business" }, { status: 404 });
        }

        const loyaltyProgram = businessLoyalty[0];
        const tiers = loyaltyProgram.tiers || [];

        // Find customer's current tier based on points
        let currentTier: Tier | null = null;
        for (let i = tiers.length - 1; i >= 0; i--) {
            if (loyaltyData.points >= tiers[i].points_to_unlock) {
                currentTier = tiers[i];
                break;
            }
        }

        // If no tier found, use the first tier
        if (!currentTier && tiers.length > 0) {
            currentTier = tiers[0];
        }

        if (!currentTier) {
            return NextResponse.json({ error: "No loyalty tiers configured" }, { status: 404 });
        }

        // Get reward redemption history for this customer
        const redemptionHistory = await db.select()
            .from(rewardRedemptions)
            .where(and(
                eq(rewardRedemptions.customer_id, customerData.id),
                eq(rewardRedemptions.business_id, business.id)
            ));

        // Calculate monthly redemption counts for limited usage rewards
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const monthlyRedemptions: Record<string, number> = {};

        currentTier.rewards.forEach((reward) => {
            if (reward.reward_type === 'limited_usage') {
                const monthlyCount = redemptionHistory.filter((redemption: { reward_id: string; redeemed_at: Date }) => {
                    const redemptionDate = new Date(redemption.redeemed_at);
                    return parseInt(redemption.reward_id) === reward.id &&
                        redemptionDate.getMonth() === currentMonth &&
                        redemptionDate.getFullYear() === currentYear;
                }).length;
                monthlyRedemptions[reward.id] = monthlyCount;
            }
        });

        // Update rewards with redemption counts
        const rewardsWithCounts = currentTier.rewards.map((reward) => {
            const redemptionCount = redemptionHistory.filter(
                (redemption: { reward_id: string }) => parseInt(redemption.reward_id) === reward.id
            ).length;

            return {
                ...reward,
                redeemed_count: redemptionCount
            };
        });

        const enrichedCustomer = {
            id: customerData.id,
            phone_number: customerData.phone_number,
            name: customerData.name,
            current_tier_name: currentTier.name,
            points: loyaltyData.points,
            redeemable_points: loyaltyData.redeemable_points || 0,
            is_newly_enrolled: isNewlyEnrolled,
            monthly_redemptions: monthlyRedemptions,
            current_tier: {
                ...currentTier,
                rewards: rewardsWithCounts
            }
        };

        return NextResponse.json(enrichedCustomer);
    } catch (error) {
        console.error("Error searching customer:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
} 