/**
 * 교육 동행(CLASS)과 공간 동행(SPACE)을 화면에 같은 모양으로 보여 주기 위한 도우미.
 * 문구 원칙: 공간은 '희망 이용 일시', '공식 대관 안내 확인'. '예약 완료'·'사용 가능'은 쓰지 않는다.
 */
import { meetupType } from './api';
import type { Meetup } from './types';

const WEEK = ['일', '월', '화', '수', '목', '금', '토'];
const hm = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

export function formatRange(startIso?: string | null, endIso?: string | null): string | null {
  if (!startIso) return null;
  const s = new Date(startIso);
  const head = `${s.getMonth() + 1}/${s.getDate()}(${WEEK[s.getDay()]}) ${hm(s)}`;
  if (!endIso) return head;
  const e = new Date(endIso);
  const sameDay = s.toDateString() === e.toDateString();
  return sameDay ? `${head}–${hm(e)}` : `${head} – ${e.getMonth() + 1}/${e.getDate()}(${WEEK[e.getDay()]}) ${hm(e)}`;
}

export interface MeetupView {
  type: 'CLASS' | 'SPACE';
  /** 탭·배지용 이름 */
  typeLabel: '교육' | '공간';
  title: string;
  /** 장소 한 줄 */
  place: string | null;
  /** 일정 한 줄 (CLASS: 기관 일정 문구, SPACE: 희망 이용 일시) */
  when: string | null;
  whenLabel: '일정' | '희망 이용 일시';
  officialUrl: string | null;
  officialLabel: '공식 신청 안내 확인' | '공식 대관 안내 확인';
}

export function viewOf(m: Meetup): MeetupView {
  if (meetupType(m) === 'SPACE') {
    const sp = m.spaces;
    const range = formatRange(m.proposed_start_at, m.proposed_end_at);
    return {
      type: 'SPACE',
      typeLabel: '공간',
      title: m.activity_title || sp?.name || '공간 함께 쓰기',
      place: [sp?.name, sp?.venue].filter(Boolean).join(' · ') || null,
      when: range ? `희망 ${range}` : null,
      whenLabel: '희망 이용 일시',
      officialUrl: sp?.reservation_url ?? null,
      officialLabel: '공식 대관 안내 확인',
    };
  }
  const p = m.programs;
  return {
    type: 'CLASS',
    typeLabel: '교육',
    title: p?.name ?? '프로그램 정보 없음',
    place: p?.venue ?? null,
    when: p?.schedule_text ?? null,
    whenLabel: '일정',
    officialUrl: p?.registration_url ?? null,
    officialLabel: '공식 신청 안내 확인',
  };
}
