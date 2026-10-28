// Who is signed in, and their profile. In demo mode there is never a session.
import { Session } from '@supabase/supabase-js';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { avatarUrls, getProfile, ProfileRow, updateMyProfile } from './api';
import { appUrl } from './appUrl';
import { supabase } from './supabase';

type Auth = {
  live: boolean;
  ready: boolean;
  session: Session | null;
  me: ProfileRow | null;
  /** Short-lived link to your profile photo, if you have one. */
  myAvatarUrl?: string;
  signUp: (name: string, email: string, password: string) => Promise<{ needsConfirm: boolean }>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  saveMe: (patch: Partial<ProfileRow>) => Promise<void>;
  refreshMe: () => Promise<void>;
};

const Ctx = createContext<Auth | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [me, setMe] = useState<ProfileRow | null>(null);
  const [ready, setReady] = useState(!supabase);
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
    const { data } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      // Load outside the callback, as Supabase recommends, to avoid blocking auth events.
      setTimeout(() => loadMe(s), 0);
    });
    return () => data.subscription.unsubscribe();
  }, [loadMe]);

  const value = useMemo<Auth>(
    () => ({
      live: !!supabase,
      ready,
      session,
      me,
      myAvatarUrl,
      signUp: async (name, email, password) => {
        const { data, error } = await supabase!.auth.signUp({ email, password, options: { data: { name }, emailRedirectTo: appUrl('/') } });
        if (error) throw error;
        return { needsConfirm: !data.session };
      },
      signIn: async (email, password) => {
        const { error } = await supabase!.auth.signInWithPassword({ email, password });
        if (error) throw error;
      },
      signOut: async () => {
        await supabase!.auth.signOut();
      },
      saveMe: async (patch) => {
        setMe(await updateMyProfile(patch));
      },
      refreshMe: () => loadMe(session),
    }),
    [ready, session, me, myAvatarUrl, loadMe],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
