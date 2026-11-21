'use client';

import Link from 'next/link';
import type { Meetup } from '@/lib/types';
import { Badge } from './ui';
import Icon from './Icon';

export function meetupState(m: Meetup, count: number | null): { label: string; tone: 'green' | 'tangerine' | 'gray' } {
  if (m.status === 'CLOSED') return { label: '모집 마감', tone: 'gray' };
  if (count !== null && count >= m.max_members) return { label: '정원 마감', tone: 'gray' };
  if (count !== null && m.max_members - count === 1) return { label: '1자리 남음', tone: 'tangerine' };
  return { label: '모집 중', tone: 'green' };
}

export function timeAgo(iso: string): string {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return '방금';
  if (m < 60) return `${m}분 전`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}시간 전`;
  return `${Math.round(h / 24)}일 전`;
}

/** 모집글 카드. count가 null이면 로그인 전이라 참여 인원을 모르는 상태. */
export default function MeetupCard({ m, count, mine }: { m: Meetup; count: number | null; mine?: boolean }) {
  const p = m.programs;
  const st = meetupState(m, count);
  const pct = count === null ? 0 : Math.min(100, Math.round((count / m.max_members) * 100));
  const full = count !== null && count >= m.max_members;

  return (
    <Link href={`/m/${m.id}`} className="note-card flex flex-col gap-3 p-4 text-ink no-underline">
      <div className="flex items-center justify-between gap-2">
        <Badge tone={st.tone}>{st.label}</Badge>
        <span className="text-xs text-sub">{timeAgo(m.created_at)} 개설</span>
      </div>
      <div>
        <h3 className="m-0 text-[17px] leading-snug font-bold">{p?.name ?? '프로그램 정보 없음'}</h3>
        {p?.venue ? (
          <p className="m-0 mt-1 flex items-center gap-1 text-[13px] text-sub">
            <Icon name="pin" size={13} />
            {p.venue}
          </p>
        ) : null}
        {p?.schedule_text ? (
          <p className="m-0 mt-0.5 flex items-start gap-1 text-[13px] text-sub">
            <Icon name="cal" size={13} className="mt-[3px] shrink-0" />
            <span className="line-clamp-2">{p.schedule_text}</span>
          </p>
        ) : null}
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between text-[13px]">
          <b>{count === null ? `정원 ${m.max_members}명` : `${count}/${m.max_members}명`}</b>
          <span className="text-sub">{count === null ? '로그인하면 참여 현황이 보여요' : full ? '정원이 다 찼어요' : `${m.max_members - count}자리 남았어요 · 선착순`}</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-[#EEE9DE]" aria-hidden="true">
          <div className={`h-full rounded-full transition-[width] duration-500 ${full ? 'bg-green' : 'bg-tangerine'}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
      {mine ? (
        <span className="flex items-center gap-1 text-xs font-bold text-mint-ink">
          <Icon name="check" size={13} />
          내가 참여한 모집
        </span>
      ) : null}
    </Link>
  );
}
