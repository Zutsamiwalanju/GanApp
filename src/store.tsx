import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as api from './api';
import { distanceM, LatLng, SAMPLE_LOCATION } from './geo';
import { nextHalfHour } from './time';
import type { Draft, Ping, Profile, Role } from './types';

const K_ONBOARDED = 'ganapp.onboarded';
const K_LOCMODE = 'ganapp.locmode';

export type PingView = Ping & { distance: number; live: boolean };

type Ctx = {
  ready: boolean;
  error: string | null;
  retry: () => void;
  uid: string;
  profile: Profile;
  onboarded: boolean;
  location: LatLng;
  usingSample: boolean;
  now: Date;
  pings: PingView[];
  /** Live pings whose vicinity includes you, nearest first. */
  nearby: PingView[];
  savedIds: Set<string>;
  goingIds: Set<string>;
  draft: Draft;
  updateProfile: (p: Partial<Omit<Profile, 'id'>>) => Promise<void>;
  finishOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
  setLocationMode: (mode: 'real' | 'sample') => Promise<boolean>;
  reload: () => Promise<void>;
  toggleSave: (id: string) => Promise<void>;
  toggleGoing: (id: string) => Promise<void>;
  updateDraft: (d: Partial<Draft>) => void;
  resetDraft: () => void;
  publish: (overrides?: Partial<Draft>) => Promise<Ping>;
  extend: (id: string, hours: number) => Promise<void>;
  removePing: (id: string) => Promise<void>;
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
  locationVerified: false,
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

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [uid, setUid] = useState('');
  const [profile, setProfile] = useState<Profile>({ id: '', displayName: 'Explorer', role: 'explorer', interests: [] });
  const [onboarded, setOnboarded] = useState(false);
  const [location, setLocation] = useState<LatLng>(SAMPLE_LOCATION);
  const [usingSample, setUsingSample] = useState(true);
  const [rawPings, setRawPings] = useState<Ping[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [goingIds, setGoingIds] = useState<Set<string>>(new Set());
  const [draft, setDraft] = useState<Draft>(emptyDraft('explorer'));
  const [now, setNow] = useState(new Date());

  // Tick every 30 s so countdowns ("Ends in 3h 20m") stay current.
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const loadRealLocation = useCallback(async (): Promise<boolean> => {
    try {
      const perm = await Location.getForegroundPermissionsAsync();
      if (perm.status !== 'granted') return false;
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      setUsingSample(false);
      return true;
    } catch {
      return false;
    }
  }, []);

  const reload = useCallback(async () => {
    if (!uid) return;
    const [p, s, g] = await Promise.all([api.fetchPings(), api.fetchMySaves(uid), api.fetchMyGoing(uid)]);
    setRawPings(p);
    setSavedIds(new Set(s));
    setGoingIds(new Set(g));
  }, [uid]);

  // Startup: sign in (anonymously), load profile, location, and pings.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setError(null);
        const id = await api.ensureSession();
        const [ob, mode] = await Promise.all([AsyncStorage.getItem(K_ONBOARDED), AsyncStorage.getItem(K_LOCMODE)]);
        let prof = await api.getProfile(id);
        if (!prof) {
          prof = { id, displayName: 'Explorer', role: 'explorer', interests: [] };
          await api.saveProfile(prof);
        }
        await api.refreshDemoPings();
        const [p, s, g] = await Promise.all([api.fetchPings(), api.fetchMySaves(id), api.fetchMyGoing(id)]);
        if (mode === 'real') await loadRealLocation();
        if (cancelled) return;
        setUid(id);
        setProfile(prof);
        setDraft(emptyDraft(prof.role));
        setOnboarded(ob === '1');
        setRawPings(p);
        setSavedIds(new Set(s));
        setGoingIds(new Set(g));
        setReady(true);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Something went wrong.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [attempt, loadRealLocation]);

  const pings: PingView[] = useMemo(
    () =>
      rawPings.map((p) => ({
        ...p,
        distance: distanceM(location, p),
        live: new Date(p.pingEndsAt).getTime() > now.getTime(),
      })),
    [rawPings, location, now],
  );

  const nearby = useMemo(
    () => pings.filter((p) => p.live && p.distance <= p.radiusM).sort((a, b) => a.distance - b.distance),
    [pings],
  );

  const updateProfile = useCallback(
    async (p: Partial<Omit<Profile, 'id'>>) => {
      const next = { ...profile, ...p };
      setProfile(next);
      await api.saveProfile(next);
    },
    [profile],
  );

  const value: Ctx = {
    ready,
    error,
    retry: () => setAttempt((a) => a + 1),
    uid,
    profile,
    onboarded,
    location,
    usingSample,
    now,
    pings,
    nearby,
    savedIds,
    goingIds,
    draft,
    updateProfile,
    finishOnboarding: async () => {
      await AsyncStorage.setItem(K_ONBOARDED, '1');
      setOnboarded(true);
    },
    resetOnboarding: async () => {
      await AsyncStorage.removeItem(K_ONBOARDED);
      setOnboarded(false);
    },
    setLocationMode: async (mode) => {
      if (mode === 'sample') {
        await AsyncStorage.setItem(K_LOCMODE, 'sample');
        setLocation(SAMPLE_LOCATION);
        setUsingSample(true);
        return true;
      }
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== 'granted') return false;
      await AsyncStorage.setItem(K_LOCMODE, 'real');
      return loadRealLocation();
    },
    reload,
    toggleSave: async (id) => {
      const on = !savedIds.has(id);
      setSavedIds((s) => {
        const n = new Set(s);
        on ? n.add(id) : n.delete(id);
        return n;
      });
      setRawPings((ps) => ps.map((p) => (p.id === id ? { ...p, saved: Math.max(0, p.saved + (on ? 1 : -1)) } : p)));
      await api.setSaved(uid, id, on);
    },
    toggleGoing: async (id) => {
      const on = !goingIds.has(id);
      setGoingIds((s) => {
        const n = new Set(s);
        on ? n.add(id) : n.delete(id);
        return n;
      });
      setRawPings((ps) => ps.map((p) => (p.id === id ? { ...p, going: Math.max(0, p.going + (on ? 1 : -1)) } : p)));
      await api.setGoing(uid, id, on);
    },
    updateDraft: (d) => setDraft((x) => ({ ...x, ...d })),
    resetDraft: () => setDraft(emptyDraft(profile.role)),
    publish: async (overrides) => {
      const created = await api.createPing({ ...draft, ...overrides }, uid, profile.displayName);
      setRawPings((ps) => [created, ...ps]);
      setDraft(emptyDraft(profile.role));
      return created;
    },
    extend: async (id, hours) => {
      const newEnd = await api.extendPing(id, hours);
      setRawPings((ps) => ps.map((p) => (p.id === id ? { ...p, pingEndsAt: newEnd } : p)));
    },
    removePing: async (id) => {
      await api.deletePing(id);
      setRawPings((ps) => ps.filter((p) => p.id !== id));
    },
    getPing: (id) => pings.find((p) => p.id === id),
  };

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}
