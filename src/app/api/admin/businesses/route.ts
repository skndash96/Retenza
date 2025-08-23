import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { businesses } from "@/server/db/schema";

export async function GET() {
    try {
        // Fetch all businesses with their details
        const allBusinesses = await db
            .select({
                id: businesses.id,
                name: businesses.name,
                phone_number: businesses.phone_number,
                business_type: businesses.business_type,
                address: businesses.address,
                description: businesses.description,
                approved: businesses.approved,
                created_at: businesses.created_at,
                is_setup_complete: businesses.is_setup_complete,
            })
            .from(businesses)
            .orderBy(businesses.created_at);

        return NextResponse.json({
            success: true,
            businesses: allBusinesses,
        });
    } catch (error) {
        console.error("Error fetching businesses:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch businesses" },
            { status: 500 }
        );
    }
} 