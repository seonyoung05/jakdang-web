'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useState } from 'react';
import { useStore } from '@/lib/store';
import { feeAtCapacity, remainingText, requiredCount, settlementText, whenText, won } from '@/lib/calc';
import Ddari from '@/components/Ddari';
import Icon from '@/components/Icon';
import StampGauge from '@/components/StampGauge';
import { Avatar, BackBar, Badge, Button, IconButton, LinkButton, Loading, Note, SectionTitle, Tag, isVerified } from '@/components/ui';
import { useJoinFlow } from '@/components/useJoinFlow';

const audienceText = {
  anyone: '누구나 환영',
  verified: '학교·동네 인증 멤버를 선호해요',
  peers: '또래(±5세) 모임을 선호해요',
  sameGender: '같은 성별 모임을 선호해요',
} as const;

export default function SlotDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { ready, view, me, toggleFriend, markBooked, reopenNextWeek, views, checkedOut } = useStore();
  const { openJoin, openCancel, ui } = useJoinFlow();
  const [copied, setCopied] = useState<string | null>(null);
  const v = view(id);

  if (!ready) return <Loading />;
  if (!v) {
    return (
      <div className="flex flex-col items-center gap-3 pt-20 text-center">
        <Ddari mood="sleepy" />
        <b>이 쪽지를 찾을 수 없어요</b>
        <LinkButton href="/" variant="line" className="!w-auto">
          홈으로
        </LinkButton>
      </div>
    );
  }

  const f = v.facility;
  const host = v.participants.find((p) => p.isHost) ?? v.participants[0];
  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
    } catch {
      setCopied('복사가 막혔어요');
    }
    setTimeout(() => setCopied(null), 1800);
  };
  const share = () => copy(`${window.location.origin}/s/${v.id}`, '링크를 복사했어요');
  const fallbacks =
    v.status === 'failed'
      ? views
          .map((x) => x.facility)
          .filter((x, i, arr) => arr.findIndex((y) => y.id === x.id) === i)
          .filter((x) => x.district === f.district && x.id !== f.id && requiredCount(x) <= v.currentCount)
      : [];

  return (
    <>
      <BackBar title={f.facilityName} right={<IconButton label="친구에게 공유" icon="share" onClick={share} />} />

      {v.isOpen ? (
        <section className="flex flex-col items-center gap-2 rounded-3xl bg-green px-5 py-6 text-center text-white">
          <Ddari mood="cheer" size={60} />
          <h2 className="m-0 text-2xl font-black">{v.status === 'booked' ? '예약까지 끝났어요!' : '작당 성공!'}</h2>
          <p className="m-0 text-[13px] leading-relaxed text-[#D3EBDD]">
            {v.currentCount}명이 모여 공간을 함께 쓸 수 있어요
            <br />
            {whenText(v.startAt, v.endAt)} · {f.district} {f.dong}
          </p>
          {!f.isFree ? (
            <div className="mt-1 flex gap-1.5">
              <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold">1인당 {won(Math.ceil(f.totalFee / v.currentCount / 10) * 10)}원</span>
              {!v.isFull ? <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold">더 모이면 내려가요</span> : null}
            </div>
          ) : null}
        </section>
      ) : (
        <section className="note-card flex items-center gap-4 p-4">
          <Ddari mood={v.remaining === 1 ? 'excited' : v.currentCount <= 1 ? 'sleepy' : 'look'} size={56} />
          <div>
            <p className="m-0 text-xs font-bold text-tangerine-ink">{v.status === 'failed' ? '모집이 끝났어요' : `마감까지 ${v.deadline}`}</p>
            <h2 className="m-0 mt-1 text-xl font-black">{v.status === 'failed' ? '이번엔 인원이 모자랐어요' : remainingText(v)}</h2>
          </div>
        </section>
      )}

      <section className="mt-4 flex flex-col gap-1.5">
        <div className="flex justify-between text-[13px]">
          <b>
            도장 {v.currentCount}/{v.requiredCount}
          </b>
          <span className="text-sub">
            수용 {f.capacity}명 · {v.requiredCount}명이면 효율적
          </span>
        </div>
        <StampGauge required={v.requiredCount} capacity={f.capacity} participants={v.participants} myId={v.myParticipantId} />
      </section>

      <section className="note-card mt-4 flex flex-col divide-y divide-line px-4" aria-label="작당 정보">
        {[
          ['cal', '언제', `${whenText(v.startAt, v.endAt)}`, '제안 시간 · 실제 예약 가능 여부는 원본에서 확인'],
          ['pin', '어디서', `${f.facilityName}`, `${f.district} ${f.dong}${f.eligibility.length ? ` · ${f.eligibility.join(', ')}` : ''}`],
          [
            'users',
            '모임 가능성',
            `${v.possibilityGrade}`,
            `이 시간 근처에 머무는 사람 ${won(v.nearbyPopulation)}명`,
          ],
        ].map(([icon, label, value, sub]) => (
          <div key={label} className="flex items-start gap-3 py-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-mute text-green">
              <Icon name={icon as 'cal'} size={17} />
            </span>
            <div className="min-w-0">
              <span className="text-xs text-sub">{label}</span>
              <b className="block text-[15px]">{value}</b>
              <span className="text-xs text-sub">{sub}</span>
            </div>
          </div>
        ))}
        <div className="py-3">
          {f.isFree ? (
            <p className="m-0 text-[13px]">
              <b>무료 시설</b> · 혼자 빌리기 부담스러운 큰 공간을 함께 써요
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                ['지금 참여하면', v.isMine ? v.feeMine : v.feeIfJoinNow],
                [`목표 ${v.requiredCount}명`, v.feeAtTarget],
                [`최대 ${f.capacity}명`, feeAtCapacity(f)],
              ].map(([l, n]) => (
                <div key={l as string} className="rounded-xl bg-tangerine-soft px-1 py-2">
                  <span className="block text-[11px] text-tangerine-ink">{l}</span>
                  <b className="text-[15px]">{won((n as number) ?? 0)}원</b>
                </div>
              ))}
            </div>
          )}
          {f.feeSource === 'fallback' ? <p className="m-0 mt-2 text-[11px] text-sub">이용료는 같은 종류 시설 기준으로 추정했어요</p> : null}
        </div>
      </section>

      <SectionTitle>함께할 이웃 {v.currentCount}명</SectionTitle>
      <section className="note-card px-4 py-1">
        {v.participants.map((p) => {
          const mine = p.id === v.myParticipantId;
          const friend = me.friends.includes(p.nickname);
          return (
            <div key={p.id} className="flex items-center gap-2.5 border-b border-line py-2.5 last:border-0">
              <Avatar name={p.nickname} verified={isVerified(p)} size={40} ring={false} />
              <div className="min-w-0 flex-1">
                <b className="flex items-center gap-1 text-sm">
                  {p.nickname}
                  {p.isHost ? <Badge>작당 반장</Badge> : null}
                  {mine ? <Badge tone="green">나</Badge> : null}
                </b>
                <span className="text-xs text-sub">
                  {[p.verification.school ? '학교 인증' : null, p.verification.neighborhood ? `동네 인증(${p.verification.neighborhood})` : null].filter(Boolean).join(' · ') || '인증 전'}
                  {' · '}
                  {p.manner === null ? '믿음 새싹 · 처음 왔어요' : `믿음 ${p.manner}`}
                </span>
              </div>
              {!mine ? (
                <button
                  type="button"
                  onClick={() => toggleFriend(p.nickname)}
                  aria-pressed={friend}
                  className={`inline-flex min-h-9 items-center gap-1 rounded-[11px] border px-2.5 text-xs font-bold ${friend ? 'border-mint bg-mint text-mint-ink' : 'border-line-strong bg-paper'}`}
                >
                  <Icon name={friend ? 'check' : 'useradd'} size={13} />
                  {friend ? '작당 동료' : '친구 추가'}
                </button>
              ) : null}
            </div>
          );
        })}
      </section>

      <SectionTitle>이 작당은</SectionTitle>
      <div className="flex flex-wrap gap-1.5">
        <Tag>{v.purpose}</Tag>
        {v.vibeTags.map((t) => (
          <Tag key={t}>{t}</Tag>
        ))}
        <Badge tone="sky">{audienceText[v.audience]}</Badge>
      </div>

      {fallbacks.length ? (
        <section className="mt-5 rounded-[18px] bg-sky p-4">
          <b className="text-sm text-sky-ink">
            {v.currentCount}명이 모였어요. {v.currentCount}명이 쓸 수 있는 근처 작은 공간이 있어요
          </b>
          {fallbacks.map((x) => (
            <div key={x.id} className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-paper px-3 py-2.5">
              <div>
                <b className="text-sm">{x.facilityName}</b>
                <span className="block text-xs text-sub">
                  수용 {x.capacity}명 · {x.isFree ? '무료' : `${won(x.totalFee)}원`}
                </span>
              </div>
              <Link href={`/new?facility=${x.id}`} className="inline-flex min-h-9 items-center rounded-[11px] bg-ink px-3 text-xs font-bold text-white no-underline">
                이 멤버로 열기
              </Link>
            </div>
          ))}
        </section>
      ) : null}

      {/* 상태별 행동 (명세서 5-2 표) */}
      <section className="mt-6 flex flex-col gap-2">
        {v.isMine && v.isOpen && v.amIHost && v.status !== 'booked' ? (
          <div className="note-card flex flex-col gap-2.5 p-4">
            <div className="flex items-center justify-between">
              <b className="text-sm">작당 반장 할 일</b>
              <Badge>결제는 곧 지원돼요</Badge>
            </div>
            <p className="m-0 text-xs leading-relaxed text-sub">원본 예약 사이트에서 예약한 뒤 완료 표시를 눌러 주세요. 지금은 정산 문구를 복사해 작당방에 보내 주세요.</p>
            <a href={f.reservationUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center gap-1.5 rounded-2xl bg-ink text-[15px] font-bold text-white no-underline">
              <Icon name="external" size={17} />
              예약하러 가기
            </a>
            <Button variant="line" icon="check" onClick={() => markBooked(v.id)}>
              예약 완료 표시
            </Button>
          </div>
        ) : null}

        {v.isMine && v.isOpen && !v.amIHost && v.status !== 'booked' ? (
          <Note icon="shield">작당 반장 {host?.nickname}님이 원본 사이트에서 예약을 진행해요. 결제 기능은 곧 지원돼요.</Note>
        ) : null}

        {v.isMine && v.isOpen ? (
          <LinkButton href={`/chat/${v.id}`} variant="green" icon="chat">
            작당방 입장
          </LinkButton>
        ) : null}

        {v.isMine && v.status === 'booked' ? (
          <>
            <Button variant="line" icon="copy" onClick={() => copy(settlementText(v, host?.nickname ?? ''), '정산 문구를 복사했어요')}>
              정산 문구 복사
            </Button>
            {checkedOut.includes(v.id) ? (
              <Note icon="check">뒷정리 작전을 마쳤어요. 고마워요!</Note>
            ) : (
              <LinkButton href={`/s/${v.id}/checkout`} variant="tangerine" icon="broom">
                뒷정리 작전 (퇴실 인증)
              </LinkButton>
            )}
            <Button
              variant="ghost"
              icon="repeat"
              onClick={async () => {
                const nid = await reopenNextWeek(v.id);
                if (nid) router.push(`/s/${nid}`);
              }}
            >
              다음 주 같은 시간 또 작당하기
            </Button>
          </>
        ) : null}

        {!v.isMine ? (
          <Button variant="dark" disabled={v.isFull || v.status === 'failed'} onClick={() => openJoin(v)}>
            {v.isFull ? '정원 마감' : v.status === 'failed' ? '모집 마감' : v.isOpen ? '나도 참여하기' : '도장 찍고 참여하기'}
          </Button>
        ) : null}

        {v.isMine && !v.isOpen && v.status !== 'failed' ? (
          <div className="flex gap-2">
            <Button variant="line" onClick={() => openCancel(v)}>
              참여 취소
            </Button>
            <Button variant="dark" icon="share" onClick={share}>
              친구에게 공유
            </Button>
          </div>
        ) : null}

        <Note>연락처는 공유되지 않아요. 작당이 열리면 멤버끼리만 작당방에서 이야기해요.</Note>
      </section>

      {copied ? (
        <div role="status" className="absolute inset-x-6 bottom-8 z-40 rounded-2xl bg-ink px-4 py-3 text-center text-sm font-bold text-white">
          {copied}
        </div>
      ) : null}
      {ui}
    </>
  );
}
