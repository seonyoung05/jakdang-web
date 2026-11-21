'use client';

import { useMemo, useState } from 'react';
import { DISTRICT, listMeetups, memberIndex } from '@/lib/api';
import { useAuth, useLoad } from '@/lib/auth';
import MeetupCard from '@/components/MeetupCard';
import Ddari from '@/components/Ddari';
import Icon from '@/components/Icon';
import { Chip, IconButton, LinkButton, Loading, SectionTitle } from '@/components/ui';

type Filter = 'open' | 'all' | 'mine';

export default function HomePage() {
  const { ready, configured, user, nickname } = useAuth();
  const [filter, setFilter] = useState<Filter>('open');

  const { data, loading, error, reload } = useLoad(async () => {
    if (!configured) return { meetups: [], members: null };
    const meetups = await listMeetups();
    // 참여 인원은 로그인해야 읽을 수 있다
    const members = user ? await memberIndex(meetups.map((m) => m.id)) : null;
    return { meetups, members };
  }, [configured, user?.id]);

  const list = useMemo(() => {
    if (!data) return [];
    return data.meetups
      .map((m) => {
        const ids = data.members?.get(String(m.id)) ?? null;
        return { m, count: data.members ? (ids?.length ?? 0) : null, mine: !!user && !!ids?.includes(user.id) };
      })
      .filter(({ m, count, mine }) => {
        if (filter === 'mine') return mine;
        if (filter === 'open') return m.status === 'OPEN' && (count === null || count < m.max_members);
        return true;
      });
  }, [data, filter, user]);

  return (
    <>
      <header className="mb-4 flex items-start justify-between gap-2">
        <div>
          <p className="m-0 text-[13px] text-sub">
            {DISTRICT}
            {user && nickname ? ` · ${nickname}님` : ''}
          </p>
          <h1 className="m-0 mt-0.5 text-[22px] leading-snug font-black tracking-tight">
            동네 강좌, 이웃과
            <br />
            <span className="scribble">같이 들어요</span>
          </h1>
        </div>
        <IconButton label="새로고침" icon="refresh" onClick={reload} />
      </header>

      <section className="flex items-start gap-3 rounded-[18px] bg-mint px-4 py-3.5" aria-label="서비스 안내">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-paper text-green">
          <Icon name="book" size={20} />
        </span>
        <div className="min-w-0 flex-1 text-xs leading-relaxed text-mint-ink">
          <b className="block text-sm text-ink">공식 교육 프로그램만 모집할 수 있어요</b>
          작당모임은 함께할 이웃을 모아 줘요. 수강 신청은 각자 공식 기관 안내에 따라 해 주세요.
        </div>
      </section>

      {ready && !user && configured ? (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-[18px] border border-line bg-paper px-4 py-3">
          <span className="text-[13px] text-sub">로그인하면 참여 인원 확인과 참여가 돼요</span>
          <LinkButton href="/login" variant="dark" className="!min-h-10 !w-auto !rounded-xl !px-3 !text-[13px]">
            로그인
          </LinkButton>
        </div>
      ) : null}

      <SectionTitle>모집 중인 작당</SectionTitle>
      <div className="no-scrollbar -mx-[18px] mb-3 flex gap-1.5 overflow-x-auto px-[18px]" role="group" aria-label="보기">
        <Chip on={filter === 'open'} onClick={() => setFilter('open')}>
          모집 중
        </Chip>
        <Chip on={filter === 'all'} onClick={() => setFilter('all')}>
          전체
        </Chip>
        {user ? (
          <Chip on={filter === 'mine'} onClick={() => setFilter('mine')}>
            내가 참여한
          </Chip>
        ) : null}
      </div>

      {loading || !ready ? (
        <Loading />
      ) : error ? (
        <div role="alert" className="rounded-2xl bg-[#FBE4E1] p-4 text-sm text-rose">
          {error}
          <button type="button" onClick={reload} className="ml-2 font-bold underline">
            다시 시도
          </button>
        </div>
      ) : list.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-[22px] border border-dashed border-line-strong bg-paper px-6 py-8 text-center">
          <Ddari mood="sleepy" size={60} />
          <b className="text-[15px]">{filter === 'mine' ? '아직 참여한 모집이 없어요' : '아직 열린 모집이 없어요'}</b>
          <p className="m-0 text-[13px] text-sub">관심 있는 강좌로 첫 모집을 열어 볼까요?</p>
          <LinkButton href="/programs" variant="dark" icon="book" className="!w-auto">
            강좌 보러 가기
          </LinkButton>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {list.map(({ m, count, mine }) => (
            <MeetupCard key={String(m.id)} m={m} count={count} mine={mine} />
          ))}
        </div>
      )}
    </>
  );
}
