import { db } from "@/server/db";
import { customers, sessions } from "@/server/db/schema";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from 'zod';
import { adminAuth } from "@/lib/firebase/admin";

const SESSION_COOKIE_NAME = "session_id";

const customerSignupSchema = z.object({
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
    const validatedData = customerSignupSchema.parse(body);

    const { password, firebaseIdToken } = validatedData;

    const decodedToken = await adminAuth.verifyIdToken(firebaseIdToken);
    const phoneNumber = decodedToken.phone_number; 

    if (!phoneNumber) {
        return NextResponse.json({ error: "Phone number not found in token." }, { status: 400 });
    }

    const existing = await db.query.customers.findFirst({
      where: (customers, { eq }) => eq(customers.phone_number, phoneNumber), 
    });

    if (existing) {
      return NextResponse.json({ error: "A customer with this phone number already exists." }, { status: 409 });
    }

    const { sessionId, expiresAt } = await db.transaction(async (tx) => {
      const hashedPassword = await bcrypt.hash(password, 10);

      const [insertedCustomer] = await tx
        .insert(customers)
        .values({
          phone_number: phoneNumber, 
          hashed_password: hashedPassword,
          is_setup_complete: false, 
        })
        .returning({ id: customers.id });

      if (!insertedCustomer?.id) {
        throw new Error("Failed to create customer record.");
      }
      
      const newSessionId = randomUUID();
      const newExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

      await tx.insert(sessions).values({
        id: newSessionId,
        userId: insertedCustomer.id,
        role: "user", 
        expiresAt: newExpiresAt,
      });

      return { sessionId: newSessionId, expiresAt: newExpiresAt };
    });
    
    cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: "/",
      expires: expiresAt,
      sameSite: 'lax',
    });

    return NextResponse.json({ success: true }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed.", details: error.flatten() }, { status: 400 });
    }

    console.error("Customer registration failed:", error);

    return NextResponse.json(
      { 
        error: "Customer registration failed.",
        details: error instanceof Error ? error.message : "An unexpected error occurred.",
      },
      { status: 500 }
    );
  }
}