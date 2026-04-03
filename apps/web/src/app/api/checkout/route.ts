import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { lemonSqueezySetup, createCheckout } from '@lemonsqueezy/lemonsqueezy.js';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  lemonSqueezySetup({ apiKey: process.env.LEMONSQUEEZY_API_KEY! });

  const storeId = process.env.LEMONSQUEEZY_STORE_ID!;
  const variantId = process.env.LEMONSQUEEZY_VARIANT_ID!;

  const checkout = await createCheckout(storeId, variantId, {
    checkoutData: {
      email: session.user.email,
      name: session.user.name ?? undefined,
      custom: {
        user_id: session.user.id!,
      },
    },
    productOptions: {
      redirectUrl: 'https://git.exposed/settings',
    },
  });

  const url = checkout.data?.data.attributes.url;
  if (!url) {
    return NextResponse.json({ error: 'Failed to create checkout' }, { status: 500 });
  }

  return NextResponse.json({ url });
}
