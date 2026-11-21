'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { MAX_MEMBERS, MIN_MEMBERS, createMeetup, listPrograms } from '@/lib/api';
import { useAuth, useLoad } from '@/lib/auth';
import Icon from '@/components/Icon';
import Ddari from '@/components/Ddari';
import { BackBar, Button, LinkButton, Loading, Note } from '@/components/ui';

export default function NewMeetupPage() {
  const router = useRouter();
  const preset = useSearchParams().get('program');
  const { ready, user, configured } = useAuth();
  const { data: programs, loading, error } = useLoad(() => (configured ? listPrograms() : Promise.resolve([])), [configured]);
  const [picked, setPicked] = useState<string | null>(preset);
  const [max, setMax] = useState(4);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!ready) return <Loading />;
  if (!user) {
    return (
      <>
        <BackBar title="모집 열기" />
        <div className="flex flex-col items-center gap-3 pt-14 text-center">
          <Ddari mood="look" />
          <b className="text-[17px]">로그인하고 모집을 열 수 있어요</b>
          <LinkButton href={`/login?next=${encodeURIComponent(`/new${preset ? `?program=${preset}` : ''}`)}`} variant="dark" className="!w-auto">
            로그인하러 가기
          </LinkButton>
        </div>
      </>
    );
  }

  const program = programs?.find((p) => String(p.id) === picked) ?? null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!program) return setErr('강좌를 골라 주세요');
    setBusy(true);
    setErr(null);
    try {
      const m = await createMeetup(program.id, user.id, max);
      router.replace(`/m/${m.id}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <BackBar title="새 모집 열기" />

      <fieldset className="m-0 mb-5 border-0 p-0">
        <legend className="mb-2 p-0 text-[13px] font-bold">어떤 강좌를 같이 들을까요?</legend>
        {loading ? (
          <Loading />
        ) : error ? (
          <p role="alert" className="text-sm text-rose">
            {error}
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {programs?.map((p) => {
              const on = String(p.id) === picked;
              return (
                <button
                  key={String(p.id)}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setPicked(String(p.id))}
                  className={`flex min-h-14 items-start gap-3 rounded-[14px] border px-3.5 py-3 text-left ${on ? 'border-2 border-green bg-mint' : 'border-line-strong bg-paper'}`}
                >
                  <Icon name={on ? 'check' : 'book'} size={18} className={`mt-0.5 shrink-0 ${on ? 'text-green' : 'text-sub'}`} />
                  <span className="min-w-0 flex-1">
                    <b className="block text-sm leading-snug">{p.name}</b>
                    <span className="block text-xs text-sub">{[p.venue, p.schedule_text].filter(Boolean).join(' · ')}</span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </fieldset>

      <div className="mb-5">
        <p className="m-0 mb-2 text-[13px] font-bold">몇 명이 모일까요? (나 포함)</p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="한 명 줄이기"
            onClick={() => setMax((n) => Math.max(MIN_MEMBERS, n - 1))}
            disabled={max <= MIN_MEMBERS}
            className="flex h-12 w-12 items-center justify-center rounded-[14px] border border-line-strong bg-paper text-xl font-bold disabled:text-[#9AA19C]"
          >
            −
          </button>
          <output aria-live="polite" className="min-w-20 text-center text-[28px] font-black">
            {max}명
          </output>
          <button
            type="button"
            aria-label="한 명 늘리기"
            onClick={() => setMax((n) => Math.min(MAX_MEMBERS, n + 1))}
            disabled={max >= MAX_MEMBERS}
            className="flex h-12 w-12 items-center justify-center rounded-[14px] border border-line-strong bg-paper text-xl font-bold disabled:text-[#9AA19C]"
          >
            +
          </button>
        </div>
        <p className="m-0 mt-2 text-xs text-sub">
          {MIN_MEMBERS}~{MAX_MEMBERS}명까지, 선착순으로 마감돼요.
        </p>
      </div>

      <div className="mb-4 flex flex-col gap-2 rounded-[18px] bg-paper p-4">
        <Note icon="users">모집을 연 사람도 참여자 1명으로 자동 등록돼요. 나중에 빠져도 모집글은 남아요.</Note>
        <Note icon="book">수강 신청은 대신해 주지 않아요. 모인 뒤 각자 공식 안내에 따라 신청해요.</Note>
      </div>

      {err ? (
        <p role="alert" className="m-0 mb-3 text-[13px] font-bold text-rose">
          {err}
        </p>
      ) : null}
      <Button type="submit" variant="dark" disabled={busy || !program}>
        {busy ? '여는 중…' : '모집 열기'}
      </Button>
    </form>
  );
}
