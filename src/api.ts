import { decode } from 'base64-arraybuffer';
import { supabase } from './supabase';
import type { Draft, Message, Ping, Profile, ReportReason, ReportTarget, Review, Role } from './types';

/* ---------- row mappers ---------- */

const toPing = (r: any): Ping => ({
  id: r.id,
  creatorId: r.creator_id,
  creatorName: r.creator_name,
  title: r.title,
  category: r.category,
  description: r.description,
  placeName: r.place_name,
  address: r.address,
  placeKey: r.place_key,
  lat: r.lat,
  lng: r.lng,
  kind: r.kind,
  startsAt: r.starts_at,
  endsAt: r.ends_at,
  pingEndsAt: r.ping_ends_at,
  radiusM: r.radius_m,
  isPromoted: r.is_promoted,
  isPrivate: r.is_private ?? false,
  isDemo: r.is_demo ?? false,
  priceLabel: r.price_label,
  photoUrl: r.photo_url,
  views: r.views_count,
  saved: r.saved_count,
  going: r.going_count,
  directions: r.directions_count,
  createdAt: r.created_at,
});

const toReview = (r: any): Review => ({
  id: r.id,
  pingId: r.ping_id,
  authorId: r.author_id,
  authorName: r.author_name,
  rating: r.rating,
  title: r.title,
  body: r.body,
  upvotes: r.upvotes,
  createdAt: r.created_at,
});

const toMessage = (r: any): Message => ({
  id: r.id,
  pingId: r.ping_id,
  authorId: r.author_id,
  authorName: r.author_name,
  body: r.body,
  createdAt: r.created_at,
});

/** Turns Supabase errors into sentences a user can act on. */
function friendly(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('reviews_one_per_place')) return 'You’ve already reviewed this place. Thanks!';
  if (m.includes('duplicate key')) return 'You’ve already done that here.';
  if (m.includes('row-level security')) return 'You’re not allowed to do that.';
  if (m.includes('network') || m.includes('failed to fetch')) return 'No connection. Check your internet and try again.';
  return msg;
}

function check<T>(res: { data: T; error: any }): T {
  if (res.error) throw new Error(friendly(res.error.message ?? String(res.error)));
  return res.data;
}

/* ---------- auth & profile ---------- */

/** "No sign up needed": every phone gets an anonymous Supabase account. */
export async function ensureSession(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  if (data.session?.user) return data.session.user.id;
  const res = await supabase.auth.signInAnonymously();
  if (res.error) {
    throw new Error(
      res.error.message.toLowerCase().includes('anonymous')
        ? 'Anonymous sign-ins are turned off. In Supabase: Authentication → Sign In / Providers → turn on "Allow anonymous sign-ins".'
        : friendly(res.error.message),
    );
  }
  return res.data.user!.id;
}

export async function getProfile(uid: string): Promise<Profile | null> {
  const row = check(await supabase.from('profiles').select('*').eq('id', uid).maybeSingle()) as any;
  if (!row) return null;
  return { id: row.id, displayName: row.display_name, role: row.role, interests: row.interests ?? [], verified: !!row.verified };
}

export async function createProfile(p: { id: string; displayName: string; role: Role; interests: string[] }) {
  check(await supabase.from('profiles').insert({ id: p.id, display_name: p.displayName, role: p.role, interests: p.interests }));
}

export async function updateProfile(uid: string, p: { displayName?: string; role?: Role; interests?: string[] }) {
  const patch: Record<string, unknown> = {};
  if (p.displayName !== undefined) patch.display_name = p.displayName.trim().slice(0, 40) || 'Explorer';
  if (p.role !== undefined) patch.role = p.role;
  if (p.interests !== undefined) patch.interests = p.interests;
  check(await supabase.from('profiles').update(patch).eq('id', uid));
}

/* ---------- pings ---------- */

export async function refreshDemoPings() {
  await supabase.rpc('refresh_demo_pings');
}

/** Pings within ~12 km of a point, plus your own. */
export async function fetchNearby(lat: number, lng: number): Promise<Ping[]> {
  const rows = check(await supabase.rpc('nearby_pings', { p_lat: lat, p_lng: lng, p_km: 12 }));
  return ((rows as any[]) ?? []).map(toPing);
}

