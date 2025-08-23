import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { businesses } from "@/server/db/schema";
import { getSession } from "@/lib/session";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
    try {
        const session = await getSession();

        if (!session || session.role !== "business") {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const business = await db
            .select({
                id: businesses.id,
                approved: businesses.approved,
            })
            .from(businesses)
            .where(eq(businesses.id, session.userId))
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