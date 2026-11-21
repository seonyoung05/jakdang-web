'use client';

import Link from 'next/link';
import { useStore } from '@/lib/store';
import { whenText } from '@/lib/calc';
import Ddari from '@/components/Ddari';
import Icon from '@/components/Icon';
import { Avatar, LinkButton, Loading, Note } from '@/components/ui';

export default function ChatListPage() {
  const { ready, views, messagesOf } = useStore();
  const rooms = views.filter((v) => v.isMine && v.isOpen);
  const waiting = views.filter((v) => v.isMine && !v.isOpen && v.status !== 'failed');

  return (
    <>
      <h1 className="m-0 mb-1 text-[22px] font-black">작당방</h1>
      <Note icon="shield">작당이 열리면 멤버끼리만 들어올 수 있어요. 연락처는 주고받지 않아요.</Note>

      {!ready ? (
        <Loading />
      ) : (
        <>
          <div className="mt-4 flex flex-col gap-2">
            {rooms.map((v) => {
              const msgs = messagesOf(v.id);
              const last = msgs[msgs.length - 1];
              return (
                <Link key={v.id} href={`/chat/${v.id}`} className="note-card flex items-center gap-3 p-3.5 text-ink no-underline">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-mint text-green">
                    <Icon name="door" size={22} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <b className="block truncate text-[15px]">{v.facility.facilityName}</b>
                    <span className="block truncate text-xs text-sub">{last ? (last.nickname === 'system' ? last.text : `${last.nickname}: ${last.text}`) : '아직 대화가 없어요'}</span>
                  </div>
                  <div className="flex">
                    {v.participants.slice(0, 3).map((p) => (
                      <span key={p.id} className="-ml-2">
                        <Avatar name={p.nickname} size={26} />
                      </span>
                    ))}
                  </div>
                </Link>
              );
            })}
          </div>

          {rooms.length === 0 ? (
            <div className="mt-6 flex flex-col items-center gap-3 text-center">
              <Ddari mood="sleepy" size={60} />
              <b>아직 열린 작당방이 없어요</b>
              <LinkButton href="/" variant="dark" className="!w-auto">
                작당 쪽지 보러 가기
              </LinkButton>
            </div>
          ) : null}

          {waiting.length ? (
            <>
              <h2 className="mt-6 mb-2 text-[15px] font-black">열리길 기다리는 중</h2>
              <div className="flex flex-col gap-2">
                {waiting.map((v) => (
                  <Link key={v.id} href={`/s/${v.id}`} className="flex items-center gap-3 rounded-2xl border border-dashed border-line-strong bg-paper/60 p-3.5 text-ink no-underline">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-mute text-sub">
                      <Icon name="clock" size={18} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <b className="block truncate text-sm">{v.facility.facilityName}</b>
                      <span className="text-xs text-sub">
                        {whenText(v.startAt, v.endAt)} · {v.remaining}명 더 모이면 열려요
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          ) : null}
        </>
      )}
    </>
  );
}
