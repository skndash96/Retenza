import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { businesses } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const business = await db
            .select({
                id: businesses.id,
                approved: businesses.approved,
            })
            .from(businesses)
            .where(eq(businesses.id, parseInt(id)))
            .limit(1);

        if (business.length === 0) {
            return NextResponse.json(
                { success: false, error: "Business not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            approved: business[0].approved,
        });
    } catch (error) {
        console.error("Error checking business approval:", error);
        return NextResponse.json(
            { success: false, error: "Failed to check approval status" },
            { status: 500 }
        );
    }
} 