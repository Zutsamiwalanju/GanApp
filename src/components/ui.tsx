import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CAT_ICON, photoSource, UI } from '../assets';
import { fmtDistance } from '../geo';
import type { PingView } from '../store';
import { C, catMeta, R } from '../theme';
import { statusBadge, Tone, whenShort } from '../time';
import { Text, TextInput } from './Text';

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
      {footer ? <Footer>{footer}</Footer> : <BottomSpacer />}
    </SafeAreaView>
  );
}

/** Sticky bottom bar that stays above the phone's navigation bar / gesture area. */
export function Footer({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const insets = useSafeAreaInsets();
  return <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, 12) + 8 }, style]}>{children}</View>;
}

function BottomSpacer() {
  const insets = useSafeAreaInsets();
  return <View style={{ height: insets.bottom }} />;
}

export function BackButton({ onPress }: { onPress?: () => void }) {
  const router = useRouter();
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

export function IconButton({ name, onPress, label, color = C.dark }: { name: any; onPress: () => void; label: string; color?: string }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={s.round} hitSlop={8}>
      <Ionicons name={name} size={20} color={color} />
    </Pressable>
  );
}

export function Logo({ size = 28, word = true }: { size?: number; word?: boolean }) {
  return (
    <View style={s.row}>
      <Image source={UI.logo} style={{ width: size, height: size }} contentFit="contain" />
      {word ? <Text style={{ fontSize: size * 0.82, fontWeight: '700', color: C.dark, marginLeft: 6, letterSpacing: -0.5 }}>ganapp</Text> : null}
    </View>
  );
}

/* ---------- text ---------- */

export const Eyebrow = ({ children, color = C.primary }: { children: React.ReactNode; color?: string }) => (
  <Text style={[s.eyebrow, { color }]}>{children}</Text>
);
export const H1 = ({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) => <Text style={[s.h1, style]}>{children}</Text>;
export const H2 = ({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) => <Text style={[s.h2, style]}>{children}</Text>;
export const Body = ({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) => <Text style={[s.body, style]}>{children}</Text>;
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
      accessibilityState={{ disabled: !!disabled }}
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
  icon,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  icon?: number;
}) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={[s.chip, selected ? s.chipOn : s.chipOff, style]}>
      {icon ? <Image source={icon} style={{ width: 20, height: 20, borderRadius: 6, marginRight: 6 }} /> : null}
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
  value: T | null;
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
      <TextInput
        placeholderTextColor="#9AA9A6"
        {...props}
        style={[s.input, props.multiline && { minHeight: 84, textAlignVertical: 'top' }, props.style]}
      />
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

export function Stepper({ label, value, onMinus, onPlus }: { label: string; value: string; onMinus: () => void; onPlus: () => void }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Label>{label}</Label>
      <View style={[s.input, s.row, { justifyContent: 'space-between', paddingVertical: 6 }]}>
        <Pressable accessibilityLabel={`Earlier ${label}`} onPress={onMinus} style={s.stepBtn} hitSlop={6}>
          <Ionicons name="remove" size={18} color={C.primary} />
        </Pressable>
        <Text style={s.stepValue}>{value}</Text>
        <Pressable accessibilityLabel={`Later ${label}`} onPress={onPlus} style={s.stepBtn} hitSlop={6}>
          <Ionicons name="add" size={18} color={C.primary} />
        </Pressable>
      </View>
    </View>
  );
}

/* ---------- display ---------- */

const TONES: Record<Tone | 'gold', { bg: string; fg: string }> = {
  mint: { bg: C.mint, fg: C.primary },
  gold: { bg: C.gold, fg: C.goldText },
  live: { bg: C.coral, fg: C.white },
  open: { bg: '#2E9E5B', fg: C.white },
  grey: { bg: '#EEF2F1', fg: C.muted },
};

export function Badge({ text, tone = 'mint' }: { text: string; tone?: Tone | 'gold' }) {
  const t = TONES[tone];
  return (
    <View style={[s.badge, { backgroundColor: t.bg }]}>
      <Text style={[s.badgeText, { color: t.fg }]}>{text}</Text>
    </View>
  );
}

export function StatusBadge({ ping, now }: { ping: PingView; now: Date }) {
  const b = statusBadge(ping, now);
  return <Badge text={b.text} tone={b.tone} />;
}

export function CategoryIcon({ category, size = 28 }: { category: string; size?: number }) {
  const src = CAT_ICON[category];
  if (!src) return <View style={{ width: size, height: size, borderRadius: size * 0.25, backgroundColor: C.primary }} />;
  return <Image source={src} style={{ width: size, height: size }} contentFit="contain" accessibilityLabel={category} />;
}

/** Ping photo: the live photo, the bundled artwork for samples, or a branded category tile. */
export function Photo({
  ping,
  style,
  rounded = 16,
}: {
  ping: { photoUrl: string | null; category: string; title?: string };
  style?: StyleProp<ViewStyle>;
  rounded?: number;
}) {
  const src = photoSource(ping.photoUrl);
  if (src) {
    return (
      <Image
        source={src}
        style={[{ borderRadius: rounded, backgroundColor: C.line }, style as any]}
        contentFit="cover"
        transition={200}
        accessibilityLabel={ping.title ? `Photo of ${ping.title}` : 'Ping photo'}
      />
    );
  }
  const meta = catMeta(ping.category);
  return (
    <View style={[{ borderRadius: rounded, backgroundColor: meta.color + '26', alignItems: 'center', justifyContent: 'center' }, style]}>
      <CategoryIcon category={ping.category} size={44} />
    </View>
  );
}

