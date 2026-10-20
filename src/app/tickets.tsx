import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackHeader, Screen } from '../components/Chrome';
import { Icon } from '../components/Icon';
import { FairPlay, LiveCode } from '../components/Tickets';
import { Button, Card, Rise, Tap, text } from '../components/ui';
import { events, profile } from '../data/content';
import { money } from '../data/fees';
import { fetchMyTickets, orderStatus, useLoad } from '../lib/api';
import { useAuth } from '../lib/auth';
import { toNexusEvent } from '../lib/mappers';
import { Ticket, useDemo } from '../state/DemoState';
import { colors, fonts } from '../theme';

export default function Tickets() {
  const { live } = useAuth();
  return live ? <LiveTickets /> : <DemoTickets />;
}

function DemoTickets() {
  const { tickets, drawings } = useDemo();
  const insets = useSafeAreaInsets();
  // Start with the buyer's own ticket from their latest order open.
  const [openId, setOpenId] = useState<string | null>(() => [...tickets].reverse().find((t) => t.holder === profile.name)?.id ?? null);
  const entered = events.filter((e) => drawings[e.id]);

  return (
    <Screen header={<BackHeader label="Events" fallback="/events" />} contentStyle={[styles.body, { paddingBottom: 32 + insets.bottom }]}>
      <Text style={styles.title} accessibilityRole="header">
        My tickets
      </Text>

      {tickets.length === 0 && entered.length === 0 ? (
        <Card style={styles.empty}>
          <Icon name="ticket" size={32} color={colors.olive} />
          <Text style={[text.strong, { textAlign: 'center' }]}>No tickets yet</Text>
          <Text style={[text.sub, { textAlign: 'center' }]}>Tickets you buy or RSVP for land here, ready to scan at the door.</Text>
          <Button label="Browse events" onPress={() => router.replace('/events')} />
        </Card>
      ) : null}

      {tickets.map((t, i) => (
        <Rise key={t.id} delay={i * 60}>
          <TicketCard ticket={t} open={openId === t.id} onToggle={() => setOpenId(openId === t.id ? null : t.id)} />
        </Rise>
      ))}

      {entered.map((e) => (
        <Card key={e.id} style={styles.drawing}>
          <Icon name="star" size={18} color={colors.forest} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[text.strong, { fontSize: 14.5 }]}>{e.title}</Text>
            <Text style={text.small}>You’re in the drawing · first round</Text>
          </View>
        </Card>
      ))}

      <FairPlay />
    </Screen>
  );
}

function TicketCard({ ticket: t, open, onToggle }: { ticket: Ticket; open: boolean; onToggle: () => void }) {
  const { showToast } = useDemo();
  const event = events.find((e) => e.id === t.eventId);
  if (!event) return null;
  return (
    <TicketView
      month={event.month}
      day={event.day}
      title={event.title}
      line={`${t.tier} · ${money(t.price)}`}
      holder={t.holder}
      codeSeed={t.id}
      open={open}
      onToggle={onToggle}
      onTransfer={() => showToast('Transfers are **free** and go to a verified Nexus member.')}
      onResell={() =>
        showToast(
          t.price > 0
            ? `Resale is capped at what you paid: **${money(t.price)}**. The next fan on the waitlist gets it.`
            : 'Free RSVPs can’t be sold. Release it so someone else can come.',
        )
      }
    />
  );
}

