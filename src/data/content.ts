// Sample content for the demo. Everything the screens show lives here,
// so copy and event details can be edited without touching layout code.
import { ImageSourcePropType } from 'react-native';
import { colors } from '../theme';

/** A cover: a photo when we have one, otherwise a labelled color block. */
export type Art = { bg: string; fg: string; height: number; label: string; image?: ImageSourcePropType };

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

// Talent match vocabulary: what someone can bring, and what kind of project it's for.
export const skills = ['Vocals', 'Drums', 'Bass', 'Film crew', 'Editing', 'Visual art', 'Choreography', 'Sound'] as const;
export const projectTypes = ['Music video', 'Live show', 'Album art', 'Short film', 'Stage show'] as const;
export type Skill = (typeof skills)[number];
export type ProjectType = (typeof projectTypes)[number];

export type Creator = {
  name: string;
  role: string;
  discipline: Exclude<Discipline, 'All'>;
  openTo: string;
  art: Art;
  skills: Skill[];
  projects: ProjectType[];
  city: string;
  /** Nexus events you were both checked in at. */
  sharedEvents: number;
};

export const creators: Creator[] = [
  { name: 'Sofia Ramos', role: 'Vocalist · Chula Vista', discipline: 'Music', openTo: 'Open to features', art: { bg: colors.forest, fg: colors.lime, height: 190, label: 'Live set' }, skills: ['Vocals'], projects: ['Music video', 'Live show'], city: 'Chula Vista', sharedEvents: 2 },
  { name: 'Kai Nakamura', role: 'Cinematographer', discipline: 'Film', openTo: 'Open to music videos', art: { bg: colors.sand, fg: colors.forest, height: 130, label: 'Reel still' }, skills: ['Film crew'], projects: ['Music video', 'Short film'], city: 'San Diego', sharedEvents: 3 },
  { name: 'Dani Flores', role: 'Muralist', discipline: 'Visual', openTo: 'Open to commissions', art: { bg: colors.lime, fg: colors.ink, height: 220, label: 'Mural' }, skills: ['Visual art'], projects: ['Album art', 'Stage show'], city: 'San Diego', sharedEvents: 0 },
  { name: 'Jordan Ellis', role: 'Drummer', discipline: 'Music', openTo: 'Open to bands', art: { bg: colors.ink, fg: colors.lime, height: 150, label: 'Studio photo' }, skills: ['Drums'], projects: ['Live show'], city: 'San Diego', sharedEvents: 2 },
  { name: 'Ana Lucero', role: 'Choreographer · Tijuana', discipline: 'Movement', openTo: 'Open to stage work', art: { bg: colors.olive, fg: colors.cream, height: 170, label: 'Rehearsal' }, skills: ['Choreography'], projects: ['Stage show', 'Music video'], city: 'Tijuana', sharedEvents: 1 },
  { name: 'Ruben Ortiz', role: 'Editor and colorist', discipline: 'Film', openTo: 'Open to short films', art: { bg: colors.stone, fg: colors.forest, height: 140, label: 'Color grade' }, skills: ['Editing'], projects: ['Short film', 'Music video'], city: 'San Diego', sharedEvents: 1 },
  { name: 'Mia Chen', role: 'Illustrator · Los Angeles', discipline: 'Visual', openTo: 'Open to album art', art: { bg: colors.forest, fg: colors.cream, height: 180, label: 'Illustration' }, skills: ['Visual art'], projects: ['Album art'], city: 'Los Angeles', sharedEvents: 0 },
  { name: 'Luis Herrera', role: 'Sound engineer', discipline: 'Music', openTo: 'Open to live shows', art: { bg: colors.sand, fg: colors.ink, height: 130, label: 'Board photo' }, skills: ['Sound'], projects: ['Live show'], city: 'San Diego', sharedEvents: 1 },
  { name: 'Andre Okafor', role: 'Bassist · North Park', discipline: 'Music', openTo: 'Open to bands', art: { bg: colors.olive, fg: colors.lime, height: 150, label: 'Jam session' }, skills: ['Bass'], projects: ['Live show', 'Music video'], city: 'San Diego', sharedEvents: 3 },
];

