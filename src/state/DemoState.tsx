import { createContext, ReactNode, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { OptionId } from '../data/content';

type DemoState = {
  roles: Record<string, boolean>;
  options: Partial<Record<OptionId, boolean>>;
  saved: Record<string, boolean>;
  going: Record<string, boolean>;
  toast: string | null;
  toggleRole: (role: string) => void;
  toggleOption: (id: OptionId) => void;
  toggleSaved: (postId: string) => void;
  toggleGoing: (eventId: string) => void;
  showToast: (message: string) => void;
};

const Ctx = createContext<DemoState | null>(null);

const flip = <T extends Record<string, boolean | undefined>>(obj: T, key: string): T => ({
  ...obj,
  [key]: !obj[key],
});

export function DemoProvider({ children }: { children: ReactNode }) {
  // Matches the promise on screen: every switch starts off.
  const [roles, setRoles] = useState<Record<string, boolean>>({ Musician: true, Producer: true });
  const [options, setOptions] = useState<Partial<Record<OptionId, boolean>>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [going, setGoing] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const showToast = useCallback((message: string) => {
    setToast(message);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  const value = useMemo<DemoState>(
    () => ({
      roles,
      options,
      saved,
      going,
      toast,
      toggleRole: (r) => setRoles((s) => flip(s, r)),
      toggleOption: (id) => setOptions((s) => flip(s, id)),
      toggleSaved: (id) => setSaved((s) => flip(s, id)),
      toggleGoing: (id) => setGoing((s) => flip(s, id)),
      showToast,
    }),
    [roles, options, saved, going, toast, showToast],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDemo() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useDemo must be used inside DemoProvider');
  return ctx;
}
