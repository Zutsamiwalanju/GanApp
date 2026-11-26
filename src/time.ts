// All times in GanApp are shown in 12-hour format (e.g. "6:00 PM"), never 24-hour.

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function fmtTime(d: Date | string): string {
  const x = typeof d === 'string' ? new Date(d) : d;
  let h = x.getHours();
  const m = x.getMinutes();
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m.toString().padStart(2, '0')} ${ap}`;
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** "Today", "Tomorrow", "Yesterday", or "Sat, Nov 28". */
export function dayLabel(d: Date | string, now = new Date()): string {
  const x = typeof d === 'string' ? new Date(d) : d;
  const diff = Math.round((startOfDay(x).getTime() - startOfDay(now).getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  return `${DAYS[x.getDay()]}, ${MONTHS[x.getMonth()]} ${x.getDate()}`;
}

/** "Today, 6:00 PM – 10:00 PM" or "Today, 9:00 PM – Tomorrow, 2:00 AM". */
export function fmtWhen(start?: string | null, end?: string | null, now = new Date()): string {
  if (!start) return '';
  const s = new Date(start);
  if (!end) return `${dayLabel(s, now)}, ${fmtTime(s)}`;
  const e = new Date(end);
  const sameDay = startOfDay(s).getTime() === startOfDay(e).getTime();
  return sameDay
    ? `${dayLabel(s, now)}, ${fmtTime(s)} – ${fmtTime(e)}`
    : `${dayLabel(s, now)}, ${fmtTime(s)} – ${dayLabel(e, now)}, ${fmtTime(e)}`;
}

/** "Until 10:00 PM" (same day) or "Until Tomorrow, 4:00 AM". */
export function fmtUntil(d: string | Date, now = new Date()): string {
  const x = typeof d === 'string' ? new Date(d) : d;
  const label = dayLabel(x, now);
  return label === 'Today' ? `Until ${fmtTime(x)}` : `Until ${label}, ${fmtTime(x)}`;
}

/** Countdown like "3h 20m", "45m", "2d 4h". Returns "Ended" when past. */
export function fmtLeft(d: string | Date, now = new Date()): string {
  const ms = (typeof d === 'string' ? new Date(d) : d).getTime() - now.getTime();
  if (ms <= 0) return 'Ended';
  const mins = Math.floor(ms / 60000);
  const days = Math.floor(mins / 1440);
  const hrs = Math.floor((mins % 1440) / 60);
  const m = mins % 60;
  if (days > 0) return hrs ? `${days}d ${hrs}h` : `${days}d`;
  if (hrs > 0) return m ? `${hrs}h ${m}m` : `${hrs}h`;
  return `${Math.max(m, 1)}m`;
}

/** "2 min ago", "3 hr ago", "4 days ago". */
export function fmtAgo(d: string | Date, now = new Date()): string {
  const mins = Math.floor((now.getTime() - new Date(d).getTime()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h} hr ago`;
  const days = Math.floor(h / 24);
  return days === 1 ? 'Yesterday' : `${days} days ago`;
}

export function hoursLabel(h: number): string {
  if (h === 168) return 'Weekly';
  return h === 1 ? '1 hr' : `${h} hrs`;
}

/** Next half hour from now, used as the default start time for new pins. */
export function nextHalfHour(now = new Date()): Date {
  const d = new Date(now);
  d.setSeconds(0, 0);
  d.setMinutes(d.getMinutes() < 30 ? 30 : 60);
  return d;
}

export const ageDays = (d: string) => (Date.now() - new Date(d).getTime()) / 86400000;
