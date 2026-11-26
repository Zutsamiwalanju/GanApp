import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fmtDistance } from '../geo';
import type { PingView } from '../store';
import { C, catMeta, R } from '../theme';
import { fmtLeft, fmtUntil } from '../time';

/* ---------- layout ---------- */

export function Screen({
  children,
  scroll = true,
  footer,
  style,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  footer?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {scroll ? (
        <ScrollView contentContainerStyle={[s.pad, style]} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={[s.pad, { flex: 1 }, style]}>{children}</View>
      )}
      {footer ? <View style={s.footer}>{footer}</View> : null}
    </SafeAreaView>
  );
}

export function BackButton({ onPress }: { onPress?: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Back"
      onPress={onPress ?? (() => (router.canGoBack() ? router.back() : router.replace('/')))}
      style={s.round}
      hitSlop={8}
    >
      <Ionicons name="arrow-back" size={20} color={C.dark} />
    </Pressable>
  );
}

export function IconButton({ name, onPress, label, active }: { name: any; onPress: () => void; label: string; active?: boolean }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={s.round} hitSlop={8}>
      <Ionicons name={name} size={20} color={active ? C.primary : C.dark} />
    </Pressable>
  );
}

/* ---------- text ---------- */

export const Eyebrow = ({ children, color = C.primary }: { children: React.ReactNode; color?: string }) => (
  <Text style={[s.eyebrow, { color }]}>{children}</Text>
);
export const H1 = ({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) => (
  <Text style={[s.h1, style]}>{children}</Text>
);
export const H2 = ({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) => (
  <Text style={[s.h2, style]}>{children}</Text>
);
export const Body = ({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) => (
  <Text style={[s.body, style]}>{children}</Text>
);
export const Label = ({ children }: { children: React.ReactNode }) => <Text style={s.label}>{children}</Text>;

/* ---------- controls ---------- */

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  icon,
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'ghost' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  icon?: any;
  style?: StyleProp<ViewStyle>;
}) {
  const bg = variant === 'primary' ? C.primary : variant === 'danger' ? C.danger : variant === 'outline' ? C.white : 'transparent';
  const fg = variant === 'primary' || variant === 'danger' ? C.white : C.primary;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        s.btn,
        { backgroundColor: bg, opacity: disabled ? 0.45 : pressed ? 0.85 : 1 },
        variant === 'outline' && { borderWidth: 1, borderColor: C.line },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={s.row}>
          {icon ? <Ionicons name={icon} size={18} color={fg} style={{ marginRight: 8 }} /> : null}
          <Text style={[s.btnText, { color: fg }]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  style,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[s.chip, selected ? s.chipOn : s.chipOff, style]}
    >
      <Text style={[s.chipText, { color: selected ? C.white : C.dark }]}>{label}</Text>
    </Pressable>
  );
}

/** A row of chips where exactly one is selected. */
export function ChipGroup<T extends string | number>({
  options,
  value,
  onChange,
  label = (v: T) => String(v),
}: {
  options: T[];
  value: T;
  onChange: (v: T) => void;
  label?: (v: T) => string;
}) {
  return (
    <View style={s.chipRow}>
      {options.map((o) => (
        <Chip key={String(o)} label={label(o)} selected={o === value} onPress={() => onChange(o)} style={{ flex: 1 }} />
      ))}
    </View>
  );
}

export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Label>{label}</Label>
      <TextInput placeholderTextColor="#9AA9A6" {...props} style={[s.input, props.multiline && { minHeight: 84, textAlignVertical: 'top' }, props.style]} />
    </View>
  );
}

export function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <Pressable accessibilityRole="switch" accessibilityState={{ checked: value }} onPress={() => onChange(!value)} style={s.toggleRow}>
      <Text style={s.toggleLabel}>{label}</Text>
      <View style={[s.track, { backgroundColor: value ? C.primary : '#C9D3D1' }]}>
        <View style={[s.knob, { alignSelf: value ? 'flex-end' : 'flex-start' }]} />
      </View>
    </Pressable>
  );
}

/** A value with − and + buttons (used for times, so no extra date-picker library is needed). */
export function Stepper({ label, value, onMinus, onPlus }: { label: string; value: string; onMinus: () => void; onPlus: () => void }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Label>{label}</Label>
      <View style={[s.input, s.row, { justifyContent: 'space-between', paddingVertical: 6 }]}>
        <Pressable accessibilityLabel={`Decrease ${label}`} onPress={onMinus} style={s.stepBtn} hitSlop={6}>
          <Ionicons name="remove" size={18} color={C.primary} />
        </Pressable>
        <Text style={s.stepValue}>{value}</Text>
        <Pressable accessibilityLabel={`Increase ${label}`} onPress={onPlus} style={s.stepBtn} hitSlop={6}>
          <Ionicons name="add" size={18} color={C.primary} />
        </Pressable>
      </View>
    </View>
  );
}

/* ---------- display ---------- */

export function Badge({ text, tone = 'mint' }: { text: string; tone?: 'mint' | 'gold' | 'live' | 'grey' }) {
  const map = {
    mint: { bg: C.mint, fg: C.primary },
    gold: { bg: C.gold, fg: C.goldText },
    live: { bg: C.coral, fg: C.white },
    grey: { bg: '#EEF2F1', fg: C.muted },
  }[tone];
  return (
    <View style={[s.badge, { backgroundColor: map.bg }]}>
      <Text style={[s.badgeText, { color: map.fg }]}>{text}</Text>
    </View>
  );
}

