/**
 * Supabase 호출 모음. 백엔드 연동 안내 v2의 "핵심 호출 코드"를 그대로 옮겼다.
 * 화면은 이 파일의 함수만 쓰고, supabase-js를 직접 부르지 않는다.
 */
import type { PostgrestError } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type { Id, Meetup, MeetupMember, ProofStatus, Profile, Program, QnaPost, QnaThread } from './types';

export const DISTRICT = '종로구';
export const MIN_MEMBERS = 2;
export const MAX_MEMBERS = 20;

const MEETUP_SELECT = 'id,program_id,creator_id,max_members,status,created_at,programs(id,name,venue,schedule_text,registration_url)';

/** DB 에러를 사람이 읽을 문장으로 바꾼다 */
export function friendlyError(e: { message?: string; code?: string } | null | undefined): string {
  if (!e) return '알 수 없는 오류가 났어요';
  const msg = (e.message ?? '').toLowerCase();
  if (e.code === '23505' || msg.includes('duplicate')) return '이미 참여한 모집이에요';
  if (msg.includes('full') || msg.includes('capacity') || msg.includes('정원') || msg.includes('max_members')) return '정원이 다 찼어요';
  if (e.code === '23514') return `정원은 개설자 포함 ${MIN_MEMBERS}~${MAX_MEMBERS}명이에요`;
  if (e.code === '42501' || msg.includes('row-level security') || msg.includes('permission')) return '로그인이 필요하거나 권한이 없어요';
  if (msg.includes('invalid login credentials')) return '이메일 또는 비밀번호가 맞지 않아요';
  if (msg.includes('user already registered')) return '이미 가입된 이메일이에요';
  if (msg.includes('password should be at least')) return '비밀번호는 6자 이상이어야 해요';
  if (msg.includes('bucket not found')) return '캡처 저장소가 아직 준비되지 않았어요 (백엔드 05 적용 확인)';
  if (msg.includes('signups') && msg.includes('disabled')) return '지금은 새 가입이 막혀 있어요. 운영진(백엔드)에게 이메일 가입 허용을 요청해 주세요';
  if (msg.includes('rate limit')) return '가입 메일을 너무 자주 보냈어요. 메일함의 인증 링크를 확인하거나 잠시 뒤 다시 시도해 주세요';
  if (msg.includes('email not confirmed')) return '메일함에서 가입 인증 링크를 먼저 눌러 주세요';
  if (msg.includes('failed to fetch') || msg.includes('network')) return '서버에 연결하지 못했어요. 인터넷 연결을 확인해 주세요';
  return e.message ?? '오류가 났어요';
}

function check<T>(data: T | null, error: PostgrestError | null): T {
  if (error) throw Object.assign(new Error(friendlyError(error)), { cause: error });
  return data as T;
}

/* ───────── 1) 회원가입 / 로그인 ───────── */

export async function signUp(email: string, password: string, nickname: string) {
  const { data, error } = await supabase().auth.signUp({ email, password, options: { data: { nickname } } });
  if (error) throw new Error(friendlyError(error));
  // 이메일 인증을 켜 둔 프로젝트면 session이 null로 온다
  return { needsEmailConfirm: !data.session };
}

export async function signIn(email: string, password: string) {
  const { error } = await supabase().auth.signInWithPassword({ email, password });
  if (error) throw new Error(friendlyError(error));
}

export async function signOut() {
  await supabase().auth.signOut();
}

export async function getMyProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase()
    .from('profiles')
    .select('id,nickname,neighborhood_code,neighborhood_name,location_checked_at,created_at')
    .eq('id', userId)
    .maybeSingle();
  if (error) return null; // 프로필을 못 읽어도 앱은 계속 쓸 수 있게
  return data as Profile | null;
}

/* ───────── 2) 종로구 공식 프로그램 ───────── */

export async function listPrograms(): Promise<Program[]> {
  const { data, error } = await supabase()
    .from('programs')
    .select('id,name,venue,district,schedule_text,registration_url')
    .eq('district', DISTRICT)
    .order('name');
  return check(data as Program[] | null, error) ?? [];
}

/* ───────── 3) 모집글 ───────── */

export async function listMeetups(): Promise<Meetup[]> {
  const { data, error } = await supabase().from('meetups').select(MEETUP_SELECT).order('created_at', { ascending: false });
  return (check(data, error) ?? []) as unknown as Meetup[];
}

export async function getMeetup(id: Id): Promise<Meetup | null> {
  const { data, error } = await supabase().from('meetups').select(MEETUP_SELECT).eq('id', id).maybeSingle();
  return check(data, error) as unknown as Meetup | null;
}

