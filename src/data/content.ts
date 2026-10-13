// Sample content for the demo. Everything the screens show lives here,
// so copy and event details can be edited without touching layout code.
import { colors } from '../theme';

export type Art = { bg: string; fg: string; height: number; label: string };

export const roles = [
  'Musician',
  'Producer',
  'Filmmaker',
  'Photographer',
  'Visual artist',
  'Designer',
  'Dancer',
  'Writer',
];

export type OptionId = 'suggest' | 'discover' | 'personal' | 'others' | 'reminder' | 'quiet';

export const welcomeOptions: { id: OptionId; title: string; detail: string }[] = [
  {
    id: 'suggest',
    title: 'Suggest me to other creatives',
    detail: 'People with matching interests can see you as a possible collaborator.',
  },
  {
    id: 'discover',
    title: 'Show my work in Discover',
    detail: 'Your posts can appear for people who don’t follow you yet.',
  },
  {
    id: 'personal',
    title: 'Personalize my Discover page',
    detail: 'Use what I follow to sort Discover. Your timeline always stays in order.',
  },
];

export type PostKind = 'Looking for' | 'New work' | 'Crew call';

export type Post = {
  id: string;
  initials: string;
  avatar: string;
  name: string;
  firstName: string;
  role: string;
  time: string;
  kind: PostKind;
  text: string;
  art?: Art;
  cta: string;
};

export const postKindColors: Record<PostKind, { bg: string; fg: string }> = {
  'Looking for': { bg: colors.lime, fg: colors.ink },
  'New work': { bg: colors.stone, fg: colors.forest },
  'Crew call': { bg: colors.ink, fg: colors.lime },
};

export const posts: Post[] = [
  {
    id: 'andre',
    initials: 'AO',
    avatar: colors.olive,
    name: 'Andre Okafor',
    firstName: 'Andre',
    role: 'Bassist',
    time: '1h',
    kind: 'Looking for',
    text: 'Looking for a drummer and keys player for Sunday jam sessions in North Park. Neo-soul, funk, some Latin grooves. All levels welcome if you can hold a pocket.',
    cta: 'I’m interested',
  },
  {
    id: 'marisol',
    initials: 'MV',
    avatar: colors.forest,
    name: 'Marisol Vega',
    firstName: 'Marisol',
    role: 'Photographer · Tijuana',
    time: '3h',
    kind: 'New work',
    text: 'New series shot along the border at golden hour. Would love to collaborate with a musician on a short visual piece.',
    art: { bg: colors.sand, fg: colors.forest, height: 210, label: 'Photo series' },
    cta: 'Collaborate',
  },
  {
    id: 'lena',
    initials: 'LP',
    avatar: colors.ink,
    name: 'Lena Park',
    firstName: 'Lena',
    role: 'Filmmaker',
    time: '6h',
    kind: 'Crew call',
    text: 'Shooting a music video Nov 2 in Barrio Logan. Need a gaffer and a stylist. Paid, small budget, great food.',
    art: { bg: colors.forest, fg: colors.lime, height: 150, label: 'Moodboard' },
    cta: 'Apply',
  },
  {
    id: 'tomas',
    initials: 'TR',
    avatar: colors.olive,
    name: 'Tomás Rivera',
    firstName: 'Tomás',
    role: 'Producer',
    time: '9h',
    kind: 'New work',
    text: 'Finished a beat tape last night. Looking for vocalists who write in Spanish and English.',
    art: { bg: colors.lime, fg: colors.ink, height: 120, label: 'Audio preview' },
    cta: 'Collaborate',
  },
];

export const disciplines = ['All', 'Music', 'Film', 'Visual', 'Movement'] as const;
export type Discipline = (typeof disciplines)[number];

export type Creator = {
  name: string;
  role: string;
  discipline: Exclude<Discipline, 'All'>;
  openTo: string;
  art: Art;
};

