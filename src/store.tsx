import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';
import * as api from './api';
import { distanceM, LatLng, SAMPLE_AREAS, SampleArea } from './geo';
import { friendlyName } from './names';
import { isHappeningNow, nextHalfHour } from './time';
import type { Draft, Ping, Profile, ReportReason, ReportTarget, Role } from './types';

const K_ONBOARDED = 'ganapp.onboarded';
const K_LOCMODE = 'ganapp.locmode'; // 'real' | 'makati' | 'intramuros'
const K_HIDDEN = 'ganapp.hidden'; // things this phone reported

export type PingView = Ping & { distance: number; live: boolean };
export type LocationMode = 'real' | SampleArea;

type Ctx = {
  ready: boolean;
  error: string | null;
  retry: () => void;
  uid: string;
  profile: Profile;
  onboarded: boolean;
  location: LatLng;
  locationMode: LocationMode;
  usingSample: boolean;
  now: Date;
  pings: PingView[];
  /** Live, public pings whose vicinity includes you: happening now first, then nearest. */
  nearby: PingView[];
  savedIds: Set<string>;
  goingIds: Set<string>;
  blockedIds: Set<string>;
  hiddenIds: Set<string>;
  draft: Draft;
  updateProfile: (p: Partial<Pick<Profile, 'displayName' | 'role' | 'interests'>>) => Promise<void>;
  finishOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
  setLocationMode: (mode: LocationMode) => Promise<boolean>;
  reload: () => Promise<void>;
  toggleSave: (id: string) => Promise<void>;
  toggleGoing: (id: string) => Promise<void>;
  updateDraft: (d: Partial<Draft>) => void;
  resetDraft: () => void;
  publish: (overrides?: Partial<Draft>) => Promise<Ping>;
  extend: (id: string, hours: number) => Promise<void>;
  removePing: (id: string) => Promise<void>;
  editPing: (id: string, p: api.PingEdit) => Promise<void>;
  addPracticePing: () => Promise<string>;
  reportContent: (target: ReportTarget, id: string, reason: ReportReason) => Promise<void>;
  blockUser: (userId: string) => Promise<void>;
  unblockAll: () => Promise<void>;
  getPing: (id: string) => PingView | undefined;
};

const AppCtx = createContext<Ctx | null>(null);

export const useApp = () => {
  const c = useContext(AppCtx);
  if (!c) throw new Error('useApp must be inside <AppProvider>');
  return c;
};

const emptyDraft = (role: Role): Draft => ({
  photoUri: null,
  photoBase64: null,
  lat: null,
  lng: null,
  title: '',
  category: 'Music',
  placeName: '',
  address: '',
  description: '',
  startsAt: nextHalfHour().toISOString(),
  lengthMin: 180,
  priceLabel: 'Free entry',
  durationH: role === 'promoter' ? 24 : 6,
  radiusM: role === 'promoter' ? 3000 : 1000,
  isPromoted: role === 'promoter',
});

