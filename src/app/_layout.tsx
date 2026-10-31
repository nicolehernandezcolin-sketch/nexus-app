import { Archivo_500Medium, Archivo_700Bold, Archivo_800ExtraBold, Archivo_900Black } from '@expo-google-fonts/archivo';
import { InstrumentSans_400Regular, InstrumentSans_500Medium, InstrumentSans_600SemiBold } from '@expo-google-fonts/instrument-sans';
import { useFonts } from 'expo-font';
import { router, Stack, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ReactNode, useEffect } from 'react';
import { Platform, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Celebration } from '../components/Celebration';
import { Toast } from '../components/Chrome';
import { AuthProvider, useAuth } from '../lib/auth';
import { DemoProvider } from '../state/DemoState';
import { colors, fonts } from '../theme';

export default function RootLayout() {
  const [loaded] = useFonts({
    Archivo_500Medium,
    Archivo_700Bold,
    Archivo_800ExtraBold,
    Archivo_900Black,
    InstrumentSans_400Regular,
    InstrumentSans_500Medium,
    InstrumentSans_600SemiBold,
  });
  if (!loaded) return <View style={{ flex: 1, backgroundColor: colors.cream }} />;

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <DemoProvider>
          <StatusBar style="dark" />
          <WebFrame>
            <Gate />
            <Stack screenOptions={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: colors.cream } }} />
            <Celebration />
            <Toast />
          </WebFrame>
        </DemoProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

/**
 * With a real backend: signed-out visitors go to sign in, new members to setup,
 * and set-up members past both. The demo has no gate.
 */
function Gate() {
  const { live, ready, session, me, recovering } = useAuth();
  const segments = useSegments();
  const at = segments[0] as string | undefined;

  useEffect(() => {
    if (!live || !ready) return;
    // A reset link signs you in just long enough to choose a new password; the screen explains expired links.
    if (recovering) {
      if (at !== 'reset-password') router.replace('/reset-password');
    } else if (at === 'reset-password') {
      return;
    } else if (!session) {
      if (at !== 'auth') router.replace('/auth');
    } else if (me && !me.onboarded) {
      if (at !== undefined && at !== 'index') router.replace('/');
    } else if (me && (at === 'auth' || at === undefined || at === 'index')) {
      router.replace('/timeline');
    }
  }, [live, ready, session, me, recovering, at]);

  return null;
}

/** On a wide browser window, show the app in a phone frame beside a short intro. Phones get the app full screen. */
function WebFrame({ children }: { children: ReactNode }) {
  const { width } = useWindowDimensions();
  const { live } = useAuth();
  if (Platform.OS !== 'web' || width < 560) return <View style={{ flex: 1 }}>{children}</View>;

  return (
    <View style={styles.stage}>
      {width >= 900 ? (
        <View style={styles.intro}>
          <Text style={styles.mark}>NEXUS</Text>
          <Text style={styles.h1}>Find your people. Then go make something.</Text>
          <Text style={styles.p}>
            Nexus is a network for creatives built to connect you, not keep you scrolling. Your timeline ends, everything is opt
            in, and your work is protected from AI.
          </Text>
          <View style={{ gap: 6 }}>
            {['Pick what you make and set your switches.', 'Scroll the timeline to the very end.', 'Browse Discover, Events and your Profile.'].map(
              (s, i) => (
                <Text key={s} style={styles.step}>
                  {i + 1}. {s}
                </Text>
              ),
            )}
          </View>
          <Text style={styles.note}>
            {live ? 'Members only. Sign up to join.' : 'Interactive demo. Posts and creators are sample content.'}
          </Text>
        </View>
      ) : null}
      <View style={styles.phone}>
        <View style={styles.screen}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    backgroundColor: colors.forest,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 56,
    padding: 32,
  },
  intro: { maxWidth: 340, gap: 18 },
  mark: { fontFamily: fonts.display900, fontSize: 44, letterSpacing: -1, color: colors.lime },
  h1: { fontFamily: fonts.display800, fontSize: 30, lineHeight: 33, letterSpacing: -0.5, color: colors.cream },
  p: { fontFamily: fonts.body400, fontSize: 15, lineHeight: 23, color: colors.creamMuted },
  step: { fontFamily: fonts.body400, fontSize: 14, lineHeight: 20, color: colors.creamMuted },
  note: { fontFamily: fonts.body400, fontSize: 12.5, color: '#C9C5B5' },
  phone: {
    width: 390,
    height: 812,
    maxHeight: '100%',
    borderRadius: 46,
    backgroundColor: colors.ink,
    padding: 10,
    shadowColor: '#14180C',
    shadowOpacity: 0.35,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 30 },
  },
  screen: { flex: 1, borderRadius: 36, overflow: 'hidden', backgroundColor: colors.cream },
});
