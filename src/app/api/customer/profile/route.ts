import { NextRequest, NextResponse } from 'next/server';
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

    const { name, gender, dob, anniversary } = await req.json();

    const dobDate = dob ? new Date(dob) : null;
    const anniversaryDate = anniversary ? new Date(anniversary) : null;

    await db.update(customers)
      .set({
        name,
        gender,
        dob: dobDate,
        anniversary: anniversaryDate,
        is_setup_complete: true, 
        updated_at: new Date(),
      })
      .where(eq(customers.id, sessionUser.id));

    const [updatedCustomer] = await db.select().from(customers).where(eq(customers.id, sessionUser.id));

    if (updatedCustomer) {
      return NextResponse.json({
        message: 'Profile updated successfully!',
        user: {
          id: updatedCustomer.id,
          phone_number: updatedCustomer.phone_number,
          name: updatedCustomer.name,
          gender: updatedCustomer.gender,
          dob: updatedCustomer.dob ? updatedCustomer.dob.getTime() : null,
          anniversary: updatedCustomer.anniversary ? updatedCustomer.anniversary.getTime() : null,
          is_setup_complete: updatedCustomer.is_setup_complete,
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