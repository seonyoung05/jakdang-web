'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { DISTRICT, listMeetups, listPrograms, listSpaces, meetupType } from '@/lib/api';
import { useAuth, useLoad } from '@/lib/auth';
import { JdPill, Segmented } from '@/components/jd';
import { Loading } from '@/components/ui';

/** 강좌·공간 찾기 (탭바의 돋보기) */
export default function ExplorePage() {
  const router = useRouter();
  const tab = useSearchParams().get('tab') === 'space' ? 'SPACE' : 'CLASS';
  const { configured } = useAuth();

  const { data, loading, error, reload } = useLoad(async () => {
    if (!configured) return null;
    const meetups = await listMeetups();
    const open = new Map<string, number>();
    for (const m of meetups) {
      if (m.status !== 'OPEN') continue;
      const key = meetupType(m) === 'SPACE' ? `s:${m.space_id}` : `c:${m.program_id}`;
      open.set(key, (open.get(key) ?? 0) + 1);
    }
    if (tab === 'SPACE') return { kind: 'SPACE' as const, spaces: await listSpaces(), open };
    return { kind: 'CLASS' as const, programs: await listPrograms(), open };
  }, [configured, tab]);

  return (
    <div className="flex flex-col gap-[14px]">
      <div className="leading-[1.4]">
        <h1 className="m-0 text-[22px] font-black">{DISTRICT} 공식 {tab === 'SPACE' ? '공간' : '강좌'}</h1>
        <p className="m-0 mt-1 text-[12px] text-ink-2">
          {tab === 'SPACE' ? '공공기관이 대관하는 공식 공간이에요. 함께 쓸 이웃을 모아 보세요.' : '자치회관 공식 프로그램이에요. 함께 들을 이웃을 모아 보세요.'}
        </p>
      </div>
      <Segmented
        label="찾을 종류"
        value={tab}
        onChange={(v) => router.replace(v === 'SPACE' ? '/programs?tab=space' : '/programs')}
        options={[
          { value: 'CLASS', label: '교육 같이 듣기' },
          { value: 'SPACE', label: '공간 함께 쓰기' },
        ]}
      />
      <p className="m-0 rounded-[12px] bg-bg px-3 py-2.5 text-[11px] leading-[1.5] font-medium text-ink-2">
        {tab === 'SPACE'
          ? '실제 대관 신청과 승인은 공공기관에서 해요. 이용 가능 여부와 요금은 공식 대관 안내에서 꼭 확인해 주세요.'
          : '일정은 기관이 안내한 문구 그대로예요. 접수 여부와 남은 자리는 공식 안내에서 꼭 확인해 주세요.'}
      </p>

      {loading ? (
        <Loading />
      ) : error ? (
        <div role="alert" className="rounded-[20px] bg-peach p-4 text-[13px] text-coral-ink">
          {error}
          <button type="button" onClick={reload} className="ml-2 font-bold underline">
            다시 시도
          </button>
        </div>
      ) : data?.kind === 'SPACE' ? (
        data.spaces.length === 0 ? (
          <p className="m-0 text-center text-[13px] text-ink-2">등록된 공식 공간이 아직 없어요</p>
        ) : (
          data.spaces.map((sp) => {
            const n = data.open.get(`s:${sp.id}`) ?? 0;
            return (
              <Card
                key={String(sp.id)}
                title={sp.name}
                badge={n ? `모집 ${n}개` : null}
                lines={[sp.venue, sp.address, sp.capacity ? `수용 ${sp.capacity}명` : null, sp.usage_notes].filter(Boolean) as string[]}
                createHref={`/new?space=${encodeURIComponent(String(sp.id))}`}
                createLabel="이 공간으로 모집 열기"
                officialUrl={sp.reservation_url}
                officialLabel="공식 대관 안내 확인"
              />
            );
          })
        )
      ) : data?.kind === 'CLASS' ? (
        data.programs.map((p) => {
          const n = data.open.get(`c:${p.id}`) ?? 0;
          return (
            <Card
              key={String(p.id)}
              title={p.name}
              badge={n ? `모집 ${n}개` : null}
              lines={[p.venue, p.schedule_text].filter(Boolean) as string[]}
              createHref={`/new?program=${encodeURIComponent(String(p.id))}`}
              createLabel="이 강좌로 모집 열기"
              officialUrl={p.registration_url}
              officialLabel="공식 신청 안내 확인"
            />
          );
        })
      ) : null}
    </div>
  );
}

function Card({
  title,
  badge,
  lines,
  createHref,
  createLabel,
  officialUrl,
  officialLabel,
}: {
  title: string;
  badge: string | null;
  lines: string[];
  createHref: string;
  createLabel: string;
  officialUrl: string | null;
  officialLabel: string;
}) {
  return (
    <article className="note-card flex flex-col gap-[10px] px-4 py-[14px] leading-[1.4]">
      <div className="flex items-start justify-between gap-2">
        <h2 className="m-0 text-[15px] font-bold">{title}</h2>
        {badge ? <JdPill>{badge}</JdPill> : null}
      </div>
      {lines.length ? (
        <div className="flex flex-col gap-0.5 text-[12px] text-ink-2">
          {lines.map((l) => (
            <span key={l}>{l}</span>
          ))}
        </div>
      ) : null}
      <div className="flex gap-2">
        <Link href={createHref} className="inline-flex h-11 flex-1 items-center justify-center rounded-[22px] bg-ink text-[13px] font-bold text-white no-underline">
          + {createLabel}
        </Link>
        {officialUrl ? (
          <a href={officialUrl} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center rounded-[22px] border border-line px-3.5 text-[12px] font-bold text-ink no-underline">
            {officialLabel} ↗
          </a>
        ) : null}
      </div>
    </article>
  );
}