export function Photo({ ping, style, rounded = 16 }: { ping: { photoUrl: string | null; category: string }; style?: StyleProp<ViewStyle>; rounded?: number }) {
  const meta = catMeta(ping.category);
  if (ping.photoUrl) {
    return <Image source={{ uri: ping.photoUrl }} style={[{ borderRadius: rounded, backgroundColor: C.line }, style as any]} resizeMode="cover" />;
  }
  return (
    <View style={[{ borderRadius: rounded, backgroundColor: meta.color + '22', alignItems: 'center', justifyContent: 'center' }, style]}>
      <Text style={{ fontSize: 34 }}>{meta.emoji}</Text>
    </View>
  );
}

export function Card({ children, style, onPress }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void }) {
  if (onPress)
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [s.card, style, pressed && { opacity: 0.9 }]}>
        {children}
      </Pressable>
    );
  return <View style={[s.card, style]}>{children}</View>;
}

/** The standard ping row used in lists (Explore, Saved, Search…). */
export function PingRow({
  ping,
  now,
  saved,
  onSave,
  onPress,
}: {
  ping: PingView;
  now: Date;
  saved?: boolean;
  onSave?: () => void;
  onPress?: () => void;
}) {
  return (
    <Card onPress={onPress ?? (() => router.push(`/ping/${ping.id}`))} style={s.pingRow}>
      <Photo ping={ping} style={{ width: 84, height: 84 }} />
      <View style={{ flex: 1, marginLeft: 14 }}>
        <Text style={s.pingTitle} numberOfLines={1}>
          {ping.title}
        </Text>
        <Text style={s.pingMeta} numberOfLines={1}>
          {fmtDistance(ping.distance)} · {ping.category} · {ping.live ? fmtUntil(ping.pingEndsAt, now) : 'Ended'}
        </Text>
        <View style={[s.row, { marginTop: 8, flexWrap: 'wrap', gap: 6 }]}>
          {ping.live ? <Badge text="● LIVE" tone="live" /> : <Badge text="Expired" tone="grey" />}
          {ping.isPromoted ? <Badge text="PROMOTED" tone="gold" /> : null}
          {ping.live ? <Badge text={`⏱ Ends in ${fmtLeft(ping.pingEndsAt, now)}`} /> : null}
        </View>
      </View>
      {onSave ? (
        <Pressable accessibilityLabel={saved ? 'Unsave' : 'Save'} onPress={onSave} hitSlop={10} style={{ padding: 4 }}>
          <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={22} color={saved ? C.primary : C.muted} />
        </Pressable>
      ) : null}
    </Card>
  );
}

export function Empty({ icon = 'compass-outline', title, body, action }: { icon?: any; title: string; body?: string; action?: React.ReactNode }) {
  return (
    <View style={s.empty}>
      <Ionicons name={icon} size={36} color={C.primary} />
      <Text style={[s.h2, { textAlign: 'center', marginTop: 10 }]}>{title}</Text>
      {body ? <Body style={{ textAlign: 'center', marginTop: 6 }}>{body}</Body> : null}
      {action ? <View style={{ marginTop: 16, alignSelf: 'stretch' }}>{action}</View> : null}
    </View>
  );
}

export function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <Card style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 26, fontWeight: '700', color: C.dark }}>{value}</Text>
      <Text style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{label}</Text>
    </Card>
  );
}

export const Spacer = ({ h = 16 }: { h?: number }) => <View style={{ height: h }} />;

export const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  pad: { padding: 24, paddingBottom: 40 },
  footer: { paddingHorizontal: 24, paddingTop: 10, paddingBottom: 28, backgroundColor: C.bg, borderTopWidth: 1, borderTopColor: C.line },
  row: { flexDirection: 'row', alignItems: 'center' },
  round: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6, marginBottom: 6 },
  h1: { fontSize: 30, fontWeight: '700', color: C.dark, lineHeight: 36 },
  h2: { fontSize: 18, fontWeight: '700', color: C.dark },
  body: { fontSize: 14, color: C.muted, lineHeight: 20 },
  label: { fontSize: 11, fontWeight: '600', color: C.muted, letterSpacing: 0.5, marginBottom: 6, textTransform: 'uppercase' },
  btn: { height: 52, borderRadius: R.card, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  btnText: { fontSize: 16, fontWeight: '600' },
  chip: { height: 40, borderRadius: R.field, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  chipOn: { backgroundColor: C.primary },
  chipOff: { backgroundColor: C.white, borderWidth: 1, borderColor: C.line },
  chipText: { fontSize: 13, fontWeight: '600' },
  chipRow: { flexDirection: 'row', gap: 8 },
  input: {
    backgroundColor: C.white,
    borderRadius: R.field,
    borderWidth: 1,
    borderColor: C.line,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: C.dark,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.gold,
    borderRadius: R.field,
    padding: 14,
  },
  toggleLabel: { color: C.goldText, fontWeight: '600', fontSize: 14, flex: 1 },
  track: { width: 44, height: 24, borderRadius: 12, padding: 3, justifyContent: 'center' },
  knob: { width: 18, height: 18, borderRadius: 9, backgroundColor: C.white },
  stepBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.mint, alignItems: 'center', justifyContent: 'center' },
  stepValue: { fontSize: 15, fontWeight: '600', color: C.dark },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  card: {
    backgroundColor: C.white,
    borderRadius: R.card,
    padding: 14,
    shadowColor: '#0B2B27',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  pingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  pingTitle: { fontSize: 16, fontWeight: '700', color: C.dark },
  pingMeta: { fontSize: 13, color: C.muted, marginTop: 3 },
  empty: { alignItems: 'center', padding: 24, backgroundColor: C.white, borderRadius: R.card, borderWidth: 1, borderColor: C.line },
});
