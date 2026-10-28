import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '../components/Chrome';
import { Icon } from '../components/Icon';
import { Button, Chip, Tap, text } from '../components/ui';
import { authMessage, useAuth } from '../lib/auth';
import { colors, fonts } from '../theme';

type Mode = 'signin' | 'signup' | 'forgot';

export default function AuthScreen() {
  const { signIn, signUp, resendConfirmation, sendPasswordReset } = useAuth();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<Mode>('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unconfirmed, setUnconfirmed] = useState(false);
  // Which email we just sent: the sign-up confirmation or a password reset.
  const [sent, setSent] = useState<'confirm' | 'reset' | null>(null);
  const [resent, setResent] = useState(false);

  const emailOk = /^\S+@\S+\.\S+$/.test(email.trim());
  const ready = emailOk && (mode === 'forgot' || (password.length >= 8 && (mode === 'signin' || name.trim().length > 0)));

  const switchTo = (m: Mode) => {
    setMode(m);
    setError(null);
    setUnconfirmed(false);
  };

  const run = async (work: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    setUnconfirmed(false);
    try {
      await work();
    } catch (e) {
      setUnconfirmed((e as { code?: string }).code === 'email_not_confirmed');
      setError(authMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const submit = () =>
    run(async () => {
      const address = email.trim();
      if (mode === 'signin') await signIn(address, password);
      else if (mode === 'forgot') {
        await sendPasswordReset(address);
        setSent('reset');
      } else {
        const { needsConfirm } = await signUp(name.trim(), address, password);
        if (needsConfirm) setSent('confirm');
      }
      // Signed in: the layout moves you on to setup or your timeline.
    });

  const resend = () =>
    run(async () => {
      await resendConfirmation(email.trim());
      setResent(true);
    });

  return (
    <Screen contentStyle={[styles.body, { paddingBottom: 32 + insets.bottom }]}>
      <Text style={styles.logo}>NEXUS</Text>
      <Text style={styles.h1} accessibilityRole="header">
        Find your people. Then go make something.
      </Text>
      <Text style={[text.sub, { fontSize: 15, lineHeight: 22 }]}>
        A network for creatives built to connect you, not keep you scrolling.
      </Text>

      {sent ? (
        <View style={styles.sent}>
          <Icon name="send" size={22} color={colors.lime} />
          <Text style={styles.sentTitle}>Check your email</Text>
          <Text style={styles.sentText}>
            {sent === 'confirm'
              ? `We sent a confirmation link to ${email.trim()}. Open it on this device and you’re in.`
              : `If there’s an account for ${email.trim()}, a link to choose a new password is on its way.`}{' '}
            It can take a minute; check spam too.
          </Text>
          {error ? <Text style={styles.sentError}>{error}</Text> : null}
          {sent === 'confirm' ? (
            <Tap accessibilityRole="button" onPress={busy || resent ? undefined : resend}>
              <Text style={styles.sentLink}>{resent ? 'Sent again.' : busy ? 'Sending…' : 'Didn’t get it? Send it again'}</Text>
            </Tap>
          ) : null}
          <Button
            variant="lime"
            label="Back to sign in"
            onPress={() => {
              setSent(null);
              setResent(false);
              setPassword('');
              switchTo('signin');
            }}
          />
        </View>
      ) : (
        <View style={styles.form}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Chip label="Create account" selected={mode === 'signup'} onPress={() => switchTo('signup')} />
            <Chip label="Sign in" selected={mode !== 'signup'} onPress={() => switchTo('signin')} />
          </View>

          {mode === 'forgot' ? (
            <Text style={text.sub}>Enter your account’s email and we’ll send a link to choose a new password.</Text>
          ) : null}

          {mode === 'signup' ? <Field label="Your name" value={name} onChange={setName} autoComplete="name" /> : null}
          <Field label="Email" value={email} onChange={setEmail} autoComplete="email" keyboard="email-address" />
          {mode !== 'forgot' ? (
            <Field
              label="Password"
              value={password}
              onChange={setPassword}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              secure
              hint={mode === 'signup' ? 'At least 8 characters' : undefined}
              onSubmit={ready && !busy ? submit : undefined}
            />
          ) : null}

          {error ? (
            <Text style={styles.error} accessibilityLiveRegion="polite">
              {error}
            </Text>
          ) : null}
          {unconfirmed ? (
            <Tap accessibilityRole="button" onPress={busy || resent ? undefined : resend}>
              <Text style={styles.link}>{resent ? 'Confirmation link sent. Check your email.' : 'Send the confirmation link again'}</Text>
            </Tap>
          ) : null}

          <Button
            variant="big"
            label={busy ? 'One moment…' : mode === 'signup' ? 'Create account' : mode === 'forgot' ? 'Send reset link' : 'Sign in'}
            onPress={ready && !busy ? submit : undefined}
            style={!(ready && !busy) && { opacity: 0.45 }}
          />

          {mode === 'signin' ? (
            <Tap accessibilityRole="button" onPress={() => switchTo('forgot')} style={{ alignSelf: 'center' }}>
              <Text style={styles.link}>Forgot password?</Text>
            </Tap>
          ) : null}
          {mode === 'forgot' ? (
            <Tap accessibilityRole="button" onPress={() => switchTo('signin')} style={{ alignSelf: 'center' }}>
              <Text style={styles.link}>Back to sign in</Text>
            </Tap>
          ) : null}
        </View>
      )}

      <View style={styles.ai}>
        <Icon name="shield" color={colors.lime} />
        <Text style={styles.aiText}>Your work is never sold or used to train AI. Everything on Nexus is visible only to signed-in members.</Text>
      </View>
    </Screen>
  );
}

function Field({
  label,
  value,
  onChange,
  secure,
  hint,
  autoComplete,
  keyboard,
  onSubmit,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  secure?: boolean;
  hint?: string;
  autoComplete?: 'name' | 'email' | 'new-password' | 'current-password';
  keyboard?: 'email-address';
  onSubmit?: () => void;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        accessibilityLabel={label}
        secureTextEntry={secure}
        autoCapitalize={autoComplete === 'name' ? 'words' : 'none'}
        autoComplete={autoComplete}
        keyboardType={keyboard}
        onSubmitEditing={onSubmit}
        style={styles.input}
      />
      {hint ? <Text style={text.small}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  body: { paddingTop: 36, paddingHorizontal: 22, gap: 20 },
  logo: { fontFamily: fonts.display900, fontSize: 26, letterSpacing: -0.5, color: colors.forest },
  h1: { fontFamily: fonts.display800, fontSize: 34, lineHeight: 36, letterSpacing: -1, color: colors.ink },
  form: { gap: 14 },
  label: { fontFamily: fonts.body600, fontSize: 13.5, color: colors.forest },
  input: {
    height: 50,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.paper,
    paddingHorizontal: 14,
    fontFamily: fonts.body400,
    fontSize: 16,
    color: colors.ink,
  },
  error: { fontFamily: fonts.body500, fontSize: 13.5, color: '#9A2B1F' },
  link: { fontFamily: fonts.body600, fontSize: 14, color: colors.forest, textDecorationLine: 'underline', paddingVertical: 4 },
  sent: { backgroundColor: colors.forest, borderRadius: 20, padding: 18, gap: 10 },
  sentTitle: { fontFamily: fonts.display800, fontSize: 20, color: colors.lime },
  sentText: { fontFamily: fonts.body400, fontSize: 14, lineHeight: 20, color: colors.cream },
  sentError: { fontFamily: fonts.body500, fontSize: 13.5, color: '#FFB4A8' },
  sentLink: { fontFamily: fonts.body600, fontSize: 14, color: colors.lime, textDecorationLine: 'underline', paddingVertical: 4 },
  ai: { backgroundColor: colors.ink, borderRadius: 18, padding: 16, flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  aiText: { flex: 1, fontFamily: fonts.body400, fontSize: 13, lineHeight: 19, color: colors.cream },
});
