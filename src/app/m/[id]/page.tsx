'use client';

import { use, useState, type FormEvent } from 'react';
import { getMeetup, joinMeetup, leaveMeetup, listMembers, listQna, postAnswer, postQuestion } from '@/lib/api';
import { useAuth, useLoad } from '@/lib/auth';
import type { MeetupMember, QnaThread } from '@/lib/types';
import Celebration from '@/components/Celebration';
import Ddari from '@/components/Ddari';
import Icon from '@/components/Icon';
import { meetupState, timeAgo } from '@/components/MeetupCard';
import StampGauge from '@/components/StampGauge';
import { Avatar, BackBar, Badge, Button, IconButton, LinkButton, Loading, Note, SectionTitle } from '@/components/ui';

export default function MeetupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { ready, user, nickname } = useAuth();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState(false);

  const meetup = useLoad(() => getMeetup(id), [id]);
  // 참여자 목록은 로그인해야 읽을 수 있다
  const members = useLoad<MeetupMember[] | null>(() => (user ? listMembers(id) : Promise.resolve(null)), [id, user?.id]);
  const qna = useLoad(() => listQna(id), [id]);

  if (!ready || meetup.loading) return <Loading />;
  const m = meetup.data;
  if (meetup.error || !m) {
    return (
      <>
        <BackBar title="모집" />
        <div className="flex flex-col items-center gap-3 pt-16 text-center">
          <Ddari mood="sleepy" />
          <b>{meetup.error ?? '이 모집을 찾을 수 없어요'}</b>
          <LinkButton href="/" variant="line" className="!w-auto">
            홈으로
          </LinkButton>
        </div>
      </>
    );
  }

  const p = m.programs;
  const list = members.data ?? [];
  const count = members.data ? list.length : null;
  const joined = !!user && list.some((x) => x.user_id === user.id);
  const full = count !== null && count >= m.max_members;
  const closed = m.status === 'CLOSED';
  const st = meetupState(m, count);
  const nameOf = (uid: string) => list.find((x) => x.user_id === uid)?.profiles?.nickname || (uid === user?.id ? nickname : '') || '이웃';

  const act = async (kind: 'join' | 'leave') => {
    if (!user) return;
    setBusy(true);
    setErr(null);
    try {
      if (kind === 'join') {
        await joinMeetup(m.id, user.id);
        const after = await listMembers(m.id);
        if (after.length >= m.max_members) setCelebrate(true);
      } else {
        await leaveMeetup(m.id, user.id);
      }
      members.reload();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
      members.reload();
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <BackBar
        title={p?.name ?? '모집'}
        right={
          <IconButton
            label="새로고침"
            icon="refresh"
            onClick={() => {
              meetup.reload();
              members.reload();
              qna.reload();
            }}
          />
        }
      />

      <section className="note-card flex flex-col gap-3 p-4" aria-label="강좌 정보">
        <div className="flex items-center justify-between gap-2">
          <Badge tone={st.tone}>{st.label}</Badge>
          <span className="text-xs text-sub">{timeAgo(m.created_at)} 개설</span>
        </div>
        <h1 className="m-0 text-xl leading-snug font-black">{p?.name}</h1>
        <div className="flex flex-col gap-1 text-[13px] text-sub">
          {p?.venue ? (
            <span className="flex items-center gap-1.5">
              <Icon name="pin" size={14} />
              {p.venue}
            </span>
          ) : null}
          {p?.schedule_text ? (
            <span className="flex items-start gap-1.5">
              <Icon name="cal" size={14} className="mt-[3px] shrink-0" />
              {p.schedule_text}
            </span>
          ) : null}
        </div>
        {p?.registration_url ? (
          <a
            href={p.registration_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-[14px] border border-line-strong bg-cream text-sm font-bold text-ink no-underline"
          >
            <Icon name="external" size={16} />
            공식 신청 안내 확인
          </a>
        ) : null}
        <Note>수강 신청은 공식 기관 사이트·전화·방문으로 각자 해요. 접수 여부와 남은 자리는 공식 안내에서 확인해 주세요.</Note>
      </section>

      <SectionTitle right={<span className="text-xs text-sub">선착순 · 정원 {m.max_members}명</span>}>
        함께하는 이웃 {count === null ? '' : `${count}명`}
      </SectionTitle>

      {count === null ? (
        <div className="flex items-center justify-between gap-3 rounded-[18px] border border-dashed border-line-strong bg-paper px-4 py-4">
          <span className="text-[13px] text-sub">로그인하면 누가 함께하는지 볼 수 있어요</span>
          <LinkButton href={`/login?next=${encodeURIComponent(`/m/${id}`)}`} variant="dark" className="!min-h-10 !w-auto !rounded-xl !px-3 !text-[13px]">
            로그인
          </LinkButton>
        </div>
      ) : (
        <>
          <StampGauge max={m.max_members} members={list.map((x) => ({ id: x.user_id, name: x.profiles?.nickname || '이웃' }))} myId={user?.id} />
          <div className="note-card mt-3 px-4 py-1">
            {list.map((x) => (
              <div key={x.user_id} className="flex items-center gap-2.5 border-b border-line py-2.5 last:border-0">
                <Avatar name={x.profiles?.nickname || '이웃'} size={36} ring={false} />
                <div className="min-w-0 flex-1">
                  <b className="flex items-center gap-1 text-sm">
                    {x.profiles?.nickname || '이웃'}
                    {x.user_id === m.creator_id ? <Badge>모집 연 사람</Badge> : null}
                    {x.user_id === user?.id ? <Badge tone="green">나</Badge> : null}
                  </b>
                  <span className="text-xs text-sub">
                    {x.profiles?.neighborhood_name ? `${x.profiles.neighborhood_name} · ` : ''}
                    {timeAgo(x.joined_at)} 참여
                  </span>
                </div>
              </div>
            ))}
            {list.length === 0 ? <p className="py-3 text-center text-[13px] text-sub">아직 참여한 이웃이 없어요</p> : null}
          </div>
        </>
      )}

      <div className="mt-4 flex flex-col gap-2">
        {err ? (
          <p role="alert" className="m-0 text-[13px] font-bold text-rose">
            {err}
          </p>
        ) : null}
        {!user ? (
          <LinkButton href={`/login?next=${encodeURIComponent(`/m/${id}`)}`} variant="dark">
            로그인하고 참여하기
          </LinkButton>
        ) : joined ? (
          <Button variant="line" disabled={busy} onClick={() => act('leave')}>
            {busy ? '처리 중…' : '참여 취소'}
          </Button>
        ) : (
          <Button variant="dark" disabled={busy || closed || full} onClick={() => act('join')}>
            {closed ? '모집이 마감됐어요' : full ? '정원이 다 찼어요' : busy ? '처리 중…' : '선착순 참여하기'}
          </Button>
        )}
        {joined && user?.id === m.creator_id ? <Note>참여를 취소해도 모집글은 남아요.</Note> : null}
      </div>

      <Qna meetupId={m.id} creatorId={m.creator_id} threads={qna.data ?? []} loading={qna.loading} error={qna.error} reload={qna.reload} nameOf={nameOf} />

      <Celebration open={celebrate} title={p?.name ?? ''} registrationUrl={p?.registration_url ?? null} onClose={() => setCelebrate(false)} />
    </>
  );
}

function Qna({
  meetupId,
  creatorId,
  threads,
  loading,
  error,
  reload,
  nameOf,
}: {
  meetupId: string | number;
  creatorId: string;
  threads: QnaThread[];
  loading: boolean;
  error: string | null;
  reload: () => void;
  nameOf: (uid: string) => string;
}) {
  const { user } = useAuth();
  const [question, setQuestion] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [answer, setAnswer] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const send = async (e: FormEvent, kind: 'q' | 'a', qid?: string | number) => {
    e.preventDefault();
    if (!user) return;
    const text = (kind === 'q' ? question : answer).trim();
    if (!text) return;
    setBusy(true);
    setErr(null);
    try {
      if (kind === 'q') {
        await postQuestion(meetupId, user.id, text);
        setQuestion('');
      } else {
        await postAnswer(meetupId, user.id, qid!, text);
        setAnswer('');
        setReplyTo(null);
      }
      reload();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const who = (uid: string) => (
    <span className="flex items-center gap-1 text-xs text-sub">
      <b className="text-ink">{nameOf(uid)}</b>
      {uid === creatorId ? <Badge>모집 연 사람</Badge> : null}
    </span>
  );

  return (
    <section aria-label="공개 Q&A" className="mt-2">
      <SectionTitle right={<span className="text-xs text-sub">누구나 볼 수 있어요</span>}>공개 Q&amp;A</SectionTitle>
      <Note icon="help">개인 채팅 대신 공개 Q&A로 이야기해요. 연락처 같은 개인 정보는 적지 말아 주세요.</Note>

      <div className="mt-3 flex flex-col gap-3">
        {loading ? (
          <Loading />
        ) : error ? (
          <p role="alert" className="text-sm text-rose">
            {error}
          </p>
        ) : threads.length === 0 ? (
          <p className="m-0 rounded-2xl bg-paper p-4 text-center text-[13px] text-sub">아직 질문이 없어요. 궁금한 걸 먼저 물어봐요!</p>
        ) : (
          threads.map((q) => (
            <article key={String(q.id)} className="rounded-2xl border border-line bg-paper p-3.5">
              <div className="flex items-center justify-between gap-2">
                {who(q.author_id)}
                <span className="text-[11px] text-sub">{timeAgo(q.created_at)}</span>
              </div>
              <p className="m-0 mt-1.5 text-sm leading-relaxed whitespace-pre-wrap">
                <b className="mr-1 text-tangerine-ink">Q.</b>
                {q.content}
              </p>
              {q.answers.map((a) => (
                <div key={String(a.id)} className="mt-2.5 rounded-xl bg-cream p-3">
                  <div className="flex items-center justify-between gap-2">
                    {who(a.author_id)}
                    <span className="text-[11px] text-sub">{timeAgo(a.created_at)}</span>
                  </div>
                  <p className="m-0 mt-1 text-sm leading-relaxed whitespace-pre-wrap">
                    <b className="mr-1 text-green">A.</b>
                    {a.content}
                  </p>
                </div>
              ))}
              {user ? (
                replyTo === String(q.id) ? (
                  <form onSubmit={(e) => send(e, 'a', q.id)} className="mt-2.5 flex gap-2">
                    <label className="flex-1">
                      <span className="sr-only">답변</span>
                      <input
                        autoFocus
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        maxLength={500}
                        placeholder="답변 쓰기"
                        className="min-h-11 w-full rounded-xl border border-line-strong bg-cream px-3 text-sm"
                      />
                    </label>
                    <button type="submit" disabled={busy || !answer.trim()} className="min-h-11 rounded-xl bg-green px-3 text-sm font-bold text-white disabled:bg-mute disabled:text-[#6A726D]">
                      등록
                    </button>
                  </form>
                ) : (
                  <button type="button" onClick={() => setReplyTo(String(q.id))} className="mt-2 min-h-9 text-[13px] font-bold text-green">
                    답변 달기
                  </button>
                )
              ) : null}
            </article>
          ))
        )}
      </div>

      {err ? (
        <p role="alert" className="m-0 mt-2 text-[13px] font-bold text-rose">
          {err}
        </p>
      ) : null}

      {user ? (
        <form onSubmit={(e) => send(e, 'q')} className="mt-3 flex flex-col gap-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-bold">질문하기</span>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="예: 첫 수업 전에 같이 신청 방법 확인해요?"
              className="rounded-[14px] border border-line-strong bg-paper p-3 text-sm"
            />
          </label>
          <Button type="submit" variant="green" icon="send" disabled={busy || !question.trim()}>
            질문 올리기
          </Button>
        </form>
      ) : (
        <p className="m-0 mt-3 text-center text-[13px] text-sub">질문과 답변은 로그인한 뒤 쓸 수 있어요.</p>
      )}
    </section>
  );
}
