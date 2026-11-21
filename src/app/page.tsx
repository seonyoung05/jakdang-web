'use client';

import { useMemo, useState } from 'react';
import { useStore } from '@/lib/store';
import { kpis, sortByPossibility, won } from '@/lib/calc';
import type { Category, SlotView, TimeBand } from '@/lib/types';
import SlotCard from '@/components/SlotCard';
import Ddari from '@/components/Ddari';
import Icon from '@/components/Icon';
import { Chip, IconButton, LinkButton, Loading, SectionTitle } from '@/components/ui';
import { useJoinFlow } from '@/components/useJoinFlow';

const BANDS: ('전체' | TimeBand)[] = ['전체', '평일낮', '평일저녁', '주말오전', '주말오후'];
const CATS: Category[] = ['배드민턴', '풋살', '농구', '회의/스터디', '요리/공유주방'];
const COMFORTS = ['인증 멤버만', '또래끼리', '같은 성별끼리'] as const;
type Comfort = (typeof COMFORTS)[number];
type Sort = 'possibility' | 'deadline' | 'people';

export default function HomePage() {
  const { ready, views, me, notices, todayJoined } = useStore();
  const { openJoin, openCancel, ui } = useJoinFlow();
  const [band, setBand] = useState<(typeof BANDS)[number]>('전체');
  const [cats, setCats] = useState<Category[]>([]);
  const [comfort, setComfort] = useState<Comfort[]>([]);
  const [sort, setSort] = useState<Sort>('possibility');

  const list = useMemo(() => {
    const ok = (v: SlotView) => {
      if (v.status === 'booked') return false;
      if (band !== '전체' && v.timeBand !== band) return false;
      if (cats.length && !cats.includes(v.facility.category)) return false;
      if (comfort.includes('인증 멤버만') && !(v.audience === 'verified' || v.verifiedCount === v.currentCount)) return false;
      if (comfort.includes('또래끼리') && v.audience !== 'peers') return false;
      if (comfort.includes('같은 성별끼리') && v.audience !== 'sameGender') return false;
      return true;
    };
    const sorter =
      sort === 'deadline' ? (a: SlotView, b: SlotView) => a.deadlineMs - b.deadlineMs : sort === 'people' ? (a: SlotView, b: SlotView) => b.currentCount - a.currentCount : sortByPossibility;
    return views.filter(ok).sort(sorter);
  }, [views, band, cats, comfort, sort]);

  const k = kpis(views, todayJoined);
  const unread = notices.some((n) => !n.read);
  const toggle = <T,>(arr: T[], x: T) => (arr.includes(x) ? arr.filter((y) => y !== x) : [...arr, x]);

  return (
    <>
      <header className="mb-4 flex items-start justify-between gap-2">
        <div>
          <p className="m-0 text-[13px] text-sub">
            {me.district} {me.dong} · {me.nickname}님
          </p>
          <h1 className="m-0 mt-0.5 text-[22px] leading-snug font-black tracking-tight">
            이번 주, 이웃과
            <br />
            <span className="scribble">좋은 작당</span> 해 볼까요?
          </h1>
        </div>
        <IconButton href="/notifications" label={unread ? '알림, 새 소식 있음' : '알림'} icon="bell" dot={unread} />
      </header>

      <section className="flex items-center gap-3 rounded-[18px] bg-mint px-4 py-3.5" aria-label="내 인증 상태">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-paper text-green">
          <Icon name="shield" size={22} />
        </span>
        <div className="min-w-0 flex-1">
          <b className="block text-sm">인증된 이웃끼리 모여요</b>
          <span className="text-xs text-mint-ink">
            {me.verification.school ? '학교 인증' : ''}
            {me.verification.school && me.verification.neighborhood ? ' · ' : ''}
            {me.verification.neighborhood ? `동네 인증(${me.verification.neighborhood})` : ''} · 믿음 도장 {me.manner}점
          </span>
        </div>
      </section>

      <section aria-label="오늘의 작당 현황" className="no-scrollbar -mx-[18px] mt-3 flex gap-2 overflow-x-auto px-[18px]">
        {[
          ['열 수 있는 빈칸', `${k.openable}개`],
          ['오늘 모인 이웃', `${k.todayPeople}명`],
          ['함께 열린 시설', `${k.openedPlaces}곳`],
          ['함께 아낀 이용료', `${won(k.savedFee)}원`],
        ].map(([label, value]) => (
          <div key={label} className="flex min-w-[118px] flex-col gap-0.5 rounded-2xl border border-line bg-paper px-3.5 py-3">
            <span className="text-[11px] text-sub">{label}</span>
            <b className="text-[17px] font-black">{value}</b>
          </div>
        ))}
      </section>

      <section aria-label="필터" className="mt-4 flex flex-col gap-2">
        <div className="no-scrollbar -mx-[18px] flex gap-1.5 overflow-x-auto px-[18px]" role="group" aria-label="시간대">
          {BANDS.map((b) => (
            <Chip key={b} on={band === b} onClick={() => setBand(b)}>
              {b === '전체' ? '전체' : b.replace('평일', '평일 ').replace('주말', '주말 ')}
            </Chip>
          ))}
        </div>
        <div className="no-scrollbar -mx-[18px] flex gap-1.5 overflow-x-auto px-[18px]" role="group" aria-label="종목">
          {CATS.map((c) => (
            <Chip key={c} on={cats.includes(c)} onClick={() => setCats(toggle(cats, c))}>
              {c}
            </Chip>
          ))}
        </div>
        <div className="no-scrollbar -mx-[18px] flex gap-1.5 overflow-x-auto px-[18px]" role="group" aria-label="편한 모임">
          {COMFORTS.map((c) => (
            <Chip key={c} soft on={comfort.includes(c)} onClick={() => setComfort(toggle(comfort, c))}>
              {c}
            </Chip>
          ))}
        </div>
        <p className="m-0 text-[11px] text-sub">편한 모임 조건은 &lsquo;선호&rsquo;예요. 기본은 누구나 함께해요.</p>
      </section>

      <SectionTitle
        right={
          <label className="flex items-center gap-1 text-xs text-sub">
            <span className="sr-only">정렬</span>
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="min-h-9 rounded-[10px] border border-line-strong bg-paper px-2 text-xs text-ink">
              <option value="possibility">모임 가능성 높은 순</option>
              <option value="deadline">마감 임박 순</option>
              <option value="people">참여 인원 많은 순</option>
            </select>
          </label>
        }
      >
        작당 쪽지 <span className="text-green">{ready ? list.length : ''}</span>
      </SectionTitle>
      <p className="m-0 mb-3 text-[11px] text-sub">날짜·시간은 만든 사람이 제안한 시간이에요. 실제 예약 가능 여부는 원본에서 확인해요.</p>

      {!ready ? (
        <Loading />
      ) : list.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-[22px] border border-dashed border-line-strong bg-paper px-6 py-8 text-center">
          <Ddari mood="sleepy" size={60} />
          <b className="text-[15px]">아직 이런 작당은 없어요</b>
          <p className="m-0 text-[13px] text-sub">조건을 조금 풀거나, 직접 쪽지를 써 볼까요?</p>
          <LinkButton href="/new" variant="dark" icon="plus" className="!w-auto">
            작당 만들기
          </LinkButton>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {list.map((v) => (
            <SlotCard key={v.id} v={v} onJoin={() => openJoin(v)} onCancel={() => openCancel(v)} />
          ))}
        </div>
      )}
      {ui}
    </>
  );
}
