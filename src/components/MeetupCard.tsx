'use client';

import Link from 'next/link';
import type { Meetup } from '@/lib/types';
import { JakdangiRow } from './Jakdangi';
import { JdPill } from './jd';

export function meetupState(m: Meetup, count: number | null): { label: string; style: 'peach' | 'dark' | 'outline' } {
  if (m.status === 'CLOSED') return { label: '모집 마감', style: 'outline' };
  if (count !== null && count >= m.max_members) return { label: '작당 성공', style: 'dark' };
  if (count !== null) return { label: `${m.max_members - count}명 더`, style: 'peach' };
  return { label: '모집 중', style: 'peach' };
}

export function timeAgo(iso: string): string {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return '방금';
  if (m < 60) return `${m}분 전`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}시간 전`;
  return `${Math.round(h / 24)}일 전`;
}

/** 피그마 01 메인의 모집 카드. memberIds가 null이면 로그인 전이라 참여 현황을 모르는 상태. */
export default function MeetupCard({ m, memberIds }: { m: Meetup; memberIds: string[] | null }) {
  const p = m.programs;
  const count = memberIds ? memberIds.length : null;
  const st = meetupState(m, count);
  const sub = [p?.schedule_text, p?.venue].filter(Boolean).join(' · ');

  return (
    <Link href={`/m/${m.id}`} className="note-card flex flex-col gap-[10px] px-4 py-[14px] text-ink no-underline">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 flex-col gap-[2px] leading-[1.4]">
          <h3 className="m-0 text-[15px] font-bold">{p?.name ?? '프로그램 정보 없음'}</h3>
          {sub ? <p className="m-0 truncate text-[11px] text-ink-2">{sub}</p> : null}
        </div>
        <JdPill style={st.style}>{st.label}</JdPill>
      </div>
      <div className="flex items-center justify-between">
        {memberIds ? (
          <JakdangiRow members={memberIds.map((id) => ({ id, name: '' }))} max={m.max_members} />
        ) : (
          <span className="text-[11px] text-ink-2">로그인하면 누가 모였는지 보여요</span>
        )}
        <b className="text-[15px] leading-[1.4] font-black">{count === null ? `정원 ${m.max_members}` : `${count}/${m.max_members}`}</b>
      </div>
    </Link>
  );
}
