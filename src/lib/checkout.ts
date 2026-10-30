// Sends the buyer to Stripe's hosted checkout and back to their tickets.
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { startCheckout } from './api';
import { appUrl } from './appUrl';

/** Where Stripe sends people after paying. These must be listed in ALLOWED_RETURN_URLS on the server. */
export function ticketsReturnUrl() {
  // Phones go through a small web page that opens the app, since Stripe returns to web addresses.
  return Platform.OS === 'web' ? appUrl('/tickets') : `${SITE}/stripe-return.html`;
}

const SITE = 'https://nicolehernandezcolin-sketch.github.io/nexus-app';

export async function payWithStripe(eventId: string, tierId: string, quantity: number) {
  const returnTo = ticketsReturnUrl();
  const { url, orderId } = await startCheckout(eventId, tierId, quantity, returnTo);
  if (Platform.OS === 'web') {
    // Stripe's page replaces the app; its success link brings the buyer back to /tickets.
    window.location.assign(url);
    return;
  }
  // The sheet closes when the return page hands off to nexus://tickets.
  const result = await WebBrowser.openAuthSessionAsync(url, appUrl('/tickets'));
  const cancelled = result.type === 'success' && result.url.includes('cancelled=1');
  router.replace({ pathname: '/tickets', params: cancelled ? { order: orderId, cancelled: '1' } : { order: orderId } });
}
