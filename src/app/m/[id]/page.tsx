'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { use, useRef, useState, type FormEvent, type Ref } from 'react';
import { getMeetup, joinMeetup, leaveMeetup, listMembers, listQna, postAnswer, postQuestion } from '@/lib/api';
import { useAuth, useLoad } from '@/lib/auth';
import type { MeetupMember, QnaThread } from '@/lib/types';
import Jakdangi from '@/components/Jakdangi';
import { timeAgo } from '@/components/MeetupCard';
import { InviteSheet, JoinSheet, NextSteps, QuestionSheet, SuccessScreen } from '@/components/MeetupSheets';
import TableScene, { seatsFrom } from '@/components/TableScene';
import { CircleButton, JdButton, JdLinkButton, JdPill, JdPillButton } from '@/components/jd';
import { Loading } from '@/components/ui';

/** 피그마 02 작당 상세 / 05 작당 상세 · 성공 */
export default function MeetupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const search = useSearchParams();
  const { ready, user, nickname } = useAuth();
  const [sheet, setSheet] = useState<'join' | 'invite' | 'question' | null>(search.get('invite') ? 'invite' : null);
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const qnaRef = useRef<HTMLElement>(null);

  const meetup = useLoad(() => getMeetup(id), [id]);
  const members = useLoad<MeetupMember[] | null>(() => (user ? listMembers(id) : Promise.resolve(null)), [id, user?.id]);
  const qna = useLoad(() => listQna(id), [id]);

  if (!ready || meetup.loading) return <Loading />;
  const m = meetup.data;
  if (meetup.error || !m) {
    return (
      <div className="flex flex-col items-center gap-3 pt-20 text-center">
        <Jakdangi empty size={64} />
        <b>{meetup.error ?? '이 작당을 찾을 수 없어요'}</b>
        <JdLinkButton href="/" kind="light" className="!w-auto">
          홈으로
        </JdLinkButton>
      </div>
    );
  }

  const p = m.programs;
  const list = members.data ?? [];
  const known = members.data !== null;
  const count = list.length;
  const joined = !!user && list.some((x) => x.user_id === user.id);
  const full = known && count >= m.max_members;
  const closed = m.status === 'CLOSED';
  const left = Math.max(0, m.max_members - count);
  const people = list.map((x) => ({ id: x.user_id, name: x.profiles?.nickname || '이웃' }));
  const nameOf = (uid: string) => list.find((x) => x.user_id === uid)?.profiles?.nickname || (uid === user?.id ? nickname : '') || '이웃';
  const pageUrl = typeof window === 'undefined' ? `/m/${m.id}` : `${window.location.origin}/m/${m.id}`;
  const loginHref = `/login?next=${encodeURIComponent(`/m/${id}`)}`;

  const join = async () => {
    if (!user) return;
    setBusy(true);
    setErr(null);
    try {
      await joinMeetup(m.id, user.id);
      const after = await listMembers(m.id);
      setSheet(null);
      if (after.length >= m.max_members) setSuccess(true);
      members.reload();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
      members.reload();
    } finally {
      setBusy(false);
    }
  };

  const leave = async () => {
    if (!user) return;
    setBusy(true);
    setErr(null);
    try {
      await leaveMeetup(m.id, user.id);
      members.reload();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const statusPill = closed ? <JdPill style="outline">모집 마감</JdPill> : full ? <JdPill style="dark">작당 성공</JdPill> : <JdPill>모집 중 · 선착순</JdPill>;

  return (
    <div className="flex min-h-full flex-col gap-[14px]">
      <div className="flex items-center justify-between">
        <CircleButton label="뒤로" onClick={() => (window.history.length > 1 ? router.back() : router.push('/'))}>
          ‹
        </CircleButton>
        {statusPill}
      </div>

      <div className="flex flex-col gap-1 leading-[1.4]">
        <h1 className="m-0 text-[22px] font-black">{p?.name} 작당</h1>
        <p className="m-0 text-[12px] text-ink-2">{[p?.venue, p?.schedule_text].filter(Boolean).join(' · ')}</p>
      </div>

      {/* 작당 현황 */}
      {full ? (
        <TableScene height={150} seats={seatsFrom(people, Math.min(6, count))} mood="joy" className="bg-peach" label="정원이 다 모여 만세하는 작당이들" />
      ) : (
        <section className="flex flex-col gap-3 rounded-[24px] bg-peach p-4" aria-label="작당 현황">
          <div className="flex items-center justify-between leading-[1.4]">
            <b className="text-[15px] font-black">{known ? `작당 중 ${count} / ${m.max_members}` : `정원 ${m.max_members}명`}</b>
            <span className="text-[12px] font-bold text-coral-ink">{closed ? '모집이 마감됐어요' : known ? `${left}자리 비었어요` : '선착순'}</span>
          </div>
          <TableScene height={170} seats={seatsFrom(people, m.max_members)} bubbles={count >= 2 ? [{ seat: 0, text: 'ㅋㅋ' }] : []} />
          {known ? (
            <div className="flex flex-wrap items-center gap-x-[6px]">
              {people.map((x) => (
                <span key={x.id} className="inline-flex min-h-[32px] items-center">
                  <JdPill style={x.id === user?.id ? 'dark' : 'outline'}>{x.id === user?.id ? `${x.name} (나)` : x.name}</JdPill>
                </span>
              ))}
              {!joined && !closed && user ? (
                <JdPillButton style="coral" onClick={() => setSheet('join')}>
                  + 내 자리
                </JdPillButton>
              ) : null}
            </div>
          ) : (
            <p className="m-0 text-[12px] text-ink-2">로그인하면 누가 모였는지 보여요</p>
          )}
        </section>
      )}

      {full && joined ? <NextSteps schedule={p?.schedule_text ?? null} /> : null}

      {/* 정보 */}
      <section className="note-card flex flex-col px-4 py-1 text-[12px] leading-[1.4]" aria-label="강좌 정보">
        {[
          ['장소', p?.venue],
          ['일정', p?.schedule_text],
          ['정원', `개설자 포함 ${m.max_members}명 · 선착순`],
        ]
          .filter(([, v]) => v)
          .map(([k, v]) => (
            <div key={k} className="flex items-start justify-between gap-4 border-b border-line py-3 last:border-0">
              <span className="shrink-0 text-ink-2">{k}</span>
              <b className="text-right">{v}</b>
            </div>
          ))}
        {p?.registration_url ? (
          <a href={p.registration_url} target="_blank" rel="noreferrer" className="flex min-h-11 items-center justify-between gap-4 py-3 text-ink no-underline">
            <span className="text-ink-2">수강 신청</span>
            <b className="text-coral-ink">공식 신청 안내 확인 ↗</b>
          </a>
        ) : null}
      </section>
      <p className="m-0 -mt-1 text-[11px] leading-[1.5] text-ink-2">수강 신청은 공식 기관 사이트·전화·방문으로 각자 해요. 접수 여부와 남은 자리는 공식 안내에서 확인해 주세요.</p>

      {/* 공개 회의 */}
      <Qna
        ref={qnaRef}
        threads={qna.data ?? []}
        loading={qna.loading}
        creatorId={m.creator_id}
        nameOf={nameOf}
        canWrite={!!user}
        onAsk={() => (user ? setSheet('question') : router.push(loginHref))}
        onAnswer={async (qid, text) => {
          if (!user) return '로그인이 필요해요';
          try {
            await postAnswer(m.id, user.id, qid, text);
            qna.reload();
            return null;
          } catch (e) {
            return e instanceof Error ? e.message : String(e);
          }
        }}
      />

      {/* 하단 버튼 */}
      <div className="sticky bottom-0 -mx-[18px] mt-auto flex flex-col gap-2 bg-gradient-to-t from-surface from-70% to-transparent px-[18px] pt-4 pb-2">
        {err && !sheet ? (
          <p role="alert" className="m-0 text-[13px] font-bold text-rose">
            {err}
          </p>
        ) : null}
        {!user ? (
          <JdLinkButton href={loginHref} kind="dark">
            로그인하고 작당하기
          </JdLinkButton>
        ) : joined ? (
          <div className="flex gap-2">
            {!full ? (
              <JdButton kind="dark" onClick={() => setSheet('invite')}>
                이웃 부르기
              </JdButton>
            ) : null}
            <JdButton kind="light" onClick={leave} disabled={busy}>
              {busy ? '처리 중…' : '참여 취소'}
            </JdButton>
          </div>
        ) : (
          <JdButton kind="dark" onClick={() => setSheet('join')} disabled={closed || full}>
            {closed ? '모집이 마감됐어요' : full ? '정원이 다 찼어요' : '나도 작당할래요'}
          </JdButton>
        )}
      </div>

      <JoinSheet
        open={sheet === 'join'}
        onClose={() => setSheet(null)}
        onJoin={join}
        title={`${p?.name ?? ''} 작당`}
        count={count}
        max={m.max_members}
        nickname={nickname}
        busy={busy}
        error={err}
      />
      <InviteSheet open={sheet === 'invite'} onClose={() => setSheet(null)} url={pageUrl} members={people} max={m.max_members} />
      <QuestionSheet
        open={sheet === 'question'}
        onClose={() => setSheet(null)}
        nickname={nickname}
        onSubmit={async (text) => {
          if (!user) return '로그인이 필요해요';
          try {
            await postQuestion(m.id, user.id, text);
            setSheet(null);
            qna.reload();
            return null;
          } catch (e) {
            return e instanceof Error ? e.message : String(e);
          }
        }}
      />
      <SuccessScreen
        open={success}
        onClose={() => setSuccess(false)}
        onQna={() => {
          setSuccess(false);
          setTimeout(() => qnaRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
        }}
        members={people}
        title={p?.name ?? ''}
        schedule={p?.schedule_text ?? null}
        registrationUrl={p?.registration_url ?? null}
      />
    </div>
  );
}

/* 공개 회의 카드 (피그마 02 하단): 접혀 있을 땐 첫 질문·답변만, '모두 보기'로 펼친다 */
function Qna({
  ref,
  threads,
  loading,
  creatorId,
  nameOf,
  canWrite,
  onAsk,
  onAnswer,
}: {
  ref: Ref<HTMLElement>;
  threads: QnaThread[];
  loading: boolean;
  creatorId: string;
  nameOf: (uid: string) => string;
  canWrite: boolean;
  onAsk: () => void;
  onAnswer: (qid: string | number, text: string) => Promise<string | null>;
}) {
  const [all, setAll] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const shown = all ? threads : threads.slice(0, 1);

  const submit = async (e: FormEvent, qid: string | number) => {
    e.preventDefault();
    if (!text.trim()) return;
    const r = await onAnswer(qid, text.trim());
    if (r) setErr(r);
    else {
      setText('');
      setReplyTo(null);
      setErr(null);
    }
  };

  return (
    <section ref={ref} className="note-card flex scroll-mt-4 flex-col gap-[6px] px-4 py-[14px] leading-[1.4]" aria-label="공개 회의">
      <div className="flex items-center justify-between">
        <h2 className="m-0 text-[13px] font-black">공개 회의 {threads.length}</h2>
        {threads.length > 1 ? (
          <button type="button" onClick={() => setAll((v) => !v)} className="-my-3 min-h-11 text-[11px] text-ink-2">
            {all ? '접기' : '모두 보기'}
          </button>
        ) : null}
      </div>
      {loading ? (
        <p className="m-0 text-[11px] text-ink-2">불러오는 중…</p>
      ) : threads.length === 0 ? (
        <p className="m-0 text-[12px] text-ink-2">아직 안건이 없어요. 궁금한 걸 먼저 물어봐요!</p>
      ) : (
        shown.map((q) => (
          <div key={String(q.id)} className="flex flex-col gap-1 border-b border-line py-1.5 last:border-0">
            <p className="m-0 text-[12px] font-bold">
              Q. {q.content}
              <span className="ml-1.5 text-[10px] font-normal text-ink-3">
                {nameOf(q.author_id)}
                {q.author_id === creatorId ? ' · 개설자' : ''} · {timeAgo(q.created_at)}
              </span>
            </p>
            {(all ? q.answers : q.answers.slice(0, 1)).map((a) => (
              <p key={String(a.id)} className="m-0 text-[11px] text-ink-2">
                A. {a.content}
                <span className="ml-1.5 text-[10px] text-ink-3">
                  {nameOf(a.author_id)}
                  {a.author_id === creatorId ? ' · 개설자' : ''}
                </span>
              </p>
            ))}
            {canWrite && all ? (
              replyTo === String(q.id) ? (
                <form onSubmit={(e) => submit(e, q.id)} className="mt-1 flex gap-2">
                  <label className="flex-1">
                    <span className="sr-only">답변</span>
                    <input
                      autoFocus
                      value={text}
                      onChange={(e) => setText(e.target.value.slice(0, 100))}
                      placeholder="답변 쓰기"
                      className="h-10 w-full rounded-[12px] border border-line px-3 text-[12px] placeholder:text-ink-3"
                    />
                  </label>
                  <button type="submit" disabled={!text.trim()} className="h-10 rounded-[12px] bg-ink px-3 text-[12px] font-bold text-white disabled:opacity-45">
                    등록
                  </button>
                </form>
              ) : (
                <button type="button" onClick={() => setReplyTo(String(q.id))} className="-my-2 min-h-10 self-start text-[11px] font-bold text-coral-ink">
                  답변 달기
                </button>
              )
            ) : null}
          </div>
        ))
      )}
      {err ? (
        <p role="alert" className="m-0 text-[12px] font-bold text-rose">
          {err}
        </p>
      ) : null}
      <button type="button" onClick={onAsk} className="mt-1 flex min-h-10 items-center justify-center rounded-[14px] border border-dashed border-line text-[12px] font-bold text-ink">
        {canWrite ? '+ 질문하기' : '로그인하고 질문하기'}
      </button>
    </section>
  );
}
