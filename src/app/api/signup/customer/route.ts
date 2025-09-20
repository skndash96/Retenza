import { db } from "@/server/db";
import { customers, sessions } from "@/server/db/schema";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from 'zod';
import { adminAuth } from "@/lib/firebase/admin";
import { createSession } from "@/lib/session";

const customerSignupSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  confirmPassword: z.string().min(8, 'Please confirm your password.'),
  firebaseIdToken: z.string().min(1, 'Firebase token is required for verification.'),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match.",
  path: ["confirmPassword"],
});


export async function POST(req: Request) {
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
      where: (customers, { eq }) => eq(customers.phoneNumber, phoneNumber), 
    });

    if (existing) {
      return NextResponse.json({ error: "A customer with this phone number already exists." }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [insertedCustomer] = await db
      .insert(customers)
      .values({
        phoneNumber,
        hashedPassword,
        isSetupComplete: false,
      })
      .returning({ id: customers.id });

    if (!insertedCustomer?.id) {
      throw new Error("Failed to create customer record.");
    }

    await createSession(insertedCustomer.id, "user");

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