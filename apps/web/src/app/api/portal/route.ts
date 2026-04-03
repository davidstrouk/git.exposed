import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@repo/shared/db';
import { subscriptions } from '@repo/shared/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [sub] = await db.select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, session.user.id))
    .limit(1);

  if (!sub?.customerPortalUrl) {
    return NextResponse.json({ error: 'No subscription found' }, { status: 404 });
  }

  return NextResponse.redirect(sub.customerPortalUrl);
}
