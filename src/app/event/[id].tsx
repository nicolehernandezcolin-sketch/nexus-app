import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackHeader, Screen } from '../../components/Chrome';
import { TeamList } from '../../components/Team';
import { Icon, IconName } from '../../components/Icon';
import { FairPlay, PriceBreakdown, QuantityStepper } from '../../components/Tickets';
import { ArtBlock, Avatar, Button, Card, Pill, Rise, SectionTitle, Tap, text } from '../../components/ui';
import { events, NexusEvent, TicketTier } from '../../data/content';
import { money, TICKET_LIMIT } from '../../data/fees';
import { useDemo } from '../../state/DemoState';
import { colors, fonts } from '../../theme';

export async function generateStaticParams(): Promise<Record<string, string>[]> {
  return events.map((e) => ({ id: e.id }));
}

export default function EventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const event = events.find((e) => e.id === id);
  if (!event) return <NotFound />;
  return <EventDetail event={event} />;
}

function EventDetail({ event: e }: { event: NexusEvent }) {
  const insets = useSafeAreaInsets();
  return (
    <Screen header={<BackHeader label="Back" fallback="/events" />} contentStyle={[styles.body, { paddingBottom: 32 + insets.bottom }]}>
      <Rise>
        <ArtBlock art={e.art} radius={22} height={200} />
      </Rise>

      <View style={{ gap: 8 }}>
        <Pill label={e.badge} bg={colors.limeSoft} fg={colors.forest} />
        <Text style={styles.title} accessibilityRole="header">
          {e.title}
        </Text>
        <Fact icon="events" text={e.when} />
        <Fact icon="discover" text={e.where} />
        <Fact icon="users" text={`Hosted by ${e.host}`} />
      </View>

      <Text style={text.body}>{e.about}</Text>

      <View style={styles.friends}>
        <View style={{ flexDirection: 'row' }}>
          {e.friends.map((f, j) => (
            <View key={f} style={{ marginLeft: j ? -8 : 0 }}>
              <Avatar initials={f} size={30} bg={[colors.olive, colors.forest, colors.lime][j % 3]} fg={j % 3 === 2 ? colors.ink : colors.cream} ring={colors.cream} />
            </View>
          ))}
        </View>
        <Text style={text.small}>{e.friendsText}</Text>
      </View>

      <TeamList workId={e.id} title="Who’s putting it on" />

      {e.sale.kind === 'tickets' ? <TicketPicker event={e} tiers={e.sale.tiers} /> : null}
      {e.sale.kind === 'free' ? <FreeRsvp event={e} note={e.sale.note} /> : null}
      {e.sale.kind === 'drawing' ? <Drawing event={e} note={e.sale.note} /> : null}

      <FairPlay />
      <Text style={[text.small, { textAlign: 'center' }]}>Demo prices. No card is charged.</Text>
    </Screen>
  );
}

function Fact({ icon, text: t }: { icon: IconName; text: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Icon name={icon} size={16} color={colors.olive} strokeWidth={2.2} />
      <Text style={[text.sub, { flex: 1 }]}>{t}</Text>
    </View>
  );
}

function TicketPicker({ event: e, tiers }: { event: NexusEvent; tiers: TicketTier[] }) {
  const { tickets } = useDemo();
  const [tierId, setTierId] = useState(tiers[0].id);
  const [quantity, setQuantity] = useState(1);
  const tier = tiers.find((t) => t.id === tierId) ?? tiers[0];
  const owned = tickets.filter((t) => t.eventId === e.id).length;
  const remaining = TICKET_LIMIT - owned;

  return (
    <Card style={styles.panel}>
      <SectionTitle>Tickets</SectionTitle>
      <View style={{ gap: 8 }}>
        {tiers.map((t) => {
          const on = t.id === tierId;
          return (
            <Tap
              key={t.id}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              onPress={() => setTierId(t.id)}
              style={[styles.tier, on && { borderColor: colors.forest, backgroundColor: colors.limeSoft }]}
            >
              <View style={[styles.radio, on && { borderColor: colors.forest }]}>{on ? <View style={styles.radioDot} /> : null}</View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[text.strong, { fontSize: 14.5 }]}>{t.name}</Text>
                {t.note ? <Text style={text.small}>{t.note}</Text> : null}
              </View>
              <Text style={[text.strong, { fontSize: 15 }]}>{money(t.price)}</Text>
            </Tap>
          );
        })}
      </View>

      {remaining > 0 ? (
        <>
          <View style={styles.qtyRow}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[text.strong, { fontSize: 14.5 }]}>How many?</Text>
              <Text style={text.small}>
                Up to {TICKET_LIMIT} per person{owned ? ` · you have ${owned}` : ''}
              </Text>
            </View>
            <QuantityStepper value={Math.min(quantity, remaining)} max={remaining} onChange={setQuantity} />
          </View>
          <PriceBreakdown price={tier.price} quantity={Math.min(quantity, remaining)} />
          <Button
            variant="big"
            label="Continue"
            onPress={() =>
              router.push({ pathname: '/checkout/[id]', params: { id: e.id, tier: tier.id, qty: String(Math.min(quantity, remaining)) } })
            }
          />
        </>
      ) : (
        <View style={styles.limit}>
          <Icon name="lock" size={18} color={colors.forest} />
          <Text style={[text.small, { flex: 1, color: colors.forest }]}>You have the most tickets one person can hold for this show.</Text>
          <Button variant="ghost" label="My tickets" style={{ height: 38 }} onPress={() => router.push('/tickets')} />
        </View>
      )}
    </Card>
  );
}

