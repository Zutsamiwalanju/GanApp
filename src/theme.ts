// GanApp design tokens, taken from the Figma prototype.
export const C = {
  primary: '#087F70',
  dark: '#142E2B',
  muted: '#687B77',
  mint: '#E0F2E9',
  bg: '#F9FBFA',
  line: '#E1E8E6',
  coral: '#F56857',
  gold: '#FFF0D6',
  goldText: '#A16207',
  white: '#FFFFFF',
  danger: '#C0392B',
};

export const R = { card: 20, field: 14, pill: 999 };

export const CATEGORIES = [
  'Food', 'Music', 'Art', 'Sports', 'Nightlife', 'Nature', 'Culture', 'Tech', 'Wellness',
] as const;
export type Category = (typeof CATEGORIES)[number];

export const CAT: Record<Category, { emoji: string; color: string }> = {
  Food: { emoji: '🍜', color: '#F56857' },
  Music: { emoji: '🎧', color: '#087F70' },
  Art: { emoji: '🎨', color: '#7C5CFA' },
  Sports: { emoji: '🏀', color: '#E8902E' },
  Nightlife: { emoji: '🌙', color: '#3B3B98' },
  Nature: { emoji: '🌿', color: '#2E9E5B' },
  Culture: { emoji: '🏛️', color: '#B5651D' },
  Tech: { emoji: '💡', color: '#2F80ED' },
  Wellness: { emoji: '🧘', color: '#D16BA5' },
};

export const catMeta = (c: string) => CAT[(c as Category)] ?? { emoji: '📍', color: C.primary };
