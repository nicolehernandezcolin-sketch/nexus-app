// Ticket fee math. Change the numbers here and every screen follows.
//
// The Nexus fee is all-in: it already covers card processing (Stripe's standard
// 2.9% + $0.30), so buyers see one fee, not a service fee plus a processing fee.
// At 3% + $0.99 Nexus keeps roughly $0.66 per paid ticket after Stripe at any
// price, so the fee never runs at a loss. See docs/TICKETING.md for the details.

export const NEXUS_FEE = { percent: 0.03, fixed: 0.99 };

// Eventbrite's per-ticket fee as quoted for comparison. Check current pricing
// before using this publicly; Eventbrite may add payment processing on top.
export const EVENTBRITE_FEE = { percent: 0.0363, fixed: 1.3 };

/** Most tickets one verified person can buy for a single event. */
export const TICKET_LIMIT = 4;

/** Seconds before the live ticket code changes. */
export const CODE_REFRESH_SECONDS = 15;

const cents = (n: number) => Math.round(n * 100) / 100;

/** Worked out in whole cents, the same way the server charges (supabase/functions/_shared/pricing.ts). */
export function feePerTicket(price: number, fee = NEXUS_FEE) {
  if (price <= 0) return 0;
  return Math.round(Math.round(price * 100) * fee.percent + fee.fixed * 100) / 100;
}

export function quote(price: number, quantity: number) {
  const subtotal = cents(price * quantity);
  const fees = cents(feePerTicket(price) * quantity);
  const eventbriteFees = cents(feePerTicket(price, EVENTBRITE_FEE) * quantity);
  return { subtotal, fees, total: cents(subtotal + fees), eventbriteFees, savings: cents(eventbriteFees - fees) };
}

export const money = (n: number) => (n === 0 ? 'Free' : `$${n.toFixed(2)}`);

/** Short call-to-action for an event's sale type. */
export function saleLabel(sale: { kind: 'tickets'; tiers: { price: number }[] } | { kind: 'free' } | { kind: 'drawing' }) {
  if (sale.kind === 'free') return 'Free RSVP';
  if (sale.kind === 'drawing') return 'Enter drawing';
  const from = Math.min(...sale.tiers.map((t) => t.price));
  return `Tickets $${from}${sale.tiers.length > 1 ? '+' : ''}`;
}
