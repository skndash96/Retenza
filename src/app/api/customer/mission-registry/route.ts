import { NextRequest, NextResponse } from 'next/server';
import { getCustomerFromSession } from '@/lib/session';
import { db } from '@/server/db';
import { missionRegistry, missions, notifications } from '@/server/db/schema';
import { eq, and } from 'drizzle-orm';

// Get customer's mission registries
export async function GET(req: NextRequest) {
    try {
        const customer = await getCustomerFromSession();
        if (!customer) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');

        let whereClause: any = eq(missionRegistry.customerId, customer.id);

        if (status) {
            whereClause = and(whereClause, eq(missionRegistry.status, status as 'in_progress' | 'completed' | 'failed'));
        }

        const registries = await db
            .select({
                id: missionRegistry.id,
                mission_id: missionRegistry.missionId,
                status: missionRegistry.status,
                started_at: missionRegistry.startedAt,
                completed_at: missionRegistry.completedAt,
                discount_amount: missionRegistry.discountAmount,
                discount_percentage: missionRegistry.discountPercentage,
                notes: missionRegistry.notes,
                mission_title: missions.title,
                mission_description: missions.description,
                mission_offer: missions.offer,
                mission_filters: missions.filters,
                mission_expiry: missions.expiresAt,
            })
            .from(missionRegistry)
            .innerJoin(missions, eq(missionRegistry.missionId, missions.id))
            .where(whereClause)
            .orderBy(missionRegistry.startedAt);

        return NextResponse.json({ success: true, registries });
    } catch (error) {
        console.error("Error fetching customer mission registries:", error);
        return NextResponse.json({ error: "Failed to fetch mission registries" }, { status: 500 });
    }
}

// Start a new mission
export async function POST(req: NextRequest) {
    try {
        const customer = await getCustomerFromSession();
        if (!customer) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json() as { missionId: number; businessId: number };
        const { missionId, businessId } = body;

        if (!missionId || !businessId) {
            return NextResponse.json({ error: "Mission ID and business ID are required" }, { status: 400 });
        }

        // Check if mission already exists
        const existingMission = await db.select()
            .from(missionRegistry)
            .where(and(
                eq(missionRegistry.customerId, customer.id),
                eq(missionRegistry.missionId, missionId)
            ))
            .limit(1);

        if (existingMission.length > 0) {
            return NextResponse.json({ error: "Mission already in progress" }, { status: 400 });
        }

        // Get mission details
        const missionData = await db.select()
            .from(missions)
            .where(eq(missions.id, missionId))
            .limit(1);

        if (missionData.length === 0) {
            return NextResponse.json({ error: "Mission not found" }, { status: 404 });
        }

        const mission = missionData[0];

        // Start the mission
        await db.insert(missionRegistry).values({
            customerId: customer.id,
            missionId,
            businessId,
            status: 'in_progress',
            startedAt: new Date(),
        });

        // Send notification about mission started
        await db.insert(notifications).values({
            customerId: customer.id,
            businessId,
            type: 'mission_started',
            title: 'Mission Started! 🚀',
            body: `You've started "${mission.title}" mission. ${mission.offer}`,
            data: {
                missionId,
                missionTitle: mission.title,
                missionOffer: mission.offer,
                startedAt: new Date()
            }
        });

        return NextResponse.json({
            success: true,
            message: "Mission started successfully",
            missionId,
            status: 'in_progress'
        });
    } catch (error) {
        console.error("Error starting mission:", error);
        return NextResponse.json({ error: "Failed to start mission" }, { status: 500 });
    }
}

// End a mission (mark as completed or failed)
export async function DELETE(req: NextRequest) {
    try {
        const customer = await getCustomerFromSession();

        if (!customer) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json() as { missionId: number; businessId: number };

        const { missionId, businessId } = body;

        if (!missionId || !businessId) {
            return NextResponse.json({ error: "Mission ID, business ID are required" }, { status: 400 });
        }

        // Get existing mission registry
        const existingRegistry = await db.select()
            .from(missionRegistry)
            .where(and(
                eq(missionRegistry.customerId, customer.id),
                eq(missionRegistry.missionId, missionId),
                eq(missionRegistry.status, 'in_progress')
            ))
            .limit(1);

        if (existingRegistry.length === 0) {
            return NextResponse.json({ error: "No in-progress mission found to update" }, { status: 404 });
        }

        const registry = existingRegistry[0];

        // Delete mission registry
        await db.delete(missionRegistry)
            .where(eq(missionRegistry.id, registry.id));

        return NextResponse.json({
            success: true,
            message: `Mission deleted successfully`,
            missionId
        });
    } catch (error) {
        console.error("Error updating mission:", error);
        return NextResponse.json({ error: "Failed to update mission" }, { status: 500 });
    }
}