/** A ticket: stub with the event, and when open, the live entry code and actions. */
function TicketView({
  month,
  day,
  title,
  line,
  holder,
  codeSeed,
  open,
  onToggle,
  onTransfer,
  onResell,
}: {
  month: string;
  day: string;
  title: string;
  line: string;
  holder: string;
  codeSeed: string;
  open: boolean;
  onToggle: () => void;
  onTransfer: () => void;
  onResell: () => void;
}) {
  return (
    <View style={styles.ticket}>
      <Tap accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={onToggle} style={styles.ticketTop}>
        <View style={styles.date}>
          <Text style={styles.month}>{month}</Text>
          <Text style={styles.day}>{day}</Text>
        </View>
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={styles.ticketTitle}>{title}</Text>
          <Text style={styles.ticketMeta}>{line}</Text>
          <Text style={styles.ticketMeta}>{holder}</Text>
        </View>
        <Icon name={open ? 'chevron' : 'ticket'} size={20} color={colors.lime} />
      </Tap>

      {/* Perforation between stub and body */}
      <View style={styles.perf}>
        <View style={[styles.notch, { left: -10 }]} />
        <View style={styles.dash} />
        <View style={[styles.notch, { right: -10 }]} />
      </View>

      {open ? (
        <View style={styles.ticketBody}>
          <View style={styles.codePanel}>
            <LiveCode ticketId={codeSeed} />
          </View>
          <View style={styles.actions}>
            <Button variant="lime" label="Transfer" icon={<Icon name="send" size={16} />} style={{ flex: 1, height: 44 }} onPress={onTransfer} />
            <Button
              variant="outlineDark"
              label="Resell"
              icon={<Icon name="tag" size={16} color={colors.cream} />}
              style={{ flex: 1, height: 44 }}
              onPress={onResell}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}

/** Real tickets from the database, and confirmation after returning from Stripe. */
function LiveTickets() {
  const { order, cancelled } = useLocalSearchParams<{ order?: string; cancelled?: string }>();
  const { showToast } = useDemo();
  const insets = useSafeAreaInsets();
  const loaded = useLoad(fetchMyTickets, []);
  const [openId, setOpenId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<'waiting' | 'expired' | null>(order && !cancelled ? 'waiting' : null);

  useEffect(() => {
    if (cancelled) showToast('Payment cancelled. **Nothing was charged.**');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cancelled]);

  // Stripe confirms the payment to our server a moment after you return; check until the tickets land.
  useEffect(() => {
    if (!order || cancelled) return;
    let tries = 0;
    const timer = setInterval(async () => {
      tries++;
      const status = await orderStatus(order).catch(() => null);
      if (status === 'paid') {
        clearInterval(timer);
        setConfirming(null);
        await loaded.reload();
        showToast('You’re in. **Your tickets are here.**');
      } else if (status === 'expired' || tries > 30) {
        clearInterval(timer);
        setConfirming('expired');
      }
    }, 2000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order, cancelled]);

  const rows = loaded.data ?? [];
  const first = rows[0]?.ticket.id ?? null;

  return (
    <Screen header={<BackHeader label="Events" fallback="/events" />} contentStyle={[styles.body, { paddingBottom: 32 + insets.bottom }]}>
      <Text style={styles.title} accessibilityRole="header">
        My tickets
      </Text>

      {confirming === 'waiting' ? (
        <Card style={styles.drawing}>
          <ActivityIndicator color={colors.forest} />
          <Text style={[text.strong, { flex: 1, fontSize: 14 }]}>Confirming your payment with Stripe…</Text>
        </Card>
      ) : null}
      {confirming === 'expired' ? (
        <Card style={styles.drawing}>
          <Icon name="clock" size={18} color={colors.forest} />
          <Text style={[text.sub, { flex: 1 }]}>We haven’t heard from Stripe yet. If you were charged, your tickets will appear here shortly.</Text>
        </Card>
      ) : null}

      {loaded.loading && !loaded.data ? <ActivityIndicator color={colors.forest} /> : null}
      {loaded.data && rows.length === 0 && !confirming ? (
        <Card style={styles.empty}>
          <Icon name="ticket" size={32} color={colors.olive} />
          <Text style={[text.strong, { textAlign: 'center' }]}>No tickets yet</Text>
          <Text style={[text.sub, { textAlign: 'center' }]}>Tickets you buy land here, ready to scan at the door.</Text>
          <Button label="Browse events" onPress={() => router.replace('/events')} />
        </Card>
      ) : null}

      {rows.map(({ ticket: t, event }, i) => {
        const e = event ? toNexusEvent(event) : null;
        const isOpen = (openId ?? first) === t.id;
        return (
          <Rise key={t.id} delay={i * 60}>
            <TicketView
              month={e?.month ?? ''}
              day={e?.day ?? ''}
              title={e?.title ?? 'Event'}
              line={`${t.tier_name} · ${money(t.price_cents / 100)}${t.status !== 'valid' ? ` · ${t.status}` : ''}`}
              holder={t.holder_name}
              codeSeed={t.code_secret}
              open={isOpen}
              onToggle={() => setOpenId(isOpen ? '' : t.id)}
              onTransfer={() => showToast('Free transfers to another member are coming next.')}
              onResell={() => showToast(`Face-value resale (up to **${money(t.price_cents / 100)}**) is coming next.`)}
            />
          </Rise>
        );
      })}

      <FairPlay />
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 16, paddingTop: 4, gap: 14 },
  title: { fontFamily: fonts.display800, fontSize: 30, letterSpacing: -0.8, color: colors.ink },
  empty: { padding: 24, gap: 10, alignItems: 'center' },
  drawing: { padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  ticket: { backgroundColor: colors.forest, borderRadius: 22, overflow: 'hidden' },
  ticketTop: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  date: { width: 56, height: 60, borderRadius: 14, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center', gap: 3 },
  month: { fontFamily: fonts.display700, fontSize: 10, letterSpacing: 1, color: colors.ink },
  day: { fontFamily: fonts.display800, fontSize: 20, lineHeight: 20, color: colors.ink },
  ticketTitle: { fontFamily: fonts.display700, fontSize: 17, lineHeight: 20, color: colors.cream },
  ticketMeta: { fontFamily: fonts.body400, fontSize: 12.5, color: colors.creamMuted },
  perf: { height: 20, justifyContent: 'center' },
  notch: { position: 'absolute', width: 20, height: 20, borderRadius: 10, backgroundColor: colors.cream },
  dash: { marginHorizontal: 18, borderTopWidth: 2, borderStyle: 'dashed', borderColor: colors.forest2 },
  ticketBody: { padding: 16, paddingTop: 4, gap: 16 },
  codePanel: { backgroundColor: colors.cream, borderRadius: 18, paddingVertical: 16, paddingHorizontal: 12 },
  actions: { flexDirection: 'row', gap: 8 },
});
