import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { customers, businesses } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
    try {
        const { phone, newPassword, userType } = await request.json();

        if (!phone || !newPassword || !userType) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        if (newPassword.length < 8) {
            return NextResponse.json(
                { error: 'Password must be at least 8 characters long' },
                { status: 400 }
            );
        }

        if (!['customer', 'business'].includes(userType)) {
            return NextResponse.json(
                { error: 'Invalid user type' },
                { status: 400 }
            );
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 12);

        let updateResult;

        if (userType === 'customer') {
            // Update customer password
            updateResult = await db
                .update(customers)
                .set({ hashed_password: hashedPassword })
                .where(eq(customers.phone_number, phone))
                .returning({ id: customers.id });
        } else {
            // Update business password
            updateResult = await db
                .update(businesses)
                .set({ hashed_password: hashedPassword })
                .where(eq(businesses.phone_number, phone))
                .returning({ id: businesses.id });
        }

        if (updateResult.length === 0) {
            return NextResponse.json(
                { error: 'User not found with this phone number' },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { success: true, message: 'Password reset successfully' },
            { status: 200 }
        );

    } catch (error) {
        console.error('Error resetting password:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 