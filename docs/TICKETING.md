# Ticketing on Nexus

How Nexus sells tickets directly, why its fee beats Eventbrite, and how it keeps scalpers and bots out. The demo app shows each of these flows on screen. This document covers what it takes to make them real.

## 1. Fees

| | Per-ticket fee | $10 ticket | $20 ticket | $50 ticket |
| --- | --- | --- | --- | --- |
| Eventbrite (as quoted) | 3.63% + $1.30 | $1.66 | $2.03 | $3.12 |
| **Nexus** | **3% + $0.99, card processing included** | **$1.29** | **$1.59** | **$2.49** |
| Buyer saves | | $0.37 | $0.44 | $0.63 |

Check Eventbrite's current pricing before publishing a comparison. Depending on plan and country, Eventbrite may also charge a separate payment processing fee, which would make the Nexus savings larger.

### Does Nexus make money at 3% + $0.99?

Stripe's standard US card rate is 2.9% + $0.30 per charge. If the buyer pays the fee on top of the ticket price, Stripe charges 2.9% on the whole amount:

```
fee        = 0.03 × price + 0.99
stripe     = 0.029 × (price + fee) + 0.30
nexus keeps = fee − stripe ≈ 0.661 + 0.00013 × price
```

So Nexus keeps about **$0.66 per ticket at any price**, and it never loses money on a standard card. Multi-ticket orders do better because Stripe's $0.30 is charged once per order, not per ticket.

Costs this doesn't cover yet:
- International cards (+1.5%) and currency conversion (+1%)
- Stripe Connect payouts to organizers (about $2 per active account per month, plus 0.25% + $0.25 per payout)
- Refunds: Stripe keeps its fee on refunded charges
- Disputes: $15 each

**To change the fee**, edit `NEXUS_FEE` in `src/data/fees.ts`. Every screen updates.

## 2. Selling tickets for real

**Built:** Stripe Checkout through two Supabase server functions, with server-side pricing, the 4-per-person limit enforced in the database, named tickets issued only after Stripe confirms payment, and refunds. Setup steps are in [BACKEND.md](BACKEND.md#set-up-stripe-for-paid-tickets). Nexus sells as the single merchant for now.

**Next**, so other organizers get paid directly:

1. **Stripe Connect (Express accounts).** Each organizer, starting with Nexus, onboards once. Money goes straight to them, and Nexus takes its fee through `application_fee_amount`. Stripe handles payouts, tax forms (1099-K) and KYC.
2. **A small backend.** Supabase (Postgres, auth and edge functions) or Expo Router API routes deployed with EAS Hosting. It creates PaymentIntents, stores orders and tickets, and receives Stripe webhooks.
3. **Stripe's React Native SDK** (`@stripe/stripe-react-native`) for Apple Pay, Google Pay and cards in the app. The app never sees card numbers.
4. **App store rules.** Tickets for real-world events can use Stripe instead of in-app purchase on both iOS and Android.

Rough order of work: auth and verified accounts, then events and orders, then Stripe checkout, then ticket codes and door scanning, then resale.

## 3. Keeping out scalpers and bots

There's no single fix. Each layer makes the next attack more expensive until reselling isn't worth it.

### Make every buyer a real, single person
- **Phone verification** at signup. Block VoIP and virtual numbers using a carrier lookup (Twilio Lookup reports the line type). One account per phone number.
- **Passkeys** (Face ID or a fingerprint) instead of passwords, so credential-stuffing bots have nothing to stuff.
- **Device attestation.** Apple App Attest and Google Play Integrity prove a request came from a genuine, unmodified copy of the Nexus app on a real device. Scripts and emulators fail. On the web, use Cloudflare Turnstile and require the app for high-demand events.
- **Account age and history.** For hot events, new accounts or accounts that have never checked in at an event wait in a later round.

### Limit what each person can hold
- **A ticket limit (4)** enforced on the server across the person, phone number, payment card fingerprint (Stripe gives one per card) and device. This stops one person running 50 accounts with one card.
- **Names on tickets.** Each ticket is tied to a verified member. Guests accept their ticket into their own account.

### Remove the speed advantage
- **Drawings for high-demand shows.** Registration is open for a set window, then winners are picked at random with one entry per verified person. Speed no longer matters, which kills most bots' edge. People who checked in at past Nexus events go in an earlier round, which rewards the community instead of resellers.
- **Rate limits** per account, device and IP on checkout endpoints, and alerts on unusual spikes.

### Make resold tickets worthless off-platform
- **Rotating ticket codes.** The code is a short-lived token (like a TOTP) signed by the server and redrawn in the app every 15 seconds. Screenshots and PDFs stop scanning, so tickets can't be sold on Craigslist or StubHub as images.
- **Codes appear close to showtime**, for example 48 hours before doors, so there's nothing to resell weeks ahead.
- **Door scanning** checks the signature, the time window and that the ticket hasn't already been used. It works offline with a cached public key.

### Give fans a fair way out
- **Free transfers** to another verified member.
- **Face-value resale** through Nexus only. The seller gets what they paid, minus nothing or a small fee, and the ticket goes to the next person on the waitlist. With no markup there's no scalping business.

### What the demo shows vs. what needs a backend

| Protection | In the demo | Needs |
| --- | --- | --- |
| Fee breakdown and Eventbrite comparison | Working | – |
| Real payments | Stripe Checkout, live mode | – |
| 4-per-person limit | Enforced on the server and in the database, per account | Also per card, phone and device |
| Fair-access check at checkout | Animated steps | App Attest, Play Integrity, phone lookup |
| Fair drawing | Enter and see status | Drawing service and notifications |
| Live rotating code | Redraws every 15 s from a per-ticket secret only the owner can read | Server-signed tokens and a door scanner app |
| Transfer and face-value resale | Messages explain the rules | Transfer and waitlist backend |
