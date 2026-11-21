/**
 * 백엔드 연동 안내(FE_supabase_contract_v2, 2026-11-21) 기준 테이블 타입.
 * id 타입은 DB에서 uuid/bigint 어느 쪽이어도 되도록 string | number로 둔다.
 */
export type Id = string | number;

export interface Profile {
  id: string;
  nickname: string | null;
  neighborhood_code: string | null;
  neighborhood_name: string | null;
  location_checked_at: string | null;
  created_at: string;
}

export interface Program {
  id: Id;
  source_name?: string | null;
  external_id?: string | null;
  name: string;
  venue: string | null;
  district: string | null;
  /** 회차별 날짜가 아니라 사람이 읽는 문자열 */
  schedule_text: string | null;
  /** 온라인 예약 URL이 아니라 공식 안내 페이지일 수 있음 */
  registration_url: string | null;
  registration_end_at?: string | null;
}

export type MeetupStatus = 'OPEN' | 'CLOSED';

export interface Meetup {
  id: Id;
  program_id: Id;
  creator_id: string;
  max_members: number;
  status: MeetupStatus;
  created_at: string;
  programs: Pick<Program, 'id' | 'name' | 'venue' | 'schedule_text'> & Partial<Program> | null;
}

export interface MeetupMember {
  user_id: string;
  joined_at: string;
  /** 신청했다고 본인이 신고한 시각 (마이그레이션 05 이후) */
  self_reported_at?: string | null;
  /** enrollment-proofs 버킷 안의 캡처 경로 (마이그레이션 05 이후) */
  proof_path?: string | null;
  profiles: Pick<Profile, 'nickname' | 'neighborhood_name' | 'location_checked_at'> | null;
}

/** 수강 신청 배지 — 기관이 확정한 것처럼 보이면 안 된다 (BE 안내) */
export type ProofStatus = '미신고' | '신청했다고 신고' | '증빙 제출';

export interface QnaPost {
  id: Id;
  author_id: string;
  parent_id: Id | null;
  content: string;
  created_at: string;
}

/** 질문 + 그 아래 답변 */
export interface QnaThread extends QnaPost {
  answers: QnaPost[];
}