export const creators: Creator[] = [
  { name: 'Sofia Ramos', role: 'Vocalist · Chula Vista', discipline: 'Music', openTo: 'Open to features', art: { bg: colors.forest, fg: colors.lime, height: 190, label: 'Live set' } },
  { name: 'Kai Nakamura', role: 'Cinematographer', discipline: 'Film', openTo: 'Open to music videos', art: { bg: colors.sand, fg: colors.forest, height: 130, label: 'Reel still' } },
  { name: 'Dani Flores', role: 'Muralist', discipline: 'Visual', openTo: 'Open to commissions', art: { bg: colors.lime, fg: colors.ink, height: 220, label: 'Mural' } },
  { name: 'Jordan Ellis', role: 'Drummer', discipline: 'Music', openTo: 'Open to bands', art: { bg: colors.ink, fg: colors.lime, height: 150, label: 'Studio photo' } },
  { name: 'Ana Lucero', role: 'Choreographer', discipline: 'Movement', openTo: 'Open to stage work', art: { bg: colors.olive, fg: colors.cream, height: 170, label: 'Rehearsal' } },
  { name: 'Ruben Ortiz', role: 'Editor and colorist', discipline: 'Film', openTo: 'Open to short films', art: { bg: colors.stone, fg: colors.forest, height: 140, label: 'Color grade' } },
  { name: 'Mia Chen', role: 'Illustrator', discipline: 'Visual', openTo: 'Open to album art', art: { bg: colors.forest, fg: colors.cream, height: 180, label: 'Illustration' } },
  { name: 'Luis Herrera', role: 'Sound engineer', discipline: 'Music', openTo: 'Open to live shows', art: { bg: colors.sand, fg: colors.ink, height: 130, label: 'Board photo' } },
];

export type NexusEvent = {
  id: string;
  featured?: boolean;
  month: string;
  day: string;
  badge: string;
  title: string;
  meta: string;
  friends: string[];
  friendsText: string;
};

export const events: NexusEvent[] = [
  { id: 'nff', featured: true, month: 'OCT', day: '10', badge: 'Nexus event', title: 'Nexus Film Festival · 1st Edition', meta: 'Fleet Science Center · Doors 7 PM', friends: ['LP', 'KN', 'RO'], friendsText: 'Lena, Kai + 1 you follow' },
  { id: 'kickback', month: 'OCT', day: '25', badge: 'Nexus event', title: 'Creative Kickback · Nexus turns one', meta: 'Granada House', friends: ['SR', 'MV'], friendsText: 'Sofia, Marisol going' },
  { id: 'jam', month: 'SUN', day: '•', badge: 'Community', title: 'Sunday Jam Sessions', meta: 'North Park · hosted by Andre Okafor', friends: ['AO', 'JE'], friendsText: 'Andre, Jordan going' },
  { id: 'uc', month: 'MONTHLY', day: 'UC', badge: 'Nexus event', title: 'UC Series at UCSD', meta: 'UC San Diego', friends: ['TR'], friendsText: 'Tomás going' },
];

export const profile = {
  initials: 'NH',
  name: 'Nicole Hernandez Colin',
  firstName: 'Nicole',
  tagline: 'Artist, producer, founder · San Diego',
  bio: 'Performing and producing as Destined Echo. Building spaces where creatives meet in real life through Nexus. English y español.',
  openTo: ['Band members', 'Music video crews', 'Event partners'],
  metAt: ['Nexus Film Festival', 'UC Series at UCSD'],
};

export type WorkItem = { title: string; detail: string; art: Art };
export type WorkModule = { id: string; title: string; blurb: string; items: WorkItem[] };