export function Card({ children, style, onPress }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void }) {
  if (onPress)
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [s.card, style, pressed && { opacity: 0.92 }]}>
        {children}
      </Pressable>
    );
  return <View style={[s.card, style]}>{children}</View>;
}

/** The standard ping row used in lists (Explore, Saved, Search…). */
export function PingRow({ ping, now, saved, onSave, onPress }: { ping: PingView; now: Date; saved?: boolean; onSave?: () => void; onPress?: () => void }) {
  const router = useRouter();
  return (
    <Card onPress={onPress ?? (() => router.push(`/ping/${ping.id}`))} style={s.pingRow}>
      <Photo ping={ping} style={{ width: 84, height: 84 }} />
      <View style={{ flex: 1, marginLeft: 14 }}>
        <Text style={s.pingTitle} numberOfLines={1}>
          {ping.title}
        </Text>
        <Text style={s.pingMeta} numberOfLines={1}>
          {fmtDistance(ping.distance)} · {ping.category} · {whenShort(ping, now)}
        </Text>
        <View style={[s.row, { marginTop: 8, flexWrap: 'wrap', gap: 6 }]}>
          <StatusBadge ping={ping} now={now} />
          {ping.isPromoted ? <Badge text="PROMOTED" tone="gold" /> : null}
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

export function Empty({ title, body, action }: { title: string; body?: string; action?: React.ReactNode }) {
  return (
    <View style={s.empty}>
      <Image source={UI.empty} style={{ width: 160, height: 120 }} contentFit="contain" />
      <Text style={[s.h2, { textAlign: 'center', marginTop: 6 }]}>{title}</Text>
      {body ? <Body style={{ textAlign: 'center', marginTop: 6 }}>{body}</Body> : null}
      {action ? <View style={{ marginTop: 16, alignSelf: 'stretch' }}>{action}</View> : null}
    </View>
  );
}

export function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <Card style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: '700', color: C.dark }}>{value}</Text>
      <Text style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{label}</Text>
    </Card>
  );
}

export const Spacer = ({ h = 16 }: { h?: number }) => <View style={{ height: h }} />;

/* ---------- bottom sheet with a list of actions (Report, Block, …) ---------- */

export type SheetOption = { label: string; icon?: any; destructive?: boolean; keepOpen?: boolean; onPress: () => void };

export function ActionSheet({
  visible,
  title,
  message,
  options,
  onClose,
}: {
  visible: boolean;
  title: string;
  message?: string;
  options: SheetOption[];
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.sheetBackdrop} onPress={onClose} accessibilityLabel="Close" />
      <View style={[s.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
        <View style={s.sheetHandle} />
        <Text style={[s.h2, { marginBottom: message ? 4 : 12 }]}>{title}</Text>
        {message ? <Body style={{ marginBottom: 12 }}>{message}</Body> : null}
        {options.map((o) => (
          <Pressable
            key={o.label}
            onPress={() => {
              if (!o.keepOpen) onClose();
              o.onPress();
            }}
            style={({ pressed }) => [s.sheetRow, pressed && { backgroundColor: C.mint }]}
          >
            {o.icon ? <Ionicons name={o.icon} size={20} color={o.destructive ? C.danger : C.dark} style={{ marginRight: 12 }} /> : null}
            <Text style={{ fontSize: 16, color: o.destructive ? C.danger : C.dark, fontWeight: '500' }}>{o.label}</Text>
          </Pressable>
        ))}
        <Button title="Cancel" variant="ghost" onPress={onClose} />
      </View>
    </Modal>
  );
}

export const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  pad: { padding: 24, paddingBottom: 40 },
  footer: { paddingHorizontal: 24, paddingTop: 10, backgroundColor: C.bg, borderTopWidth: 1, borderTopColor: C.line },
  row: { flexDirection: 'row', alignItems: 'center' },
  round: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.white, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6, marginBottom: 6 },
  h1: { fontSize: 30, fontWeight: '700', color: C.dark, lineHeight: 36, letterSpacing: -0.6 },
  h2: { fontSize: 18, fontWeight: '700', color: C.dark, letterSpacing: -0.2 },
  body: { fontSize: 14, color: C.muted, lineHeight: 20 },
  label: { fontSize: 11, fontWeight: '600', color: C.muted, letterSpacing: 0.5, marginBottom: 6, textTransform: 'uppercase' },
  btn: { height: 52, borderRadius: R.card, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  btnText: { fontSize: 16, fontWeight: '600' },
  chip: { height: 40, borderRadius: R.field, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, flexDirection: 'row' },
  chipOn: { backgroundColor: C.primary },
  chipOff: { backgroundColor: C.white, borderWidth: 1, borderColor: C.line },
  chipText: { fontSize: 13, fontWeight: '600' },
  chipRow: { flexDirection: 'row', gap: 8 },
  input: { backgroundColor: C.white, borderRadius: R.field, borderWidth: 1, borderColor: C.line, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: C.dark },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.gold, borderRadius: R.field, padding: 14 },
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
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(10,30,27,0.4)' },
  sheet: { backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 10 },
  sheetHandle: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: C.line, marginBottom: 14 },
  sheetRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 8, borderRadius: 12 },
});
