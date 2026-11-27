// All times in GanApp are shown in 12-hour format (e.g. "6:00 PM"), never 24-hour.

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const toDate = (d: Date | string) => (typeof d === 'string' ? new Date(d) : d);

export function fmtTime(d: Date | string): string {
  const x = toDate(d);
  let h = x.getHours();
  const m = x.getMinutes();
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m.toString().padStart(2, '0')} ${ap}`;
}

export function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export const dayDiff = (d: Date, now: Date) => Math.round((startOfDay(d).getTime() - startOfDay(now).getTime()) / 86400000);

/** "Today", "Tomorrow", "Yesterday", or "Sat, Nov 28". */
export function dayLabel(d: Date | string, now = new Date()): string {
  const x = toDate(d);
  const diff = dayDiff(x, now);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  if (diff > 1 && diff < 7) return DAYS[x.getDay()];
  return `${DAYS[x.getDay()]}, ${MONTHS[x.getMonth()]} ${x.getDate()}`;
}

/** "Today, 6:00 PM – 10:00 PM" or "Today, 9:00 PM – Tomorrow, 2:00 AM". */
export function fmtWhen(start?: string | null, end?: string | null, now = new Date()): string {
  if (!start) return '';
  const s = new Date(start);
  if (!end) return `${dayLabel(s, now)}, ${fmtTime(s)}`;
  const e = new Date(end);
  const sameDay = startOfDay(s).getTime() === startOfDay(e).getTime();
  const endsJustAfterMidnight = dayDiff(e, s) === 1 && e.getHours() < 6;
  if (sameDay || endsJustAfterMidnight) return `${dayLabel(s, now)}, ${fmtTime(s)} – ${fmtTime(e)}`;
  return `${dayLabel(s, now)}, ${fmtTime(s)} – ${dayLabel(e, now)}, ${fmtTime(e)}`;
}

/** "Until 10:00 PM" (same day) or "Until Tomorrow, 4:00 AM". */
export function fmtUntil(d: string | Date, now = new Date()): string {
  const x = toDate(d);
  const label = dayLabel(x, now);
  return label === 'Today' ? `Until ${fmtTime(x)}` : `Until ${label}, ${fmtTime(x)}`;
}

/** Countdown like "3h 20m", "45m", "2d 4h". Returns "Ended" when past. */
export function fmtLeft(d: string | Date, now = new Date()): string {
  const ms = toDate(d).getTime() - now.getTime();
  if (ms <= 0) return 'Ended';
  const mins = Math.floor(ms / 60000);
  const days = Math.floor(mins / 1440);
  const hrs = Math.floor((mins % 1440) / 60);
  const m = mins % 60;
  if (days > 0) return hrs ? `${days}d ${hrs}h` : `${days}d`;
  if (hrs > 0) return m ? `${hrs}h ${m}m` : `${hrs}h`;
  return `${Math.max(m, 1)}m`;
}

export function fmtAgo(d: string | Date, now = new Date()): string {
  const mins = Math.floor((now.getTime() - toDate(d).getTime()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h} hr ago`;
  const days = Math.floor(h / 24);
  return days === 1 ? 'Yesterday' : `${days} days ago`;
}

export function hoursLabel(h: number): string {
  if (h === 168) return '7 days';
  return h === 1 ? '1 hr' : `${h} hrs`;
}

export function nextHalfHour(now = new Date()): Date {
  const d = new Date(now);
  d.setSeconds(0, 0);
  d.setMinutes(d.getMinutes() < 30 ? 30 : 60);
  return d;
}

export const ageDays = (d: string) => (Date.now() - new Date(d).getTime()) / 86400000;

/* ---------- event / place status, used on every card ---------- */

type Timed = { kind: 'event' | 'place'; startsAt: string | null; endsAt: string | null; pingEndsAt: string };
export type Tone = 'live' | 'open' | 'mint' | 'grey';

const minutesOfDay = (d: Date) => d.getHours() * 60 + d.getMinutes();

/** Is a place open right now, using its daily opening hours? */
export function isOpenNow(p: Timed, now = new Date()): boolean {
  if (!p.startsAt || !p.endsAt) return true;
  const o = minutesOfDay(new Date(p.startsAt));
  const c = minutesOfDay(new Date(p.endsAt));
  const n = minutesOfDay(now);
  return o < c ? n >= o && n < c : n >= o || n < c; // handles closing after midnight
}

export function isHappeningNow(p: Timed, now = new Date()): boolean {
  if (p.kind === 'place') return isOpenNow(p, now);
  if (!p.startsAt) return true;
  const s = new Date(p.startsAt).getTime();
  const e = p.endsAt ? new Date(p.endsAt).getTime() : Infinity;
  return s <= now.getTime() && now.getTime() < e;
}

/** Badge on cards: "● HAPPENING NOW", "TONIGHT 6:00 PM", "OPEN NOW", "CLOSED"… */
export function statusBadge(p: Timed, now = new Date()): { text: string; tone: Tone } {
  if (new Date(p.pingEndsAt).getTime() <= now.getTime()) return { text: 'ENDED', tone: 'grey' };
  if (p.kind === 'place') return isOpenNow(p, now) ? { text: '● OPEN NOW', tone: 'open' } : { text: 'CLOSED', tone: 'grey' };
  if (isHappeningNow(p, now)) return { text: '● HAPPENING NOW', tone: 'live' };
  if (!p.startsAt) return { text: 'UPCOMING', tone: 'mint' };
  const s = new Date(p.startsAt);
  if (p.endsAt && new Date(p.endsAt).getTime() <= now.getTime()) return { text: 'ENDED', tone: 'grey' };
  const d = dayDiff(s, now);
  const label = d === 0 ? (s.getHours() >= 17 ? 'TONIGHT' : 'TODAY') : d === 1 ? 'TOMORROW' : dayLabel(s, now).toUpperCase();
  return { text: `${label} ${fmtTime(s)}`, tone: 'mint' };
}

/** Short time text for cards. Events show event time; places show opening hours. */
export function whenShort(p: Timed, now = new Date()): string {
  if (p.kind === 'place') {
    if (!p.startsAt || !p.endsAt) return 'Open';
    return isOpenNow(p, now) ? `Open until ${fmtTime(p.endsAt)}` : `Opens ${fmtTime(p.startsAt)}`;
  }
  if (!p.startsAt) return '';
  if (isHappeningNow(p, now)) return p.endsAt ? `Now – ${fmtTime(p.endsAt)}` : 'Now';
  return `${dayLabel(p.startsAt, now)} ${fmtTime(p.startsAt)}`;
}

/** Opening hours line for a place: "Open daily 8:00 AM – 6:00 PM". */
export function fmtHours(p: Timed): string {
  if (!p.startsAt || !p.endsAt) return '';
  return `Open daily ${fmtTime(p.startsAt)} – ${fmtTime(p.endsAt)}`;
}