/* ---------- Events and tickets ---------- */

export type TicketTier = { id: string; name: string; price: number; note?: string };

export type Sale =
  | { kind: 'tickets'; tiers: TicketTier[] }
  | { kind: 'free'; note: string }
  // High-demand shows: a drawing instead of first come, first served.
  | { kind: 'drawing'; note: string };

export type NexusEvent = {
  id: string;
  featured?: boolean;
  month: string;
  day: string;
  badge: string;
  title: string;
  meta: string;
  when: string;
  where: string;
  host: string;
  about: string;
  art: Art;
  sale: Sale;
  friends: string[];
  friendsText: string;
};

// Ticket prices are sample prices for the demo.
export const events: NexusEvent[] = [
  {
    id: 'kickback',
    month: 'OCT',
    day: '25',
    badge: 'Nexus event',
    title: 'Creative Kickback · Nexus turns one',
    meta: 'Granada House',
    when: 'Saturday, October 25',
    where: 'Granada House, San Diego',
    host: 'Nexus',
    about: 'A year of Nexus, celebrated with the people who built it. Bring a friend you want to make something with.',
    art: { bg: colors.lime, fg: colors.ink, height: 170, label: 'Kickback' },
    sale: { kind: 'tickets', tiers: [{ id: 'ga', name: 'General admission', price: 12 }] },
    friends: ['SR', 'MV'],
    friendsText: 'Sofia, Marisol going',
  },
  {
    id: 'curtain',
    featured: true,
    month: 'OCT',
    day: '30',
    badge: 'UC Series',
    title: 'Behind The Curtain',
    meta: 'UC San Diego · Venue announced soon',
    when: 'Friday, October 30, 2026',
    where: 'UC San Diego · venue announced soon',
    host: 'Nexus UC Series',
    about:
      'An evening of live music, performance and projected light, wrapped in sheer curtains and haze. Film and faces are projected across the fabric while performers move behind and through it. The launch night of the Nexus UC Series at UC San Diego.',
    art: { bg: colors.ink, fg: colors.lime, height: 190, label: 'Behind The Curtain' },
    sale: {
      kind: 'tickets',
      tiers: [
        { id: 'student', name: 'UCSD student', price: 10, note: 'Student ID checked at the door' },
        { id: 'ga', name: 'General admission', price: 20 },
      ],
    },
    friends: ['TR', 'KN', 'SR'],
    friendsText: 'Tomás, Kai + 1 you follow',
  },
  {
    id: 'latin-jazz',
    month: 'NOV',
    day: '♪',
    badge: 'Nexus music',
    title: 'Latin Jazz Night',
    meta: 'San Diego · Monthly',
    when: 'November · date announced soon',
    where: 'San Diego',
    host: 'Nexus',
    about: 'Every month, a new lineup and the same heat. When the rhythm section locks in, the room moves with it. A night San Diego can come back to.',
    art: { bg: colors.olive, fg: colors.cream, height: 170, label: 'Latin Jazz Night' },
    sale: { kind: 'tickets', tiers: [{ id: 'ga', name: 'General admission', price: 15 }] },
    friends: ['AO', 'JE'],
    friendsText: 'Andre, Jordan going',
  },
  {
    id: 'nex-up',
    month: 'MONTHLY',
    day: 'NU',
    badge: 'Free showcase',
    title: 'Nex Up',
    meta: 'San Diego · A new room each month',
    when: 'Monthly',
    where: 'San Diego, a new room each month',
    host: 'Nexus',
    about:
      'The next voices in San Diego, heard first. A handpicked lineup of emerging artists gets a real room, a real audience, and a night built around their work. Music, spoken word, dance and DJs.',
    art: { bg: colors.stone, fg: colors.forest, height: 160, label: 'Nex Up' },
    sale: { kind: 'free', note: 'Admission is always free. RSVP so we know how big a room to find.' },
    friends: ['MV'],
    friendsText: 'Marisol going',
  },
  {
    id: 'nff2',
    month: 'APR',
    day: '27',
    badge: 'Nexus Film',
    title: 'Nexus Film Festival · 2nd Edition',
    meta: 'San Diego · April 2027',
    when: 'April 2027',
    where: 'San Diego · venue revealed soon',
    host: 'Nexus Film',
    about:
      'The 1st Edition sold out all 248 seats under the Giant Dome. The 2nd Edition brings a new lineup and a bigger program. Because demand will outrun seats, tickets go out by fair drawing, not to whoever has the fastest bot.',
    art: { bg: colors.forest, fg: colors.lime, height: 190, label: 'Film Festival', image: require('../../assets/images/dome.jpg') },
    sale: { kind: 'drawing', note: 'Enter the drawing before tickets go on sale. Winners get 24 hours to buy at face value.' },
    friends: ['LP', 'KN', 'RO'],
    friendsText: 'Lena, Kai + 1 you follow entered',
  },
  {
    id: 'jam',
    month: 'SUN',
    day: '•',
    badge: 'Community',
    title: 'Sunday Jam Sessions',
    meta: 'North Park · hosted by Andre Okafor',
    when: 'Sundays',
    where: 'North Park, San Diego',
    host: 'Andre Okafor',
    about: 'Neo-soul, funk and some Latin grooves. All levels welcome if you can hold a pocket.',
    art: { bg: colors.sand, fg: colors.forest, height: 150, label: 'Jam session' },
    sale: { kind: 'free', note: 'Free. RSVP so Andre knows who’s coming.' },
    friends: ['AO', 'JE'],
    friendsText: 'Andre, Jordan going',
  },
];

