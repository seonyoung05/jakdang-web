/**
 * 명세서 4장의 공식을 모두 여기 순수 함수로 둔다.
 * 카드, 상세, KPI가 같은 함수를 써서 숫자가 어긋나지 않게 한다.
 */
import type { Facility, Grade, Participant, PopulationLookup, Slot, SlotView, TimeBand } from './types';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

/** 4-1. 필요 인원 */
export function requiredCount(f: Facility): number {
  const fixed: Partial<Record<Facility['category'], number>> = { 배드민턴: 4, 농구: 6, 풋살: 10 };
  let n: number;
  if (fixed[f.category] !== undefined) n = fixed[f.category]!;
  else if (f.category === '회의/스터디') n = f.capacity <= 10 ? 4 : 6;
  else n = Math.max(3, Math.round(f.capacity * 0.3));
  return Math.min(n, f.capacity);
}

/** 정산 금액이 모자라지 않게 10원 단위 올림 */
export const ceil10 = (n: number) => Math.ceil(n / 10) * 10;

/** 4-3. 1인당 이용료 */
export function feeIfJoinNow(f: Facility, currentCount: number): number | null {
  return f.isFree ? null : ceil10(f.totalFee / (currentCount + 1));
}
export function feeShare(f: Facility, count: number): number | null {
  return f.isFree || count === 0 ? null : ceil10(f.totalFee / count);
}
export function feeAtTarget(f: Facility, required: number): number | null {
  return f.isFree ? null : ceil10(f.totalFee / required);
}
export function feeAtCapacity(f: Facility): number | null {
  return f.isFree ? null : ceil10(f.totalFee / f.capacity);
}

/** 슬롯 시작 시각으로 생활인구 키를 고른다 */
export function timeBandOf(startAt: string): TimeBand {
  const d = new Date(startAt);
  const weekend = d.getDay() === 0 || d.getDay() === 6;
  const h = d.getHours();
  if (weekend) return h < 13 ? '주말오전' : '주말오후';
  return h < 18 ? '평일낮' : '평일저녁';
}

/** 4-4. 모임 가능성 원점수 */
export function possibilityScore(pop: number, required: number): number {
  return pop / required;
}

/** 전체 원점수의 백분위로 등급을 나눈다: 상위 30% 높음, 다음 40% 보통, 나머지 낮음 */
export function gradeByPercentile(score: number, all: number[]): Grade {
  if (all.length === 0) return '보통';
  const sorted = [...all].sort((a, b) => b - a);
  const rank = sorted.findIndex((s) => s <= score); // 0 = 최상위
  const pct = (rank + 1) / sorted.length;
  if (pct <= 0.3) return '높음';
  if (pct <= 0.7) return '보통';
  return '낮음';
}

/** 4-5. 모집 마감 = min(접수 마감, 이용 시작 − bookingLeadDays일) */
export function deadlineOf(f: Facility, s: Slot): number {
  return Math.min(new Date(f.reservationEndAt).getTime(), new Date(s.startAt).getTime() - f.bookingLeadDays * DAY);
}

export function deadlineText(deadlineMs: number, now: number): { text: string; urgent: boolean; passed: boolean } {
  const left = deadlineMs - now;
  if (left <= 0) return { text: '마감', urgent: true, passed: true };
  if (left >= DAY) return { text: `${Math.floor(left / DAY)}일`, urgent: false, passed: false };
  const h = Math.floor(left / HOUR);
  const m = Math.floor((left % HOUR) / (60 * 1000));
  return { text: h > 0 ? `${h}시간 ${m}분` : `${m}분`, urgent: left < 3 * HOUR, passed: false };
}

export function remainingText(v: Pick<SlotView, 'remaining' | 'isOpen' | 'isFull'>): string {
  if (v.isFull) return '정원이 다 찼어요';
  if (v.isOpen) return '더 모일수록 1인당 내려가요';
  if (v.remaining === 1) return '1명만 더 모이면 열려요!';
  return `${v.remaining}명 더 모이면 열려요`;
}

export function won(n: number): string {
  return n.toLocaleString('ko-KR');
}

const WEEK = ['일', '월', '화', '수', '목', '금', '토'];
export function whenText(startAt: string, endAt: string): string {
  const s = new Date(startAt);
  const e = new Date(endAt);
  const hm = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return `${s.getMonth() + 1}/${s.getDate()}(${WEEK[s.getDay()]}) ${hm(s)}–${hm(e)}`;
}

