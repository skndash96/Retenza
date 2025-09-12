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

        let whereClause: any = eq(missionRegistry.customer_id, customer.id);

        if (status) {
            whereClause = and(whereClause, eq(missionRegistry.status, status as 'in_progress' | 'completed' | 'failed'));
        }

        const registries = await db
            .select({
                id: missionRegistry.id,
                mission_id: missionRegistry.mission_id,
                status: missionRegistry.status,
                started_at: missionRegistry.started_at,
                completed_at: missionRegistry.completed_at,
                discount_amount: missionRegistry.discount_amount,
                discount_percentage: missionRegistry.discount_percentage,
                notes: missionRegistry.notes,
                mission_title: missions.title,
                mission_description: missions.description,
                mission_offer: missions.offer,
                mission_filters: missions.filters,
                mission_expiry: missions.expires_at,
            })
            .from(missionRegistry)
            .innerJoin(missions, eq(missionRegistry.mission_id, missions.id))
            .where(whereClause)
            .orderBy(missionRegistry.started_at);

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

        const body = await req.json() as { mission_id: number; business_id: number };
        const { mission_id, business_id } = body;

        if (!mission_id || !business_id) {
            return NextResponse.json({ error: "Mission ID and business ID are required" }, { status: 400 });
        }

        // Check if mission already exists
        const existingMission = await db.select()
            .from(missionRegistry)
            .where(and(
                eq(missionRegistry.customer_id, customer.id),
                eq(missionRegistry.mission_id, mission_id)
            ))
            .limit(1);

        if (existingMission.length > 0) {
            return NextResponse.json({ error: "Mission already in progress" }, { status: 400 });
        }

        // Get mission details
        const missionData = await db.select()
            .from(missions)
            .where(eq(missions.id, mission_id))
            .limit(1);

        if (missionData.length === 0) {
            return NextResponse.json({ error: "Mission not found" }, { status: 404 });
        }

        const mission = missionData[0];

        // Start the mission
        await db.insert(missionRegistry).values({
            customer_id: customer.id,
            mission_id,
            business_id,
            status: 'in_progress',
            started_at: new Date(),
        });

        // Send notification about mission started
        await db.insert(notifications).values({
            customer_id: customer.id,
            business_id,
            type: 'mission_started',
            title: 'Mission Started! 🚀',
            body: `You've started "${mission.title}" mission. ${mission.offer}`,
            data: {
                mission_id,
                mission_title: mission.title,
                mission_offer: mission.offer,
                started_at: new Date()
            }
        });

        return NextResponse.json({
            success: true,
            message: "Mission started successfully",
            mission_id,
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

        const body = await req.json() as { mission_id: number; business_id: number };

        const { mission_id, business_id } = body;

        if (!mission_id || !business_id) {
            return NextResponse.json({ error: "Mission ID, business ID are required" }, { status: 400 });
        }

        // Get existing mission registry
        const existingRegistry = await db.select()
            .from(missionRegistry)
            .where(and(
                eq(missionRegistry.customer_id, customer.id),
                eq(missionRegistry.mission_id, mission_id),
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
            mission_id
        });
    } catch (error) {
        console.error("Error updating mission:", error);
        return NextResponse.json({ error: "Failed to update mission" }, { status: 500 });
    }
}