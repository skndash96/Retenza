import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { campaigns } from "@/server/db/schema";
import { getUserFromSession } from "@/lib/session";
import { eq, desc, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const businessUser = await getUserFromSession();
    if (!businessUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rows = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.business_id, businessUser.id))
      .orderBy(desc(campaigns.created_at));

    const formatted = rows.map((mission) => ({
      id: mission.id,
      title: mission.title ? String(mission.title) : "",
      description: mission.description ? String(mission.description) : "",
      expires_at: mission.expires_at,
      applicable_tiers: Array.isArray(mission.applicable_tiers)
        ? mission.applicable_tiers.map((t) =>
            t && typeof t === "object" && "name" in t ? String(t.name) : String(t)
          )
        : [],
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

    const body = await req.json();
    if (!body.title || !body.description || !body.expires_at) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const inserted = await db
      .insert(campaigns)
      .values({
        business_id: businessUser.id,
        title: String(body.title),
        description: String(body.description),
        applicable_tiers: Array.isArray(body.applicable_tiers) ? body.applicable_tiers.map(String) : [],
        expires_at: new Date(body.expires_at),
      })
      .returning();

    return NextResponse.json(inserted[0]);
  } catch (error) {
    console.error("Error creating mission:", error);
    return NextResponse.json({ error: "Failed to create mission." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const businessUser = await getUserFromSession();
    if (!businessUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ error: "Missing mission ID" }, { status: 400 });
    }

    const deleted = await db
      .delete(campaigns)
      .where(and(eq(campaigns.id, body.id), eq(campaigns.business_id, businessUser.id)))
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
