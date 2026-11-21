'use client';

import type { User } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { getMyProfile } from './api';
import { isConfigured, supabase } from './supabase';
import type { Profile } from './types';

interface AuthState {
  ready: boolean;
  configured: boolean;
  user: User | null;
  profile: Profile | null;
  /** 화면에 보여 줄 닉네임 (프로필 → 가입 메타데이터 → 이메일 앞부분) */
  nickname: string;
  refreshProfile: () => Promise<void>;
}

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isConfigured();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const loadProfile = useCallback(async (u: User | null) => {
    setProfile(u ? await getMyProfile(u.id) : null);
  }, []);

  useEffect(() => {
    if (!configured) {
      // 환경 변수가 없으면 로그인 없이 안내 화면만 보여 준다
      const t = setTimeout(() => setReady(true), 0);
      return () => clearTimeout(t);
    }
    const sb = supabase();
    let alive = true;
    sb.auth.getUser().then(async ({ data }) => {
      if (!alive) return;
      setUser(data.user ?? null);
      await loadProfile(data.user ?? null);
      if (alive) setReady(true);
    });
    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      loadProfile(u);
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [configured, loadProfile]);

  const meta = user?.user_metadata as { nickname?: string } | undefined;
  const nickname = profile?.nickname || meta?.nickname || user?.email?.split('@')[0] || '';

  return (
    <Ctx.Provider value={{ ready, configured, user, profile, nickname, refreshProfile: () => loadProfile(user) }}>{children}</Ctx.Provider>
  );
}

export function useAuth(): AuthState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth는 AuthProvider 안에서 써야 해요');
  return v;
}

/** 간단한 비동기 로더: 데이터·로딩·에러·다시 불러오기 */
export function useLoad<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [state, setState] = useState<{ data: T | null; loading: boolean; error: string | null }>({ data: null, loading: true, error: null });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let alive = true;
    fn().then(
      (data) => alive && setState({ data, loading: false, error: null }),
      (e: unknown) => alive && setState((s) => ({ data: s.data, loading: false, error: e instanceof Error ? e.message : String(e) })),
    );
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);
  return { ...state, reload: () => setTick((t) => t + 1) };
}