function FreeRsvp({ event: e, note }: { event: NexusEvent; note: string }) {
  const { tickets, buyTickets, showToast } = useDemo();
  const going = tickets.some((t) => t.eventId === e.id);
  return (
    <Card style={styles.panel}>
      <SectionTitle>Free entry</SectionTitle>
      <Text style={text.sub}>{note}</Text>
      {going ? (
        <Button variant="lime" label="You’re on the list · view ticket" onPress={() => router.push('/tickets')} />
      ) : (
        <Button
          variant="big"
          label="RSVP"
          onPress={() => {
            buyTickets(e.id, { id: 'rsvp', name: 'Free RSVP', price: 0 }, 1);
            showToast('You’re on the list. See you **in person**.');
          }}
        />
      )}
      <Text style={text.small}>Free events have no fees. RSVPs still go to verified members, one per person.</Text>
    </Card>
  );
}

function Drawing({ event: e, note }: { event: NexusEvent; note: string }) {
  const { drawings, enterDrawing, showToast } = useDemo();
  const entered = !!drawings[e.id];
  const steps = ['Enter before sales open. It doesn’t matter how fast.', 'One entry per verified person, equal odds. People who came to past Nexus events are drawn first.', 'Winners get a 24-hour window to buy at face value.'];
  return (
    <Card style={styles.panel}>
      <SectionTitle>Fair drawing</SectionTitle>
      <Text style={text.sub}>{note}</Text>
      <View style={{ gap: 8 }}>
        {steps.map((s, i) => (
          <View key={s} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
            <View style={styles.stepNum}>
              <Text style={styles.stepNumText}>{i + 1}</Text>
            </View>
            <Text style={[text.body, { flex: 1, fontSize: 14 }]}>{s}</Text>
          </View>
        ))}
      </View>
      <View style={styles.priority}>
        <Icon name="star" size={16} color={colors.forest} />
        <Text style={[text.small, { flex: 1, color: colors.forest }]}>You checked in at the 1st Edition, so you’re in the first round.</Text>
      </View>
      {entered ? (
        <View style={[styles.limit, { backgroundColor: colors.lime }]}>
          <Icon name="check" size={18} strokeWidth={2.6} />
          <Text style={[text.strong, { flex: 1, fontSize: 14 }]}>You’re in the drawing. We’ll notify you here.</Text>
        </View>
      ) : (
        <Button
          variant="big"
          label="Enter the drawing"
          onPress={() => {
            enterDrawing(e.id);
            showToast('You’re in the drawing. **Good luck.**');
          }}
        />
      )}
    </Card>
  );
}

function NotFound() {
  return (
    <Screen header={<BackHeader label="Back" fallback="/events" />} contentStyle={{ padding: 20 }}>
      <Text style={text.sub}>We couldn’t find that event.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 16, paddingTop: 4, gap: 18 },
  title: { fontFamily: fonts.display800, fontSize: 28, lineHeight: 31, letterSpacing: -0.6, color: colors.ink },
  friends: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  panel: { padding: 16, gap: 14 },
  tier: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.line,
  },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.line2, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.forest },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  limit: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.limeSoft, borderRadius: 14, padding: 12 },
  stepNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.forest, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { fontFamily: fonts.display800, fontSize: 12, color: colors.lime },
  priority: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.limeSoft, borderRadius: 14, padding: 12 },
});
