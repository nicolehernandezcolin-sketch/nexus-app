// Stripe tells us when a checkout is paid or expires. Paid orders get their tickets here.
// Stripe signs every call, so this function is deployed without Supabase's sign-in check.

import Stripe from 'npm:stripe@^22';
import { createClient } from 'npm:@supabase/supabase-js@^2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!);
const cryptoProvider = Stripe.createSubtleCryptoProvider();
const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

Deno.serve(async (req) => {
  const signature = req.headers.get('Stripe-Signature');
  // Verification needs the raw body, exactly as Stripe sent it.
  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature!, Deno.env.get('STRIPE_WEBHOOK_SECRET')!, undefined, cryptoProvider);
  } catch (err) {
    return new Response(`Webhook signature check failed: ${(err as Error).message}`, { status: 400 });
  }

  if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.payment_status !== 'paid') return Response.json({ ok: true, waiting: true });
    const orderId = session.metadata?.order_id;
    if (!orderId) return Response.json({ ok: true, ignored: 'no order id' });

    // Only a pending order turns paid, once. Stripe can send the same event more than once.
    const { data: order } = await admin
      .from('orders')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', orderId)
      .eq('status', 'pending')
      .select('*')
      .maybeSingle();
    if (!order) return Response.json({ ok: true, already: true });

    const { data: buyer } = await admin.from('profiles').select('name').eq('id', order.user_id).single();
    // One named ticket per seat: the buyer's, then guests they name before the show.
    const tickets = Array.from({ length: order.quantity }, (_, i) => ({
      order_id: order.id,
      event_id: order.event_id,
      owner: order.user_id,
      holder_name: i === 0 ? buyer?.name || 'You' : `Guest ${i}`,
      tier_name: order.tier_name,
      price_cents: order.unit_price_cents,
    }));
    const { error } = await admin.from('tickets').insert(tickets);
    if (error) {
      // Put the order back so Stripe's retry issues the tickets.
      await admin.from('orders').update({ status: 'pending', paid_at: null }).eq('id', order.id);
      return new Response(error.message, { status: 500 });
    }
    return Response.json({ ok: true, issued: tickets.length });
  }

  if (event.type === 'checkout.session.expired' || event.type === 'checkout.session.async_payment_failed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.order_id;
    if (orderId) await admin.from('orders').update({ status: 'expired' }).eq('id', orderId).eq('status', 'pending');
    return Response.json({ ok: true });
  }

  // A full refund from the Stripe dashboard voids the order's tickets.
  if (event.type === 'charge.refunded') {
    const charge = event.data.object as Stripe.Charge;
    if (!charge.refunded) return Response.json({ ok: true, partial: true });
    const intentId = typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id;
    if (!intentId) return Response.json({ ok: true, ignored: 'no payment intent' });
    const intent = await stripe.paymentIntents.retrieve(intentId);
    const orderId = intent.metadata?.order_id;
    if (!orderId) return Response.json({ ok: true, ignored: 'no order id' });
    await admin.from('orders').update({ status: 'refunded' }).eq('id', orderId);
    await admin.from('tickets').update({ status: 'refunded' }).eq('order_id', orderId);
    return Response.json({ ok: true, refunded: orderId });
  }

  return Response.json({ ok: true, ignored: event.type });
});
