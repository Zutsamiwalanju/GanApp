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

export const CATEGORIES = ['Food', 'Music', 'Art', 'Sports', 'Nightlife', 'Nature', 'Culture', 'Tech', 'Wellness'] as const;
export type Category = (typeof CATEGORIES)[number];

export const CAT_COLOR: Record<Category, string> = {
  Food: '#F56857',
  Music: '#087F70',
  Art: '#7C5CFA',
  Sports: '#E8902E',
  Nightlife: '#3B3B98',
  Nature: '#2E9E5B',
  Culture: '#B5651D',
  Tech: '#2F80ED',
  Wellness: '#D16BA5',
};

export const catMeta = (c: string) => ({ color: CAT_COLOR[c as Category] ?? C.primary });