// The profile's work, grouped into modules the owner can reorder, hide and collapse.
export const workModules: WorkModule[] = [
  {
    id: 'music',
    title: 'Music',
    blurb: 'Records and releases as Destined Echo',
    items: [
      { title: 'Layers', detail: 'Album · Destined Echo', art: { bg: colors.forest, fg: colors.lime, height: 140, label: 'Album art' } },
      { title: 'Layers Reimagined', detail: 'Live recording', art: { bg: colors.olive, fg: colors.cream, height: 140, label: 'Cover' } },
    ],
  },
  {
    id: 'film',
    title: 'Film',
    blurb: 'Short films and music videos',
    items: [
      { title: 'Pa Ya', detail: 'Short film · Nexus Film Fest', art: { bg: colors.lime, fg: colors.ink, height: 140, label: 'Film still' } },
    ],
  },
  {
    id: 'live',
    title: 'Live shows',
    blurb: 'Stages and sets',
    items: [
      { title: 'Layers Reimagined', detail: 'Live show · Quartyard SD', art: { bg: colors.sand, fg: colors.forest, height: 140, label: 'Show photo' } },
      { title: 'Latin Jazz Night', detail: 'Nexus music series', art: { bg: colors.ink, fg: colors.lime, height: 140, label: 'Show photo' } },
    ],
  },
  {
    id: 'events',
    title: 'Events I organize',
    blurb: 'Nexus nights, festivals and series',
    items: [
      { title: 'Nexus Film Festival', detail: 'Founder · 1st Edition', art: { bg: colors.forest, fg: colors.lime, height: 140, label: 'Event photo' } },
      { title: 'UC Series', detail: 'Monthly · UC San Diego', art: { bg: colors.stone, fg: colors.forest, height: 140, label: 'Event photo' } },
      { title: 'Nex Up', detail: 'New artist showcase', art: { bg: colors.lime, fg: colors.ink, height: 140, label: 'Flyer' } },
    ],
  },
];

export type ProfilePost = {
  id: string;
  time: string;
  kind: PostKind | 'Event';
  module?: string;
  text: string;
  art?: Art;
};

// The profile owner's own posts, newest first. This is their personal timeline.
export const profilePosts: ProfilePost[] = [
  {
    id: 'p1',
    time: '2d',
    kind: 'Event',
    text: 'Creative Kickback on the 25th. Nexus turns one. Bring a friend you want to make something with.',
    art: { bg: colors.forest, fg: colors.lime, height: 150, label: 'Flyer' },
  },
  {
    id: 'p2',
    time: '1w',
    kind: 'Looking for',
    text: 'Looking for a drummer and a bassist for a few live Destined Echo dates. San Diego based, rehearsals in North Park.',
  },
  {
    id: 'p3',
    time: '2w',
    kind: 'New work',
    module: 'Film',
    text: 'Pa Ya screened at the Nexus Film Festival. Thank you to everyone who came out and stayed for the talkback.',
    art: { bg: colors.lime, fg: colors.ink, height: 170, label: 'Film still' },
  },
  {
    id: 'p4',
    time: '1mo',
    kind: 'New work',
    module: 'Live shows',
    text: 'Layers Reimagined, live at Quartyard. Same songs, new arrangements, full band.',
    art: { bg: colors.sand, fg: colors.forest, height: 130, label: 'Show photo' },
  },
];

export const profileKindColors: Record<ProfilePost['kind'], { bg: string; fg: string }> = {
  ...postKindColors,
  Event: { bg: colors.forest, fg: colors.lime },
};

type PrivacyRow = { id?: OptionId; title: string; detail: string };

export const privacySections: { title: string; rows: PrivacyRow[] }[] = [
  {
    title: 'Being found',
    rows: [
      { id: 'suggest', title: 'Suggest me to creatives', detail: 'Appear as a possible collaborator for people with shared interests.' },
      { id: 'discover', title: 'Show my work in Discover', detail: 'Let people who don’t follow you see your posts.' },
      { id: 'personal', title: 'Personalize Discover for me', detail: 'Sort Discover by what you follow. Never touches your timeline.' },
    ],
  },
  {
    title: 'Your timeline',
    rows: [
      { title: 'Newest first, people you follow', detail: 'No algorithm decides what you see in your timeline.' },
      { title: 'Timeline ends when you’re caught up', detail: 'No infinite scroll. You get a clear stopping point.' },
      { id: 'others', title: 'Mix in posts from others', detail: 'Add a few posts from outside your follows, clearly labeled.' },
    ],
  },
  {
    title: 'Wellbeing',
    rows: [
      { id: 'reminder', title: 'Daily time check', detail: 'A gentle nudge after 20 minutes in the app.' },
      { id: 'quiet', title: 'Quiet hours', detail: 'Pause notifications overnight and on weekends.' },
    ],
  },
];

export const aiProtections = [
  'Marked do-not-train for AI crawlers and data buyers',
  'Invisible watermark ties each file to your account',
  'Full-quality files only shown to signed-in members',
  'Scraping is rate-limited and blocked when detected',
];