export function hoursOf(s: Slot): number {
  return (new Date(s.endAt).getTime() - new Date(s.startAt).getTime()) / HOUR;
}

/** 화면용 파생 값 */
export function buildViews(
  slots: Slot[],
  facilities: Facility[],
  participants: Participant[],
  population: PopulationLookup,
  me: { nickname: string; friends: string[]; joined: Record<string, string> },
  now: number,
): SlotView[] {
  const fMap = new Map(facilities.map((f) => [f.id, f]));
  const raw = slots
    .filter((s) => fMap.has(s.facilityId))
    .map((s) => {
      const f = fMap.get(s.facilityId)!;
      const band = timeBandOf(s.startAt);
      const pop = population[f.district]?.[band] ?? 1000;
      return { s, f, band, pop, score: possibilityScore(pop, s.requiredCount) };
    });
  const allScores = raw.map((r) => r.score);

  return raw.map(({ s, f, band, pop, score }) => {
    const ps = participants.filter((p) => p.slotId === s.id).sort((a, b) => a.joinedAt.localeCompare(b.joinedAt));
    const count = ps.length;
    const isOpen = count >= s.requiredCount;
    const isFull = count >= f.capacity;
    const myId = me.joined[s.id];
    const isMine = !!myId && ps.some((p) => p.id === myId);
    const dl = deadlineOf(f, s);
    const dt = deadlineText(dl, now);
    const mannered = ps.map((p) => p.manner).filter((m): m is number => m !== null);
    let status = s.status;
    if (status === 'recruiting' && isOpen) status = 'opened';
    if (status === 'recruiting' && dt.passed && !isOpen) status = 'failed';
    return {
      ...s,
      status,
      facility: f,
      participants: ps,
      currentCount: count,
      remaining: Math.max(0, s.requiredCount - count),
      isOpen,
      isFull,
      feeIfJoinNow: feeIfJoinNow(f, count),
      feeMine: isMine ? feeShare(f, count) : null,
      feeAtTarget: feeAtTarget(f, s.requiredCount),
      possibilityScore: score,
      possibilityGrade: gradeByPercentile(score, allScores),
      nearbyPopulation: pop,
      timeBand: band,
      deadline: dt.text,
      deadlineMs: dl,
      deadlineUrgent: dt.urgent,
      myParticipantId: isMine ? myId : undefined,
      isMine,
      amIHost: isMine && s.hostNickname === me.nickname,
      verifiedCount: ps.filter((p) => p.verification.school || p.verification.neighborhood).length,
      avgManner: mannered.length ? Math.round(mannered.reduce((a, b) => a + b, 0) / mannered.length) : null,
      friendsIn: ps.filter((p) => me.friends.includes(p.nickname)).map((p) => p.nickname),
    };
  });
}

/** 기본 정렬: 1명만 남은 카드가 맨 위, 그다음 원점수 내림차순 */
export function sortByPossibility(a: SlotView, b: SlotView): number {
  const a1 = !a.isOpen && a.remaining === 1 ? 1 : 0;
  const b1 = !b.isOpen && b.remaining === 1 ? 1 : 0;
  if (a1 !== b1) return b1 - a1;
  return b.possibilityScore - a.possibilityScore;
}

/** 5-1. KPI */
export function kpis(views: SlotView[], todayJoined: number) {
  const opened = views.filter((v) => v.isOpen);
  return {
    openable: views.filter((v) => v.status === 'recruiting').length,
    weekHours: Math.round(views.reduce((a, v) => a + hoursOf(v), 0)),
    todayPeople: todayJoined,
    openedPlaces: new Set(opened.map((v) => v.facilityId)).size,
    savedFee: opened.reduce((a, v) => a + v.facility.totalFee * (v.currentCount - 1), 0),
  };
}

/** PIN은 보안 수단이 아니라 실수 방지용이다 (명세서 6장) */
export async function hashPin(pin: string): Promise<string> {
  const data = new TextEncoder().encode(`jakdang:${pin}`);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function settlementText(v: SlotView, hostNickname: string): string {
  const fee = feeShare(v.facility, v.currentCount);
  const head = `${v.facility.facilityName} ${whenText(v.startAt, v.endAt)}`;
  if (fee === null) return `${head} · 무료 시설이에요 · 작당 반장 ${hostNickname}`;
  return `${head} · 1인당 ${won(fee)}원 · 작당 반장 ${hostNickname}님에게 송금해 주세요`;
}
