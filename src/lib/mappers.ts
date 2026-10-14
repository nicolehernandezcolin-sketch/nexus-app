// Shapes database rows like the demo's content so the same screens render both.
import { NexusEvent } from '../data/content';
import { colors } from '../theme';
import { EventView } from './api';

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

export type LiveEvent = NexusEvent & { live: EventView };

export function toNexusEvent(e: EventView): LiveEvent {
  const date = e.starts_on ? new Date(`${e.starts_on}T12:00:00`) : null;
  const sale: NexusEvent['sale'] =
    e.sale_kind === 'tickets'
      ? { kind: 'tickets', tiers: e.tiers }
      : e.sale_kind === 'drawing'
        ? { kind: 'drawing', note: 'Enter the drawing before tickets go on sale. Winners get 24 hours to buy at face value.' }
        : { kind: 'free', note: 'Free. RSVP so the host knows who’s coming.' };
  return {
    id: e.slug ?? e.id,
    featured: e.featured,
    month: date ? MONTHS[date.getMonth()] : (e.when_text.split(/[\s·]+/)[0] || 'SOON').toUpperCase().slice(0, 7),
    day: date ? String(date.getDate()) : '•',
    badge: e.badge,
    title: e.title,
    meta: e.where_text,
    when: e.when_text,
    where: e.where_text,
    host: e.hostName,
    about: e.about,
    art: {
      bg: e.featured ? colors.ink : colors.forest,
      fg: colors.lime,
      height: 190,
      label: e.title,
      image: e.coverUrl ? { uri: e.coverUrl } : undefined,
      plain: true,
    },
    sale,
    friends: [],
    friendsText: e.going ? `${e.going} going` : 'Be the first to say you’re going',
    live: e,
  };
}
