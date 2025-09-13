import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { businesses } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export async function DELETE(
    _: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        
        const result = await db
            .delete(businesses)
            .where(eq(businesses.id, parseInt(id)))
            .returning();
        
        if (result.length === 0) {
            return NextResponse.json(
                { success: false, error: "Business not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Business deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting business:", error);
        return NextResponse.json(
            { success: false, error: "Failed to delete business" },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { approved } = await request.json();

        if (typeof approved !== "boolean") {
            return NextResponse.json(
                { success: false, error: "Invalid approval status" },
                { status: 400 }
            );
        }

        // Update business approval status
        const result = await db
            .update(businesses)
            .set({
                approved: approved,
                updated_at: new Date()
            })
            .where(eq(businesses.id, parseInt(id)))
            .returning();

        if (result.length === 0) {
            return NextResponse.json(
                { success: false, error: "Business not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            business: result[0],
            message: `Business ${approved ? "approved" : "rejected"} successfully`,
        });
    } catch (error) {
        console.error("Error updating business approval:", error);
        return NextResponse.json(
            { success: false, error: "Failed to update business approval" },
            { status: 500 }
        );
    }
} 