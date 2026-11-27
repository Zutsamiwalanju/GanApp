// Bundled artwork. Sample pings store photo_url = "asset://<key>" and resolve to these files.
/* eslint-disable @typescript-eslint/no-require-imports */

export const ART: Record<string, number> = {
  'sunset-sessions': require('../assets/art/sunset-sessions.jpg'),
  'gallery-after-hours': require('../assets/art/gallery-after-hours.jpg'),
  'the-mill': require('../assets/art/the-mill.jpg'),
  'sunrise-yoga': require('../assets/art/sunrise-yoga.jpg'),
  'night-market': require('../assets/art/night-market.jpg'),
  'pickup-basketball': require('../assets/art/pickup-basketball.jpg'),
  'acoustic-night': require('../assets/art/acoustic-night.jpg'),
  'walls-at-sunset': require('../assets/art/walls-at-sunset.jpg'),
  'plaza-jam': require('../assets/art/plaza-jam.jpg'),
  'food-crawl': require('../assets/art/food-crawl.jpg'),
  'study-cafe': require('../assets/art/study-cafe.jpg'),
  'fort-photo-walk': require('../assets/art/fort-photo-walk.jpg'),
  'bike-the-walls': require('../assets/art/bike-the-walls.jpg'),
};

export const CAT_ICON: Record<string, number> = {
  Food: require('../assets/cat/food.png'),
  Music: require('../assets/cat/music.png'),
  Art: require('../assets/cat/art.png'),
  Sports: require('../assets/cat/sports.png'),
  Nightlife: require('../assets/cat/nightlife.png'),
  Nature: require('../assets/cat/nature.png'),
  Culture: require('../assets/cat/culture.png'),
  Tech: require('../assets/cat/tech.png'),
  Wellness: require('../assets/cat/wellness.png'),
};

export const CAT_GLYPH: Record<string, number> = {
  Food: require('../assets/cat/food-glyph.png'),
  Music: require('../assets/cat/music-glyph.png'),
  Art: require('../assets/cat/art-glyph.png'),
  Sports: require('../assets/cat/sports-glyph.png'),
  Nightlife: require('../assets/cat/nightlife-glyph.png'),
  Nature: require('../assets/cat/nature-glyph.png'),
  Culture: require('../assets/cat/culture-glyph.png'),
  Tech: require('../assets/cat/tech-glyph.png'),
  Wellness: require('../assets/cat/wellness-glyph.png'),
};

export const UI = {
  logo: require('../assets/logo-mark.png'),
  onboardingDiscover: require('../assets/ui/onboarding-discover.png'),
  onboardingPeople: require('../assets/ui/onboarding-people.png'),
  onboardingReviews: require('../assets/ui/onboarding-reviews.png'),
  roleExplorer: require('../assets/ui/role-explorer.png'),
  rolePromoter: require('../assets/ui/role-promoter.png'),
  location: require('../assets/ui/location.png'),
  empty: require('../assets/ui/empty.png'),
};

export const FONTS = {
  'Inter-Regular': require('../assets/fonts/Inter-Regular.otf'),
  'Inter-Medium': require('../assets/fonts/Inter-Medium.otf'),
  'Inter-SemiBold': require('../assets/fonts/Inter-SemiBold.otf'),
  'Inter-Bold': require('../assets/fonts/Inter-Bold.otf'),
};

/** Turns a ping's photo_url into something an <Image> can show. */
export function photoSource(url: string | null | undefined): number | { uri: string } | null {
  if (!url) return null;
  if (url.startsWith('asset://')) return ART[url.slice(8)] ?? null;
  return { uri: url };
}
