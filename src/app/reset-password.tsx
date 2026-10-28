import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '../components/Chrome';
import { Icon } from '../components/Icon';
import { Button, text } from '../components/ui';
import { authMessage, useAuth } from '../lib/auth';
import { colors, fonts } from '../theme';

/** Opened from the password-reset email: choose a new password. */
export default function ResetPassword() {
  const { ready, session, setNewPassword } = useAuth();
  const insets = useSafeAreaInsets();
  const [password, setPassword] = useState('');
  const [again, setAgain] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mismatch = again.length > 0 && again !== password;
  const canSave = password.length >= 8 && again === password && !busy;

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      await setNewPassword(password);
      router.replace('/timeline');
    } catch (e) {
      setError(authMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen contentStyle={[styles.body, { paddingBottom: 32 + insets.bottom }]}>
      <Text style={styles.logo}>NEXUS</Text>
      <Text style={styles.h1} accessibilityRole="header">
        Choose a new password
      </Text>

      {ready && !session ? (
        <View style={styles.card}>
          <Icon name="clock" size={22} color={colors.forest} />
          <Text style={text.strong}>This link has expired or was already used</Text>
          <Text style={text.sub}>Reset links work once and expire after an hour. Ask for a fresh one from the sign-in screen.</Text>
          <Button label="Go to sign in" onPress={() => router.replace('/auth')} />
        </View>
      ) : (
        <View style={styles.form}>
          <PasswordField label="New password" value={password} onChange={setPassword} hint="At least 8 characters" />
          <PasswordField label="Type it again" value={again} onChange={setAgain} onSubmit={canSave ? save : undefined} />
          {mismatch ? <Text style={styles.error}>The two passwords don’t match yet.</Text> : null}
          {error ? (
            <Text style={styles.error} accessibilityLiveRegion="polite">
              {error}
            </Text>
          ) : null}
          <Button
            variant="big"
            label={busy ? 'Saving…' : 'Save new password'}
            onPress={canSave ? save : undefined}
            style={!canSave && { opacity: 0.45 }}
          />
        </View>
      )}
    </Screen>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  hint,
  onSubmit,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  onSubmit?: () => void;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        accessibilityLabel={label}
        secureTextEntry
        autoCapitalize="none"
        autoComplete="new-password"
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
  card: { backgroundColor: colors.paper, borderRadius: 20, padding: 18, gap: 10 },
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
});