/* ---------- Profile ---------- */

export const profile = {
  initials: 'NH',
  photo: require('../../assets/images/nicole.jpg'),
  name: 'Nicole Hernandez Colin',
  firstName: 'Nicole',
  tagline: 'Artist · Creative entrepreneur · Golfer',
  role: 'Founder and Creative Director, Nexus',
  location: 'San Diego',
  bio: 'Multidisciplinary artist pushing culture through intersectionality. I started Nexus because I see everything connecting. My debut album Layers and its short film Layered Visions are a fusion of Afro-Cuban R&B. I perform as Destined Echo.',
  openTo: ['Band members', 'Music video crews', 'Event partners', 'Sponsors'],
  links: [{ label: 'Linktree', url: 'https://linktr.ee/nicolehernandezcolin' }],
  hosting: ['curtain', 'latin-jazz', 'nff2'],
  metAt: ['Nexus Film Festival · 1st Edition', 'UC Series at UCSD'],
};

export type WorkItem = {
  id: string;
  title: string;
  detail: string;
  kind: string;
  art: Art;
  about: string;
  facts?: [string, string][];
  // Pieces inside this work, like the films in a festival program.
  gallery?: { title: string; by: string; note: string; image: ImageSourcePropType }[];
  eventId?: string;
  link?: { label: string; url: string };
};
export type WorkModule = { id: string; title: string; blurb: string; items: WorkItem[] };

