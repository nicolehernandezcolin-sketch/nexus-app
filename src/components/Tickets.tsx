// Ticketing building blocks: fee breakdown, quantity stepper, fair-play rules,
// the fair-access check at checkout, and the live code on each ticket.
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Rect } from "react-native-svg";
import {
  CODE_REFRESH_SECONDS,
  money,
  NEXUS_FEE,
  quote,
  TICKET_LIMIT,
} from "../data/fees";
import { useAuth } from "../lib/auth";
import { colors, fonts } from "../theme";
import { Icon, IconName } from "./Icon";
import { Tap, text } from "./ui";

const nativeDriver = Platform.OS !== "web";

export function PriceBreakdown({
  price,
  quantity,
}: {
  price: number;
  quantity: number;
}) {
  const { live } = useAuth();
  const q = quote(price, quantity);
  return (
    <View style={{ gap: 10 }}>
      <Row label={`${quantity} × ${money(price)}`} value={money(q.subtotal)} />
      <Row
        label="Nexus fee"
        hint={`${(NEXUS_FEE.percent * 100).toFixed(0)}% + $${NEXUS_FEE.fixed.toFixed(2)} per ticket, card processing included`}
        value={money(q.fees)}
      />
      <View style={styles.rule} />
      <Row label="Total" value={money(q.total)} strong />
      {/* The competitor comparison stays in the demo until its numbers are checked against current pricing. */}
      {!live && q.savings > 0 ? (
        <View style={styles.savings}>
          <Icon name="tag" size={16} color={colors.forest} />
          <Text style={styles.savingsText}>
            Eventbrite’s fee would be {money(q.eventbriteFees)}. You save{" "}
            <Text style={{ fontFamily: fonts.body600 }}>
              {money(q.savings)}
            </Text>
            .
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function Row({
  label,
  value,
  hint,
  strong,
}: {
  label: string;
  value: string;
  hint?: string;
  strong?: boolean;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={strong ? styles.totalText : text.body}>{label}</Text>
        {hint ? <Text style={text.small}>{hint}</Text> : null}
      </View>
      <Text
        style={
          strong ? styles.totalText : [text.body, { fontFamily: fonts.body600 }]
        }
      >
        {value}
      </Text>
    </View>
  );
}

export function QuantityStepper({
  value,
  max,
  onChange,
}: {
  value: number;
  max: number;
  onChange: (n: number) => void;
}) {
  return (
    <View style={styles.stepper}>
      <StepButton
        icon="−"
        label="One fewer ticket"
        disabled={value <= 1}
        onPress={() => onChange(value - 1)}
      />
      <Text style={styles.stepValue} accessibilityLiveRegion="polite">
        {value}
      </Text>
      <StepButton
        icon="+"
        label="One more ticket"
        disabled={value >= max}
        onPress={() => onChange(value + 1)}
      />
    </View>
  );
}

function StepButton({
  icon,
  label,
  disabled,
  onPress,
}: {
  icon: string;
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Tap
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.stepBtn, disabled && { opacity: 0.35 }]}
    >
      <Text style={styles.stepIcon}>{icon}</Text>
    </Tap>
  );
}

const rules: { icon: IconName; title: string; detail: string }[] = [
  {
    icon: "fingerprint",
    title: "Real people only",
    detail:
      "Buyers are verified members: one phone number, a passkey, and a real device. Bot farms can’t make accounts fast enough to matter.",
  },
  {
    icon: "users",
    title: `Up to ${TICKET_LIMIT} per person`,
    detail:
      "Limits follow the person, their payment card and their device, not just the account.",
  },
  {
    icon: "ticket",
    title: "Names on every ticket",
    detail:
      "Each ticket belongs to a named member. Guests get theirs when you name them.",
  },
  {
    icon: "refresh",
    title: "Live codes",
    detail: `The entry code changes every ${CODE_REFRESH_SECONDS} seconds inside the app, so screenshots and copied tickets don’t scan.`,
  },
  {
    icon: "tag",
    title: "Resale at face value",
    detail:
      "Can’t go? Transfer free to a friend or sell back through Nexus for what you paid. No markups.",
  },
  {
    icon: "lock",
    title: "Fair drawings for big shows",
    detail:
      "When demand outruns seats, everyone who enters gets an equal shot. Speed doesn’t win, so bots don’t either.",
  },
];

// What the live app enforces today. Nothing here may promise more than the server checks.
const liveRules: { icon: IconName; title: string; detail: string }[] = [
  {
    icon: "users",
    title: `Up to ${TICKET_LIMIT} per person`,
    detail:
      "Checked on our server for every order, so bulk buyers can’t sweep a show.",
  },
  {
    icon: "ticket",
    title: "Each ticket gets in once",
    detail:
      "Every ticket has its own door code. Once it’s checked in, a copy or screenshot can’t get a second person in.",
  },
  {
    icon: "tag",
    title: "All-in prices",
    detail:
      "The price you see includes the Nexus fee. No surprise charges at checkout.",
  },
  {
    icon: "lock",
    title: "Card details stay with Stripe",
    detail:
      "You pay on Stripe’s secure page. Nexus never sees or stores your card.",
  },
];

/** Expandable explainer of the anti-scalping rules. */
export function FairPlay({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const { live } = useAuth();
  const shown = live ? liveRules : rules;
  const [open, setOpen] = useState(defaultOpen);
  const spin = useRef(new Animated.Value(open ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(spin, {
      toValue: open ? 1 : 0,
      duration: 200,
      useNativeDriver: nativeDriver,
    }).start();
  }, [open, spin]);

  return (
    <View style={styles.fair}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(!open)}
        style={styles.fairHead}
      >
        <Icon name="shield" size={22} color={colors.lime} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.fairTitle}>Fair tickets, no scalpers</Text>
          <Text style={styles.fairSub}>
            How Nexus keeps bots and resellers out
          </Text>
        </View>
        <Animated.View
          style={{
            transform: [
              {
                rotate: spin.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0deg", "180deg"],
                }),
              },
            ],
          }}
        >
          <Icon
            name="chevron"
            size={20}
            color={colors.lime}
            strokeWidth={2.2}
          />
        </Animated.View>
      </Pressable>
      {open
        ? shown.map((r) => (
            <View key={r.title} style={styles.rule2}>
              <View style={styles.ruleIcon}>
                <Icon
                  name={r.icon}
                  size={16}
                  color={colors.ink}
                  strokeWidth={2.2}
                />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.ruleTitle}>{r.title}</Text>
                <Text style={styles.ruleText}>{r.detail}</Text>
              </View>
            </View>
          ))
        : null}
    </View>
  );
}

