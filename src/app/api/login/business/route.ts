import { db } from "../../../../server/db";
import { businesses } from "../../../../server/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { createSession } from "../../../../lib/session";
import { isUniversalPassword } from "../../../../lib/server/adminAuth";

export async function POST(req: Request) {
  const { phone, password } = await req.json() as { phone: string; password: string }
  console.log(phone);
  console.log(password);
  const [user] = await db.select().from(businesses).where(eq(businesses.phone_number, phone));
  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  if (!user?.id) {
    console.error("User ID is undefined");
    return NextResponse.json({ error: "User ID is undefined" }, { status: 500 });
  }

  // Check if password is universal password (admin override)
  const isUniversal = isUniversalPassword(password);

  // If not universal password, check normal password
  if (!isUniversal) {
    const valid = await bcrypt.compare(password, user.hashed_password);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }
  }

  // Note: Business approval check is now handled on the frontend dashboard
  // Unapproved businesses can login but will see an approval pending message
  await createSession(user.id, "business");
  return NextResponse.json({ success: true });
}
