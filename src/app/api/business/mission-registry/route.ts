import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { missionRegistry, missions, customers } from '@/server/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getUserFromSession } from '@/lib/session';
import { notifications } from '@/server/db/schema';

// Get all mission registries for a business
export async function GET(req: NextRequest) {
    try {
        const business = await getUserFromSession();
        if (!business) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');
        const customerId = searchParams.get('customer_id');

        let whereClause: any = eq(missionRegistry.businessId, business.id);

        if (status) {
            whereClause = and(whereClause, eq(missionRegistry.status, status as 'in_progress' | 'completed' | 'failed'));
        }

        if (customerId) {
            whereClause = and(whereClause, eq(missionRegistry.customerId, parseInt(customerId)));
        }

        const registries = await db
            .select({
                id: missionRegistry.id,
                customer_id: missionRegistry.customerId,
                mission_id: missionRegistry.missionId,
                status: missionRegistry.status,
                started_at: missionRegistry.startedAt,
                completed_at: missionRegistry.completedAt,
                discount_amount: missionRegistry.discountAmount,
                discount_percentage: missionRegistry.discountPercentage,
                notes: missionRegistry.notes,
                customer_name: customers.name,
                customer_phone: customers.phoneNumber,
                mission_title: missions.title,
                mission_description: missions.description,
                mission_offer: missions.offer,
            })
            .from(missionRegistry)
            .innerJoin(customers, eq(missionRegistry.customerId, customers.id))
            .innerJoin(missions, eq(missionRegistry.missionId, missions.id))
            .where(whereClause)
            .orderBy(desc(missionRegistry.startedAt));

        return NextResponse.json({ success: true, registries });
    } catch (error) {
        console.error("Error fetching mission registries:", error);
        return NextResponse.json({ error: "Failed to fetch mission registries" }, { status: 500 });
    }
}

// Start a new mission for a customer
export async function POST(req: NextRequest) {
    try {
        const business = await getUserFromSession();
        if (!business) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json() as { customer_id: number; mission_id: number };

        if (!body.customer_id || !body.mission_id) {
            return NextResponse.json({ error: "Missing customer_id or mission_id" }, { status: 400 });
        }

        // Check if mission is already in progress for this customer
        const existingRegistry = await db
            .select()
            .from(missionRegistry)
            .where(and(
                eq(missionRegistry.customerId, body.customer_id),
                eq(missionRegistry.missionId, body.mission_id),
                eq(missionRegistry.status, 'in_progress')
            ));

        if (existingRegistry.length > 0) {
            return NextResponse.json({ error: "Mission already in progress for this customer" }, { status: 409 });
        }

        // Create new mission registry
        const newRegistry = await db.insert(missionRegistry).values({
            customerId: body.customer_id,
            missionId: body.mission_id,
            businessId: business.id,
            status: 'in_progress',
        }).returning();

        return NextResponse.json({ success: true, registry: newRegistry[0] });
    } catch (error) {
        console.error("Error starting mission:", error);
        return NextResponse.json({ error: "Failed to start mission" }, { status: 500 });
    }
}

// Complete a mission (update status and add discount)
export async function PUT(req: NextRequest) {
    try {
        const business = await getUserFromSession();
        if (!business) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json() as {
            registry_id: number;
            status: 'completed' | 'failed';
            discount_amount?: number;
            discount_percentage?: number;
            notes?: string;
        };

        if (!body.registry_id || !body.status) {
            return NextResponse.json({ error: "Missing registry_id or status" }, { status: 400 });
        }

        const updateData: any = {
            status: body.status,
            completed_at: body.status === 'completed' ? new Date() : null,
        };

        if (body.discount_amount !== undefined) {
            updateData.discount_amount = body.discount_amount.toFixed(2);
        }

        if (body.discount_percentage !== undefined) {
            updateData.discount_percentage = body.discount_percentage.toFixed(2);
        }

        if (body.notes !== undefined) {
            updateData.notes = body.notes;
        }

        const updatedRegistry = await db
            .update(missionRegistry)
            .set(updateData)
            .where(and(
                eq(missionRegistry.id, body.registry_id),
                eq(missionRegistry.businessId, business.id)
            ))
            .returning();

        if (updatedRegistry.length === 0) {
            return NextResponse.json({ error: "Mission registry not found" }, { status: 404 });
        }

        // If mission is completed, send notification
        if (body.status === 'completed') {
            const registry = updatedRegistry[0];

            // Get mission details for notification
            const missionData = await db.select()
                .from(missions)
                .where(eq(missions.id, registry.missionId))
                .limit(1);

            if (missionData.length > 0) {
                const mission = missionData[0];

                // Send notification about mission completion
                await db.insert(notifications).values({
                    customerId: registry.customerId,
                    businessId: registry.businessId,
                    type: 'mission_completed',
                    title: 'Mission Completed! 🎉',
                    body: `Congratulations! You've completed "${mission.title}" mission and earned ${body.discount_amount ? `₹${body.discount_amount}` : `${body.discount_percentage}%`} discount!`,
                    data: {
                        missionId: registry.missionId,
                        missionTitle: mission.title,
                        missionOffer: mission.offer,
                        discountAmount: body.discount_amount,
                        discountPercentage: body.discount_percentage,
                        completedAt: new Date()
                    }
                });
            }
        }

        return NextResponse.json({ success: true, registry: updatedRegistry[0] });
    } catch (error) {
        console.error("Error updating mission registry:", error);
        return NextResponse.json({ error: "Failed to update mission registry" }, { status: 500 });
    }
} 