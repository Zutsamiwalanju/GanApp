import { decode } from 'base64-arraybuffer';
import { supabase } from './supabase';
import type { Draft, Message, Ping, Profile, Review, Role } from './types';

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
  lat: r.lat,
  lng: r.lng,
  kind: r.kind,
  startsAt: r.starts_at,
  endsAt: r.ends_at,
  pingEndsAt: r.ping_ends_at,
  radiusM: r.radius_m,
  isPromoted: r.is_promoted,
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

function check<T>(res: { data: T; error: any }): T {
  if (res.error) throw new Error(res.error.message ?? String(res.error));
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
        : res.error.message,
    );
  }
  return res.data.user!.id;
}

export async function getProfile(uid: string): Promise<Profile | null> {
  const row = check(await supabase.from('profiles').select('*').eq('id', uid).maybeSingle());
  if (!row) return null;
  const r = row as any;
  return { id: r.id, displayName: r.display_name, role: r.role, interests: r.interests ?? [] };
}

export async function saveProfile(p: { id: string; displayName: string; role: Role; interests: string[] }) {
  check(
    await supabase.from('profiles').upsert({
      id: p.id,
      display_name: p.displayName.trim().slice(0, 40) || 'Explorer',
      role: p.role,
      interests: p.interests,
    }),
  );
}

/* ---------- pings ---------- */

export async function refreshDemoPings() {
  await supabase.rpc('refresh_demo_pings');
}

export async function fetchPings(): Promise<Ping[]> {
  const rows = check(await supabase.from('pings').select('*').order('ping_ends_at', { ascending: false }).limit(500));
  return (rows as any[]).map(toPing);
}

export async function fetchPing(id: string): Promise<Ping | null> {
  const row = check(await supabase.from('pings').select('*').eq('id', id).maybeSingle());
  return row ? toPing(row) : null;
}

/** Uploads the live photo, then creates the ping row. */
export async function createPing(d: Draft, uid: string, creatorName: string): Promise<Ping> {
  if (!d.photoBase64) throw new Error('A live photo is required.');
  if (d.lat == null || d.lng == null) throw new Error('Location is missing.');

  const path = `${uid}/${Date.now()}.jpg`;
  const up = await supabase.storage.from('ping-photos').upload(path, decode(d.photoBase64), {
    contentType: 'image/jpeg',
    upsert: false,
  });
  if (up.error) throw new Error(`Photo upload failed: ${up.error.message}`);
  const photoUrl = supabase.storage.from('ping-photos').getPublicUrl(path).data.publicUrl;

  const start = new Date(d.startsAt);
  const end = new Date(start.getTime() + d.lengthMin * 60000);
  const pingEnds = new Date(Date.now() + d.durationH * 3600000);

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
}

/** Adds hours to your own ping. Returns the new end time (ISO). */
export async function extendPing(id: string, hours: number): Promise<string> {
  const res = await supabase.rpc('extend_ping', { p_ping: id, p_hours: hours });
  if (res.error) throw new Error(res.error.message);
  return res.data as string;
}

export async function deletePing(id: string) {
  check(await supabase.from('pings').delete().eq('id', id));
}

export async function bumpStat(id: string, stat: 'views' | 'directions') {
  await supabase.rpc('bump_ping_stat', { p_ping: id, p_stat: stat });
}

/* ---------- saves & attendance ---------- */

export async function fetchMySaves(uid: string): Promise<string[]> {
  const rows = check(await supabase.from('saves').select('ping_id').eq('user_id', uid));
  return (rows as any[]).map((r) => r.ping_id);
}

export async function fetchMyGoing(uid: string): Promise<string[]> {
  const rows = check(await supabase.from('attendees').select('ping_id').eq('user_id', uid));
  return (rows as any[]).map((r) => r.ping_id);
}

export async function setSaved(uid: string, pingId: string, on: boolean) {
  if (on) check(await supabase.from('saves').upsert({ user_id: uid, ping_id: pingId }, { ignoreDuplicates: true }));
  else check(await supabase.from('saves').delete().eq('user_id', uid).eq('ping_id', pingId));
}

export async function setGoing(uid: string, pingId: string, on: boolean) {
  if (on) check(await supabase.from('attendees').upsert({ user_id: uid, ping_id: pingId }, { ignoreDuplicates: true }));
  else check(await supabase.from('attendees').delete().eq('user_id', uid).eq('ping_id', pingId));
}

/* ---------- reviews (expire after 30 days unless upvoted 5+ times) ---------- */

export const KEEP_VOTES = 5;

export async function fetchReviews(pingId: string): Promise<Review[]> {
  const cutoff = new Date(Date.now() - 30 * 86400000).toISOString();
  const rows = check(
    await supabase
      .from('reviews')
      .select('*')
      .eq('ping_id', pingId)
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
  const rows = check(
    await supabase.from('messages').select('*').eq('ping_id', pingId).order('created_at', { ascending: true }).limit(200),
  );
  return (rows as any[]).map(toMessage);
}

export async function sendMessage(m: { pingId: string; uid: string; authorName: string; body: string }) {
  check(
    await supabase.from('messages').insert({
      ping_id: m.pingId,
      author_id: m.uid,
      author_name: m.authorName,
      body: m.body.trim(),
    }),
  );
}