// The profile's work, grouped into modules the owner can reorder, hide and collapse.
export const workModules: WorkModule[] = [
  {
    id: 'music',
    title: 'Music',
    blurb: 'Afro-Cuban R&B',
    items: [
      {
        id: 'layers',
        title: 'Layers',
        detail: 'Debut album · Destined Echo',
        kind: 'Album',
        art: { bg: colors.forest, fg: colors.lime, height: 148, label: 'Album art' },
        about: 'Nicole’s debut album, a fusion of Afro-Cuban roots and R&B. It comes with a companion short film, Layered Visions.',
        facts: [
          ['Type', 'Album'],
          ['Artist', 'Destined Echo'],
          ['Sound', 'Afro-Cuban R&B'],
          ['Companion film', 'Layered Visions'],
        ],
        link: { label: 'Listen on Linktree', url: 'https://linktr.ee/nicolehernandezcolin' },
      },
    ],
  },
  {
    id: 'film',
    title: 'Film',
    blurb: 'Short films',
    items: [
      {
        id: 'layered-visions',
        title: 'Layered Visions',
        detail: 'Short film · companion to Layers',
        kind: 'Short film',
        art: { bg: colors.lime, fg: colors.ink, height: 148, label: 'Film still' },
        about: 'The short film that accompanies Layers, bringing the album’s Afro-Cuban R&B to the screen.',
        facts: [
          ['Type', 'Short film'],
          ['Companion to', 'Layers (album)'],
        ],
      },
      {
        id: 'pa-ya',
        title: 'Pa Ya',
        detail: 'Short film',
        kind: 'Short film',
        art: { bg: colors.sand, fg: colors.forest, height: 148, label: 'Film still' },
        about: 'A short film by Nicole. [Add a logline, runtime and credits.]',
        facts: [['Type', 'Short film']],
      },
    ],
  },
  {
    id: 'live',
    title: 'Live shows',
    blurb: 'Stages and sets',
    items: [
      {
        id: 'layers-reimagined',
        title: 'Layers Reimagined',
        detail: 'Live show · Quartyard SD',
        kind: 'Live show',
        art: { bg: colors.olive, fg: colors.cream, height: 148, label: 'Show photo' },
        about: 'The songs from Layers, rearranged for a full band and performed live at Quartyard in San Diego.',
        facts: [
          ['Venue', 'Quartyard, San Diego'],
          ['Based on', 'Layers (album)'],
        ],
      },
    ],
  },
  {
    id: 'curation',
    title: 'My events',
    blurb: 'Nexus nights, series and festivals',
    items: [
      {
        id: 'nff1',
        title: 'Nexus Film Festival',
        detail: '1st Edition · Sold out',
        kind: 'Film festival',
        art: { bg: colors.forest, fg: colors.lime, height: 148, label: 'Giant Dome', image: require('../../assets/images/dome.jpg') },
        about:
          'On October 10, 2026, the first Nexus Film Festival sold out the Giant Dome Theater at the Fleet Science Center. Eleven short films from filmmakers in San Diego, Tijuana and the surrounding region screened across five genres, and the night closed with awards and time for filmmakers and the audience to meet.',
        facts: [
          ['Date', 'October 10, 2026'],
          ['Venue', 'Giant Dome Theater, Fleet Science Center'],
          ['Seats', '248, sold out'],
          ['Program', '11 short films, 5 genres'],
          ['Awards', '4'],
        ],
        gallery: [
          { title: 'In My Own Skin', by: 'Romeo Yotat', note: 'Best Picture', image: require('../../assets/images/film-in-my-own-skin.jpg') },
          { title: 'The Puppeteer', by: 'Chloe Appleton', note: 'Best Screenplay', image: require('../../assets/images/film-the-puppeteer.jpg') },
          { title: 'The Spirit of the Steppe', by: 'Matteo Freschi', note: 'Best Cinematography', image: require('../../assets/images/film-the-spirit-of-the-steppe.jpg') },
          { title: 'Hacked', by: 'Chasen Dinh', note: 'Best Editing', image: require('../../assets/images/film-hacked.jpg') },
        ],
        eventId: 'nff2',
      },
      {
        id: 'curtain',
        title: 'Behind The Curtain',
        detail: 'UC Series launch · Oct 30',
        kind: 'Live event',
        art: { bg: colors.ink, fg: colors.lime, height: 148, label: 'Curtains & haze' },
        about:
          'The first chapter of the Nexus UC Series, a campus series built to come back and grow with UCSD. Sheer curtains become screens, haze hangs in the air, candles light the corners, and the music carries the night.',
        facts: [
          ['Date', 'Friday, October 30, 2026'],
          ['Where', 'UC San Diego'],
          ['Format', 'Live music, performance and projection'],
        ],
        eventId: 'curtain',
      },
      {
        id: 'latin-jazz',
        title: 'Latin Jazz Night',
        detail: 'Monthly series',
        kind: 'Music series',
        art: { bg: colors.olive, fg: colors.cream, height: 148, label: 'Latin Jazz Night' },
        about: 'A monthly home for Latin jazz in San Diego. Every month a new lineup of horn players, pianists, bassists, percussionists and vocalists.',
        facts: [
          ['When', 'Monthly'],
          ['Next', 'November lineup in progress'],
        ],
        eventId: 'latin-jazz',
      },
      {
        id: 'nex-up',
        title: 'Nex Up',
        detail: 'Free monthly showcase',
        kind: 'Showcase',
        art: { bg: colors.stone, fg: colors.forest, height: 148, label: 'Nex Up' },
        about: 'A curated, always-free showcase for emerging San Diego artists: singers, rappers, bands, poets, DJs and dancers. Not an open mic. Every lineup is chosen with care.',
        facts: [
          ['When', 'Monthly'],
          ['Admission', 'Always free'],
          ['Who', 'Music, spoken word, dance and DJs'],
        ],
        eventId: 'nex-up',
      },
      {
        id: 'festival-2027',
        title: 'Nexus Festival',
        detail: 'October 2027',
        kind: 'Festival',
        art: { bg: colors.lime, fg: colors.ink, height: 148, label: 'Three stages' },
        about: 'Music, dance and film under one sky. Three stages, one night, and everyone who has been part of Nexus together for the biggest night of the year.',
        facts: [
          ['When', 'October 2027'],
          ['Where', 'San Diego, venue revealed soon'],
          ['Format', 'Three stages: music, dance and film'],
        ],
      },
    ],
  },
];

