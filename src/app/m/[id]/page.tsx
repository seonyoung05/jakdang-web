'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { use, useRef, useState, type FormEvent, type Ref } from 'react';
import { checkProofFile, getMeetup, joinMeetup, leaveMeetup, listMembers, listQna, postAnswer, postQuestion, proofStatus, proofUrl, removeProof, selfReport, uploadProof } from '@/lib/api';
import { useAuth, useLoad } from '@/lib/auth';
import type { MeetupMember, QnaThread } from '@/lib/types';
import { viewOf } from '@/lib/meetupView';
import Jakdangi, { colorFor } from '@/components/Jakdangi';
import { timeAgo } from '@/components/MeetupCard';
import { InviteSheet, JoinSheet, NextSteps, ProofSheet, ProofViewer, QuestionSheet, SuccessScreen } from '@/components/MeetupSheets';
import TableScene, { seatsFrom } from '@/components/TableScene';
import { CircleButton, JdButton, JdLinkButton, JdPill, JdPillButton } from '@/components/jd';
import { Loading } from '@/components/ui';

/** 피그마 02 작당 상세 / 05 작당 상세 · 성공 */
export default function MeetupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const search = useSearchParams();
  const { ready, user, nickname } = useAuth();
  const [sheet, setSheet] = useState<'join' | 'invite' | 'question' | 'proof' | null>(search.get('invite') ? 'invite' : null);
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [viewer, setViewer] = useState<{ name: string; url: string | null; error: string | null } | null>(null);
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

  const v = viewOf(m);
  const sp = m.spaces;
  const isSpace = v.type === 'SPACE';
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
  const mine = user ? list.find((x) => x.user_id === user.id) : undefined;
  const myStatus = mine ? proofStatus(mine) : null;

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setErr(null);
    try {
      await fn();
      members.reload();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const openProof = async (path: string, name: string) => {
    setViewer({ name, url: null, error: null });
    try {
      const url = await proofUrl(path);
      setViewer({ name, url, error: null });
    } catch (e) {
      setViewer({ name, url: null, error: e instanceof Error ? e.message : String(e) });
    }
  };

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
      // 나가기 전에 내 캡처를 먼저 지운다 (실패해도 나가기는 계속)
      if (mine?.proof_path) await removeProof(m.id, user.id, mine.proof_path).catch(() => undefined);
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
        <span className="text-[11px] font-bold text-coral-ink">{isSpace ? '공간 함께 쓰기' : '교육 같이 듣기'}</span>
        <h1 className="m-0 text-[22px] font-black">{isSpace ? v.title : `${v.title} 작당`}</h1>
        <p className="m-0 text-[12px] text-ink-2">{[v.place, v.when].filter(Boolean).join(' · ')}</p>
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

      {full && joined ? <NextSteps schedule={v.when} type={v.type} /> : null}

      {/* 내 할 일 (피그마 05 '내 할 일' 카드) */}
      {joined && mine && !isSpace ? (
        <section className="flex flex-col gap-[10px] rounded-[20px] bg-peach px-4 py-[14px]" aria-label="내 할 일">
          <p className="m-0 text-[13px] leading-[1.4] font-black">
            {myStatus === '미신고' ? '내 할 일 · 공식 안내에서 신청하고 알려 주기' : myStatus === '신청했다고 신고' ? '신청했다고 알렸어요 · 캡처도 올려 볼까요?' : '신청 캡처를 냈어요'}
          </p>
          <div className="flex gap-2">
            {myStatus === '미신고' ? (
              <>
                <button type="button" disabled={busy} onClick={() => run(() => selfReport(m.id, user!.id))} className="h-10 flex-1 rounded-[20px] bg-ink text-[13px] font-bold text-white disabled:opacity-45">
                  신청했어요
                </button>
                <button type="button" onClick={() => setSheet('proof')} className="h-10 flex-1 rounded-[20px] border border-line bg-surface text-[13px] font-bold">
                  캡처 올리기
                </button>
              </>
            ) : myStatus === '신청했다고 신고' ? (
              <button type="button" onClick={() => setSheet('proof')} className="h-10 flex-1 rounded-[20px] bg-ink text-[13px] font-bold text-white">
                캡처 올리기
              </button>
            ) : (
              <>
                <button type="button" onClick={() => openProof(mine.proof_path!, '내')} className="h-10 flex-1 rounded-[20px] bg-ink text-[13px] font-bold text-white">
                  내 캡처 보기
                </button>
                <button type="button" disabled={busy} onClick={() => run(() => removeProof(m.id, user!.id, mine.proof_path!))} className="h-10 flex-1 rounded-[20px] border border-line bg-surface text-[13px] font-bold disabled:opacity-45">
                  캡처 삭제
                </button>
              </>
            )}
          </div>
          {err && !sheet ? (
            <p role="alert" className="m-0 text-[12px] font-bold text-rose">
              {err}
            </p>
          ) : null}
        </section>
      ) : null}

      {/* 수강 신청 현황 — 로그인한 이웃에게 보이고, 캡처 파일은 같은 작당 멤버만 열 수 있다 */}
      {joined && isSpace ? (
        <section className="flex flex-col gap-[10px] rounded-[20px] bg-peach px-4 py-[14px]" aria-label="내 할 일">
          <p className="m-0 text-[13px] leading-[1.4] font-black">내 할 일 · 대관 신청할 대표를 함께 정해요</p>
          <p className="m-0 text-[11px] leading-[1.5] text-ink-2">공간 대관은 보통 대표 한 명이 공공기관에 신청해요. 공개 회의에서 누가 신청할지 정하고, 결과도 거기서 알려 주세요.</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => (user ? setSheet('question') : router.push(loginHref))} className="h-10 flex-1 rounded-[20px] bg-ink text-[13px] font-bold text-white">
              공개 회의에 쓰기
            </button>
            {v.officialUrl ? (
              <a href={v.officialUrl} target="_blank" rel="noreferrer" className="flex h-10 flex-1 items-center justify-center rounded-[20px] border border-line bg-surface text-[13px] font-bold text-ink no-underline">
                공식 대관 안내 ↗
              </a>
            ) : null}
          </div>
        </section>
      ) : null}

      {known && count > 0 && !isSpace ? (
        <section className="note-card flex flex-col px-4 py-1" aria-label="수강 신청 현황">
          <div className="flex items-center justify-between pt-3 pb-1 leading-[1.4]">
            <h2 className="m-0 text-[13px] font-black">수강 신청 현황</h2>
            <span className="text-[11px] text-ink-2">본인 신고 기준</span>
          </div>
          {list.map((x) => {
            const st = proofStatus(x);
            const name = x.profiles?.nickname || '이웃';
            const loc = x.profiles?.location_checked_at ? `${x.profiles?.neighborhood_name ?? ''} · 위치 확인 ${new Date(x.profiles.location_checked_at).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}` : null;
            return (
              <div key={x.user_id} className="flex items-center gap-2.5 border-b border-line py-2.5 last:border-0">
                <Jakdangi color={colorFor(x.user_id)} mood="sly" size={34} />
                <div className="min-w-0 flex-1 leading-[1.4]">
                  <b className="block truncate text-[13px]">
                    {name}
                    {x.user_id === user?.id ? ' (나)' : ''}
                    {x.user_id === m.creator_id ? <span className="ml-1 text-[11px] font-normal text-ink-3">개설자</span> : null}
                  </b>
                  {loc ? <span className="block truncate text-[11px] text-ink-2">{loc}</span> : null}
                </div>
                {x.proof_path && joined ? (
                  <button type="button" onClick={() => openProof(x.proof_path!, name)} className="-my-1 min-h-9 shrink-0 text-[11px] font-bold text-coral-ink">
                    캡처 보기
                  </button>
                ) : null}
                <JdPill style={st === '증빙 제출' ? 'dark' : st === '신청했다고 신고' ? 'peach' : 'soft'}>{st}</JdPill>
              </div>
            );
          })}
        </section>
      ) : null}

      {/* 정보 */}
      <section className="note-card flex flex-col px-4 py-1 text-[12px] leading-[1.4]" aria-label="강좌 정보">
        {(isSpace
          ? [
              ['장소', v.place],
              ['주소', sp?.address],
              ['희망 이용 일시', v.when?.replace(/^희망 /, '')],
              ['모집 정원', `개설자 포함 ${m.max_members}명 · 선착순${sp?.capacity ? ` (공간 수용 ${sp.capacity}명)` : ''}`],
              ['이용 안내', sp?.usage_notes],
              ['대관 안내', sp?.reservation_info],
            ]
          : [
              ['장소', v.place],
              ['일정', v.when],
              ['정원', `개설자 포함 ${m.max_members}명 · 선착순`],
            ]
        )
          .filter(([, v]) => v)
          .map(([k, v]) => (
            <div key={k} className="flex items-start justify-between gap-4 border-b border-line py-3 last:border-0">
              <span className="shrink-0 text-ink-2">{k}</span>
              <b className="text-right">{v}</b>
            </div>
          ))}
        {v.officialUrl ? (
          <a href={v.officialUrl} target="_blank" rel="noreferrer" className="flex min-h-11 items-center justify-between gap-4 py-3 text-ink no-underline">
            <span className="text-ink-2">{isSpace ? '대관 신청' : '수강 신청'}</span>
            <b className="text-coral-ink">{v.officialLabel} ↗</b>
          </a>
        ) : null}
      </section>
      <p className="m-0 -mt-1 text-[11px] leading-[1.5] text-ink-2">
        {isSpace
          ? '실제 대관은 공공기관에서 신청·승인받아요. 모집 인원은 함께할 이웃 수이고, 이용 가능 여부는 공식 대관 안내에서 확인해 주세요.'
          : '수강 신청은 공식 기관 사이트·전화·방문으로 각자 해요. 접수 여부와 남은 자리는 공식 안내에서 확인해 주세요.'}
      </p>

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
        {err && !sheet && !joined ? (
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
        title={isSpace ? v.title : `${v.title} 작당`}
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
        type={v.type}
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
      <ProofSheet
        open={sheet === 'proof'}
        onClose={() => setSheet(null)}
        programName={v.title}
        schedule={v.when}
        checkFile={checkProofFile}
        onUpload={async (file) => {
          if (!user) return '로그인이 필요해요';
          try {
            if (mine?.proof_path) await removeProof(m.id, user.id, mine.proof_path).catch(() => undefined);
            await uploadProof(m.id, user.id, file);
            setSheet(null);
            members.reload();
            return null;
          } catch (e) {
            return e instanceof Error ? e.message : String(e);
          }
        }}
      />
      <ProofViewer open={!!viewer} onClose={() => setViewer(null)} name={viewer?.name ?? ''} url={viewer?.url ?? null} error={viewer?.error ?? null} />
      <SuccessScreen
        open={success}
        onClose={() => setSuccess(false)}
        onQna={() => {
          setSuccess(false);
          setTimeout(() => qnaRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
        }}
        members={people}
        title={v.title}
        schedule={v.when}
        registrationUrl={v.officialUrl}
        officialLabel={v.officialLabel}
        type={v.type}
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
