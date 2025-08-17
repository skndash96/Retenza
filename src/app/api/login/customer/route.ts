import { db } from "@/server/db";
import { customers } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { createSession } from "@/lib/session";

export async function POST(req: Request) {
  const { phone, password } = await req.json() as { phone: string; password: string };

  const [user] = await db.select().from(customers).where(eq(customers.phone_number, phone));
  if (!user) {
    return new NextResponse("Invalid credentials", { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.hashed_password);
  if (!valid) return new NextResponse("Invalid credentials", { status: 401 });

  await createSession(user.id, "user"); 
  
  return NextResponse.json({ success: true });
}
