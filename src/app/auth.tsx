import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '../components/Chrome';
import { Icon } from '../components/Icon';
import { Button, Chip, text } from '../components/ui';
import { useAuth } from '../lib/auth';
import { colors, fonts } from '../theme';

type Mode = 'signin' | 'signup';

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<Mode>('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const ready = email.includes('@') && password.length >= 8 && (mode === 'signin' || name.trim().length > 0);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      if (mode === 'signin') await signIn(email.trim(), password);
      else {
        const { needsConfirm } = await signUp(name.trim(), email.trim(), password);
        if (needsConfirm) setSent(true);
      }
      // Signed in: the layout moves you on to setup or your timeline.
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

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
          <Text style={styles.sentText}>We sent a confirmation link to {email}. Open it, then come back and sign in.</Text>
          <Button
            variant="lime"
            label="I’ve confirmed, sign in"
            onPress={() => {
              setSent(false);
              setMode('signin');
            }}
          />
        </View>
      ) : (
        <View style={styles.form}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Chip label="Create account" selected={mode === 'signup'} onPress={() => setMode('signup')} />
            <Chip label="Sign in" selected={mode === 'signin'} onPress={() => setMode('signin')} />
          </View>

          {mode === 'signup' ? <Field label="Your name" value={name} onChange={setName} autoComplete="name" /> : null}
          <Field label="Email" value={email} onChange={setEmail} autoComplete="email" keyboard="email-address" />
          <Field
            label="Password"
            value={password}
            onChange={setPassword}
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            secure
            hint={mode === 'signup' ? 'At least 8 characters' : undefined}
          />

          {error ? (
            <Text style={styles.error} accessibilityLiveRegion="polite">
              {error}
            </Text>
          ) : null}

          <Button
            variant="big"
            label={busy ? 'One moment…' : mode === 'signup' ? 'Create account' : 'Sign in'}
            onPress={ready && !busy ? submit : undefined}
            style={!(ready && !busy) && { opacity: 0.45 }}
          />
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  secure?: boolean;
  hint?: string;
  autoComplete?: 'name' | 'email' | 'new-password' | 'current-password';
  keyboard?: 'email-address';
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
  sent: { backgroundColor: colors.forest, borderRadius: 20, padding: 18, gap: 10 },
  sentTitle: { fontFamily: fonts.display800, fontSize: 20, color: colors.lime },
  sentText: { fontFamily: fonts.body400, fontSize: 14, lineHeight: 20, color: colors.cream },
  ai: { backgroundColor: colors.ink, borderRadius: 18, padding: 16, flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  aiText: { flex: 1, fontFamily: fonts.body400, fontSize: 13, lineHeight: 19, color: colors.cream },
});
