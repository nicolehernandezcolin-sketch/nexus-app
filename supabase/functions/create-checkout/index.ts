// Starts a Stripe Checkout for tickets.
// The signed-in member sends { eventId, tierId, quantity, returnTo }. Prices, the Nexus fee
// and the 4-per-person limit are all worked out here from the database, never from the app.

import Stripe from 'npm:stripe@^22';
import { createClient } from 'npm:@supabase/supabase-js@^2';
import { quotePurchase, Tier } from '../_shared/pricing.ts';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!);
const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

// Where buyers may be sent back to after paying. Anything else falls back to the first.
const allowedReturns = (Deno.env.get('ALLOWED_RETURN_URLS') ?? '').split(',').map((s) => s.trim()).filter(Boolean);

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return reply({ error: 'Use POST' }, 405);

  // Who is buying: the member's own session token.
  const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
  const { data: auth } = await admin.auth.getUser(token);
  const user = auth.user;
  if (!user) return reply({ error: 'Sign in to buy tickets.' }, 401);

  let input: { eventId?: string; tierId?: string; quantity?: number; returnTo?: string };
  try {
    input = await req.json();
  } catch {
    return reply({ error: 'Bad request' }, 400);
  }

  const { data: event } = await admin
    .from('events')
    .select('id, title, when_text, sale_kind, tiers')
    .eq('id', input.eventId ?? '')
    .single();
  if (!event || event.sale_kind !== 'tickets') return reply({ error: 'This event isn’t selling tickets.' }, 400);

  const { data: committed, error: countError } = await admin.rpc('tickets_committed', { for_user: user.id, for_event: event.id });
  if (countError) return reply({ error: countError.message }, 500);

  const check = quotePurchase(event.tiers as Tier[], input.tierId ?? '', Number(input.quantity), committed as number);
  if (!check.ok) return reply({ error: check.error }, 400);
  const q = check.quote;

  const { data: order, error: orderError } = await admin
    .from('orders')
    .insert({
      user_id: user.id,
      event_id: event.id,
      tier_id: q.tier.id,
      tier_name: q.tier.name,
      quantity: q.quantity,
      unit_price_cents: q.unitCents,
      fee_cents: q.feeCents,
      total_cents: q.totalCents,
    })
    .select('id')
    .single();
  if (orderError) return reply({ error: orderError.message }, 500);

  const back = allowedReturns.find((u) => input.returnTo?.startsWith(u)) ?? allowedReturns[0];
  if (!back) return reply({ error: 'Server is missing ALLOWED_RETURN_URLS.' }, 500);
  const join = back.includes('?') ? '&' : '?';

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    client_reference_id: order.id,
    customer_email: user.email,
    metadata: { order_id: order.id, event_id: event.id, user_id: user.id },
    payment_intent_data: { metadata: { order_id: order.id }, description: `${event.title} · ${q.quantity} × ${q.tier.name}` },
    // Matches the 30 minutes a pending order holds its place in the limit.
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    line_items: [
      {
        quantity: q.quantity,
        price_data: { currency: 'usd', unit_amount: q.unitCents, product_data: { name: `${event.title} · ${q.tier.name}`, description: event.when_text || undefined } },
      },
      {
        quantity: q.quantity,
        price_data: { currency: 'usd', unit_amount: q.feeCents, product_data: { name: 'Nexus fee (card processing included)' } },
      },
    ],
    success_url: `${back}${join}order=${order.id}`,
    cancel_url: `${back}${join}order=${order.id}&cancelled=1`,
  });

  await admin.from('orders').update({ stripe_session_id: session.id }).eq('id', order.id);
  return reply({ url: session.url, orderId: order.id });
});
