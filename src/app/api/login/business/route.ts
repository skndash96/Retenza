import { db } from "../../../../server/db";
import { businesses } from "../../../../server/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { createSession } from "../../../../lib/session";

export async function POST(req: Request) {
  const { phone , password } = await req.json() as { phone: string; password: string }
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

  const valid = await bcrypt.compare(password, user.hashed_password);
  console.log(user.hashed_password)

  if (!valid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
  await createSession(user.id,"business");
  return NextResponse.json({ success: true });
}
