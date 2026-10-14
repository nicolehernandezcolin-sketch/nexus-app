import { createContext, ReactNode, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { OptionId, PostKind, profile, TicketTier, workModules } from '../data/content';

/** A post written in the demo, shown at the top of the timeline and on the profile. */
export type UserPost = { id: string; kind: PostKind; text: string; image?: string };

export type HeaderStyle = { cover: string; pattern: 'none' | 'waves' | 'grid' | 'dots' };

export type Ticket = { id: string; eventId: string; tier: string; price: number; holder: string; seq: number };

export type ProfileTab = 'work' | 'posts';

type DemoState = {
  roles: Record<string, boolean>;
  options: Partial<Record<OptionId, boolean>>;
  saved: Record<string, boolean>;
  tickets: Ticket[];
  drawings: Record<string, boolean>;
  toast: string | null;
  profileTab: ProfileTab;
  moduleOrder: string[];
  hiddenModules: Record<string, boolean>;
  collapsedModules: Record<string, boolean>;
  pinnedPost: string | null;
  userPosts: UserPost[];
  header: HeaderStyle;
  addPost: (post: Omit<UserPost, 'id'>) => void;
  setHeader: (change: Partial<HeaderStyle>) => void;
  setProfileTab: (tab: ProfileTab) => void;
  moveModule: (id: string, by: -1 | 1) => void;
  toggleModuleHidden: (id: string) => void;
  toggleModuleCollapsed: (id: string) => void;
  togglePinned: (postId: string) => void;
  toggleRole: (role: string) => void;
  toggleOption: (id: OptionId) => void;
  toggleSaved: (postId: string) => void;
  buyTickets: (eventId: string, tier: TicketTier, quantity: number) => void;
  enterDrawing: (eventId: string) => void;
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
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [drawings, setDrawings] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [profileTab, setProfileTab] = useState<ProfileTab>('work');
  const [moduleOrder, setModuleOrder] = useState(() => workModules.map((m) => m.id));
  const [hiddenModules, setHiddenModules] = useState<Record<string, boolean>>({});
  const [collapsedModules, setCollapsedModules] = useState<Record<string, boolean>>({});
  const [pinnedPost, setPinnedPost] = useState<string | null>(null);
  const [userPosts, setUserPosts] = useState<UserPost[]>([]);
  const [header, setHeaderState] = useState<HeaderStyle>({ cover: 'dome', pattern: 'none' });
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
      tickets,
      drawings,
      toast,
      profileTab,
      moduleOrder,
      hiddenModules,
      collapsedModules,
      pinnedPost,
      userPosts,
      header,
      addPost: (post) => setUserPosts((list) => [{ ...post, id: `u${list.length + 1}` }, ...list]),
      setHeader: (change) => setHeaderState((h) => ({ ...h, ...change })),
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
      buyTickets: (eventId, tier, quantity) =>
        setTickets((list) => [
          ...list,
          // One ticket per person: every ticket carries a name, starting with the buyer.
          ...Array.from({ length: quantity }, (_, i) => ({
            id: `${eventId}-${list.length + i + 1}`,
            eventId,
            tier: tier.name,
            price: tier.price,
            holder: i === 0 ? profile.name : `Guest ${i} · name it before the show`,
            seq: list.length + i + 1,
          })),
        ]),
      enterDrawing: (id) => setDrawings((s) => ({ ...s, [id]: true })),
      showToast,
    }),
    [roles, options, saved, tickets, drawings, toast, profileTab, moduleOrder, hiddenModules, collapsedModules, pinnedPost, userPosts, header, showToast],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDemo() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useDemo must be used inside DemoProvider');
  return ctx;
}
