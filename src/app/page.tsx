'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { DISTRICT, listMeetups, meetupType, memberIndex } from '@/lib/api';
import type { MeetupType } from '@/lib/types';
import { useAuth, useLoad } from '@/lib/auth';
import Jakdangi from '@/components/Jakdangi';
import MeetupCard from '@/components/MeetupCard';
import TableScene from '@/components/TableScene';
import { JdLinkButton, Segmented } from '@/components/jd';
import { Loading } from '@/components/ui';

/** 피그마 01 메인 */
export default function HomePage() {
  const { ready, configured, user, profile } = useAuth();
  const [showAll, setShowAll] = useState(false);
  const [tab, setTab] = useState<MeetupType>('CLASS');

  const { data, loading, error, reload } = useLoad(async () => {
    if (!configured) return { meetups: [], members: null };
    const meetups = await listMeetups();
    const members = user ? await memberIndex(meetups.map((m) => m.id)) : null;
    return { meetups, members };
  }, [configured, user?.id]);

  const rows = useMemo(() => {
    if (!data) return [];
    return data.meetups.map((m) => {
      const ids = data.members ? (data.members.get(String(m.id)) ?? []) : null;
      const remaining = ids ? m.max_members - ids.length : null;
      return { m, ids, remaining, open: m.status === 'OPEN' && (remaining === null || remaining > 0) };
    });
  }, [data]);

  const open = rows.filter((r) => r.open).sort((a, b) => (a.remaining ?? 99) - (b.remaining ?? 99));
  const list = (showAll ? rows : open).filter((r) => meetupType(r.m) === tab);
  const almost = list.some((r) => r.open && r.remaining === 1);
  const neighbors = data?.members ? open.reduce((n, r) => n + (r.ids?.length ?? 0), 0) : null;

  return (
    <div className="flex flex-col gap-[14px]">
      {/* 상단: 로고 + 동네 */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className="flex">
            <span className="-mr-[10px]">
              <Jakdangi color="peach" mood="sly" size={30} />
            </span>
            <Jakdangi color="yellow" mood="sly" size={30} />
          </span>
          <h1 className="m-0 text-[19px] leading-[1.4] font-black">작당모임</h1>
        </div>
        <span className="flex items-center gap-1 rounded-full border border-line bg-surface px-3 py-1.5 text-[12px] leading-[1.4] font-bold">
          <span className="text-[8px] text-coral" aria-hidden="true">
            ●
          </span>
          {profile?.neighborhood_name || DISTRICT}
        </span>
      </header>

      {/* 히어로 */}
      <section className="flex flex-col gap-[6px] rounded-[24px] bg-peach p-[18px]" aria-label="우리 동네 작당 현황">
        <h2 className="m-0 text-[21px] leading-[1.4] font-black">
          지금 우리 동네에서
          <br />
          {neighbors !== null ? `작당 중인 이웃 ${neighbors}명` : `열린 작당 ${open.length}개`}
        </h2>
        <p className="m-0 text-[12px] leading-[1.4] text-ink-2">공식 강좌도, 공공 공간도 혼자 말고 같이</p>
        <TableScene
          height={160}
          label="테이블에 둘러앉은 작당이들"
          seats={[
            { id: 'h1', color: 'peach' },
            { id: 'h2', color: 'yellow' },
            { id: 'h3', color: 'sky' },
            { id: 'h4', color: 'peach' },
            { id: 'h5', color: 'yellow' },
            null,
          ]}
          mood="sly"
          bubbles={[{ seat: 2, text: '쉿!' }]}
        />
      </section>

      {ready && configured && !user ? (
        <div className="flex items-center justify-between gap-3 rounded-[20px] border border-line px-4 py-3">
          <span className="text-[12px] text-ink-2">로그인하면 함께할 이웃이 보여요</span>
          <Link href="/login" className="inline-flex min-h-10 items-center rounded-[20px] bg-ink px-4 text-[13px] font-bold text-white no-underline">
            로그인
          </Link>
        </div>
      ) : null}

      {/* 목록: 교육 같이 듣기 / 공간 함께 쓰기 */}
      <Segmented
        label="모집 종류"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'CLASS', label: '교육 같이 듣기' },
          { value: 'SPACE', label: '공간 함께 쓰기' },
        ]}
      />
      <div className="flex items-center justify-between leading-[1.4]">
        <h2 className="m-0 text-[16px] font-black">{showAll ? '모든 작당' : almost ? '한 명만 더 오면 시작해요' : '모집 중인 작당'}</h2>
        <button type="button" onClick={() => setShowAll((v) => !v)} className="-my-3 min-h-11 text-[12px] font-medium text-ink-2">
          {showAll ? '모집 중만' : '전체보기'}
        </button>
      </div>

      {loading || !ready ? (
        <Loading />
      ) : error ? (
        <div role="alert" className="rounded-[20px] bg-peach p-4 text-[13px] text-coral-ink">
          {error}
          <button type="button" onClick={reload} className="ml-2 font-bold underline">
            다시 시도
          </button>
        </div>
      ) : list.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-[20px] border border-dashed border-line px-6 py-8 text-center">
          <Jakdangi empty size={56} />
          <b className="text-[15px]">아직 열린 작당이 없어요</b>
          <p className="m-0 text-[12px] text-ink-2">{tab === 'SPACE' ? '공식 공간으로 첫 작당을 꾸며 볼까요?' : '관심 있는 공식 강좌로 첫 작당을 꾸며 볼까요?'}</p>
          <JdLinkButton href={tab === 'SPACE' ? '/programs?tab=space' : '/programs'} kind="dark" className="!w-auto">
            {tab === 'SPACE' ? '공간 찾아보기' : '강좌 찾아보기'}
          </JdLinkButton>
        </div>
      ) : (
        <div className="flex flex-col gap-[14px]">
          {list.map(({ m, ids }) => (
            <MeetupCard key={String(m.id)} m={m} memberIds={ids} />
          ))}
        </div>
      )}
    </div>
  );
}
