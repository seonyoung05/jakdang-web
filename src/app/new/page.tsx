'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useId, useState } from 'react';
import { MAX_MEMBERS, MIN_MEMBERS, createMeetup, createSpaceMeetup, listPrograms, listSpaces, spaceMaxMembers } from '@/lib/api';
import { useAuth, useLoad } from '@/lib/auth';
import type { MeetupType } from '@/lib/types';
import Jakdangi, { JakdangiRow } from '@/components/Jakdangi';
import { JdButton, JdLinkButton, Segmented } from '@/components/jd';
import { Loading } from '@/components/ui';

const pad = (n: number) => String(n).padStart(2, '0');
function defaultDate() {
  const d = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** 피그마 08 작당 꾸미기 — 교육(CLASS)·공간(SPACE) 두 종류 */
export default function NewMeetupPage() {
  const router = useRouter();
  const search = useSearchParams();
  const presetProgram = search.get('program');
  const presetSpace = search.get('space');
  const { ready, user, configured, nickname } = useAuth();

  const [type, setType] = useState<MeetupType>(presetSpace ? 'SPACE' : 'CLASS');
  const programs = useLoad(() => (configured && type === 'CLASS' ? listPrograms() : Promise.resolve([])), [configured, type]);
  const spaces = useLoad(() => (configured && type === 'SPACE' ? listSpaces() : Promise.resolve([])), [configured, type]);

  const [pickedProgram, setPickedProgram] = useState<string | null>(presetProgram);
  const [pickedSpace, setPickedSpace] = useState<string | null>(presetSpace);
  const [openList, setOpenList] = useState(!(presetProgram || presetSpace));
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(defaultDate);
  const [start, setStart] = useState('19:00');
  const [end, setEnd] = useState('21:00');
  const [max, setMax] = useState(4);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const ids = { title: useId(), date: useId(), start: useId(), end: useId() };

  const close = () => (window.history.length > 1 ? router.back() : router.push('/'));

  if (!ready) return <Loading />;
  if (!user) {
    const q = presetSpace ? `?space=${presetSpace}` : presetProgram ? `?program=${presetProgram}` : '';
    return (
      <div className="flex flex-col items-center gap-3 pt-20 text-center">
        <Jakdangi empty size={64} />
        <b className="text-[17px]">로그인하고 작당을 꾸밀 수 있어요</b>
        <JdLinkButton href={`/login?next=${encodeURIComponent(`/new${q}`)}`} kind="dark" className="!w-auto">
          로그인하러 가기
        </JdLinkButton>
      </div>
    );
  }

  const program = programs.data?.find((p) => String(p.id) === pickedProgram) ?? null;
  const space = spaces.data?.find((sp) => String(sp.id) === pickedSpace) ?? null;
  const upper = type === 'SPACE' ? spaceMaxMembers(space) : MAX_MEMBERS;
  const members = Math.min(max, upper);

  const startAt = new Date(`${date}T${start}`);
  const endAt = new Date(`${date}T${end}`);

  const submit = async () => {
    setErr(null);
    if (type === 'CLASS' && !program) return setErr('공식 강좌를 골라 주세요');
    if (type === 'SPACE') {
      if (!space) return setErr('공식 공간을 골라 주세요');
      if (!title.trim()) return setErr('함께할 활동 이름을 적어 주세요');
      if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) return setErr('희망 이용 일시를 확인해 주세요');
      if (endAt <= startAt) return setErr('끝나는 시간은 시작 시간보다 늦어야 해요');
      if (startAt.getTime() < Date.now()) return setErr('지난 시간은 고를 수 없어요');
      if (space.capacity && members > space.capacity) return setErr(`이 공간은 ${space.capacity}명까지 쓸 수 있어요`);
    }
    setBusy(true);
    try {
      const m =
        type === 'SPACE'
          ? await createSpaceMeetup({ spaceId: space!.id, creatorId: user.id, maxMembers: members, activityTitle: title.trim(), startAt, endAt })
          : await createMeetup(program!.id, user.id, members);
      router.replace(`/m/${m.id}?invite=1`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  };

  const listState = type === 'SPACE' ? spaces : programs;
  const field = 'flex h-10 w-full items-center rounded-[14px] border-[1.5px] border-ink-3 bg-surface px-[14px] text-[13px] font-bold';

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

        <Segmented
          label="작당 종류"
          value={type}
          onChange={(v) => {
            setType(v);
            setOpenList(true);
            setErr(null);
          }}
          options={[
            { value: 'CLASS', label: '교육 같이 듣기' },
            { value: 'SPACE', label: '공간 함께 쓰기' },
          ]}
        />

        {/* 강좌 / 공간 고르기 */}
        <div className="flex w-full flex-col gap-1">
          <p className="m-0 text-[12px] leading-[1.4] font-bold">{type === 'SPACE' ? '공식 공간' : '공식 강좌'}</p>
          <button
            type="button"
            aria-expanded={openList}
            onClick={() => setOpenList((v) => !v)}
            className="flex w-full flex-col gap-px rounded-[14px] border-[1.5px] border-ink-3 bg-surface px-[14px] py-[10px] text-left leading-[1.4]"
          >
            <b className="text-[14px]">
              {type === 'SPACE' ? (space ? space.name : '공간을 골라 주세요') : program ? program.name : '강좌를 골라 주세요'} ▾
            </b>
            <span className="text-[11px] text-ink-2">
              {type === 'SPACE'
                ? space
                  ? [space.venue, space.capacity ? `수용 ${space.capacity}명` : null].filter(Boolean).join(' · ')
                  : '공공기관 공식 공간만 고를 수 있어요'
                : program
                  ? [program.venue, program.schedule_text].filter(Boolean).join(' · ')
                  : '종로구 자치회관 공식 프로그램'}
            </span>
          </button>
          {openList ? (
            <div className="flex w-full flex-col gap-1.5 pt-1">
              {listState.loading ? (
                <Loading />
              ) : listState.error ? (
                <p role="alert" className="m-0 text-[12px] text-rose">
                  {listState.error}
                </p>
              ) : type === 'SPACE' ? (
                spaces.data?.map((sp) => {
                  const on = String(sp.id) === pickedSpace;
                  return (
                    <button
                      key={String(sp.id)}
                      type="button"
                      aria-pressed={on}
                      onClick={() => {
                        setPickedSpace(String(sp.id));
                        setOpenList(false);
                      }}
                      className={`flex w-full flex-col gap-px rounded-[14px] border px-[14px] py-[10px] text-left leading-[1.4] ${on ? 'border-coral bg-peach' : 'border-line bg-surface'}`}
                    >
                      <b className="text-[13px]">{sp.name}</b>
                      <span className="text-[11px] text-ink-2">{[sp.venue, sp.capacity ? `수용 ${sp.capacity}명` : null].filter(Boolean).join(' · ')}</span>
                    </button>
                  );
                })
              ) : (
                programs.data?.map((p) => {
                  const on = String(p.id) === pickedProgram;
                  return (
                    <button
                      key={String(p.id)}
                      type="button"
                      aria-pressed={on}
                      onClick={() => {
                        setPickedProgram(String(p.id));
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

        {/* 공간: 활동 이름 + 희망 이용 일시 */}
        {type === 'SPACE' ? (
          <>
            <label htmlFor={ids.title} className="flex w-full flex-col gap-1">
              <span className="text-[12px] leading-[1.4] font-bold">
                함께할 활동 <span className="font-normal text-ink-3">예: 보드게임 함께 해요</span>
              </span>
              <input id={ids.title} value={title} maxLength={40} onChange={(e) => setTitle(e.target.value)} placeholder="무엇을 함께 할까요?" className={`${field} placeholder:font-normal placeholder:text-ink-3`} />
            </label>
            <div className="flex w-full flex-col gap-1">
              <p className="m-0 text-[12px] leading-[1.4] font-bold">
                희망 이용 일시 <span className="font-normal text-ink-3">예약 확정 아님</span>
              </p>
              <label htmlFor={ids.date} className="w-full">
                <span className="sr-only">날짜</span>
                <input id={ids.date} type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`${field} min-w-0`} />
              </label>
              <div className="grid w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
                <label htmlFor={ids.start} className="min-w-0">
                  <span className="sr-only">시작 시간</span>
                  <input id={ids.start} type="time" step={1800} value={start} onChange={(e) => setStart(e.target.value)} className={`${field} min-w-0`} />
                </label>
                <span className="text-[13px] text-ink-2" aria-hidden="true">
                  ~
                </span>
                <label htmlFor={ids.end} className="min-w-0">
                  <span className="sr-only">끝나는 시간</span>
                  <input id={ids.end} type="time" step={1800} value={end} onChange={(e) => setEnd(e.target.value)} className={`${field} min-w-0`} />
                </label>
              </div>
            </div>
          </>
        ) : null}

        {/* 정원 */}
        <div className="flex w-full flex-col gap-1">
          <p className="m-0 text-[12px] leading-[1.4] font-bold">
            몇 명이 모일까요 <span className="font-normal text-ink-3">나 포함 · 선착순{type === 'SPACE' && space?.capacity ? ` · 이 공간은 ${space.capacity}명까지` : ''}</span>
          </p>
          <div className="flex w-full items-center rounded-[22px] bg-bg p-[3px]">
            <button
              type="button"
              aria-label="한 명 줄이기"
              disabled={members <= MIN_MEMBERS}
              onClick={() => setMax(Math.max(MIN_MEMBERS, members - 1))}
              className="flex h-11 w-14 items-center justify-center rounded-[18px] bg-surface text-[18px] font-bold disabled:opacity-40"
            >
              −
            </button>
            <output aria-live="polite" className="flex-1 text-center text-[15px] font-black">
              {members}명
            </output>
            <button
              type="button"
              aria-label="한 명 늘리기"
              disabled={members >= upper}
              onClick={() => setMax(Math.min(upper, members + 1))}
              className="flex h-11 w-14 items-center justify-center rounded-[18px] bg-surface text-[18px] font-bold disabled:opacity-40"
            >
              +
            </button>
          </div>
        </div>

        {/* 미리보기 */}
        <div className="flex w-full flex-col gap-1.5 rounded-[16px] bg-peach px-[14px] py-3">
          <div className="flex items-center justify-between gap-2">
            <b className="text-[14px] leading-[1.4] font-black">{members}명이 모이면 작당 성공!</b>
            <JakdangiRow members={[{ id: user.id, name: nickname }]} max={members} size={22} limit={6} />
          </div>
          <p className="m-0 text-[11px] leading-[1.4] font-medium text-coral-ink">
            {MIN_MEMBERS}~{upper}명 · 나도 첫 번째 참여자로 들어가요 · 나중에 빠져도 작당은 남아요
          </p>
        </div>

        <div className="flex w-full flex-col gap-1">
          <p className="m-0 text-[12px] leading-[1.4] font-bold">닉네임</p>
          <div className="flex h-10 w-full items-center rounded-[14px] border border-line px-[14px] text-[13px]">{nickname}</div>
        </div>

        <p className="m-0 w-full rounded-[12px] bg-bg px-3 py-2.5 text-[11px] leading-[1.4] font-medium text-ink-2">
          {type === 'SPACE'
            ? '실제 대관은 공공기관에서 신청·승인받아요. 모집 인원은 함께할 이웃 수이고, 시설 예약이 확정된 건 아니에요.'
            : '작당모임은 수강 신청을 대신하지 않아요. 모인 뒤 각자 공식 안내에 따라 신청해요.'}
        </p>

        {err ? (
          <p role="alert" className="m-0 w-full text-[13px] font-bold text-rose">
            {err}
          </p>
        ) : null}
        <div className="mt-auto w-full pt-2">
          <JdButton kind="dark" onClick={submit} disabled={busy || (type === 'CLASS' ? !program : !space)}>
            {busy ? '꾸미는 중…' : '작당 시작하기'}
          </JdButton>
        </div>
      </div>
    </div>
  );
}
