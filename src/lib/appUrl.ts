import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

/** A full link to a screen in this app, for emails and payment returns. */
export function appUrl(path: string) {
  if (Platform.OS === 'web') {
    // The published site lives under the base path; the local dev server serves from the root.
    const base = (Constants.expoConfig?.experiments?.baseUrl ?? '').replace(/\/$/, '');
    const prefix = base && window.location.pathname.startsWith(base) ? base : '';
    return `${window.location.origin}${prefix}${path}`;
  }
  return Linking.createURL(path);
}