/** Checks that tick off one by one before payment unlocks. */
export function FairAccessCheck({
  steps,
  onDone,
}: {
  steps: { title: string; detail: string }[];
  onDone: () => void;
}) {
  const [done, setDone] = useState(0);
  useEffect(() => {
    if (done >= steps.length) {
      onDone();
      return;
    }
    const t = setTimeout(() => setDone((d) => d + 1), 550);
    return () => clearTimeout(t);
  }, [done, steps.length, onDone]);

  return (
    <View style={{ gap: 10 }}>
      {steps.map((s, i) => {
        const ok = i < done;
        const active = i === done;
        return (
          <View
            key={s.title}
            style={[styles.check, { opacity: ok || active ? 1 : 0.4 }]}
          >
            <View
              style={[
                styles.checkDot,
                ok && {
                  backgroundColor: colors.lime,
                  borderColor: colors.lime,
                },
              ]}
            >
              {ok ? <Icon name="check" size={14} strokeWidth={2.8} /> : null}
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[text.strong, { fontSize: 14 }]}>{s.title}</Text>
              <Text style={text.small}>{active ? "Checking…" : s.detail}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

/* ---------- Door code (live tickets) ---------- */

/** The ticket's door code, big and spaced so it reads easily, with the holder's name. */
export function DoorCode({
  code,
  holder,
  status,
}: {
  code: string;
  holder: string;
  status: "valid" | "used" | "refunded";
}) {
  const spoken = code.split("").join(" ");
  return (
    <View
      style={{ alignItems: "center", gap: 8 }}
      accessible
      accessibilityLabel={`Door code ${spoken}, for ${holder}`}
    >
      <Text style={text.small}>Show this at the door</Text>
      <Text style={styles.doorCode} selectable>
        {code.slice(0, 3)} {code.slice(3)}
      </Text>
      <Text style={[text.strong, { fontSize: 14 }]}>{holder}</Text>
      <Text style={[text.small, { textAlign: "center" }]}>
        {status === "used"
          ? "Checked in. This ticket has been used."
          : status === "refunded"
            ? "Refunded. This ticket no longer gets in."
            : "Each ticket gets in once. Share the code only with the guest it’s for."}
      </Text>
    </View>
  );
}

/* ---------- Live code ---------- */

const GRID = 21;

// Small deterministic generator so the same ticket and time window always draw the same code.
function rng(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++)
    h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

function inFinder(x: number, y: number) {
  const corner = (cx: number, cy: number) =>
    x >= cx && x < cx + 7 && y >= cy && y < cy + 7;
  return corner(0, 0) || corner(GRID - 7, 0) || corner(0, GRID - 7);
}

function finderCell(x: number, y: number) {
  const lx = x % (GRID - 7) === x ? x : x - (GRID - 7);
  const ly = y % (GRID - 7) === y ? y : y - (GRID - 7);
  const edge = lx === 0 || ly === 0 || lx === 6 || ly === 6;
  const core = lx >= 2 && lx <= 4 && ly >= 2 && ly <= 4;
  return edge || core;
}

/**
 * A ticket code that redraws every CODE_REFRESH_SECONDS. In the real app each
 * code is a short-lived token signed by the server, so a screenshot stops
 * working within seconds. Here it is drawn locally for the demo.
 */
export function LiveCode({
  ticketId,
  size = 168,
}: {
  ticketId: string;
  size?: number;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

  const windowMs = CODE_REFRESH_SECONDS * 1000;
  const slot = Math.floor(now / windowMs);
  const left = 1 - (now % windowMs) / windowMs;
  const next = rng(`${ticketId}:${slot}`);
  const cell = size / GRID;

  const cells: { x: number; y: number }[] = [];
  for (let y = 0; y < GRID; y++)
    for (let x = 0; x < GRID; x++) {
      const on = inFinder(x, y) ? finderCell(x, y) : next() > 0.52;
      if (on) cells.push({ x, y });
    }

  return (
    <View style={{ alignItems: "center", gap: 10 }}>
      <View style={styles.codeFrame}>
        <Svg
          width={size}
          height={size}
          accessibilityLabel="Live entry code"
          role="img"
        >
          {cells.map((c) => (
            <Rect
              key={`${c.x}-${c.y}`}
              x={c.x * cell}
              y={c.y * cell}
              width={cell + 0.3}
              height={cell + 0.3}
              fill={colors.ink}
            />
          ))}
        </Svg>
      </View>
      <View style={styles.timer}>
        <View style={[styles.timerFill, { width: `${left * 100}%` }]} />
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <Icon
          name="refresh"
          size={14}
          color={colors.forest}
          strokeWidth={2.2}
        />
        <Text style={text.small}>
          New code in {Math.ceil(left * CODE_REFRESH_SECONDS)}s · screenshots
          won’t scan
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rule: { height: 1, backgroundColor: colors.line },
  totalText: { fontFamily: fonts.display800, fontSize: 18, color: colors.ink },
  savings: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.limeSoft,
    borderRadius: 14,
    padding: 12,
  },
  savingsText: {
    flex: 1,
    fontFamily: fonts.body400,
    fontSize: 13,
    lineHeight: 18,
    color: colors.forest,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.stone,
    borderRadius: 999,
    padding: 4,
  },
  stepBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.paper,
    alignItems: "center",
    justifyContent: "center",
  },
  stepIcon: {
    fontFamily: fonts.display700,
    fontSize: 20,
    color: colors.forest,
    lineHeight: 22,
  },
  stepValue: {
    minWidth: 28,
    textAlign: "center",
    fontFamily: fonts.display800,
    fontSize: 18,
    color: colors.ink,
  },
  fair: { backgroundColor: colors.ink, borderRadius: 22, padding: 16, gap: 14 },
  fairHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 44,
  },
  fairTitle: { fontFamily: fonts.display800, fontSize: 17, color: colors.lime },
  fairSub: {
    fontFamily: fonts.body400,
    fontSize: 12.5,
    color: colors.creamMuted,
  },
  rule2: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  ruleIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.lime,
    alignItems: "center",
    justifyContent: "center",
  },
  ruleTitle: { fontFamily: fonts.body600, fontSize: 14, color: colors.cream },
  ruleText: {
    fontFamily: fonts.body400,
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.creamMuted,
  },
  check: { flexDirection: "row", gap: 12, alignItems: "center" },
  checkDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: colors.line2,
    alignItems: "center",
    justifyContent: "center",
  },
  codeFrame: { backgroundColor: colors.paper, padding: 12, borderRadius: 18 },
  doorCode: {
    fontFamily: fonts.display900,
    fontSize: 40,
    letterSpacing: 4,
    color: colors.ink,
  },
  timer: {
    width: 168,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.stone,
    overflow: "hidden",
  },
  timerFill: { height: 6, backgroundColor: colors.olive },
});
