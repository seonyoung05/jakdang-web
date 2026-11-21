/**
 * 시연용 목업 데이터. 실제 서비스에서는
 * - 시설: 서울시 공공서비스예약 API에서 뽑아 만든 정적 JSON
 * - 빈칸·참여·채팅: Supabase 테이블
 * 로 바뀐다. 날짜는 '지금' 기준으로 만들어 언제 열어도 시연이 된다.
 */
import type { ChatMessage, Facility, HistoryItem, Me, Notice, Participant, PopulationLookup, Slot } from './types';

const DAY = 24 * 60 * 60 * 1000;

/** now 이후 가장 가까운 요일(dow)·시각. minDays일 이후로 잡는다. */
function nextAt(now: number, dow: number, hour: number, min = 0, minDays = 1): Date {
  const d = new Date(now + minDays * DAY);
  d.setHours(hour, min, 0, 0);
  while (d.getDay() !== dow) d.setTime(d.getTime() + DAY);
  return d;
}
const iso = (d: Date) => d.toISOString();
const plusH = (d: Date, h: number) => new Date(d.getTime() + h * 60 * 60 * 1000);

export const population: PopulationLookup = {
  마포구: { 평일낮: 1900, 평일저녁: 2600, 주말오전: 2300, 주말오후: 2800 },
  성동구: { 평일낮: 1500, 평일저녁: 1800, 주말오전: 1300, 주말오후: 1600 },
  강남구: { 평일낮: 3400, 평일저녁: 2900, 주말오전: 2100, 주말오후: 3100 },
};

export function seedFacilities(now: number): Facility[] {
  const end = iso(new Date(now + 21 * DAY));
  return [
    { id: 'f-mangwon-gym', facilityName: '망원 다목적체육관', district: '마포구', dong: '망원동', category: '배드민턴', capacity: 20, capacitySource: 'extracted', totalFee: 12000, feeSource: 'extracted', isFree: false, eligibility: ['관내우선'], bookingLeadDays: 1, reservationEndAt: end, reservationUrl: 'https://yeyak.seoul.go.kr' },
    { id: 'f-yeonnam-kitchen', facilityName: '연남 공유주방', district: '마포구', dong: '연남동', category: '요리/공유주방', capacity: 8, capacitySource: 'extracted', totalFee: 20000, feeSource: 'extracted', isFree: false, eligibility: [], bookingLeadDays: 1, reservationEndAt: end, reservationUrl: 'https://yeyak.seoul.go.kr' },
    { id: 'f-seongdong-study', facilityName: '성동 청소년센터 스터디룸', district: '성동구', dong: '행당동', category: '회의/스터디', capacity: 10, capacitySource: 'fallback', totalFee: 0, feeSource: 'extracted', isFree: true, eligibility: [], bookingLeadDays: 0, reservationEndAt: end, reservationUrl: 'https://yeyak.seoul.go.kr' },
    { id: 'f-gaepo-futsal', facilityName: '개포 공공 풋살장', district: '강남구', dong: '개포동', category: '풋살', capacity: 14, capacitySource: 'extracted', totalFee: 44000, feeSource: 'extracted', isFree: false, eligibility: ['추첨제'], bookingLeadDays: 2, reservationEndAt: end, reservationUrl: 'https://yeyak.seoul.go.kr' },
    { id: 'f-yeoksam-seminar', facilityName: '역삼 공공 세미나실', district: '강남구', dong: '역삼동', category: '회의/스터디', capacity: 20, capacitySource: 'extracted', totalFee: 30000, feeSource: 'fallback', isFree: false, eligibility: ['본인인증'], bookingLeadDays: 1, reservationEndAt: end, reservationUrl: 'https://yeyak.seoul.go.kr' },
    { id: 'f-eungbong-court', facilityName: '응봉 근린공원 농구장', district: '성동구', dong: '응봉동', category: '농구', capacity: 10, capacitySource: 'fallback', totalFee: 0, feeSource: 'extracted', isFree: true, eligibility: [], bookingLeadDays: 1, reservationEndAt: end, reservationUrl: 'https://yeyak.seoul.go.kr' },
    { id: 'f-mangwon-room', facilityName: '망원1동 주민센터 작은방', district: '마포구', dong: '망원동', category: '다목적', capacity: 6, capacitySource: 'extracted', totalFee: 6000, feeSource: 'extracted', isFree: false, eligibility: ['관내우선'], bookingLeadDays: 1, reservationEndAt: end, reservationUrl: 'https://yeyak.seoul.go.kr' },
  ];
}

