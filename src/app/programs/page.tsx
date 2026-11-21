'use client';

import Link from 'next/link';
import { DISTRICT, listMeetups, listPrograms } from '@/lib/api';
import { useAuth, useLoad } from '@/lib/auth';
import Icon from '@/components/Icon';
import { Badge, Loading, Note } from '@/components/ui';

export default function ProgramsPage() {
  const { configured } = useAuth();
  const { data, loading, error, reload } = useLoad(async () => {
    if (!configured) return { programs: [], openCount: new Map<string, number>() };
    const [programs, meetups] = await Promise.all([listPrograms(), listMeetups()]);
    const openCount = new Map<string, number>();
    for (const m of meetups) if (m.status === 'OPEN') openCount.set(String(m.program_id), (openCount.get(String(m.program_id)) ?? 0) + 1);
    return { programs, openCount };
  }, [configured]);

  return (
    <>
      <h1 className="m-0 text-[22px] font-black">{DISTRICT} 공식 강좌</h1>
      <p className="m-0 mt-1 mb-3 text-[13px] text-sub">자치회관 공식 프로그램이에요. 함께 들을 이웃을 모아 보세요.</p>
      <Note>일정은 기관이 안내한 문구 그대로예요. 접수 여부와 남은 자리는 공식 안내에서 꼭 확인해 주세요.</Note>

      <div className="mt-4 flex flex-col gap-3">
        {loading ? (
          <Loading />
        ) : error ? (
          <div role="alert" className="rounded-2xl bg-[#FBE4E1] p-4 text-sm text-rose">
            {error}
            <button type="button" onClick={reload} className="ml-2 font-bold underline">
              다시 시도
            </button>
          </div>
        ) : (
          data?.programs.map((p) => {
            const open = data.openCount.get(String(p.id)) ?? 0;
            return (
              <article key={String(p.id)} className="note-card flex flex-col gap-2.5 p-4">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="m-0 text-[16px] leading-snug font-bold">{p.name}</h2>
                  {open ? <Badge tone="green">모집 {open}개</Badge> : null}
                </div>
                <div className="flex flex-col gap-0.5 text-[13px] text-sub">
                  {p.venue ? (
                    <span className="flex items-center gap-1">
                      <Icon name="pin" size={13} />
                      {p.venue}
                    </span>
                  ) : null}
                  {p.schedule_text ? (
                    <span className="flex items-start gap-1">
                      <Icon name="cal" size={13} className="mt-[3px] shrink-0" />
                      {p.schedule_text}
                    </span>
                  ) : null}
                </div>
                <div className="mt-1 flex gap-2">
                  <Link
                    href={`/new?program=${encodeURIComponent(String(p.id))}`}
                    className="inline-flex min-h-11 flex-1 items-center justify-center gap-1 rounded-[14px] bg-ink text-sm font-bold text-white no-underline"
                  >
                    <Icon name="plus" size={16} />이 강좌로 모집 열기
                  </Link>
                  {p.registration_url ? (
                    <a
                      href={p.registration_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-11 items-center gap-1 rounded-[14px] border border-line-strong px-3 text-[13px] font-medium text-ink no-underline"
                    >
                      공식 신청 안내 확인
                      <Icon name="external" size={14} />
                    </a>
                  ) : null}
                </div>
              </article>
            );
          })
        )}
      </div>
    </>
  );
}
