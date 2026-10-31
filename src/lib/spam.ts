// Spots messages that look like paid promo or a scam, so they can be flagged before anyone replies.

const link = /(https?:\/\/|www\.|bit\.ly|linktr\.ee|t\.me\/|wa\.me\/|\b[a-z0-9-]+\.(com|net|io|xyz|co|me|ly|app)\b)/i;
const money = /(cash ?app|venmo|paypal|zelle|crypto|bitcoin|usdt|gift ?card|wire transfer|\$\s?\d)/i;
const promo = /(guarantee|\d+k? (streams|plays|followers|listeners)|playlist placement|promot(e|ion) your|go viral|grow your (page|account|music)|dm (us|me) for|collab\?? fee)/i;

/** Why a message looks suspicious, or null if it doesn't. */
export function suspicion(body: string): string | null {
  const promoHit = promo.test(body);
  const moneyHit = money.test(body);
  if (promoHit && (moneyHit || link.test(body))) return 'Looks like paid promo';
  if (moneyHit && link.test(body)) return 'Asks for money with a link';
  if (promoHit) return 'Looks like promo';
  return null;
}

/** Whether to warn about links in a message from someone you don't know. */
export const hasLink = (body: string) => link.test(body);
