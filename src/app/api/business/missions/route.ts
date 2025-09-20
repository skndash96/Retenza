import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { missions } from "@/server/db/schema";
import { getUserFromSession } from "@/lib/session";
import { eq, desc, and } from "drizzle-orm";

export async function GET(_req: NextRequest) {
  try {
    const businessUser = await getUserFromSession();
    if (!businessUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rows = await db
      .select()
      .from(missions)
      .where(eq(missions.businessId, businessUser.id))
      .orderBy(desc(missions.createdAt));

    const formatted = rows.map((mission) => ({
      id: mission.id,
      title: mission.title ? String(mission.title) : "",
      description: mission.description ? String(mission.description) : "",
      offer: mission.offer || "",
      expiresAt: mission.expiresAt,
      applicableTiers: Array.isArray(mission.applicableTiers)
        ? mission.applicableTiers.map((t) =>
          t && typeof t === "object" && "name" in t ? String((t as { name: string }).name) : String(t)
        )
        : [],
      filters: mission.filters ?? {},
      isActive: mission.isActive,
      createdAt: mission.createdAt,
      updatedAt: mission.updatedAt,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Error fetching business missions:", error);
    return NextResponse.json({ error: "Failed to fetch missions." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const businessUser = await getUserFromSession();
    if (!businessUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json() as {
      title?: string;
      description?: string;
      offer?: string;
      expiresAt?: string;
      applicableTiers?: string[];
      filters?: {
        gender?: ('Male' | 'Female' | 'Other')[];
        age_range?: { min: number; max: number };
        location?: string[];
        customer_type?: string[];
      };
    };

    if (!body.title || !body.description || !body.offer || !body.expiresAt) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const inserted = await db
      .insert(missions)
      .values({
        businessId: businessUser.id,
        title: String(body.title),
        description: String(body.description),
        offer: String(body.offer),
        applicableTiers: Array.isArray(body.applicableTiers) ? body.applicableTiers.map(String) : [],
        filters: body.filters ?? {},
        isActive: true,
        expiresAt: new Date(body.expiresAt),
      })
      .returning();

    return NextResponse.json(inserted[0]);
  } catch (error) {
    console.error("Error creating mission:", error);
    return NextResponse.json({ error: "Failed to create mission." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const businessUser = await getUserFromSession();
    if (!businessUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json() as {
      id: number;
      title?: string;
      description?: string;
      offer?: string;
      applicable_tiers?: string[];
      filters?: {
        gender?: ('Male' | 'Female' | 'Other')[];
        age_range?: { min: number; max: number };
        location?: string[];
        customer_type?: string[];
      };
      is_active?: boolean;
      expires_at?: string;
    };

    if (!body.id) {
      return NextResponse.json({ error: "Missing mission ID" }, { status: 400 });
    }

    const updateData: {
      title?: string;
      description?: string;
      offer?: string;
      applicable_tiers?: string[];
      filters?: {
        gender?: ('Male' | 'Female' | 'Other')[];
        age_range?: { min: number; max: number };
        location?: string[];
        customer_type?: string[];
      };
      is_active?: boolean;
      expires_at?: Date;
      updated_at?: Date;
    } = {};

    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.offer !== undefined) updateData.offer = body.offer;
    if (body.applicable_tiers !== undefined) updateData.applicable_tiers = body.applicable_tiers;
    if (body.filters !== undefined) updateData.filters = body.filters;
    if (body.is_active !== undefined) updateData.is_active = body.is_active;
    if (body.expires_at !== undefined) updateData.expires_at = new Date(body.expires_at);
    updateData.updated_at = new Date();

    const updated = await db
      .update(missions)
      .set(updateData)
      .where(and(eq(missions.id, body.id), eq(missions.businessId, businessUser.id)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: "Mission not found" }, { status: 404 });
    }

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("Error updating mission:", error);
    return NextResponse.json({ error: "Failed to update mission." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const businessUser = await getUserFromSession();
    if (!businessUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json() as { id?: number };
    if (!body.id) {
      return NextResponse.json({ error: "Missing mission ID" }, { status: 400 });
    }

    const deleted = await db
      .delete(missions)
      .where(and(eq(missions.id, body.id), eq(missions.businessId, businessUser.id)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ error: "Mission not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, deleted: deleted[0] });
  } catch (error) {
    console.error("Error deleting mission:", error);
    return NextResponse.json({ error: "Failed to delete mission." }, { status: 500 });
  }
}
