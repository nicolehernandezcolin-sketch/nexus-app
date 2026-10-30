// Public pages: terms, privacy and support. They live on the website so people can read them before signing up.
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

const SITE = 'https://nicolehernandezcolin-sketch.github.io/nexus-app/legal';

export const legal = {
  terms: `${SITE}/terms.html`,
  privacy: `${SITE}/privacy.html`,
  tickets: `${SITE}/terms.html#tickets`,
  support: `${SITE}/support.html`,
  guidelines: `${SITE}/terms.html#community`,
};

export const SUPPORT_EMAIL = 'support@nexusglobal.info';

export function openPage(url: string) {
  if (Platform.OS === 'web') window.open(url, '_blank', 'noopener');
  else WebBrowser.openBrowserAsync(url);
}
