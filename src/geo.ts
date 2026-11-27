export type LatLng = { lat: number; lng: number };

/** Sample areas you can explore without sharing your location. */
export const SAMPLE_AREAS = {
  makati: { key: 'makati', label: 'Makati', detail: 'Poblacion & Legazpi Village', lat: 14.5612, lng: 121.027 },
  intramuros: { key: 'intramuros', label: 'Intramuros', detail: 'Around Mapúa & Fort Santiago', lat: 14.5899, lng: 120.9755 },
} as const;
export type SampleArea = keyof typeof SAMPLE_AREAS;

export function distanceM(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function fmtDistance(m: number): string {
  if (m < 1000) return `${Math.max(10, Math.round(m / 10) * 10)} m`;
  return `${(m / 1000).toFixed(m < 10000 ? 1 : 0)} km`;
}

export const walkMinutes = (m: number) => Math.max(1, Math.round(m / 80));

export const radiusLabel = (m: number) => (m >= 1000 ? `${m / 1000} km` : `${m} m`);

export const directionsUrl = (p: LatLng) =>
  `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}&travelmode=walking`;