export async function fetchPing(id: string): Promise<Ping | null> {
  const row = check(await supabase.from('pings').select('*').eq('id', id).maybeSingle());
  return row ? toPing(row) : null;
}

/** Uploads the live photo, then creates the ping row. */
export async function createPing(d: Draft, uid: string, creatorName: string): Promise<Ping> {
  if (!d.photoBase64) throw new Error('A live photo is required.');
  if (d.lat == null || d.lng == null) throw new Error('Location is missing. Turn on location and retake the photo.');

  const path = `${uid}/${Date.now()}.jpg`;
  const up = await supabase.storage.from('ping-photos').upload(path, decode(d.photoBase64), { contentType: 'image/jpeg', upsert: false });
  if (up.error) throw new Error(`Photo upload failed: ${friendly(up.error.message)}`);
  const photoUrl = supabase.storage.from('ping-photos').getPublicUrl(path).data.publicUrl;

  const start = new Date(d.startsAt);
  const end = new Date(start.getTime() + d.lengthMin * 60000);
  const pingEnds = new Date(Date.now() + d.durationH * 3600000);

  try {
    const row = check(
      await supabase
        .from('pings')
        .insert({
          creator_id: uid,
          creator_name: creatorName,
          title: d.title.trim(),
          category: d.category,
          description: d.description.trim(),
          place_name: d.placeName.trim(),
          address: d.address.trim(),
          lat: d.lat,
          lng: d.lng,
          kind: 'event',
          starts_at: start.toISOString(),
          ends_at: end.toISOString(),
          ping_ends_at: pingEnds.toISOString(),
          radius_m: d.radiusM,
          is_promoted: d.isPromoted,
          price_label: d.priceLabel.trim() || 'Free entry',
          photo_url: photoUrl,
        })
        .select('*')
        .single(),
    );
    return toPing(row);
  } catch (e) {
    await supabase.storage.from('ping-photos').remove([path]); // don't leave an orphan photo behind
    throw e;
  }
}

export type PingEdit = {
  title: string;
  category: string;
  placeName: string;
  address: string;
  description: string;
  priceLabel: string;
  startsAt: string;
  endsAt: string;
};

export async function updatePing(id: string, p: PingEdit): Promise<Ping> {
  const row = check(
    await supabase
      .from('pings')
      .update({
        title: p.title.trim(),
        category: p.category,
        place_name: p.placeName.trim(),
        address: p.address.trim(),
        description: p.description.trim(),
        price_label: p.priceLabel.trim() || 'Free entry',
        starts_at: p.startsAt,
        ends_at: p.endsAt,
      })
      .eq('id', id)
      .select('*')
      .single(),
  );
  return toPing(row);
}

/** Adds hours to your own ping. Returns the new end time (ISO). */
export async function extendPing(id: string, hours: number): Promise<string> {
  const res = await supabase.rpc('extend_ping', { p_ping: id, p_hours: hours });
  if (res.error) throw new Error(friendly(res.error.message));
  return res.data as string;
}

/** Removes the ping and its photo from storage. */
export async function deletePing(p: Ping) {
  const marker = '/ping-photos/';
  if (p.photoUrl && p.photoUrl.includes(marker)) {
    const path = decodeURIComponent(p.photoUrl.split(marker)[1].split('?')[0]);
    await supabase.storage.from('ping-photos').remove([path]);
  }
  check(await supabase.from('pings').delete().eq('id', p.id));
}

/** A private practice ping so new promoters can try the dashboard and "Extend +6 hrs". */
export async function createPracticePing(): Promise<string> {
  const res = await supabase.rpc('create_sample_ping');
  if (res.error) throw new Error(friendly(res.error.message));
  return res.data as string;
}

export async function bumpStat(id: string, stat: 'views' | 'directions') {
  try {
    await supabase.rpc('bump_ping_stat', { p_ping: id, p_stat: stat });
  } catch {
    /* stats are best-effort */
  }
}

/* ---------- saves, attendance, blocks ---------- */

