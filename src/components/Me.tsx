// "You", in either mode: the signed-in member, or the demo profile.
import { profile } from '../data/content';
import { colorFor, firstNameOf, initialsOf } from '../lib/format';
import { useAuth } from '../lib/auth';
import { colors } from '../theme';
import { Avatar } from './ui';

export function useMe() {
  const { live, me, myAvatarUrl } = useAuth();
  if (live && me) {
    return {
      id: me.id,
      name: me.name || 'You',
      firstName: firstNameOf(me.name),
      initials: initialsOf(me.name),
      photo: myAvatarUrl ? { uri: myAvatarUrl } : undefined,
      color: colorFor(me.id),
    };
  }
  return { id: 'nicole', name: profile.name, firstName: profile.firstName, initials: profile.initials, photo: profile.photo, color: colors.lime };
}

export function MeAvatar({ size = 38, ring }: { size?: number; ring?: string }) {
  const me = useMe();
  const light = me.color === colors.lime;
  return <Avatar initials={me.initials} photo={me.photo} bg={me.color} fg={light ? colors.ink : colors.cream} size={size} ring={ring} />;
}
