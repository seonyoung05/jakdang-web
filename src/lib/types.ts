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

/** 공공기관 공식 공간 (07 마이그레이션) */
export interface Space {
  id: Id;
  source_name?: string | null;
  external_id?: string | null;
  name: string;
  venue: string | null;
  district: string | null;
  address: string | null;
  /** 공식 대관 안내 페이지 */
  reservation_url: string | null;
  reservation_info: string | null;
  /** 공간 수용 인원 (모집 정원은 이걸 넘으면 안 됨) */
  capacity: number | null;
  usage_notes: string | null;
}

export type MeetupStatus = 'OPEN' | 'CLOSED';
/** CLASS = 교육 같이 듣기, SPACE = 공간 함께 쓰기 */
export type MeetupType = 'CLASS' | 'SPACE';

export interface Meetup {
  id: Id;
  /** 07 이전 DB에는 없으므로 없으면 CLASS로 본다 */
  meetup_type?: MeetupType | null;
  program_id: Id | null;
  space_id?: Id | null;
  /** SPACE: 함께할 활동 이름 */
  activity_title?: string | null;
  /** SPACE: 희망 이용 일시 (예약 확정 아님) */
  proposed_start_at?: string | null;
  proposed_end_at?: string | null;
  creator_id: string;
  max_members: number;
  status: MeetupStatus;
  created_at: string;
  programs: (Pick<Program, 'id' | 'name' | 'venue' | 'schedule_text'> & Partial<Program>) | null;
  spaces?: (Pick<Space, 'id' | 'name' | 'venue'> & Partial<Space>) | null;
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
