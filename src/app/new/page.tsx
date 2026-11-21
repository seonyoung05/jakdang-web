'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { MAX_MEMBERS, MIN_MEMBERS, createMeetup, listPrograms } from '@/lib/api';
import { useAuth, useLoad } from '@/lib/auth';
import Jakdangi, { JakdangiRow } from '@/components/Jakdangi';
import { JdButton, JdLinkButton } from '@/components/jd';
import { Loading } from '@/components/ui';

/** 피그마 08 작당 꾸미기 — 백엔드가 받는 값(공식 강좌, 정원)만 남겼다 */
export default function NewMeetupPage() {
  const router = useRouter();
  const preset = useSearchParams().get('program');
  const { ready, user, configured, nickname } = useAuth();
  const { data: programs, loading, error } = useLoad(() => (configured ? listPrograms() : Promise.resolve([])), [configured]);
  const [picked, setPicked] = useState<string | null>(preset);
  const [openList, setOpenList] = useState(!preset);
  const [max, setMax] = useState(4);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const close = () => (window.history.length > 1 ? router.back() : router.push('/'));

  if (!ready) return <Loading />;
  if (!user) {
    return (
      <div className="flex flex-col items-center gap-3 pt-20 text-center">
        <Jakdangi empty size={64} />
        <b className="text-[17px]">로그인하고 작당을 꾸밀 수 있어요</b>
        <JdLinkButton href={`/login?next=${encodeURIComponent(`/new${preset ? `?program=${preset}` : ''}`)}`} kind="dark" className="!w-auto">
          로그인하러 가기
        </JdLinkButton>
      </div>
    );
  }

  const program = programs?.find((p) => String(p.id) === picked) ?? null;

  const submit = async () => {
    if (!program) return setErr('공식 강좌를 골라 주세요');
    setBusy(true);
    setErr(null);
    try {
      const m = await createMeetup(program.id, user.id, max);
      router.replace(`/m/${m.id}?invite=1`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  };

  return (
    <div className="-mx-[18px] -mt-4 flex min-h-full flex-col bg-ink/[.04] pt-3">
      <div className="flex flex-1 flex-col items-center gap-2 rounded-t-[30px] bg-surface px-5 pt-3 pb-5">
        <span className="h-[5px] w-[44px] rounded-[3px] bg-line" aria-hidden="true" />
        <div className="flex w-full items-center justify-between leading-[1.4]">
          <h1 className="m-0 text-[20px] font-black">작당 꾸미기</h1>
          <button type="button" onClick={close} className="-my-3 min-h-11 text-[13px] font-medium text-ink-2">
            닫기
          </button>
        </div>

        {/* 공식 강좌 */}
        <div className="flex w-full flex-col gap-1">
          <p className="m-0 text-[12px] leading-[1.4] font-bold">공식 강좌</p>
          <button
            type="button"
            aria-expanded={openList}
            onClick={() => setOpenList((v) => !v)}
            className="flex w-full flex-col gap-px rounded-[14px] border-[1.5px] border-ink-3 bg-surface px-[14px] py-[10px] text-left leading-[1.4]"
          >
            <b className="text-[14px]">{program ? program.name : '강좌를 골라 주세요'} ▾</b>
            <span className="text-[11px] text-ink-2">{program ? [program.venue, program.schedule_text].filter(Boolean).join(' · ') : '종로구 자치회관 공식 프로그램'}</span>
          </button>
          {openList ? (
            <div className="flex w-full flex-col gap-1.5 pt-1">
              {loading ? (
                <Loading />
              ) : error ? (
                <p role="alert" className="m-0 text-[12px] text-rose">
                  {error}
                </p>
              ) : (
                programs?.map((p) => {
                  const on = String(p.id) === picked;
                  return (
                    <button
                      key={String(p.id)}
                      type="button"
                      aria-pressed={on}
                      onClick={() => {
                        setPicked(String(p.id));
                        setOpenList(false);
                      }}
                      className={`flex w-full flex-col gap-px rounded-[14px] border px-[14px] py-[10px] text-left leading-[1.4] ${on ? 'border-coral bg-peach' : 'border-line bg-surface'}`}
                    >
                      <b className="text-[13px]">{p.name}</b>
                      <span className="text-[11px] text-ink-2">{[p.venue, p.schedule_text].filter(Boolean).join(' · ')}</span>
                    </button>
                  );
                })
              )}
            </div>
          ) : null}
        </div>

        {/* 정원 */}
        <div className="flex w-full flex-col gap-1">
          <p className="m-0 text-[12px] leading-[1.4] font-bold">
            몇 명이 모일까요 <span className="font-normal text-ink-3">나 포함 · 선착순</span>
          </p>
          <div className="flex w-full items-center rounded-[22px] bg-bg p-[3px]">
            <button
              type="button"
              aria-label="한 명 줄이기"
              disabled={max <= MIN_MEMBERS}
              onClick={() => setMax((n) => Math.max(MIN_MEMBERS, n - 1))}
              className="flex h-11 w-14 items-center justify-center rounded-[18px] bg-surface text-[18px] font-bold disabled:opacity-40"
            >
              −
            </button>
            <output aria-live="polite" className="flex-1 text-center text-[15px] font-black">
              {max}명
            </output>
            <button
              type="button"
              aria-label="한 명 늘리기"
              disabled={max >= MAX_MEMBERS}
              onClick={() => setMax((n) => Math.min(MAX_MEMBERS, n + 1))}
              className="flex h-11 w-14 items-center justify-center rounded-[18px] bg-surface text-[18px] font-bold disabled:opacity-40"
            >
              +
            </button>
          </div>
        </div>

        {/* 미리보기 */}
        <div className="flex w-full flex-col gap-1.5 rounded-[16px] bg-peach px-[14px] py-3">
          <div className="flex items-center justify-between gap-2">
            <b className="text-[14px] leading-[1.4] font-black">{max}명이 모이면 작당 성공!</b>
            <JakdangiRow members={[{ id: user.id, name: nickname }]} max={max} size={22} limit={6} />
          </div>
          <p className="m-0 text-[11px] leading-[1.4] font-medium text-coral-ink">
            {MIN_MEMBERS}~{MAX_MEMBERS}명 · 나도 첫 번째 참여자로 들어가요 · 나중에 빠져도 작당은 남아요
          </p>
        </div>

        <div className="flex w-full flex-col gap-1">
          <p className="m-0 text-[12px] leading-[1.4] font-bold">닉네임</p>
          <div className="flex h-10 w-full items-center rounded-[14px] border border-line px-[14px] text-[13px]">{nickname}</div>
        </div>

        <p className="m-0 w-full rounded-[12px] bg-bg px-3 py-2.5 text-[11px] leading-[1.4] font-medium text-ink-2">
          작당모임은 수강 신청을 대신하지 않아요. 모인 뒤 각자 공식 안내에 따라 신청해요.
        </p>

        {err ? (
          <p role="alert" className="m-0 w-full text-[13px] font-bold text-rose">
            {err}
          </p>
        ) : null}
        <div className="mt-auto w-full pt-2">
          <JdButton kind="dark" onClick={submit} disabled={busy || !program}>
            {busy ? '꾸미는 중…' : '작당 시작하기'}
          </JdButton>
        </div>
      </div>
    </div>
  );
}
