// Sends the buyer to Stripe's hosted checkout and back to their tickets.
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { startCheckout } from './api';

/** Where Stripe sends people after paying. These must be listed in ALLOWED_RETURN_URLS on the server. */
export function ticketsReturnUrl() {
  if (Platform.OS === 'web') {
    const base = (Constants.expoConfig?.experiments?.baseUrl ?? '').replace(/\/$/, '');
    return `${window.location.origin}${base}/tickets`;
  }
  return Linking.createURL('/tickets');
}

export async function payWithStripe(eventId: string, tierId: string, quantity: number) {
  const returnTo = ticketsReturnUrl();
  const { url, orderId } = await startCheckout(eventId, tierId, quantity, returnTo);
  if (Platform.OS === 'web') {
    // Stripe's page replaces the app; its success link brings the buyer back to /tickets.
    window.location.assign(url);
    return;
  }
  await WebBrowser.openAuthSessionAsync(url, returnTo);
  router.replace({ pathname: '/tickets', params: { order: orderId } });
}