/* ---------- People and event teams ---------- */

export type Person = {
  id: string;
  name: string;
  initials: string;
  role: string;
  avatar: string;
  photo?: ImageSourcePropType;
  bio?: string;
  link?: { label: string; url: string };
};

// The Nexus team, from the About page of the Nexus website. 'nicole' is the profile owner.
export const people: Person[] = [
  { id: 'nicole', name: 'Nicole Hernandez Colin', initials: 'NH', role: 'Creative Director', avatar: colors.lime, photo: require('../../assets/images/nicole.jpg') },
  { id: 'jenny-xu', name: 'Jenny Xu', initials: 'JX', role: 'Co-Founder', avatar: colors.forest },
  { id: 'yaxi-zhang', name: 'Yaxi Zhang', initials: 'YZ', role: 'Strategic Finance Lead', avatar: colors.olive },
  { id: 'robert-gomez', name: 'Robert Gomez', initials: 'RG', role: 'Community Relations Director', avatar: colors.ink },
  {
    id: 'rhonda-glez',
    name: 'Rhonda Glez',
    initials: 'RG',
    role: 'Marketing Director',
    avatar: colors.forest,
    photo: require('../../assets/images/rhonda.jpg'),
    bio: 'Tijuana-based artist moving between R&B, hip-hop, techno and more. Designed the program for the first Nexus Film Festival.',
    link: { label: 'Linktree', url: 'https://linktr.ee/RhondaGlez' },
  },
  { id: 'melina-martinez', name: 'Melina Martinez', initials: 'MM', role: 'Event Coordinator', avatar: colors.olive },
  { id: 'kendra-mcfadden', name: 'Kendra McFadden', initials: 'KM', role: 'Producer', avatar: colors.ink },
  { id: 'zavier-gordon', name: 'Zavier Gordon', initials: 'ZG', role: 'Cinematographer', avatar: colors.forest },
];

export type TeamMember = { person: string; part: string };

