// Checks the app's fee display matches what the server charges, and the purchase rules.
// Run: npx tsx scripts/check-pricing.ts
import { feePerTicket, NEXUS_FEE, quote, TICKET_LIMIT } from '../src/data/fees';
import { feeCents, NEXUS_FEE as SERVER_FEE, quotePurchase, TICKET_LIMIT as SERVER_LIMIT } from '../supabase/functions/_shared/pricing';

let failures = 0;
const expect = (ok: boolean, msg: string) => {
  if (!ok) {
    failures++;
    console.log('FAIL', msg);
  }
};

expect(NEXUS_FEE.percent === SERVER_FEE.percent && Math.round(NEXUS_FEE.fixed * 100) === SERVER_FEE.fixedCents, 'fee settings match');
expect(TICKET_LIMIT === SERVER_LIMIT, 'ticket limit matches');

// Every price from $0.01 to $500 in cents: app fee display = server charge.
for (let c = 1; c <= 50000; c++) {
  const app = Math.round(feePerTicket(c / 100) * 100);
  if (app !== feeCents(c)) {
    expect(false, `fee at $${(c / 100).toFixed(2)}: app ${app}¢ vs server ${feeCents(c)}¢`);
    break;
  }
}
// App totals match the server total for each quantity.
for (const price of [10, 12, 12.5, 15, 20, 49.99]) {
  for (let n = 1; n <= 4; n++) {
    const s = quotePurchase([{ id: 'ga', name: 'GA', price }], 'ga', n, 0);
    expect(s.ok && Math.round(quote(price, n).total * 100) === s.quote.totalCents, `total for ${n} × $${price}`);
  }
}

const tiers = [{ id: 'ga', name: 'GA', price: 20 }, { id: 'free', name: 'Free', price: 0 }];
expect(!quotePurchase(tiers, 'vip', 1, 0).ok, 'unknown tier refused');
expect(!quotePurchase(tiers, 'ga', 0, 0).ok, 'zero tickets refused');
expect(!quotePurchase(tiers, 'ga', 1.5, 0).ok, 'fractional quantity refused');
expect(!quotePurchase(tiers, 'ga', 5, 0).ok, 'more than 4 refused');
expect(!quotePurchase(tiers, 'ga', 2, 3).ok, 'over the limit with tickets already held refused');
expect(quotePurchase(tiers, 'ga', 1, 3).ok, 'up to exactly 4 allowed');
expect(!quotePurchase(tiers, 'ga', 1, 4).ok, 'already at 4 refused');
expect(!quotePurchase(tiers, 'free', 1, 0).ok, 'free tier sent to RSVP instead');
const ok = quotePurchase(tiers, 'ga', 4, 0);
expect(ok.ok && ok.quote.totalCents === 4 * (2000 + 159), '4 × $20 = $86.36');

console.log(failures ? `${failures} check(s) failed` : 'All pricing checks passed');
process.exit(failures ? 1 : 0);
