import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackHeader, Screen } from '../../components/Chrome';
import { Icon } from '../../components/Icon';
import { FairAccessCheck, PriceBreakdown } from '../../components/Tickets';
import { Button, Card, SectionTitle, text } from '../../components/ui';
import { events, profile } from '../../data/content';
import { money, quote, TICKET_LIMIT } from '../../data/fees';
import { useAuth } from '../../lib/auth';
import { useDemo } from '../../state/DemoState';
import { colors, fonts } from '../../theme';

export async function generateStaticParams(): Promise<Record<string, string>[]> {
  return events.filter((e) => e.sale.kind === 'tickets').map((e) => ({ id: e.id }));
}

export default function Checkout() {
  const { id, tier: tierId, qty } = useLocalSearchParams<{ id: string; tier?: string; qty?: string }>();
  const { tickets, buyTickets, showToast } = useDemo();
  const { live } = useAuth();
  const insets = useSafeAreaInsets();
  const [ready, setReady] = useState(false);
  const onChecked = useCallback(() => setReady(true), []);

  const event = events.find((e) => e.id === id);
  if (!event || event.sale.kind !== 'tickets') {
    return (
      <Screen header={<BackHeader label="Events" fallback="/events" />} contentStyle={{ padding: 20 }}>
        <Text style={text.sub}>This event isn’t selling tickets here.</Text>
      </Screen>
    );
  }

  const tier = event.sale.tiers.find((t) => t.id === tierId) ?? event.sale.tiers[0];
  const owned = tickets.filter((t) => t.eventId === event.id).length;
  if (owned >= TICKET_LIMIT) {
    return (
      <Screen header={<BackHeader label={event.title} fallback={`/event/${event.id}`} />} contentStyle={{ padding: 20, gap: 16 }}>
        <Text style={text.sub}>You already have the most tickets one person can hold for this show.</Text>
        <Button variant="big" label="My tickets" onPress={() => router.replace('/tickets')} />
      </Screen>
    );
  }
  // Never trust the link: clamp to what this person may still buy.
  const quantity = Math.max(1, Math.min(Number(qty) || 1, TICKET_LIMIT - owned));
  const total = quote(tier.price, quantity).total;

  const steps = [
    { title: 'Verified member', detail: `${profile.name} · phone and passkey confirmed` },
    { title: 'Real device', detail: 'Checked with Apple App Attest / Google Play Integrity' },
    { title: 'Within the limit', detail: `${owned + quantity} of ${TICKET_LIMIT} tickets for this show` },
    { title: 'Names on tickets', detail: quantity > 1 ? `Yours now, name your ${quantity - 1} guest${quantity > 2 ? 's' : ''} before the show` : 'Issued to you' },
  ];

  const pay = () => {
    buyTickets(event.id, tier, quantity);
    showToast(`You’re in. **${quantity} ticket${quantity > 1 ? 's' : ''}** in your wallet.`);
    router.replace('/tickets');
  };

  return (
    <Screen header={<BackHeader label={event.title} fallback={`/event/${event.id}`} />} contentStyle={[styles.body, { paddingBottom: 32 + insets.bottom }]}>
      <Text style={styles.title} accessibilityRole="header">
        Checkout
      </Text>

      <Card style={styles.panel}>
        <View style={{ gap: 2 }}>
          <Text style={[text.strong, { fontSize: 16 }]}>{event.title}</Text>
          <Text style={text.small}>
            {event.when} · {tier.name}
          </Text>
        </View>
        <PriceBreakdown price={tier.price} quantity={quantity} />
      </Card>

      <Card style={styles.panel}>
        <SectionTitle>Fair-access check</SectionTitle>
        <FairAccessCheck steps={steps} onDone={onChecked} />
      </Card>

      <View style={styles.pay}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Icon name="lock" size={16} color={colors.forest} />
          <Text style={[text.small, { flex: 1 }]}>Apple Pay, Google Pay or card, processed securely by Stripe.</Text>
        </View>
        {live ? (
          <>
            <Button variant="big" label="Payments open soon" style={{ opacity: 0.5 }} />
            <Text style={[text.small, { textAlign: 'center' }]}>Card payments switch on once Stripe is connected. Nothing is charged yet.</Text>
          </>
        ) : (
          <>
            <Button variant="big" label={ready ? `Pay ${money(total)}` : 'Checking…'} onPress={ready ? pay : undefined} style={!ready && { opacity: 0.5 }} />
            <Text style={[text.small, { textAlign: 'center' }]}>Demo only. No card is charged.</Text>
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 16, paddingTop: 4, gap: 16 },
  title: { fontFamily: fonts.display800, fontSize: 30, letterSpacing: -0.8, color: colors.ink },
  panel: { padding: 16, gap: 14 },
  pay: { gap: 12 },
});