export async function getMeetupsByIds(ids: Id[]): Promise<Meetup[]> {
  if (ids.length === 0) return [];
  const { data, error } = await supabase().from('meetups').select(MEETUP_SELECT).in('id', ids).order('created_at', { ascending: false });
  return (check(data, error) ?? []) as unknown as Meetup[];
}

/* ───────── 4) 모집글 생성 (개설자는 자동으로 참여자 1명) ───────── */

export async function createMeetup(programId: Id, creatorId: string, maxMembers: number): Promise<Meetup> {
  const { data, error } = await supabase()
    .from('meetups')
    .insert({ program_id: programId, creator_id: creatorId, max_members: maxMembers })
    .select('id,program_id,creator_id,max_members,status')
    .single();
  return check(data, error) as unknown as Meetup;
}

/* ───────── 5) 선착순 참여 / 6) 참여 취소 ───────── */

export async function joinMeetup(meetupId: Id, userId: string) {
  const { error } = await supabase().from('meetup_members').insert({ meetup_id: meetupId, user_id: userId });
  if (error) throw new Error(friendlyError(error));
}

export async function leaveMeetup(meetupId: Id, userId: string) {
  const { error } = await supabase().from('meetup_members').delete().eq('meetup_id', meetupId).eq('user_id', userId);
  if (error) throw new Error(friendlyError(error));
}

/* ───────── 7) 참여자 (로그인 필요) ───────── */

export async function listMembers(meetupId: Id): Promise<MeetupMember[]> {
  const base = 'user_id,joined_at,profiles(nickname,neighborhood_name,location_checked_at)';
  let res: { data: unknown; error: PostgrestError | null } = await supabase()
    .from('meetup_members')
    .select(`${base},self_reported_at,proof_path`)
    .eq('meetup_id', meetupId)
    .order('joined_at', { ascending: true });
  // 마이그레이션 05가 아직 안 들어간 DB면 증빙 컬럼 없이 다시 읽는다
  if (res.error && (res.error.code === '42703' || /self_reported_at|proof_path/.test(res.error.message))) {
    res = await supabase().from('meetup_members').select(base).eq('meetup_id', meetupId).order('joined_at', { ascending: true });
  }
  return (check(res.data as MeetupMember[] | null, res.error) ?? []) as MeetupMember[];
}

/**
 * 목록 화면용 참여 인원 수. 로그인해야 읽을 수 있어서, 실패하면 null(모름)을 돌려준다.
 * 결과: meetup_id → 참여자 user_id 목록
 */
export async function memberIndex(meetupIds: Id[]): Promise<Map<string, string[]> | null> {
  if (meetupIds.length === 0) return new Map();
  const { data, error } = await supabase().from('meetup_members').select('meetup_id,user_id').in('meetup_id', meetupIds);
  if (error || !data) return null;
  const map = new Map<string, string[]>();
  for (const row of data as { meetup_id: Id; user_id: string }[]) {
    const k = String(row.meetup_id);
    map.set(k, [...(map.get(k) ?? []), row.user_id]);
  }
  return map;
}

export async function myMeetupIds(userId: string): Promise<Id[]> {
  const { data, error } = await supabase().from('meetup_members').select('meetup_id').eq('user_id', userId);
  return ((check(data, error) ?? []) as { meetup_id: Id }[]).map((r) => r.meetup_id);
}

/* ───────── 8) 공개 Q&A / 9) 질문·답변 작성 ───────── */

export async function listQna(meetupId: Id): Promise<QnaThread[]> {
  const { data, error } = await supabase()
    .from('qna_posts')
    .select('id,author_id,parent_id,content,created_at')
    .eq('meetup_id', meetupId)
    .order('created_at', { ascending: true });
  const posts = (check(data, error) ?? []) as QnaPost[];
  const questions = posts.filter((p) => p.parent_id === null);
  return questions.map((q) => ({ ...q, answers: posts.filter((p) => p.parent_id !== null && String(p.parent_id) === String(q.id)) }));
}

export async function postQuestion(meetupId: Id, authorId: string, content: string) {
  const { error } = await supabase().from('qna_posts').insert({ meetup_id: meetupId, author_id: authorId, parent_id: null, content });
  if (error) throw new Error(friendlyError(error));
}

export async function postAnswer(meetupId: Id, authorId: string, questionId: Id, content: string) {
  const { error } = await supabase().from('qna_posts').insert({ meetup_id: meetupId, author_id: authorId, parent_id: questionId, content });
  if (error) throw new Error(friendlyError(error));
}

/* ───────── 수강 신청 증빙 (FE_remaining_features 1·2) ───────── */

const PROOF_BUCKET = 'enrollment-proofs';
const PROOF_TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
export const PROOF_MAX_BYTES = 5 * 1024 * 1024;

