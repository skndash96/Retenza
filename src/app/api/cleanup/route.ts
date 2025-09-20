import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { missions, sessions } from '@/server/db/schema';
import { lt } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const cronSecret = req.nextUrl.searchParams.get('secret');

  if (cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();

    await db.transaction(async (tx) => {
      await tx.delete(sessions).where(lt(sessions.expiresAt, now));
      await tx.delete(missions).where(lt(missions.expiresAt, now));
    });

    return NextResponse.json({
      success: true,
      message: 'Expired sessions and campaigns removed.'
    }, { status: 200 });

  } catch (error) {
    console.error('Database cleanup failed:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to perform cleanup.'
    }, { status: 500 });
  }
}