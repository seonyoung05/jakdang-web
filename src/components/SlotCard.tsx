'use client';

import Link from 'next/link';
import type { SlotView } from '@/lib/types';
import { remainingText, whenText, won } from '@/lib/calc';
import { Avatar, Badge, CountNumber, Tag } from './ui';
import StampGauge from './StampGauge';
import Icon from './Icon';

const gradeTone = { 높음: 'green', 보통: 'tangerine', 낮음: 'gray' } as const;
const audienceLabel = { anyone: null, verified: '인증 멤버만', peers: '또래끼리', sameGender: '같은 성별끼리' } as const;

/** 작당 쪽지 카드 (명세서 5-2 빈칸 카드) */
export default function SlotCard({ v, onJoin, onCancel }: { v: SlotView; onJoin: () => void; onCancel: () => void }) {
  const f = v.facility;
  const urgent = v.deadlineUrgent;
  const aud = audienceLabel[v.audience];
  const tags = [f.category, ...v.vibeTags, ...(f.eligibility.includes('관내우선') ? ['관내 우선'] : []), ...(f.eligibility.includes('추첨제') ? ['추첨제'] : [])];

  return (
    <article className={`note-card flex flex-col gap-3 p-4 ${v.isOpen ? '!border-2 !border-green' : ''}`}>
      <div className="flex items-center justify-between gap-2">
        <Badge tone={gradeTone[v.possibilityGrade]}>모임 가능성 {v.possibilityGrade}</Badge>
        <span className={`flex items-center gap-1 text-[13px] ${urgent ? 'font-bold text-rose' : 'text-sub'}`}>
          <Icon name="clock" size={13} />
          마감까지 {v.deadline}
        </span>
      </div>

      {v.isOpen ? (
        <div className="flex items-center gap-2 rounded-[14px] bg-green px-3 py-2.5 text-sm font-bold text-white">
          <Icon name="door" size={16} />
          작당 성공! {v.status === 'booked' ? '예약까지 끝났어요' : '반장이 예약을 진행해요'}
        </div>
      ) : null}

      <div>
        <Link href={`/s/${v.id}`} className="text-[17px] leading-snug font-bold text-ink no-underline">
          {f.facilityName}
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-1 text-[13px] text-sub">
          <Icon name="cal" size={13} />
          {whenText(v.startAt, v.endAt)}
          <Tag>제안 시간</Tag>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {tags.map((t) => (
          <Tag key={t}>{t}</Tag>
        ))}
        {aud ? <Badge tone="sky">{aud}</Badge> : null}
      </div>

      <p className="m-0 text-xs text-sub">
        수용 {f.capacity}명 시설 · {v.requiredCount}명이 모이면 효율적으로 쓸 수 있어요
      </p>

      {f.isFree ? (
        <div className="rounded-[14px] bg-sky px-3 py-2.5 text-[13px] leading-normal">
          <b>무료 시설</b> · 혼자 빌리기 부담스러운 큰 공간을 함께 써요
        </div>
      ) : (
        <div className="rounded-[14px] bg-tangerine-soft px-3 py-2.5 text-[13px] leading-normal">
          이용료 {won(f.totalFee)}원 → {v.isMine ? '내 몫 1인당' : '지금 참여하면 1인당'}{' '}
          <b className="text-[19px] font-black">
            <CountNumber value={(v.isMine ? v.feeMine : v.feeIfJoinNow) ?? 0} />원
          </b>{' '}
          <span className="text-xs text-sub">(목표 시 {won(v.feeAtTarget ?? 0)}원)</span>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between text-[13px]">
          <b>
            도장 {v.currentCount}/{v.requiredCount}
          </b>
          <span className={`font-bold ${v.isOpen ? 'text-mint-ink' : v.remaining === 1 ? 'text-tangerine-ink' : 'text-sub'}`}>{remainingText(v)}</span>
        </div>
        <StampGauge required={v.requiredCount} capacity={f.capacity} participants={v.participants} myId={v.myParticipantId} />
      </div>

      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="font-medium text-mint-ink">
          인증 {v.verifiedCount}명 · 평균 믿음 {v.avgManner ?? '새싹'}
        </span>
        {v.friendsIn.length ? (
          <span className="flex items-center gap-1 rounded-[10px] bg-tangerine-soft px-2 py-1 text-tangerine-ink">
            <Avatar name={v.friendsIn[0]} size={18} ring={false} />
            친구 {v.friendsIn.join(', ')}님 참여 중
          </span>
        ) : null}
      </div>

      <div className="flex gap-2">
        {v.isMine && v.isOpen ? (
          <Link href={`/chat/${v.id}`} className="inline-flex min-h-12 flex-1 items-center justify-center gap-1.5 rounded-2xl bg-green text-[15px] font-bold text-white no-underline">
            <Icon name="chat" size={18} />
            작당방 입장
          </Link>
        ) : v.isMine ? (
          <button type="button" onClick={onCancel} className="min-h-12 flex-1 rounded-2xl border border-line-strong bg-paper text-[15px] font-bold">
            참여 취소
          </button>
        ) : (
          <button
            type="button"
            onClick={onJoin}
            disabled={v.isFull || v.status === 'failed'}
            className="min-h-12 flex-1 rounded-2xl bg-ink text-[15px] font-bold text-white disabled:bg-mute disabled:text-[#6A726D]"
          >
            {v.isFull ? '정원 마감' : v.status === 'failed' ? '모집 마감' : v.isOpen ? '나도 참여하기' : '참여하기'}
          </button>
        )}
        <Link href={`/s/${v.id}`} className="inline-flex min-h-12 items-center rounded-2xl border border-line-strong px-4 text-sm font-medium text-ink no-underline">
          자세히
        </Link>
      </div>
    </article>
  );
}