export function seedSlots(now: number): Slot[] {
  const created = iso(new Date(now - DAY));
  const sat = nextAt(now, 6, 10, 0, 3);
  const fri = nextAt(now, 5, 19, 0, 2);
  const studyStart = new Date(now + 3.5 * 60 * 60 * 1000); // 오늘 곧, 마감 임박 시연용
  studyStart.setMinutes(0, 0, 0);
  const sun = nextAt(now, 0, 14, 0, 4);
  const mon = nextAt(now, 1, 10, 0, 6);
  const thu = nextAt(now, 4, 20, 0, 3);
  const base = { hostPinHash: '', chatEnabled: true, createdAt: created } as const;
  return [
    { ...base, id: 's-badminton', facilityId: 'f-mangwon-gym', startAt: iso(sat), endAt: iso(plusH(sat, 2)), purpose: '배드민턴', vibeTags: ['초보 환영', '끝나고 밥'], audience: 'anyone', requiredCount: 6, hostNickname: '준호', status: 'recruiting' },
    { ...base, id: 's-kitchen', facilityId: 'f-yeonnam-kitchen', startAt: iso(fri), endAt: iso(plusH(fri, 2.5)), purpose: '요리', vibeTags: ['처음이어도 OK', '재료 각자 준비'], audience: 'verified', requiredCount: 4, hostNickname: '하늘', status: 'opened', openedAt: created },
    { ...base, id: 's-study', facilityId: 'f-seongdong-study', startAt: iso(studyStart), endAt: iso(plusH(studyStart, 2)), purpose: '스터디', vibeTags: ['조용히 공부만'], audience: 'anyone', requiredCount: 4, hostNickname: '은비', status: 'recruiting' },
    { ...base, id: 's-futsal', facilityId: 'f-gaepo-futsal', startAt: iso(sun), endAt: iso(plusH(sun, 2)), purpose: '풋살', vibeTags: ['실력 무관'], audience: 'anyone', requiredCount: 10, hostNickname: '현우', status: 'recruiting' },
    { ...base, id: 's-seminar', facilityId: 'f-yeoksam-seminar', startAt: iso(mon), endAt: iso(plusH(mon, 2)), purpose: '사이드 프로젝트 모각작', vibeTags: ['네트워킹', '노트북 지참'], audience: 'peers', requiredCount: 6, hostNickname: '아린', status: 'recruiting' },
    { ...base, id: 's-basket', facilityId: 'f-eungbong-court', startAt: iso(thu), endAt: iso(plusH(thu, 2)), purpose: '농구', vibeTags: ['가볍게 슛만'], audience: 'anyone', requiredCount: 6, hostNickname: '규리', status: 'recruiting' },
  ];
}

type P = [nickname: string, school: string | null, dong: string | null, manner: number | null];
const people: Record<string, P[]> = {
  's-badminton': [['준호', null, '망원동', 93], ['다은', '홍익대', null, 95], ['민지', '홍익대', '망원동', 91], ['하준', null, '망원동', 90]],
  's-kitchen': [['하늘', null, '연남동', 96], ['유진', '서강대', null, 94], ['석우', null, null, null], ['서현', '○○대', '망원동', 92]],
  's-study': [['은비', '한양대', null, 88], ['태윤', null, '행당동', 89], ['로아', null, null, null]],
  's-futsal': [['현우', null, '개포동', 90], ['도윤', null, '개포동', 92], ['서준', '서울시립대', null, 88], ['재민', null, null, null], ['로운', null, '일원동', 91], ['건', null, '개포동', 87], ['우진', '숭실대', null, 93]],
  's-seminar': [['아린', null, '역삼동', 95], ['성민', '고려대', null, 90], ['채원', null, '역삼동', 89], ['주안', null, null, 84], ['윤서', '숙명여대', null, 92]],
  's-basket': [['규리', null, '응봉동', 91]],
};

export const ME_SEED_JOIN: Record<string, string> = { 's-kitchen': 'p-s-kitchen-3' };

export function seedParticipants(now: number): Participant[] {
  const out: Participant[] = [];
  for (const [slotId, list] of Object.entries(people)) {
    list.forEach(([nickname, school, dong, manner], i) => {
      out.push({
        id: `p-${slotId}-${i}`,
        slotId,
        nickname,
        pinHash: '',
        isHost: i === 0,
        joinedAt: new Date(now - (list.length - i) * 60 * 60 * 1000).toISOString(),
        verification: { school: school ?? undefined, neighborhood: dong ?? undefined },
        manner,
      });
    });
  }
  return out;
}

