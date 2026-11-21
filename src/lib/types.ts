export type Category = '배드민턴' | '풋살' | '농구' | '회의/스터디' | '요리/공유주방' | '다목적';
export type TimeBand = '평일낮' | '평일저녁' | '주말오전' | '주말오후';
export type Eligibility = '관내우선' | '추첨제' | '단체명단필요' | '본인인증';
export type SlotStatus = 'recruiting' | 'opened' | 'booked' | 'failed';
export type Grade = '높음' | '보통' | '낮음';

/** 함께할 분 조건. 기본은 누구나, 나머지는 '선호'로만 표시한다. */
export type Audience = 'anyone' | 'verified' | 'peers' | 'sameGender';

export interface Facility {
  id: string;
  facilityName: string;
  district: string; // 자치구
  dong: string; // 동네 표시용
  category: Category;
  capacity: number;
  capacitySource: 'extracted' | 'fallback';
  totalFee: number; // 무료면 0
  feeSource: 'extracted' | 'fallback';
  isFree: boolean;
  eligibility: Eligibility[];
  bookingLeadDays: number;
  reservationEndAt: string; // ISO
  reservationUrl: string; // 원본 SVCURL
}

export interface Slot {
  id: string;
  facilityId: string;
  startAt: string; // ISO, 제안 시간
  endAt: string;
  purpose: string;
  vibeTags: string[];
  audience: Audience;
  requiredCount: number;
  hostNickname: string;
  hostPinHash: string;
  chatEnabled: boolean;
  status: SlotStatus;
  openedAt?: string;
  bookedAt?: string;
  parentSlotId?: string;
  createdAt: string;
}

export interface Verification {
  school?: string; // 학교 이름
  neighborhood?: string; // 인증한 동네
}

export interface Participant {
  id: string;
  slotId: string;
  nickname: string;
  pinHash: string;
  isHost: boolean;
  joinedAt: string;
  verification: Verification;
  manner: number | null; // null = 새싹(기록 없음)
  ageBand?: string; // '20대' 등, 선택 공개
}

export interface ChatMessage {
  id: string;
  slotId: string;
  nickname: string; // 'system' 이면 시스템 메시지
  text: string;
  at: string;
}

export interface Notice {
  id: string;
  kind: 'opened' | 'almost' | 'friend' | 'reminder' | 'manner' | 'fallback';
  text: string;
  strong?: string;
  at: string;
  read: boolean;
  href?: string;
}

/** 이전 내역. '노쇼'라는 말 대신 담담한 상태로 기록한다. */
export type HistoryState = 'checkedOut' | 'attended' | 'missed' | 'notOpened';
export interface HistoryItem {
  id: string;
  title: string;
  date: string;
  people: number;
  state: HistoryState;
  note?: string;
}

export interface Me {
  nickname: string;
  district: string;
  dong: string;
  ageBand: string;
  verification: Verification;
  manner: number;
  keptPromises: number;
  totalPromises: number;
  checkouts: number;
  praises: { label: string; count: number }[];
  friends: string[];
}

export type PopulationLookup = Record<string, Record<TimeBand, number>>;

export interface SlotView extends Slot {
  facility: Facility;
  participants: Participant[];
  currentCount: number;
  remaining: number;
  isOpen: boolean;
  isFull: boolean;
  feeIfJoinNow: number | null;
  feeMine: number | null;
  feeAtTarget: number | null;
  possibilityScore: number;
  possibilityGrade: Grade;
  nearbyPopulation: number;
  timeBand: TimeBand;
  deadline: string;
  deadlineMs: number;
  deadlineUrgent: boolean;
  myParticipantId?: string;
  isMine: boolean;
  amIHost: boolean;
  verifiedCount: number;
  avgManner: number | null;
  friendsIn: string[];
}