export function proofStatus(m: Pick<MeetupMember, 'self_reported_at' | 'proof_path'>): ProofStatus {
  if (m.proof_path) return '증빙 제출';
  if (m.self_reported_at) return '신청했다고 신고';
  return '미신고';
}

/** 파일 검사만 (업로드 전 화면에서 바로 알려 주기용) */
export function checkProofFile(file: File): string | null {
  if (!PROOF_TYPES[file.type]) return 'JPG, PNG, WebP 이미지만 올릴 수 있어요';
  if (file.size > PROOF_MAX_BYTES) return '5MB 이하 이미지만 올릴 수 있어요';
  return null;
}

/** 캡처 없이 '신청했어요'만 본인 신고 */
export async function selfReport(meetupId: Id, userId: string) {
  const { error } = await supabase()
    .from('meetup_members')
    .update({ self_reported_at: new Date().toISOString() })
    .eq('meetup_id', meetupId)
    .eq('user_id', userId);
  if (error) throw new Error(friendlyError(error));
}

/** 캡처 업로드 + 신고. DB 저장이 실패하면 올린 파일을 지워 고아 파일을 남기지 않는다. */
export async function uploadProof(meetupId: Id, userId: string, file: File): Promise<string> {
  const bad = checkProofFile(file);
  if (bad) throw new Error(bad);
  const path = `${meetupId}/${userId}/${crypto.randomUUID()}.${PROOF_TYPES[file.type]}`;
  const sb = supabase();
  const up = await sb.storage.from(PROOF_BUCKET).upload(path, file, { contentType: file.type, upsert: false });
  if (up.error) throw new Error(friendlyError(up.error));
  const { error } = await sb
    .from('meetup_members')
    .update({ self_reported_at: new Date().toISOString(), proof_path: path })
    .eq('meetup_id', meetupId)
    .eq('user_id', userId);
  if (error) {
    await sb.storage.from(PROOF_BUCKET).remove([path]);
    throw new Error(friendlyError(error));
  }
  return path;
}

/** 내 캡처 삭제 (신고 시각은 남긴다) */
export async function removeProof(meetupId: Id, userId: string, path: string) {
  const sb = supabase();
  const rm = await sb.storage.from(PROOF_BUCKET).remove([path]);
  if (rm.error) throw new Error(friendlyError(rm.error));
  const { error } = await sb.from('meetup_members').update({ proof_path: null }).eq('meetup_id', meetupId).eq('user_id', userId);
  if (error) throw new Error(friendlyError(error));
}

/** 같은 모집 참여자만 열 수 있는 60초짜리 링크 */
export async function proofUrl(path: string): Promise<string> {
  const { data, error } = await supabase().storage.from(PROOF_BUCKET).createSignedUrl(path, 60);
  if (error || !data) throw new Error(error ? friendlyError(error) : '캡처를 열 수 없어요');
  return data.signedUrl;
}

/* ───────── 동네 위치 확인 (FE_remaining_features 3) ───────── */

export interface NeighborhoodResult {
  neighborhood_name: string;
  location_checked_at: string;
}

function currentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) return reject(new Error('이 브라우저는 위치 확인을 지원하지 않아요'));
    navigator.geolocation.getCurrentPosition(resolve, (e) => {
      if (e.code === e.PERMISSION_DENIED) reject(new Error('위치 권한이 거절됐어요. 브라우저 주소창의 자물쇠 아이콘에서 위치를 허용한 뒤 다시 시도해 주세요'));
      else if (e.code === e.TIMEOUT) reject(new Error('위치를 찾는 데 시간이 너무 걸렸어요. 창가나 밖에서 다시 시도해 주세요'));
      else reject(new Error('위치를 찾지 못했어요. 잠시 뒤 다시 시도해 주세요'));
    }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 });
  });
}

/** 브라우저 좌표 → Edge Function(verify-neighborhood) → profiles에 행정동 저장 */
export async function verifyNeighborhood(): Promise<NeighborhoodResult> {
  const { coords } = await currentPosition();
  const { data, error } = await supabase().functions.invoke('verify-neighborhood', {
    body: { latitude: coords.latitude, longitude: coords.longitude, accuracyMeters: coords.accuracy },
  });
  if (error) {
    let msg = '';
    const ctx = (error as { context?: Response }).context;
    if (ctx && typeof ctx.json === 'function') {
      try {
        const body = await ctx.json();
        msg = body?.error || body?.message || '';
      } catch {
        /* 본문이 JSON이 아니면 무시 */
      }
    }
    throw new Error(msg || (error.message?.includes('Failed to send') ? '위치 확인 서버에 연결하지 못했어요 (Edge Function 배포 확인 필요)' : '동네를 확인하지 못했어요. 잠시 뒤 다시 시도해 주세요'));
  }
  return data as NeighborhoodResult;
}
