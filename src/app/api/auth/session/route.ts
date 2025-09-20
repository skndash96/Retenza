import { type NextRequest, NextResponse } from 'next/server';
import { getCustomerFromSession, getUserFromSession } from '@/lib/session'; 

export async function GET(_req: NextRequest) {
  try {
    const customer = await getCustomerFromSession();
    if (customer) {
      return NextResponse.json({
        user: {
          id: customer.id,
          phoneNumber: customer.phoneNumber,
          name: customer.name,
          gender: customer.gender,
          dob: customer.dob ? customer.dob.getTime() : null,
          anniversary: customer.anniversary ? customer.anniversary.getTime() : null,
          isSetupComplete: customer.isSetupComplete,
        },
        role: 'user',
      });
    }

    const business = await getUserFromSession(); 
    if (business) {
      return NextResponse.json({
        user: {
          id: business.id,
          phoneNumber: business.phoneNumber,
          name: business.name,
          address: business.address,
          businessType: business.businessType,
          contactNumber: business.contactNumber,
          contactNumber2: business.contactNumber2,
        },
        role: 'business',
      });
    }

    return NextResponse.json({ user: null, role: null });
  } catch (error) {
    console.error('Error getting session:', error);
    return NextResponse.json({ error: 'Failed to retrieve session data.' }, { status: 500 });
  }
}