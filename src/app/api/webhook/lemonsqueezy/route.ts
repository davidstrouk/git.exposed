import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { db } from '@/db';
import { subscriptions, users } from '@/db/schema';
import { eq } from 'drizzle-orm';

function verifySignature(rawBody: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(rawBody).digest('hex');
  if (signature.length !== digest.length) return false;
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get('x-signature');
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET!;

  if (!signature || !verifySignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const payload = JSON.parse(rawBody);
  const eventName: string = payload.meta?.event_name;
  const data = payload.data ?? payload;
  const attrs = data.attributes ?? data;
  const customData = payload.meta?.custom_data;

  switch (eventName) {
    case 'subscription_created': {
      const userId = customData?.user_id;
      if (!userId) {
        // Try to find user by email
        const email = attrs.user_email;
        if (!email) break;
        const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (!user) break;
        await upsertSubscription(user.id, data.id, attrs);
      } else {
        await upsertSubscription(userId, data.id, attrs);
      }
      break;
    }

    case 'subscription_updated':
    case 'subscription_resumed':
    case 'subscription_unpaused': {
      await db.update(subscriptions)
        .set({
          status: attrs.status === 'active' ? 'active' : attrs.status,
          currentPeriodEnd: attrs.renews_at ? new Date(attrs.renews_at) : null,
          variantId: String(attrs.variant_id),
          customerPortalUrl: attrs.urls?.customer_portal ?? null,
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.lsSubscriptionId, String(data.id)));
      break;
    }

    case 'subscription_cancelled':
    case 'subscription_expired': {
      await db.update(subscriptions)
        .set({
          status: eventName === 'subscription_expired' ? 'expired' : 'canceled',
          currentPeriodEnd: attrs.ends_at ? new Date(attrs.ends_at) : null,
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.lsSubscriptionId, String(data.id)));
      break;
    }

    case 'subscription_paused': {
      await db.update(subscriptions)
        .set({
          status: 'paused',
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.lsSubscriptionId, String(data.id)));
      break;
    }
  }

  return NextResponse.json({ received: true });
}

async function upsertSubscription(
  userId: string,
  subscriptionId: string,
  attrs: Record<string, unknown>,
) {
  await db.insert(subscriptions).values({
    userId,
    lsCustomerId: String(attrs.customer_id),
    lsSubscriptionId: String(subscriptionId),
    variantId: String(attrs.variant_id),
    status: 'active',
    currentPeriodEnd: attrs.renews_at ? new Date(attrs.renews_at as string) : null,
    customerPortalUrl: (attrs.urls as Record<string, string>)?.customer_portal ?? null,
  }).onConflictDoUpdate({
    target: subscriptions.lsSubscriptionId,
    set: {
      status: 'active',
      currentPeriodEnd: attrs.renews_at ? new Date(attrs.renews_at as string) : null,
      customerPortalUrl: (attrs.urls as Record<string, string>)?.customer_portal ?? null,
      updatedAt: new Date(),
    },
  });
}