export async function fetchMine(uid: string) {
  const [s, g, b] = await Promise.all([
    supabase.from('saves').select('ping_id').eq('user_id', uid),
    supabase.from('attendees').select('ping_id').eq('user_id', uid),
    supabase.from('blocks').select('blocked_id').eq('blocker_id', uid),
  ]);
  return {
    saves: (check(s) as any[]).map((r) => r.ping_id as string),
    going: (check(g) as any[]).map((r) => r.ping_id as string),
    blocked: (check(b) as any[]).map((r) => r.blocked_id as string),
  };
}

export async function setSaved(uid: string, pingId: string, on: boolean) {
  if (on) check(await supabase.from('saves').upsert({ user_id: uid, ping_id: pingId }, { ignoreDuplicates: true }));
  else check(await supabase.from('saves').delete().eq('user_id', uid).eq('ping_id', pingId));
}

export async function setGoing(uid: string, pingId: string, on: boolean) {
  if (on) check(await supabase.from('attendees').upsert({ user_id: uid, ping_id: pingId }, { ignoreDuplicates: true }));
  else check(await supabase.from('attendees').delete().eq('user_id', uid).eq('ping_id', pingId));
}

/* ---------- reviews: per PLACE, expire after 30 days unless upvoted 5+ times ---------- */

export const KEEP_VOTES = 5;

export async function fetchPlaceReviews(placeKey: string | null, pingId: string): Promise<Review[]> {
  const cutoff = new Date(Date.now() - 30 * 86400000).toISOString();
  const base = supabase.from('reviews').select('*');
  const scoped = placeKey ? base.eq('place_key', placeKey) : base.eq('ping_id', pingId);
  const rows = check(
    await scoped
      .or(`created_at.gt."${cutoff}",upvotes.gte.${KEEP_VOTES}`)
      .order('upvotes', { ascending: false })
      .order('created_at', { ascending: false }),
  );
  return (rows as any[]).map(toReview);
}

export async function fetchMyVotes(uid: string): Promise<string[]> {
  const rows = check(await supabase.from('review_votes').select('review_id').eq('user_id', uid));
  return (rows as any[]).map((r) => r.review_id);
}

export async function setVote(uid: string, reviewId: string, on: boolean) {
  if (on) check(await supabase.from('review_votes').upsert({ user_id: uid, review_id: reviewId }, { ignoreDuplicates: true }));
  else check(await supabase.from('review_votes').delete().eq('user_id', uid).eq('review_id', reviewId));
}

export async function addReview(r: { pingId: string; uid: string; authorName: string; rating: number; title: string; body: string }) {
  check(
    await supabase.from('reviews').insert({
      ping_id: r.pingId,
      author_id: r.uid,
      author_name: r.authorName,
      rating: r.rating,
      title: r.title.trim(),
      body: r.body.trim(),
    }),
  );
}

/* ---------- event chat ---------- */

export async function fetchMessages(pingId: string): Promise<Message[]> {
  const rows = check(await supabase.from('messages').select('*').eq('ping_id', pingId).order('created_at', { ascending: true }).limit(200));
  return (rows as any[]).map(toMessage);
}

export async function sendMessage(m: { pingId: string; uid: string; authorName: string; body: string }) {
  check(await supabase.from('messages').insert({ ping_id: m.pingId, author_id: m.uid, author_name: m.authorName, body: m.body.trim() }));
}

/* ---------- safety ---------- */

/** Three reports from different people hide the content for everyone. */
export async function report(target: ReportTarget, id: string, reason: ReportReason) {
  const res = await supabase.from('reports').insert({ target_type: target, target_id: id, reason });
  if (res.error && !res.error.message.toLowerCase().includes('duplicate')) throw new Error(friendly(res.error.message));
}

export async function setBlocked(uid: string, otherId: string, on: boolean) {
  if (on) check(await supabase.from('blocks').upsert({ blocker_id: uid, blocked_id: otherId }, { ignoreDuplicates: true }));
  else check(await supabase.from('blocks').delete().eq('blocker_id', uid).eq('blocked_id', otherId));
}

export async function clearBlocks(uid: string) {
  check(await supabase.from('blocks').delete().eq('blocker_id', uid));
}