export function seedMessages(now: number): ChatMessage[] {
  const t = (minAgo: number) => new Date(now - minAgo * 60 * 1000).toISOString();
  return [
    { id: 'm1', slotId: 's-kitchen', nickname: 'system', text: '4명이 모여 작당에 성공했어요! 작당방이 열렸어요', at: t(180) },
    { id: 'm2', slotId: 's-kitchen', nickname: '하늘', text: '안녕하세요! 예약 완료했어요. 재료는 각자 챙겨 오시면 돼요 :)', at: t(170) },
    { id: 'm3', slotId: 's-kitchen', nickname: '유진', text: '요리 모임 처음인데 잘 부탁드려요!', at: t(160) },
    { id: 'm4', slotId: 's-kitchen', nickname: 'system', text: '정산 · 1인당 5,000원 · 작당 반장 하늘님께 보내 주세요', at: t(150) },
    { id: 'm5', slotId: 's-kitchen', nickname: '서현', text: '저도 처음이에요 ㅎㅎ 그날 봬요!', at: t(140) },
    { id: 'm6', slotId: 's-kitchen', nickname: 'system', text: "모임이 끝나면 '뒷정리 작전(퇴실 인증)'을 함께 해 주세요. 믿음 도장에 반영돼요", at: t(139) },
  ];
}

export function seedNotices(now: number): Notice[] {
  const t = (minAgo: number) => new Date(now - minAgo * 60 * 1000).toISOString();
  return [
    { id: 'n1', kind: 'opened', strong: '연남 공유주방', text: '작당에 성공했어요! 작당방에서 인사 나눠 보세요.', at: t(2), read: false, href: '/chat/s-kitchen' },
    { id: 'n2', kind: 'almost', strong: '성동 청소년센터 스터디룸', text: '1명만 더 모이면 열려요. 친구에게 알려 볼까요?', at: t(12), read: false, href: '/s/s-study' },
    { id: 'n3', kind: 'friend', strong: '민지', text: '친구가 망원 배드민턴 작당에 참여했어요.', at: t(60), read: false, href: '/s/s-badminton' },
    { id: 'n4', kind: 'reminder', strong: '연남 공유주방', text: '모임이 곧 있어요. 늦을 것 같으면 미리 작당방에 알려 주세요.', at: t(60 * 20), read: true, href: '/chat/s-kitchen' },
    { id: 'n5', kind: 'manner', text: '뒷정리 작전 고마워요! 칭찬 2개를 받아 믿음 도장이 92점이 되었어요.', at: t(60 * 48), read: true, href: '/me' },
    { id: 'n6', kind: 'fallback', strong: '응봉 근린공원 농구장', text: '인원이 모자랐어요. 지금 멤버로 쓸 수 있는 근처 작은 공간을 찾았어요.', at: t(60 * 72), read: true, href: '/' },
  ];
}

export const history: HistoryItem[] = [
  { id: 'h1', title: '망원 다목적체육관 배드민턴', date: '11/15(토)', people: 6, state: 'checkedOut' },
  { id: 'h2', title: '연남 공유주방 김장 모임', date: '11/08(토)', people: 5, state: 'attended' },
  { id: 'h3', title: '성동 스터디룸', date: '11/06(목)', people: 4, state: 'missed', note: '예약 후 함께하지 못했어요' },
  { id: 'h4', title: '응봉 농구장', date: '10/30(목)', people: 3, state: 'notOpened', note: '모인 인원이 모자랐어요' },
  { id: 'h5', title: '망원1동 주민센터 작은방 보드게임', date: '10/25(토)', people: 5, state: 'checkedOut' },
];

export const meSeed: Me = {
  nickname: '서현',
  district: '마포구',
  dong: '망원동',
  ageBand: '20대',
  verification: { school: '○○대학교', neighborhood: '망원동' },
  manner: 92,
  keptPromises: 12,
  totalPromises: 13,
  checkouts: 11,
  praises: [
    { label: '시간 약속을 잘 지켜요', count: 9 },
    { label: '정리를 잘해요', count: 8 },
    { label: '친절해요', count: 6 },
    { label: '또 같이 하고 싶어요', count: 4 },
  ],
  friends: ['민지', '하늘', '준호'],
};
