// Ticket pricing, worked out on the server so the app can't change it.
// Keep these numbers the same as src/data/fees.ts (a test checks they match).

export const NEXUS_FEE = { percent: 0.03, fixedCents: 99 };
export const TICKET_LIMIT = 4;

export type Tier = { id: string; name: string; price: number };

/** The Nexus fee for one ticket, in cents. Free tickets have no fee. */
export function feeCents(unitPriceCents: number) {
  if (unitPriceCents <= 0) return 0;
  return Math.round(unitPriceCents * NEXUS_FEE.percent + NEXUS_FEE.fixedCents);
}

export type Quote = { tier: Tier; quantity: number; unitCents: number; feeCents: number; totalCents: number };

/**
 * Checks a purchase against the event's tiers and the per-person limit.
 * Returns the quote, or an error message for the buyer.
 */
export function quotePurchase(
  tiers: Tier[],
  tierId: string,
  quantity: number,
  alreadyCommitted: number,
): { ok: true; quote: Quote } | { ok: false; error: string } {
  const tier = tiers.find((t) => t.id === tierId);
  if (!tier) return { ok: false, error: 'That ticket type isn’t available.' };
  if (!Number.isInteger(quantity) || quantity < 1) return { ok: false, error: 'Choose at least one ticket.' };
  const remaining = TICKET_LIMIT - alreadyCommitted;
  if (remaining <= 0) return { ok: false, error: `You already have the most tickets one person can hold (${TICKET_LIMIT}).` };
  if (quantity > remaining) return { ok: false, error: `You can buy ${remaining} more for this show.` };
  const unitCents = Math.round(tier.price * 100);
  if (unitCents <= 0) return { ok: false, error: 'Free tickets don’t need checkout. RSVP instead.' };
  const fee = feeCents(unitCents);
  return { ok: true, quote: { tier, quantity, unitCents, feeCents: fee, totalCents: (unitCents + fee) * quantity } };
}
