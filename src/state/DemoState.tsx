import { createContext, ReactNode, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { OptionId, workModules } from '../data/content';

export type ProfileTab = 'work' | 'timeline';

type DemoState = {
  roles: Record<string, boolean>;
  options: Partial<Record<OptionId, boolean>>;
  saved: Record<string, boolean>;
  going: Record<string, boolean>;
  toast: string | null;
  profileTab: ProfileTab;
  moduleOrder: string[];
  hiddenModules: Record<string, boolean>;
  collapsedModules: Record<string, boolean>;
  pinnedPost: string | null;
  setProfileTab: (tab: ProfileTab) => void;
  moveModule: (id: string, by: -1 | 1) => void;
  toggleModuleHidden: (id: string) => void;
  toggleModuleCollapsed: (id: string) => void;
  togglePinned: (postId: string) => void;
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
  const [profileTab, setProfileTab] = useState<ProfileTab>('work');
  const [moduleOrder, setModuleOrder] = useState(() => workModules.map((m) => m.id));
  const [hiddenModules, setHiddenModules] = useState<Record<string, boolean>>({});
  const [collapsedModules, setCollapsedModules] = useState<Record<string, boolean>>({});
  const [pinnedPost, setPinnedPost] = useState<string | null>(null);
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
      profileTab,
      moduleOrder,
      hiddenModules,
      collapsedModules,
      pinnedPost,
      setProfileTab,
      moveModule: (id, by) =>
        setModuleOrder((order) => {
          const i = order.indexOf(id);
          const j = i + by;
          if (i < 0 || j < 0 || j >= order.length) return order;
          const next = [...order];
          [next[i], next[j]] = [next[j], next[i]];
          return next;
        }),
      toggleModuleHidden: (id) => setHiddenModules((s) => flip(s, id)),
      toggleModuleCollapsed: (id) => setCollapsedModules((s) => flip(s, id)),
      togglePinned: (id) => setPinnedPost((cur) => (cur === id ? null : id)),
      toggleRole: (r) => setRoles((s) => flip(s, r)),
      toggleOption: (id) => setOptions((s) => flip(s, id)),
      toggleSaved: (id) => setSaved((s) => flip(s, id)),
      toggleGoing: (id) => setGoing((s) => flip(s, id)),
      showToast,
    }),
    [roles, options, saved, going, toast, profileTab, moduleOrder, hiddenModules, collapsedModules, pinnedPost, showToast],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDemo() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useDemo must be used inside DemoProvider');
  return ctx;
}
