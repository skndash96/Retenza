import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/session';
import { db } from '@/server/db';
import { customerLoyalty, transactions, notifications, rewardRedemptions, pushSubscriptions, loyaltyPrograms } from '@/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { BusinessNotificationService } from '@/lib/businessNotificationService';

export async function POST(req: NextRequest) {
    try {
        const business = await getUserFromSession();
        if (!business) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json() as {
            customer_id: number;
            bill_amount: number;
            redeemable_points_used: number;
            redeemed_rewards: Array<{ reward_id: string; reward_type: string; value: number }>
        };
        const { customer_id, bill_amount, redeemable_points_used, redeemed_rewards } = body;

        if (!customer_id || !bill_amount || !redeemed_rewards || !Array.isArray(redeemed_rewards)) {
            return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
        }

        // Calculate total discount
        let totalDiscount = redeemable_points_used || 0;
        redeemed_rewards.forEach((reward: { reward_id: string; reward_type: string; value: number }) => {
            totalDiscount += reward.value ?? 0;
        });

        // Calculate final amount
        const finalAmount = Math.max(0, bill_amount - totalDiscount);

        // Calculate points to award (1:1 ratio for now)
        const pointsToAward = Math.floor(bill_amount);



        // Start transaction
        await db.transaction(async (tx) => {
            // Get current loyalty data
            const currentLoyalty = await tx.select()
                .from(customerLoyalty)
                .where(and(
                    eq(customerLoyalty.customer_id, customer_id),
                    eq(customerLoyalty.business_id, business.id)
                ))
                .limit(1);

            if (currentLoyalty.length === 0) {
                throw new Error('Customer loyalty data not found');
            }

            const loyaltyData = currentLoyalty[0];
            const oldPoints = loyaltyData.points;
            const newPoints = oldPoints + pointsToAward;

            // Calculate cashback rewards to add to redeemable points
            let cashbackToAdd = 0;

            // Get business loyalty program to find cashback rewards
            const businessLoyaltyForCashback = await tx.select()
                .from(loyaltyPrograms)
                .where(eq(loyaltyPrograms.business_id, business.id))
                .limit(1);

            if (businessLoyaltyForCashback.length > 0) {
                const loyaltyProgram = businessLoyaltyForCashback[0];
                const tiers = loyaltyProgram.tiers || [];

                // Find the customer's current tier
                let currentTier = null;
                for (let i = tiers.length - 1; i >= 0; i--) {
                    if (loyaltyData.points >= tiers[i].points_to_unlock) {
                        currentTier = tiers[i];
                        break;
                    }
                }

                // Calculate cashback from current tier rewards
                if (currentTier?.rewards) {
                    currentTier.rewards.forEach((reward: { reward_type: string; percentage?: number }) => {
                        if (reward.reward_type === 'cashback' && reward.percentage) {
                            // Calculate cashback based on bill amount and percentage
                            const cashbackAmount = (bill_amount * reward.percentage) / 100;
                            cashbackToAdd += cashbackAmount;
                        }
                    });
                }
            }

            // Calculate new redeemable points (subtract used points + add new cashback)
            const oldRedeemablePoints = parseFloat(loyaltyData.redeemable_points?.toString() ?? '0');
            const newRedeemablePoints = Math.max(0, oldRedeemablePoints - (redeemable_points_used ?? 0) + cashbackToAdd);

            // Update customer loyalty points and redeemable points
            await tx.update(customerLoyalty)
                .set({
                    points: newPoints,
                    redeemable_points: newRedeemablePoints.toFixed(2)
                })
                .where(and(
                    eq(customerLoyalty.customer_id, customer_id),
                    eq(customerLoyalty.business_id, business.id)
                ));

            // Record the transaction
            const transactionResult = await tx.insert(transactions).values({
                customer_id,
                business_id: business.id,
                bill_amount: bill_amount.toFixed(2), // Store as decimal
                points_awarded: pointsToAward
            }).returning({ id: transactions.id });

            const transactionId = transactionResult[0].id;

            // Record each redeemed reward
            for (const reward of redeemed_rewards) {
                await tx.insert(rewardRedemptions).values({
                    customer_id,
                    business_id: business.id,
                    reward_id: reward.reward_id,
                    reward_type: reward.reward_type,
                    reward_value: reward.value.toFixed(2), // Store as decimal
                    transaction_id: transactionId
                });
            }

            // Auto-subscribe customer to push notifications if they have global permission
            const globalSubscriptions = await tx.select()
                .from(pushSubscriptions)
                .where(eq(pushSubscriptions.customer_id, customer_id))
                .limit(1);

            if (globalSubscriptions.length > 0) {
                // Check if already subscribed to this business
                const businessSubscription = await tx.select()
                    .from(pushSubscriptions)
                    .where(and(
                        eq(pushSubscriptions.customer_id, customer_id),
                        eq(pushSubscriptions.business_id, business.id)
                    ))
                    .limit(1);

                if (businessSubscription.length === 0) {
                    // Auto-subscribe to this business
                    const globalSub = globalSubscriptions[0];
                    await tx.insert(pushSubscriptions).values({
                        customer_id,
                        business_id: business.id,
                        endpoint: globalSub.endpoint,
                        p256dh: globalSub.p256dh,
                        auth: globalSub.auth,
                    });
                }
            }

            // Create notification for customer about transaction
            await tx.insert(notifications).values({
                customer_id,
                business_id: business.id,
                type: 'points_earned',
                title: 'Points Earned!',
                body: `You've earned ${pointsToAward} points on your purchase of ₹${Number(bill_amount).toFixed(2)}. Total points: ${newPoints}`,
                data: {
                    bill_amount,
                    points_awarded: pointsToAward,
                    total_points: newPoints,
                    redeemed_rewards
                }
            });

            // Check for tier upgrade and send notification
            const businessLoyalty = await tx.select()
                .from(loyaltyPrograms)
                .where(eq(loyaltyPrograms.business_id, business.id))
                .limit(1);

            if (businessLoyalty.length > 0) {
                const loyaltyProgram = businessLoyalty[0];
                const tiers = loyaltyProgram.tiers ?? [];

                // Find current tier based on new points
                let currentTier = null;
                let nextTier = null;

                // Sort tiers by points threshold (ascending)
                const sortedTiers = [...tiers].sort((a, b) => a.points_to_unlock - b.points_to_unlock);

                // Find the highest tier the customer qualifies for (reverse loop)
                for (let i = sortedTiers.length - 1; i >= 0; i--) {
                    if (newPoints >= sortedTiers[i].points_to_unlock) {
                        currentTier = sortedTiers[i];
                        break;
                    }
                }

                // Find next tier
                for (const tier of tiers) {
                    if (newPoints < tier.points_to_unlock) {
                        nextTier = tier;
                        break;
                    }
                }

                // Update current tier name if changed
                if (currentTier && currentTier.name !== loyaltyData.current_tier_name) {
                    await tx.update(customerLoyalty)
                        .set({ current_tier_name: currentTier.name })
                        .where(and(
                            eq(customerLoyalty.customer_id, customer_id),
                            eq(customerLoyalty.business_id, business.id)
                        ));

                    // Send tier upgrade notification
                    await tx.insert(notifications).values({
                        customer_id,
                        business_id: business.id,
                        type: 'tier_upgraded',
                        title: 'Tier Upgraded! 🎉',
                        body: `Congratulations! You've been upgraded to ${currentTier.name} tier!`,
                        data: {
                            new_tier: currentTier.name,
                            points_required: currentTier.points_to_unlock,
                            current_points: newPoints
                        }
                    });
                }

                // Send goal gradient nudge if close to next tier
                if (nextTier) {
                    const pointsToNextTier = nextTier.points_to_unlock - newPoints;
                    const percentageToNext = Math.round(((newPoints - (currentTier?.points_to_unlock ?? 0)) / (nextTier.points_to_unlock - (currentTier?.points_to_unlock ?? 0))) * 100);

                    if (pointsToNextTier <= 50 && percentageToNext >= 80) {
                        await tx.insert(notifications).values({
                            customer_id,
                            business_id: business.id,
                            type: 'goal_nudge',
                            title: 'Almost There! 🎯',
                            body: `You're just ${pointsToNextTier} points away from ${nextTier.name} tier!`,
                            data: {
                                current_tier: currentTier?.name,
                                next_tier: nextTier.name,
                                points_needed: pointsToNextTier,
                                percentage_complete: percentageToNext
                            }
                        });
                    }
                }
            }
        });

        return NextResponse.json({
            success: true,
            message: "Transaction completed successfully",
            points_awarded: pointsToAward,
            total_discount: totalDiscount,
            final_amount: finalAmount
        });
    } catch (error) {
        console.error("Error processing transaction:", error);
        return NextResponse.json({ error: "Failed to process transaction" }, { status: 500 });
    }
} 