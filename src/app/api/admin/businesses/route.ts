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
                phoneNumber: businesses.phoneNumber,
                businessType: businesses.businessType,
                address: businesses.address,
                description: businesses.description,
                approved: businesses.approved,
                createdAt: businesses.createdAt,
                isSetupComplete: businesses.isSetupComplete,
            })
            .from(businesses)
            .orderBy(businesses.createdAt);

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