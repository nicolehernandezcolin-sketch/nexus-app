import Svg, { Circle, Path, Rect } from 'react-native-svg';

export type IconName =
  | 'timeline'
  | 'discover'
  | 'events'
  | 'profile'
  | 'globe'
  | 'shield'
  | 'check'
  | 'chat'
  | 'clock'
  | 'gear'
  | 'back'
  | 'star'
  | 'chevron'
  | 'up'
  | 'down'
  | 'eye'
  | 'eyeOff'
  | 'pin'
  | 'grid'
  | 'ticket'
  | 'lock'
  | 'fingerprint'
  | 'refresh'
  | 'send'
  | 'tag'
  | 'link'
  | 'users'
  | 'plus'
  | 'image'
  | 'close'
  | 'sparkle'
  | 'pencil';

type Props = { name: IconName; size?: number; color?: string; strokeWidth?: number };

export function Icon({ name, size = 22, color = '#1F201C', strokeWidth = 2 }: Props) {
  const p = { stroke: color, strokeWidth, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      {paths(name, p)}
    </Svg>
  );
}

function paths(name: IconName, p: object) {
  switch (name) {
    case 'timeline':
      return <Path {...p} d="M4 6h16M4 12h16M4 18h10" />;
    case 'discover':
      return (
        <>
          <Circle {...p} cx="11" cy="11" r="7" />
          <Path {...p} d="M20 20l-4-4" />
        </>
      );
    case 'events':
      return (
        <>
          <Rect {...p} x="3" y="5" width="18" height="16" rx="3" />
          <Path {...p} d="M3 10h18M8 3v4M16 3v4" />
        </>
      );
    case 'profile':
      return (
        <>
          <Circle {...p} cx="12" cy="8" r="4" />
          <Path {...p} d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
        </>
      );
    case 'globe':
      return (
        <>
          <Circle {...p} cx="12" cy="12" r="9" />
          <Path {...p} d="M12 3c-2.8 2.6-4 5.6-4 9s1.2 6.4 4 9c2.8-2.6 4-5.6 4-9s-1.2-6.4-4-9zM3.4 9h17.2M3.4 15h17.2" />
        </>
      );
    case 'shield':
      return <Path {...p} d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6l8-3zM9 12l2 2 4-4" />;
    case 'check':
      return <Path {...p} d="M5 12l5 5 9-10" />;
    case 'chat':
      return <Path {...p} d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />;
    case 'clock':
      return (
        <>
          <Circle {...p} cx="12" cy="12" r="9" />
          <Path {...p} d="M12 7v5l3 2" />
        </>
      );
    case 'gear':
      return (
        <>
          <Circle {...p} cx="12" cy="12" r="3" />
          <Path {...p} d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
        </>
      );
    case 'back':
      return <Path {...p} d="M15 18l-6-6 6-6" />;
    case 'chevron':
      return <Path {...p} d="M6 9l6 6 6-6" />;
    case 'up':
      return <Path {...p} d="M12 19V5M6 11l6-6 6 6" />;
    case 'down':
      return <Path {...p} d="M12 5v14M6 13l6 6 6-6" />;
    case 'eye':
      return (
        <>
          <Path {...p} d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
          <Circle {...p} cx="12" cy="12" r="3" />
        </>
      );
    case 'eyeOff':
      return <Path {...p} d="M3 3l18 18M10.6 5.1A10.4 10.4 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4M6.6 6.6A17 17 0 0 0 2 12s3.6 7 10 7a9.7 9.7 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2" />;
    case 'pin':
      return <Path {...p} d="M9 3h6l-1 6 4 3v2H6v-2l4-3-1-6zM12 14v7" />;
    case 'grid':
      return <Path {...p} d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" />;
    case 'ticket':
      return <Path {...p} d="M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4V8zM14 6v12" />;
    case 'lock':
      return (
        <>
          <Rect {...p} x="4" y="11" width="16" height="10" rx="2" />
          <Path {...p} d="M8 11V7a4 4 0 0 1 8 0v4" />
        </>
      );
    case 'fingerprint':
      return <Path {...p} d="M12 11v3a8 8 0 0 1-1.5 4.7M8 9.5A4 4 0 0 1 16 10v2.5M5.2 15a11 11 0 0 0 .8-4 6 6 0 0 1 9-5.2M19 11a7 7 0 0 1-.8 6M15.5 15.5a10 10 0 0 1-1.6 4" />;
    case 'refresh':
      return <Path {...p} d="M20 11a8 8 0 0 0-14.3-4.9L4 8M4 4v4h4M4 13a8 8 0 0 0 14.3 4.9L20 16M20 20v-4h-4" />;
    case 'send':
      return <Path {...p} d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />;
    case 'tag':
      return (
        <>
          <Path {...p} d="M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z" />
          <Circle {...p} cx="7.5" cy="7.5" r="1.5" />
        </>
      );
    case 'link':
      return <Path {...p} d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />;
    case 'users':
      return (
        <>
          <Circle {...p} cx="9" cy="8" r="4" />
          <Path {...p} d="M2 21c1-4 4-6 7-6s6 2 7 6M16 4a4 4 0 0 1 0 8M18 15c2 1 3.5 3 4 6" />
        </>
      );
    case 'plus':
      return <Path {...p} d="M12 5v14M5 12h14" />;
    case 'image':
      return (
        <>
          <Rect {...p} x="3" y="4" width="18" height="16" rx="3" />
          <Circle {...p} cx="9" cy="10" r="2" />
          <Path {...p} d="M21 16l-5-5-9 9" />
        </>
      );
    case 'close':
      return <Path {...p} d="M6 6l12 12M18 6L6 18" />;
    case 'sparkle':
      return <Path {...p} d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z" />;
    case 'pencil':
      return <Path {...p} d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4zM13.5 6.5l4 4" />;
    case 'star':
      return <Path {...p} d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z" />;
  }
}