const areaOf = (mode: LocationMode) => (mode === 'real' ? SAMPLE_AREAS.makati : SAMPLE_AREAS[mode]);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [uid, setUid] = useState('');
  const [profile, setProfile] = useState<Profile>({ id: '', displayName: 'Explorer', role: 'explorer', interests: [], verified: false });
  const [onboarded, setOnboarded] = useState(false);
  const [locationMode, setMode] = useState<LocationMode>('makati');
  const [location, setLocation] = useState<LatLng>(SAMPLE_AREAS.makati);
  const [rawPings, setRawPings] = useState<Ping[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [goingIds, setGoingIds] = useState<Set<string>>(new Set());
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set());
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [draft, setDraft] = useState<Draft>(emptyDraft('explorer'));
  const [now, setNow] = useState(new Date());
  const lastFetchAt = useRef<LatLng | null>(null);
  const watcher = useRef<Location.LocationSubscription | null>(null);

  // Tick every 30 s so countdowns and "happening now" stay current.
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const fetchAround = useCallback(async (at: LatLng) => {
    const list = await api.fetchNearby(at.lat, at.lng);
    lastFetchAt.current = at;
    setRawPings(list);
  }, []);

  const stopWatching = () => {
    watcher.current?.remove();
    watcher.current = null;
  };

  /** Follows the phone's position; refetches after moving about 1 km. */
  const startWatching = useCallback(async (): Promise<LatLng | null> => {
    try {
      const perm = await Location.getForegroundPermissionsAsync();
      if (perm.status !== 'granted') return null;
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const here = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setLocation(here);
      stopWatching();
      watcher.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 75 },
        (p) => {
          const at = { lat: p.coords.latitude, lng: p.coords.longitude };
          setLocation(at);
          if (!lastFetchAt.current || distanceM(lastFetchAt.current, at) > 1000) fetchAround(at).catch(() => {});
        },
      );
      return here;
    } catch {
      return null;
    }
  }, [fetchAround]);

  useEffect(() => () => stopWatching(), []);

  // Startup: sign in (anonymously), load profile, location, and nearby pings.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setError(null);
        const id = await api.ensureSession();
        const [ob, savedMode, hidden] = await Promise.all([
          AsyncStorage.getItem(K_ONBOARDED),
          AsyncStorage.getItem(K_LOCMODE),
          AsyncStorage.getItem(K_HIDDEN),
        ]);
        let prof = await api.getProfile(id);
        if (!prof) {
          prof = { id, displayName: friendlyName(id), role: 'explorer', interests: [], verified: false };
          await api.createProfile(prof);
        }
        await api.refreshDemoPings();

        let mode: LocationMode = savedMode === 'real' || savedMode === 'intramuros' ? (savedMode as LocationMode) : 'makati';
        let at: LatLng = areaOf(mode);
        if (mode === 'real') {
          const here = await startWatching();
          if (here) at = here;
          else mode = 'makati';
        }
        const [list, mine] = await Promise.all([api.fetchNearby(at.lat, at.lng), api.fetchMine(id)]);
        if (cancelled) return;
        lastFetchAt.current = at;
        setUid(id);
        setProfile(prof);
        setDraft(emptyDraft(prof.role));
        setOnboarded(ob === '1');
        setMode(mode);
        if (mode !== 'real') setLocation(at);
        setRawPings(list);
        setSavedIds(new Set(mine.saves));
        setGoingIds(new Set(mine.going));
        setBlockedIds(new Set(mine.blocked));
        setHiddenIds(new Set(hidden ? (JSON.parse(hidden) as string[]) : []));
        setReady(true);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Something went wrong.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [attempt, startWatching]);

  const pings: PingView[] = useMemo(
    () =>
      rawPings
        .filter((p) => !hiddenIds.has(p.id) && !(p.creatorId && blockedIds.has(p.creatorId)))
        .map((p) => ({ ...p, distance: distanceM(location, p), live: new Date(p.pingEndsAt).getTime() > now.getTime() })),
    [rawPings, location, now, hiddenIds, blockedIds],
  );

  const nearby = useMemo(
    () =>
      pings
        .filter((p) => p.live && !p.isPrivate && p.distance <= p.radiusM)
        .sort((a, b) => Number(isHappeningNow(b, now)) - Number(isHappeningNow(a, now)) || a.distance - b.distance),
    [pings, now],
  );

  const reload = useCallback(async () => {
    await api.refreshDemoPings();
    await fetchAround(location);
    if (uid) {
      const mine = await api.fetchMine(uid);
      setSavedIds(new Set(mine.saves));
      setGoingIds(new Set(mine.going));
      setBlockedIds(new Set(mine.blocked));
    }
  }, [fetchAround, location, uid]);

  /** Optimistic toggle that undoes itself and explains if the network call fails. */
  const toggleIn = async (
    set: Set<string>,
    setSet: React.Dispatch<React.SetStateAction<Set<string>>>,
    id: string,
    field: 'saved' | 'going',
    call: (on: boolean) => Promise<void>,
  ) => {
    const on = !set.has(id);
    const flip = (value: boolean) => {
      setSet((s) => {
        const n = new Set(s);
        value ? n.add(id) : n.delete(id);
        return n;
      });
      setRawPings((ps) => ps.map((p) => (p.id === id ? { ...p, [field]: Math.max(0, p[field] + (value ? 1 : -1)) } : p)));
    };
    flip(on);
    try {
      await call(on);
    } catch (e: any) {
      flip(!on);
      Alert.alert('Didn’t save', e?.message ?? 'Check your connection and try again.');
    }
  };

  const value: Ctx = {
    ready,
    error,
    retry: () => setAttempt((a) => a + 1),
    uid,
    profile,
    onboarded,
    location,
    locationMode,
    usingSample: locationMode !== 'real',
    now,
    pings,
    nearby,
    savedIds,
    goingIds,
    blockedIds,
    hiddenIds,
    draft,
    updateProfile: async (p) => {
      const prev = profile;
      setProfile({ ...profile, ...p });
      try {
        await api.updateProfile(uid, p);
      } catch (e) {
        setProfile(prev);
        throw e;
      }
    },
    finishOnboarding: async () => {
      await AsyncStorage.setItem(K_ONBOARDED, '1');
      setOnboarded(true);
    },
    resetOnboarding: async () => {
      await AsyncStorage.removeItem(K_ONBOARDED);
      setOnboarded(false);
    },
    setLocationMode: async (mode) => {
      if (mode !== 'real') {
        stopWatching();
        const at = SAMPLE_AREAS[mode];
        await AsyncStorage.setItem(K_LOCMODE, mode);
        setMode(mode);
        setLocation(at);
        await fetchAround(at).catch(() => {});
        return true;
      }
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== 'granted') return false;
      const here = await startWatching();
      if (!here) return false;
      await AsyncStorage.setItem(K_LOCMODE, 'real');
      setMode('real');
      await fetchAround(here).catch(() => {});
      return true;
    },
    reload,
    toggleSave: (id) => toggleIn(savedIds, setSavedIds, id, 'saved', (on) => api.setSaved(uid, id, on)),
    toggleGoing: (id) => toggleIn(goingIds, setGoingIds, id, 'going', (on) => api.setGoing(uid, id, on)),
    updateDraft: (d) => setDraft((x) => ({ ...x, ...d })),
    resetDraft: () => setDraft(emptyDraft(profile.role)),
    publish: async (overrides) => {
      const d = { ...draft, ...overrides, isPromoted: profile.role === 'promoter' && (overrides?.isPromoted ?? draft.isPromoted) };
      const created = await api.createPing(d, uid, profile.displayName);
      setRawPings((ps) => [created, ...ps]);
      setDraft(emptyDraft(profile.role));
      return created;
    },
    extend: async (id, hours) => {
      const newEnd = await api.extendPing(id, hours);
      setRawPings((ps) => ps.map((p) => (p.id === id ? { ...p, pingEndsAt: newEnd } : p)));
    },
    removePing: async (id) => {
      const p = rawPings.find((x) => x.id === id);
      if (!p) return;
      await api.deletePing(p);
      setRawPings((ps) => ps.filter((x) => x.id !== id));
    },
    editPing: async (id, p) => {
      const updated = await api.updatePing(id, p);
      setRawPings((ps) => ps.map((x) => (x.id === id ? updated : x)));
    },
    addPracticePing: async () => {
      const id = await api.createPracticePing();
      await fetchAround(location);
      return id;
    },
    reportContent: async (target, id, reason) => {
      await api.report(target, id, reason);
      const next = new Set(hiddenIds).add(id);
      setHiddenIds(next);
      await AsyncStorage.setItem(K_HIDDEN, JSON.stringify([...next]));
    },
    blockUser: async (userId) => {
      await api.setBlocked(uid, userId, true);
      setBlockedIds((s) => new Set(s).add(userId));
    },
    unblockAll: async () => {
      await api.clearBlocks(uid);
      setBlockedIds(new Set());
      setHiddenIds(new Set());
      await AsyncStorage.removeItem(K_HIDDEN);
    },
    getPing: (id) => pings.find((p) => p.id === id),
  };

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}
