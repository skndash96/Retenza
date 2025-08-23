import { db } from "@/server/db";
import { businesses, sessions } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from 'zod';
import { adminAuth } from "@/lib/firebase/admin";

const SESSION_COOKIE_NAME = "session_id";

const businessInfoSchema = z.object({
  name: z.string().min(2, 'Business name is required.'),
  address: z.string().min(5, 'Address is required.'),
  business_type: z.string().min(1, 'Business type is required.'),
  email: z.string().email('Please enter a valid email address.').optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
  gmap_link: z.string().url('Invalid URL format').optional().or(z.literal('')),
  logo_url: z.string().url('Invalid URL format').optional().or(z.literal('')),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  confirmPassword: z.string().min(8, 'Please confirm your password.'),
  firebaseIdToken: z.string().min(1, 'Firebase token is required for verification.'),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match.",
  path: ["confirmPassword"],
});

export async function POST(req: Request) {
  const cookieStore = await cookies();
  try {
    const body = await req.json() as unknown;
    const validatedData = businessInfoSchema.parse(body);
    const { password, name, address, business_type, email, description, gmap_link, logo_url, firebaseIdToken } = validatedData;

    const decodedToken = await adminAuth.verifyIdToken(firebaseIdToken);
    const phoneNumber = decodedToken.phone_number;
    console.log("phoneNumber", phoneNumber);
    if (!phoneNumber) {
      return NextResponse.json({ error: "Phone number not found in token." }, { status: 400 });
    }
    console.log("phoneNumberww", phoneNumber);
    const existing = await db.query.businesses.findFirst({
      where: (businesses, { eq }) => eq(businesses.phone_number, phoneNumber),
    });
    console.log("existing", existing);
    if (existing) {
      return NextResponse.json({ error: "A business with this phone number already exists." }, { status: 409 });
    }

    const { sessionId, expiresAt } = await db.transaction(async (tx) => {
      const hashedPassword = await bcrypt.hash(password, 10);
      const [insertedBusiness] = await tx.insert(businesses).values({
        phone_number: phoneNumber,
        hashed_password: hashedPassword,
        name,
        address,
        business_type,
        email: email ?? null,
        description: description ?? null,
        gmap_link: gmap_link ?? null,
        logo_url: logo_url ?? null,
        is_setup_complete: false,
        user_id: 0, // Temporary value, will be updated after business creation
      }).returning({ id: businesses.id });
      console.log("insertedBusiness", insertedBusiness);
      if (!insertedBusiness?.id) { throw new Error("Failed to create business record."); }

      // Update the user_id to point to the business itself
      await tx.update(businesses).set({ user_id: insertedBusiness.id }).where(eq(businesses.id, insertedBusiness.id));

      const newSessionId = randomUUID();
      const newExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
      console.log("newSessionId", newSessionId);
      await tx.insert(sessions).values({ id: newSessionId, userId: insertedBusiness.id, role: "business", expiresAt: newExpiresAt });
      return { sessionId: newSessionId, expiresAt: newExpiresAt };
    });

    cookieStore.set(SESSION_COOKIE_NAME, sessionId, { httpOnly: true, secure: process.env.NODE_ENV === 'production', path: "/", expires: expiresAt, sameSite: 'lax' });
    return NextResponse.json({ success: true, message: "Business info saved. Proceed to loyalty setup." }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) { return NextResponse.json({ error: "Validation failed.", details: error.flatten() }, { status: 400 }); }
    console.error("Business info registration failed:", error);
    return NextResponse.json({ error: "Registration failed.", details: error instanceof Error ? error.message : "An unexpected error occurred." }, { status: 500 });
  }
}