// Who worked on each of Nicole's events, keyed by work id. Parts follow each person's
// Nexus title; adjust per event as needed.
export const teams: Record<string, TeamMember[]> = {
  nff1: [
    { person: 'nicole', part: 'Founder and host' },
    { person: 'jenny-xu', part: 'Co-Founder' },
    { person: 'rhonda-glez', part: 'Program design' },
    { person: 'melina-martinez', part: 'Event coordination' },
    { person: 'kendra-mcfadden', part: 'Production' },
    { person: 'zavier-gordon', part: 'Cinematography' },
  ],
  curtain: [
    { person: 'nicole', part: 'Creative direction' },
    { person: 'jenny-xu', part: 'Co-Founder' },
    { person: 'robert-gomez', part: 'Campus and community' },
    { person: 'melina-martinez', part: 'Event coordination' },
    { person: 'kendra-mcfadden', part: 'Production' },
  ],
  'latin-jazz': [
    { person: 'nicole', part: 'Creative direction' },
    { person: 'robert-gomez', part: 'Community relations' },
    { person: 'melina-martinez', part: 'Event coordination' },
  ],
  'nex-up': [
    { person: 'nicole', part: 'Curation' },
    { person: 'rhonda-glez', part: 'Marketing' },
    { person: 'melina-martinez', part: 'Event coordination' },
  ],
  'festival-2027': [
    { person: 'nicole', part: 'Creative direction' },
    { person: 'jenny-xu', part: 'Co-Founder' },
    { person: 'yaxi-zhang', part: 'Finance and sponsorships' },
    { person: 'rhonda-glez', part: 'Marketing' },
    { person: 'melina-martinez', part: 'Event coordination' },
  ],
};

export const personById = (id: string) => people.find((p) => p.id === id);

/** Every event a person worked on, for their profile. */
export const workFor = (personId: string) =>
  Object.entries(teams)
    .filter(([, members]) => members.some((m) => m.person === personId))
    .map(([workId, members]) => ({ workId, part: members.find((m) => m.person === personId)!.part }));

export const allWork = workModules.flatMap((m) => m.items.map((item) => ({ ...item, module: m.title })));

export type ProfilePost = {
  id: string;
  time: string;
  kind: PostKind | 'Event';
  module?: string;
  workId?: string;
  eventId?: string;
  text: string;
  art?: Art;
};

// The profile owner's own posts, newest first. This is their personal timeline.
export const profilePosts: ProfilePost[] = [
  {
    id: 'p1',
    time: '3d',
    kind: 'New work',
    module: 'My events',
    workId: 'nff1',
    text: 'We sold out the Giant Dome. 248 seats, 11 short films, four awards. Thank you to every filmmaker who trusted us with their work.',
    art: { bg: colors.forest, fg: colors.lime, height: 170, label: 'Giant Dome', image: require('../../assets/images/dome.jpg') },
  },
  {
    id: 'p2',
    time: '5d',
    kind: 'Event',
    eventId: 'curtain',
    text: 'Behind The Curtain, Oct 30 at UC San Diego. Sheer curtains, projections, haze and live music. Tickets are on Nexus, with fair fees and no bots.',
  },
  {
    id: 'p3',
    time: '1w',
    kind: 'Looking for',
    eventId: 'latin-jazz',
    text: 'Building the November lineup for Latin Jazz Night. Horn players, pianists, bassists, percussionists and vocalists: send me your music.',
  },
  {
    id: 'p4',
    time: '1mo',
    kind: 'New work',
    module: 'Live shows',
    workId: 'layers-reimagined',
    text: 'Layers Reimagined, live at Quartyard. Same songs, new arrangements, full band.',
    art: { bg: colors.olive, fg: colors.cream, height: 130, label: 'Show photo' },
  },
  {
    id: 'p5',
    time: '2mo',
    kind: 'New work',
    module: 'Music',
    workId: 'layers',
    text: 'Layers is out. My debut album, plus Layered Visions, the short film that goes with it. Afro-Cuban roots, R&B heart.',
    art: { bg: colors.forest, fg: colors.lime, height: 150, label: 'Album art' },
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
