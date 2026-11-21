'use client';

import Link from 'next/link';
import { use, useEffect, useRef, useState } from 'react';
import { useStore } from '@/lib/store';
import { whenText, won } from '@/lib/calc';
import Ddari from '@/components/Ddari';
import Icon from '@/components/Icon';
import { Avatar, BackBar, Chip, LinkButton, Loading, isVerified } from '@/components/ui';

const QUICK = ['조금 늦을 것 같아요', '도착했어요', '오늘 감사했어요'];
const hm = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export default function ChatRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { ready, view, messagesOf, sendMessage, me } = useStore();
  const [text, setText] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const v = view(id);
  const msgs = messagesOf(id);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [msgs.length]);

  if (!ready) return <Loading />;
  if (!v) return <p>작당방을 찾을 수 없어요</p>;

  if (!(v.isMine && v.isOpen)) {
    return (
      <>
        <BackBar title="작당방" />
        <div className="flex flex-col items-center gap-3 pt-16 text-center">
          <Ddari mood="look" />
          <b className="text-[17px]">아직 잠겨 있는 작당방이에요</b>
          <p className="m-0 text-sm text-sub">작당이 열리면 참여한 멤버끼리만 들어올 수 있어요.</p>
          <LinkButton href={`/s/${v.id}`} variant="dark" className="!w-auto">
            쪽지 보러 가기
          </LinkButton>
        </div>
      </>
    );
  }

  const fee = v.facility.isFree ? '무료' : `1인당 ${won(Math.ceil(v.facility.totalFee / v.currentCount / 10) * 10)}원`;
  const byName = new Map(v.participants.map((p) => [p.nickname, p]));
  const send = (t: string) => {
    sendMessage(v.id, t);
    setText('');
  };

  return (
    <>
      <BackBar
        title={`${v.facility.facilityName} 작당방`}
        right={
          <span className="flex">
            {v.participants.slice(0, 3).map((p) => (
              <span key={p.id} className="-ml-2">
                <Avatar name={p.nickname} verified={isVerified(p)} size={28} />
              </span>
            ))}
          </span>
        }
      />
      <Link href={`/s/${v.id}`} className="mb-3 flex items-center gap-2.5 rounded-2xl border border-line bg-paper p-3 text-xs text-ink no-underline">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-mint text-green">
          <Icon name="pin" size={17} />
        </span>
        <div className="min-w-0 flex-1">
          <b className="block text-[13px]">{whenText(v.startAt, v.endAt)}</b>
          <span className="text-sub">
            {v.status === 'booked' ? '예약 완료' : '반장이 예약 중'} · {fee} · {v.currentCount}명
          </span>
        </div>
        <Icon name="chev" size={16} className="text-sub" />
      </Link>

      <div className="flex flex-col" aria-live="polite">
        {msgs.map((m) => {
          if (m.nickname === 'system')
            return (
              <p key={m.id} className="my-3 text-center text-xs leading-normal text-sub">
                <span className="inline-block rounded-full bg-mute px-3 py-1.5">{m.text}</span>
              </p>
            );
          const mine = m.nickname === me.nickname;
          const p = byName.get(m.nickname);
          return mine ? (
            <div key={m.id} className="my-1.5 flex items-end justify-end gap-1.5">
              <span className="text-[10px] text-[#7B837E]">{hm(m.at)}</span>
              <div className="max-w-[240px] rounded-[18px_18px_6px_18px] bg-green px-3 py-2 text-sm leading-normal text-white">{m.text}</div>
            </div>
          ) : (
            <div key={m.id} className="my-1.5 flex items-end gap-2">
              <Avatar name={m.nickname} verified={p ? isVerified(p) : false} size={32} ring={false} />
              <div>
                <p className="m-0 mb-0.5 ml-0.5 text-[11px] text-sub">
                  {m.nickname}
                  {p?.isHost ? ' · 작당 반장' : ''}
                </p>
                <div className="max-w-[230px] rounded-[18px_18px_18px_6px] border border-line bg-paper px-3 py-2 text-sm leading-normal">{m.text}</div>
              </div>
              <span className="text-[10px] text-[#7B837E]">{hm(m.at)}</span>
            </div>
          );
        })}
      </div>

      <div className="no-scrollbar -mx-[18px] mt-3 flex gap-1.5 overflow-x-auto px-[18px]">
        {QUICK.map((q) => (
          <Chip key={q} onClick={() => send(q)}>
            {q}
          </Chip>
        ))}
      </div>
      <div ref={endRef} className="h-24" />

      <form
        className="absolute inset-x-0 bottom-0 z-30 flex items-center gap-2 border-t border-line bg-paper px-3 pt-2.5 pb-5"
        onSubmit={(e) => {
          e.preventDefault();
          send(text);
        }}
      >
        <label className="flex-1">
          <span className="sr-only">메시지</span>
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="메시지 보내기" className="min-h-11 w-full rounded-[14px] border border-line-strong bg-cream px-3.5 text-sm" />
        </label>
        <button type="submit" aria-label="보내기" className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-green text-white">
          <Icon name="send" size={18} />
        </button>
      </form>
    </>
  );
}
