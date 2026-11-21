import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { ChatMessage, Participant, Slot } from './types';

let client: SupabaseClient | null | undefined;

/** 환경 변수가 없으면 null → 앱은 로컬 목업 모드로 돈다. */
export function getSupabase(): SupabaseClient | null {
  if (client !== undefined) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  client = url && key ? createClient(url, key) : null;
  return client;
}

/* DB(snake_case) ↔ 앱(camelCase) 변환. 스키마는 supabase/schema.sql 참고 */

type Row = Record<string, unknown>;

export const slotFromRow = (r: Row): Slot => ({
  id: r.id as string,
  facilityId: r.facility_id as string,
  startAt: r.start_at as string,
  endAt: r.end_at as string,
  purpose: r.purpose as string,
  vibeTags: (r.vibe_tags as string[]) ?? [],
  audience: (r.audience as Slot['audience']) ?? 'anyone',
  requiredCount: r.required_count as number,
  hostNickname: r.host_nickname as string,
  hostPinHash: r.host_pin_hash as string,
  chatEnabled: (r.chat_enabled as boolean) ?? true,
  status: r.status as Slot['status'],
  openedAt: (r.opened_at as string) ?? undefined,
  bookedAt: (r.booked_at as string) ?? undefined,
  parentSlotId: (r.parent_slot_id as string) ?? undefined,
  createdAt: r.created_at as string,
});

export const slotToRow = (s: Slot): Row => ({
  id: s.id,
  facility_id: s.facilityId,
  start_at: s.startAt,
  end_at: s.endAt,
  purpose: s.purpose,
  vibe_tags: s.vibeTags,
  audience: s.audience,
  required_count: s.requiredCount,
  host_nickname: s.hostNickname,
  host_pin_hash: s.hostPinHash,
  chat_enabled: s.chatEnabled,
  status: s.status,
  opened_at: s.openedAt ?? null,
  booked_at: s.bookedAt ?? null,
  parent_slot_id: s.parentSlotId ?? null,
  created_at: s.createdAt,
});

export const participantFromRow = (r: Row): Participant => ({
  id: r.id as string,
  slotId: r.slot_id as string,
  nickname: r.nickname as string,
  pinHash: r.pin_hash as string,
  isHost: r.is_host as boolean,
  joinedAt: r.joined_at as string,
  verification: { school: (r.school as string) ?? undefined, neighborhood: (r.neighborhood as string) ?? undefined },
  manner: (r.manner as number | null) ?? null,
});

export const participantToRow = (p: Participant): Row => ({
  id: p.id,
  slot_id: p.slotId,
  nickname: p.nickname,
  pin_hash: p.pinHash,
  is_host: p.isHost,
  joined_at: p.joinedAt,
  school: p.verification.school ?? null,
  neighborhood: p.verification.neighborhood ?? null,
  manner: p.manner,
});

export const messageFromRow = (r: Row): ChatMessage => ({
  id: r.id as string,
  slotId: r.slot_id as string,
  nickname: r.nickname as string,
  text: r.text as string,
  at: r.at as string,
});

export const messageToRow = (m: ChatMessage): Row => ({ id: m.id, slot_id: m.slotId, nickname: m.nickname, text: m.text, at: m.at });
