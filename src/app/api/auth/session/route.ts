import { NextRequest, NextResponse } from 'next/server';
import { getCustomerFromSession, getUserFromSession } from '@/lib/session'; 

export async function GET(req: NextRequest) {
  try {
    const customer = await getCustomerFromSession();
    if (customer) {
      return NextResponse.json({
        user: {
          id: customer.id,
          phone_number: customer.phone_number,
          name: customer.name,
          gender: customer.gender,
          dob: customer.dob ? customer.dob.getTime() : null,
          anniversary: customer.anniversary ? customer.anniversary.getTime() : null,
          is_setup_complete: customer.is_setup_complete,
        },
        role: 'user',
      });
    }

    const business = await getUserFromSession(); 
    if (business) {
      return NextResponse.json({
        user: {
          id: business.id,
          phone_number: business.phone_number,
          name: business.name,
          address: business.address,
          business_type: business.business_type,
          contact_number_2: business.contact_number_2,
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