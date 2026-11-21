'use client';

/**
 * 앱 상태. Supabase 환경 변수가 있으면 slots/participants/messages를 DB와 실시간으로 맞추고,
 * 없으면 브라우저 localStorage에 저장하는 목업 모드로 돈다. 화면은 어느 모드인지 몰라도 된다.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { buildViews, hashPin, requiredCount } from './calc';
import { ME_SEED_JOIN, meSeed, population, seedFacilities, seedMessages, seedNotices, seedParticipants, seedSlots } from './mock';
import {
  getSupabase,
  messageFromRow,
  messageToRow,
  participantFromRow,
  participantToRow,
  slotFromRow,
  slotToRow,
} from './supabase';
import type { Audience, ChatMessage, Facility, Me, Notice, Participant, Slot, SlotView } from './types';

const KEY = 'jakdang:v1';
const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 9)}`;

interface Persisted {
  slots: Slot[];
  participants: Participant[];
  messages: ChatMessage[];
  notices: Notice[];
  me: Me;
  joined: Record<string, string>; // slotId → 내 participantId
  todayJoined: number;
  checkedOut: string[];
}

export interface CreateInput {
  facilityId: string;
  startAt: string;
  endAt: string;
  purpose: string;
  vibeTags: string[];
  audience: Audience;
  nickname: string;
  pin: string;
}

interface Store {
  ready: boolean;
  mode: 'supabase' | 'local';
  now: number;
  facilities: Facility[];
  views: SlotView[];
  me: Me;
  notices: Notice[];
  todayJoined: number;
  checkedOut: string[];
  messagesOf: (slotId: string) => ChatMessage[];
  view: (slotId: string) => SlotView | undefined;
  join: (slotId: string, nickname: string, pin: string) => Promise<{ ok: boolean; opened: boolean; message?: string }>;
  cancel: (slotId: string, pin: string) => Promise<boolean>;
  createSlot: (input: CreateInput) => Promise<string>;
  markBooked: (slotId: string) => void;
  reopenNextWeek: (slotId: string) => Promise<string | null>;
  sendMessage: (slotId: string, text: string) => void;
  toggleFriend: (nickname: string) => void;
  checkout: (slotId: string, praises: Record<string, string[]>) => void;
  readAllNotices: () => void;
  reset: () => void;
}

const Ctx = createContext<Store | null>(null);

function seed(now: number): Persisted {
  return {
    slots: seedSlots(now),
    participants: seedParticipants(now),
    messages: seedMessages(now),
    notices: seedNotices(now),
    me: meSeed,
    joined: { ...ME_SEED_JOIN },
    todayJoined: 37,
    checkedOut: [],
  };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const sb = getSupabase();
  // 시간에 따라 바뀌는 값은 화면이 뜬 뒤(클라이언트)에만 만든다
  const [now, setNow] = useState(0);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [data, setData] = useState<Persisted | null>(null);
  const dataRef = useRef<Persisted | null>(null);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // 처음 불러오기 (클라이언트에서만)
  useEffect(() => {
    let local: Persisted | null = null;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) local = JSON.parse(raw) as Persisted;
    } catch {
      local = null;
    }
    const t = Date.now();
    // localStorage(외부 저장소)에서 처음 한 번 불러오는 hydration이라 effect 안에서 setState 한다
    /* eslint-disable react-hooks/set-state-in-effect */
    setNow(t);
    setFacilities(seedFacilities(t));
    setData(local ?? seed(t));
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // 로컬 모드 저장
  useEffect(() => {
    if (!data) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      /* 저장 실패해도 화면은 계속 동작 */
    }
  }, [data]);

  // 마감 카운트다운용 시계
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  // Supabase 모드: 불러오기 + 실시간 구독
  useEffect(() => {
    if (!sb) return;
    let cancelled = false;
    const load = async () => {
      const [s, p, m] = await Promise.all([
        sb.from('slots').select('*'),
        sb.from('participants').select('*'),
        sb.from('messages').select('*').order('at'),
      ]);
      if (cancelled) return;
      if (!s.error && s.data.length === 0) {
        // 빈 DB면 시연 데이터를 한 번 넣는다
        const sd = seed(Date.now());
        await sb.from('slots').insert(sd.slots.map(slotToRow));
        await sb.from('participants').insert(sd.participants.map(participantToRow));
        await sb.from('messages').insert(sd.messages.map(messageToRow));
        return load();
      }
      setData((d) =>
        d
          ? {
              ...d,
              slots: s.data ? s.data.map(slotFromRow) : d.slots,
              participants: p.data ? p.data.map(participantFromRow) : d.participants,
              messages: m.data ? m.data.map(messageFromRow) : d.messages,
            }
          : d,
      );
    };
    load();
    const ch = sb
      .channel('jakdang')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'slots' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'participants' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, load)
      .subscribe();
    return () => {
      cancelled = true;
      sb.removeChannel(ch);
    };
  }, [sb]);

  const update = useCallback((fn: (d: Persisted) => Persisted) => setData((d) => (d ? fn(d) : d)), []);

  const views = useMemo(
    () => (data ? buildViews(data.slots, facilities, data.participants, population, { nickname: data.me.nickname, friends: data.me.friends, joined: data.joined }, now) : []),
    [data, facilities, now],
  );

  const pushNotice = (d: Persisted, n: Omit<Notice, 'id' | 'at' | 'read'>): Persisted => ({
    ...d,
    notices: [{ ...n, id: uid('n'), at: new Date().toISOString(), read: false }, ...d.notices],
  });

  const join: Store['join'] = async (slotId, nickname, pin) => {
    const d = dataRef.current;
    if (!d) return { ok: false, opened: false };
    if (d.joined[slotId]) return { ok: false, opened: false, message: '이미 참여한 작당이에요' };
    const v = views.find((x) => x.id === slotId);
    if (!v) return { ok: false, opened: false };
    if (v.isFull) return { ok: false, opened: false, message: '정원이 다 찼어요' };
    const p: Participant = {
      id: uid('p'),
      slotId,
      nickname: nickname.trim() || d.me.nickname,
      pinHash: await hashPin(pin),
      isHost: false,
      joinedAt: new Date().toISOString(),
      verification: d.me.verification,
      manner: d.me.manner,
    };
    const opened = !v.isOpen && v.currentCount + 1 >= v.requiredCount;
    const sysMsg: ChatMessage | null = opened
      ? { id: uid('m'), slotId, nickname: 'system', text: `${v.requiredCount}명이 모여 작당에 성공했어요! 작당방이 열렸어요`, at: new Date().toISOString() }
      : null;
    if (sb) {
      await sb.from('participants').insert(participantToRow(p));
      if (opened) {
        await sb.from('slots').update({ status: 'opened', opened_at: new Date().toISOString() }).eq('id', slotId);
        await sb.from('messages').insert(messageToRow(sysMsg!));
      }
    }
    update((x) => {
      let next: Persisted = {
        ...x,
        participants: sb ? x.participants : [...x.participants, p],
        joined: { ...x.joined, [slotId]: p.id },
        todayJoined: x.todayJoined + 1,
        slots: sb || !opened ? x.slots : x.slots.map((s) => (s.id === slotId ? { ...s, status: 'opened', openedAt: new Date().toISOString() } : s)),
        messages: sb || !sysMsg ? x.messages : [...x.messages, sysMsg],
      };
      if (opened) next = pushNotice(next, { kind: 'opened', strong: v.facility.facilityName, text: '작당에 성공했어요! 작당방에서 인사 나눠 보세요.', href: `/chat/${slotId}` });
      return next;
    });
    return { ok: true, opened };
  };

  const cancel: Store['cancel'] = async (slotId, pin) => {
    const d = dataRef.current;
    if (!d) return false;
    const pid = d.joined[slotId];
    const p = d.participants.find((x) => x.id === pid);
    if (!p) return false;
    if (p.pinHash && p.pinHash !== (await hashPin(pin))) return false;
    if (sb) await sb.from('participants').delete().eq('id', pid);
    update((x) => {
      const joined = { ...x.joined };
      delete joined[slotId];
      return { ...x, joined, participants: x.participants.filter((y) => y.id !== pid), todayJoined: Math.max(0, x.todayJoined - 1) };
    });
    return true;
  };

  const createSlot: Store['createSlot'] = async (input) => {
    const d = dataRef.current!;
    const f = facilities.find((x) => x.id === input.facilityId)!;
    const pinHash = await hashPin(input.pin);
    const slot: Slot = {
      id: uid('s'),
      facilityId: f.id,
      startAt: input.startAt,
      endAt: input.endAt,
      purpose: input.purpose,
      vibeTags: input.vibeTags,
      audience: input.audience,
      requiredCount: requiredCount(f),
      hostNickname: input.nickname,
      hostPinHash: pinHash,
      chatEnabled: true,
      status: 'recruiting',
      createdAt: new Date().toISOString(),
    };
    const host: Participant = {
      id: uid('p'),
      slotId: slot.id,
      nickname: input.nickname,
      pinHash,
      isHost: true,
      joinedAt: new Date().toISOString(),
      verification: d.me.verification,
      manner: d.me.manner,
    };
    if (sb) {
      await sb.from('slots').insert(slotToRow(slot));
      await sb.from('participants').insert(participantToRow(host));
    }
    update((x) => ({
      ...x,
      slots: sb ? x.slots : [slot, ...x.slots],
      participants: sb ? x.participants : [...x.participants, host],
      joined: { ...x.joined, [slot.id]: host.id },
      todayJoined: x.todayJoined + 1,
    }));
    return slot.id;
  };

  const markBooked: Store['markBooked'] = (slotId) => {
    const at = new Date().toISOString();
    if (sb) sb.from('slots').update({ status: 'booked', booked_at: at }).eq('id', slotId).then(() => undefined);
    update((x) => ({ ...x, slots: x.slots.map((s) => (s.id === slotId ? { ...s, status: 'booked', bookedAt: at } : s)) }));
  };

  const reopenNextWeek: Store['reopenNextWeek'] = async (slotId) => {
    const d = dataRef.current;
    const s = d?.slots.find((x) => x.id === slotId);
    if (!d || !s) return null;
    const week = 7 * 24 * 60 * 60 * 1000;
    const copy: Slot = {
      ...s,
      id: uid('s'),
      startAt: new Date(new Date(s.startAt).getTime() + week).toISOString(),
      endAt: new Date(new Date(s.endAt).getTime() + week).toISOString(),
      status: 'recruiting',
      openedAt: undefined,
      bookedAt: undefined,
      parentSlotId: s.id,
      createdAt: new Date().toISOString(),
    };
    // 같은 멤버를 미리 담아 둔다
    const members = d.participants
      .filter((p) => p.slotId === slotId)
      .map((p) => ({ ...p, id: uid('p'), slotId: copy.id, joinedAt: new Date().toISOString() }));
    const myOld = d.joined[slotId];
    const myNew = members[d.participants.filter((p) => p.slotId === slotId).findIndex((p) => p.id === myOld)]?.id;
    if (sb) {
      await sb.from('slots').insert(slotToRow(copy));
      await sb.from('participants').insert(members.map(participantToRow));
    }
    update((x) => ({
      ...x,
      slots: sb ? x.slots : [copy, ...x.slots],
      participants: sb ? x.participants : [...x.participants, ...members],
      joined: myNew ? { ...x.joined, [copy.id]: myNew } : x.joined,
    }));
    return copy.id;
  };

  const sendMessage: Store['sendMessage'] = (slotId, text) => {
    const d = dataRef.current;
    if (!d || !text.trim()) return;
    const m: ChatMessage = { id: uid('m'), slotId, nickname: d.me.nickname, text: text.trim(), at: new Date().toISOString() };
    if (sb) sb.from('messages').insert(messageToRow(m)).then(() => undefined);
    else update((x) => ({ ...x, messages: [...x.messages, m] }));
  };

  const toggleFriend: Store['toggleFriend'] = (nickname) =>
    update((x) => ({
      ...x,
      me: { ...x.me, friends: x.me.friends.includes(nickname) ? x.me.friends.filter((f) => f !== nickname) : [...x.me.friends, nickname] },
    }));

  const checkout: Store['checkout'] = (slotId, praises) =>
    update((x) => {
      const given = Object.values(praises).reduce((a, b) => a + b.length, 0);
      const next: Persisted = {
        ...x,
        checkedOut: [...x.checkedOut, slotId],
        me: { ...x.me, checkouts: x.me.checkouts + 1, keptPromises: x.me.keptPromises + 1, totalPromises: x.me.totalPromises + 1, manner: Math.min(100, x.me.manner + 1) },
      };
      return pushNotice(next, { kind: 'manner', text: `뒷정리 작전 완료! 이웃에게 칭찬 ${given}개를 보냈어요. 믿음 도장이 ${next.me.manner}점이 되었어요.`, href: '/me' });
    });

  const readAllNotices = () => update((x) => ({ ...x, notices: x.notices.map((n) => ({ ...n, read: true })) }));

  const reset = () => {
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
    setData(seed(Date.now()));
  };

  const value: Store = {
    ready: !!data && facilities.length > 0,
    mode: sb ? 'supabase' : 'local',
    now,
    facilities,
    views,
    me: data?.me ?? meSeed,
    notices: data?.notices ?? [],
    todayJoined: data?.todayJoined ?? 0,
    checkedOut: data?.checkedOut ?? [],
    messagesOf: (slotId) => (data?.messages ?? []).filter((m) => m.slotId === slotId).sort((a, b) => a.at.localeCompare(b.at)),
    view: (slotId) => views.find((v) => v.id === slotId),
    join,
    cancel,
    createSlot,
    markBooked,
    reopenNextWeek,
    sendMessage,
    toggleFriend,
    checkout,
    readAllNotices,
    reset,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore는 StoreProvider 안에서 써야 해요');
  return s;
}
