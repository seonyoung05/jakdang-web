'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useStore } from '@/lib/store';
import type { Notice } from '@/lib/types';
import Icon, { type IconName } from '@/components/Icon';
import { BackBar, Loading } from '@/components/ui';

const KIND: Record<Notice['kind'], { icon: IconName; cls: string }> = {
  opened: { icon: 'door', cls: 'bg-green text-white' },
  almost: { icon: 'users', cls: 'bg-tangerine-soft text-tangerine-ink' },
  friend: { icon: 'useradd', cls: 'bg-mint text-green' },
  reminder: { icon: 'clock', cls: 'bg-mute text-[#4C554F]' },
  manner: { icon: 'star', cls: 'bg-mint text-green' },
  fallback: { icon: 'pin', cls: 'bg-sky text-sky-ink' },
};

function ago(iso: string, now: number) {
  const m = Math.round((now - new Date(iso).getTime()) / 60000);
  if (m < 1) return '방금';
  if (m < 60) return `${m}분 전`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}시간 전`;
  return `${Math.round(h / 24)}일 전`;
}

export default function NotificationsPage() {
  const { ready, notices, readAllNotices, now } = useStore();

  // 화면을 떠날 때 모두 읽음 처리 (머무는 동안은 새 알림 표시를 유지)
  useEffect(() => () => readAllNotices(), []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <BackBar title="알림" />
      {!ready ? (
        <Loading />
      ) : (
        <ul className="m-0 list-none p-0">
          {notices.map((n) => (
            <li key={n.id} className={`border-b border-line last:border-0 ${!n.read ? '-mx-[18px] bg-gradient-to-r from-mint/70 to-transparent px-[18px]' : ''}`}>
              <Link href={n.href ?? '/'} className="flex gap-3 py-3.5 text-ink no-underline">
                <span className={`flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[14px] ${KIND[n.kind].cls}`}>
                  <Icon name={KIND[n.kind].icon} size={18} />
                </span>
                <span>
                  <span className="block text-sm leading-normal">
                    {n.strong ? <b>{n.strong} </b> : null}
                    {n.text}
                  </span>
                  <span className="text-xs text-sub">
                    {ago(n.at, now)}
                    {!n.read ? <span className="ml-1.5 font-bold text-green">새 소식</span> : null}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
