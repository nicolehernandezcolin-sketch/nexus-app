// Who is signed in, and their profile. In demo mode there is never a session.
import { AuthError, Session } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { avatarUrls, getProfile, ProfileRow, updateMyProfile } from './api';
import { appUrl } from './appUrl';
import { supabase } from './supabase';

type Auth = {
  live: boolean;
  ready: boolean;
  session: Session | null;
  me: ProfileRow | null;
  /** True after opening a password-reset link, until a new password is saved. */
  recovering: boolean;
  /** Short-lived link to your profile photo, if you have one. */
  myAvatarUrl?: string;
  signUp: (name: string, email: string, password: string) => Promise<{ needsConfirm: boolean }>;
  signIn: (email: string, password: string) => Promise<void>;
  resendConfirmation: (email: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  setNewPassword: (password: string) => Promise<void>;
  signOut: () => Promise<void>;
  saveMe: (patch: Partial<ProfileRow>) => Promise<void>;
  refreshMe: () => Promise<void>;
};

const Ctx = createContext<Auth | null>(null);

/** Plain-language messages for the auth errors people actually run into. */
export function authMessage(e: unknown): string {
  const code = e instanceof AuthError ? e.code : undefined;
  const message = (e as Error)?.message ?? '';
  switch (code) {
    case 'invalid_credentials':
      return 'That email and password don’t match. Check them, or reset your password.';
    case 'email_not_confirmed':
      return 'Confirm your email first. We can send the link again.';
    case 'user_already_exists':
    case 'email_exists':
      return 'There’s already an account with this email. Sign in instead.';
    case 'weak_password':
      return 'Choose a stronger password: at least 8 characters, not a common one.';
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return 'Too many tries for now. Wait a few minutes, then try again.';
    case 'same_password':
      return 'That’s your current password. Choose a new one.';
    case 'email_address_invalid':
      return 'That email address doesn’t look right.';
  }
  if (/network|fetch/i.test(message)) return 'Can’t reach Nexus. Check your connection and try again.';
  return message || 'Something went wrong. Try again.';
}

/** Native apps open email links as nexus://…#access_token=…; sign in from them. */
async function sessionFromLink(url: string | null) {
  if (!supabase || !url || !url.includes('access_token')) return;
  const params = new URLSearchParams(url.split('#')[1] ?? '');
  const access_token = params.get('access_token');
  const refresh_token = params.get('refresh_token');
  if (access_token && refresh_token) await supabase.auth.setSession({ access_token, refresh_token });
  return params.get('type');
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [me, setMe] = useState<ProfileRow | null>(null);
  const [ready, setReady] = useState(!supabase);
  const [recovering, setRecovering] = useState(false);
  const [myAvatarUrl, setMyAvatarUrl] = useState<string | undefined>();

  const avatarPath = me?.avatar_path ?? null;
  useEffect(() => {
    if (!avatarPath) return setMyAvatarUrl(undefined);
    avatarUrls([{ avatar_path: avatarPath }]).then((urls) => setMyAvatarUrl(urls[avatarPath]));
  }, [avatarPath]);

  const loadMe = useCallback(async (s: Session | null) => {
    setMe(s ? await getProfile(s.user.id).catch(() => null) : null);
  }, []);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      await loadMe(data.session);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === 'PASSWORD_RECOVERY') setRecovering(true);
      setSession(s);
      // Load outside the callback, as Supabase recommends, to avoid blocking auth events.
      setTimeout(() => loadMe(s), 0);
    });
    return () => data.subscription.unsubscribe();
  }, [loadMe]);

  // The web reads links itself (detectSessionInUrl); native apps get them here.
  useEffect(() => {
    if (!supabase || Platform.OS === 'web') return;
    const open = (url: string | null) =>
      sessionFromLink(url).then((type) => {
        if (type === 'recovery') setRecovering(true);
      });
    Linking.getInitialURL().then(open);
    const sub = Linking.addEventListener('url', ({ url }) => open(url));
    return () => sub.remove();
  }, []);

  const value = useMemo<Auth>(
    () => ({
      live: !!supabase,
      ready,
      session,
      me,
      recovering,
      myAvatarUrl,
      signUp: async (name, email, password) => {
        const { data, error } = await supabase!.auth.signUp({ email, password, options: { data: { name }, emailRedirectTo: appUrl('/') } });
        if (error) throw error;
        // With email confirmation on, Supabase doesn't reveal existing accounts: it returns a user with no identities.
        if (data.user && data.user.identities?.length === 0) throw new AuthError('exists', 400, 'user_already_exists');
        return { needsConfirm: !data.session };
      },
      signIn: async (email, password) => {
        const { error } = await supabase!.auth.signInWithPassword({ email, password });
        if (error) throw error;
      },
      resendConfirmation: async (email) => {
        const { error } = await supabase!.auth.resend({ type: 'signup', email, options: { emailRedirectTo: appUrl('/') } });
        if (error) throw error;
      },
      sendPasswordReset: async (email) => {
        const { error } = await supabase!.auth.resetPasswordForEmail(email, { redirectTo: appUrl('/reset-password') });
        if (error) throw error;
      },
      setNewPassword: async (password) => {
        const { error } = await supabase!.auth.updateUser({ password });
        if (error) throw error;
        setRecovering(false);
      },
      signOut: async () => {
        setRecovering(false);
        await supabase!.auth.signOut();
      },
      saveMe: async (patch) => {
        setMe(await updateMyProfile(patch));
      },
      refreshMe: () => loadMe(session),
    }),
    [ready, session, me, recovering, myAvatarUrl, loadMe],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
