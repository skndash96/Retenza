import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { customers } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { getCustomerFromSession } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getCustomerFromSession();

    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, gender, dob, anniversary } = await req.json() as { name?: string; gender?: 'Male' | 'Female' | 'Other'; dob?: number; anniversary?: number };

    const dobDate = dob ? new Date(dob) : null;
    const anniversaryDate = anniversary ? new Date(anniversary) : null;

    await db.update(customers)
      .set({
        name,
        gender,
        dob: dobDate,
        anniversary: anniversaryDate,
        isSetupComplete: true,
        updatedAt: new Date(),
      })
      .where(eq(customers.id, sessionUser.id));

    const [updatedCustomer] = await db.select().from(customers).where(eq(customers.id, sessionUser.id));

    if (updatedCustomer) {
      return NextResponse.json({
        message: 'Profile updated successfully!',
        user: {
          id: updatedCustomer.id,
          phoneNumber: updatedCustomer.phoneNumber,
          name: updatedCustomer.name,
          gender: updatedCustomer.gender,
          dob: updatedCustomer.dob ? updatedCustomer.dob.getTime() : null,
          anniversary: updatedCustomer.anniversary ? updatedCustomer.anniversary.getTime() : null,
          isSetupComplete: updatedCustomer.isSetupComplete,
        },
      });
    } else {
      return NextResponse.json({ error: 'Failed to retrieve updated profile.' }, { status: 500 });
    }

  } catch (error) {
    console.error('Error updating customer profile:', error);
    return NextResponse.json({ error: 'Failed to update profile.' }, { status: 500 });
  }
}