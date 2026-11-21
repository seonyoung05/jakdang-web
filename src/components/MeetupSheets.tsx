'use client';

import confetti from 'canvas-confetti';
import { AnimatePresence, motion } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useId, useState } from 'react';
import Jakdangi from './Jakdangi';
import TableScene, { seatsFrom } from './TableScene';
import { CircleButton, IconClose, JdButton, JdLinkButton, JdPillButton, Sheet } from './jd';

/* ───────── 03 합류 시트 ───────── */
export function JoinSheet({
  open,
  onClose,
  onJoin,
  title,
  count,
  max,
  nickname,
  busy,
  error,
}: {
  open: boolean;
  onClose: () => void;
  onJoin: () => void;
  title: string;
  count: number;
  max: number;
  nickname: string;
  busy: boolean;
  error: string | null;
}) {
  const after = count + 1;
  const left = max - after;
  return (
    <Sheet open={open} onClose={onClose} label="작당 합류">
      <div className="flex w-full items-center gap-3">
        <Jakdangi empty size={56} />
        <div className="flex min-w-0 flex-1 flex-col gap-[2px] leading-[1.4]">
          <h2 className="m-0 text-[19px] font-black">이 작당에 낄까요?</h2>
          <p className="m-0 truncate text-[12px] text-ink-2">{title}</p>
        </div>
      </div>
      <div className="flex w-full items-center justify-between rounded-[16px] bg-peach px-4 py-3 leading-[1.4]">
        <b className="text-[14px] font-black">
          내가 끼면 {after} / {max}
        </b>
        <span className="text-[12px] font-bold text-coral-ink">{left <= 0 ? '내가 끼면 작당 성공!' : left === 1 ? '1명만 더 오면 시작!' : `${left}명 더 모이면 시작!`}</span>
      </div>
      <div className="flex w-full flex-col gap-[6px]">
        <p className="m-0 text-[12px] leading-[1.4] font-bold">닉네임</p>
        <div className="flex h-12 w-full items-center rounded-[14px] border border-line px-4 text-[14px]">{nickname}</div>
      </div>
      <p className="m-0 w-full rounded-[12px] bg-bg px-3 py-2.5 text-[11px] leading-[1.4] font-medium text-ink-2">
        합류하면 작당이가 배정돼요 · 수강 신청은 공식 안내에 따라 각자 해요
      </p>
      {error ? (
        <p role="alert" className="m-0 w-full text-[13px] font-bold text-rose">
          {error}
        </p>
      ) : null}
      <JdButton kind="dark" onClick={onJoin} disabled={busy}>
        {busy ? '합류하는 중…' : '작당 합류하기'}
      </JdButton>
      <button type="button" onClick={onClose} className="-my-2 min-h-11 text-[13px] font-medium text-ink-2">
        다음에 할게요
      </button>
    </Sheet>
  );
}

/* ───────── 04 작당 성공! (전체 화면) ───────── */
export function SuccessScreen({
  open,
  onClose,
  onQna,
  members,
  title,
  schedule,
  registrationUrl,
}: {
  open: boolean;
  onClose: () => void;
  onQna: () => void;
  members: { id: string }[];
  title: string;
  schedule: string | null;
  registrationUrl: string | null;
}) {
  useEffect(() => {
    if (!open || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    confetti({ particleCount: 110, spread: 80, origin: { y: 0.3 }, colors: ['#FF7A59', '#FFD95E', '#A8D7F2', '#FFB39B'] });
  }, [open]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="작당 성공"
          className="no-scrollbar absolute inset-0 z-50 flex flex-col gap-[14px] overflow-y-auto bg-bg px-[18px] pt-4 pb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="flex justify-end">
            <CircleButton label="닫기" onClick={onClose}>
              <IconClose />
            </CircleButton>
          </div>
          <TableScene height={230} seats={seatsFrom(members, members.length)} mood="joy" confetti label="모두 만세하는 작당이들" />
          <div className="flex flex-col gap-[6px] text-center leading-[1.4]">
            <h2 className="m-0 text-[32px] font-black">작당 성공!</h2>
            <p className="m-0 text-[14px] text-ink-2">
              이웃 {members.length}명이 모여서
              <br />
              {title} 같이 들어요
            </p>
          </div>
          <NextSteps schedule={schedule} />
          <div className="min-h-2 flex-1" />
          {registrationUrl ? (
            <JdLinkButton href={registrationUrl} external kind="dark">
              공식 신청 안내 확인
            </JdLinkButton>
          ) : null}
          <JdButton kind="light" onClick={onQna}>
            공개 회의 가기
          </JdButton>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

/** 작당 성공 후 할 일 (피그마 04·05의 1·2·3 목록). 실제 완료 여부는 확인할 수 없어 번호로만 보여 준다. */
export function NextSteps({ schedule }: { schedule: string | null }) {
  const steps = ['각자 공식 신청 안내에 따라 수강 신청해요', '공개 회의에서 첫날 만날 곳을 정해요', schedule ? `${schedule} 같이 들어요` : '첫 수업에서 만나요'];
  return (
    <ol className="m-0 flex list-none flex-col rounded-[20px] border border-line bg-surface px-4 py-[6px]">
      {steps.map((s, i) => (
        <li key={i} className="flex items-center gap-[10px] py-[9px]">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[12px] bg-peach text-[11px] font-black text-coral-ink">{i + 1}</span>
          <span className={`flex-1 text-[13px] leading-[1.4] ${i === 0 ? 'font-bold text-ink' : 'text-ink-2'}`}>{s}</span>
        </li>
      ))}
    </ol>
  );
}

/* ───────── 09 이웃 부르기 ───────── */
export function InviteSheet({ open, onClose, url, members, max }: { open: boolean; onClose: () => void; url: string; members: { id: string }[]; max: number }) {
  const [copied, setCopied] = useState(false);
  const left = Math.max(0, max - members.length);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };
  return (
    <Sheet open={open} onClose={onClose} label="이웃 부르기">
      <div className="flex w-full flex-col gap-1 text-center leading-[1.4]">
        <h2 className="m-0 text-[22px] font-black">작당을 꾸몄어요!</h2>
        <p className="m-0 text-[13px] text-ink-2">{left > 0 ? `${left}명만 더 모이면 작당 성공 · 선착순` : '정원이 다 모였어요'}</p>
      </div>
      <TableScene height={130} seats={seatsFrom(members, 6)} className="bg-peach" />
      <div className="flex h-[168px] w-[168px] items-center justify-center rounded-[20px] border border-line bg-surface">
        <QRCodeSVG value={url} size={132} fgColor="#2E2420" bgColor="#FFFFFF" title="이 작당 링크 QR 코드" />
      </div>
      <div className="flex w-full items-center gap-2">
        <div className="flex h-11 min-w-0 flex-1 items-center overflow-hidden rounded-[14px] border border-line px-[14px] text-[13px] text-ink-2">
          <span className="truncate">{url.replace(/^https?:\/\//, '')}</span>
        </div>
        <button type="button" onClick={copy} className="h-11 w-[68px] shrink-0 rounded-[14px] bg-ink text-[13px] font-bold text-white">
          {copied ? '복사됨' : '복사'}
        </button>
      </div>
      <JdButton kind="light" onClick={onClose}>
        작당 보러 가기
      </JdButton>
    </Sheet>
  );
}

/* ───────── 10 질문하기 (공개 회의) ───────── */
const TOPICS = ['준비물 있나요?', '초보도 들어도 돼요?', '주차 되나요?', '늦게 와도 돼요?'];

export function QuestionSheet({ open, onClose, onSubmit, nickname }: { open: boolean; onClose: () => void; onSubmit: (text: string) => Promise<string | null>; nickname: string }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const id = useId();
  return (
    <Sheet open={open} onClose={onClose} label="질문하기">
      <div className="flex w-full flex-col gap-[2px] leading-[1.4]">
        <h2 className="m-0 text-[20px] font-black">질문하기</h2>
        <p className="m-0 text-[12px] text-ink-2">모두에게 공개돼요 · 로그인한 이웃 누구나 답할 수 있어요</p>
      </div>
      <div className="flex w-full flex-col gap-[5px]">
        <p className="m-0 text-[12px] leading-[1.4] font-bold">자주 나오는 안건</p>
        <div className="flex flex-wrap gap-x-[6px]">
          {TOPICS.map((t) => (
            <JdPillButton key={t} onClick={() => setText(t)}>
              {t}
            </JdPillButton>
          ))}
        </div>
      </div>
      <label htmlFor={id} className="flex w-full flex-col gap-[6px] rounded-[16px] border border-line px-4 py-[14px]">
        <span className="sr-only">질문 내용</span>
        <textarea
          id={id}
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 100))}
          rows={4}
          placeholder="궁금한 점을 짧게 적어 주세요"
          className="resize-none bg-transparent text-[14px] leading-[1.4] outline-none placeholder:text-ink-3"
        />
        <span className="text-right text-[11px] leading-[1.4] font-medium text-ink-3">{text.length} / 100</span>
      </label>
      <div className="flex w-full items-center gap-2">
        <Jakdangi color="yellow" mood="whisper" size={32} />
        <p className="m-0 flex-1 text-[12px] leading-[1.4] font-medium text-ink-2">‘{nickname}’ 이름으로 올라가요 · 연락처는 적지 말아 주세요</p>
      </div>
      {err ? (
        <p role="alert" className="m-0 w-full text-[13px] font-bold text-rose">
          {err}
        </p>
      ) : null}
      <JdButton
        kind="dark"
        disabled={busy || !text.trim()}
        onClick={async () => {
          setBusy(true);
          setErr(null);
          const e = await onSubmit(text.trim());
          setBusy(false);
          if (e) setErr(e);
          else setText('');
        }}
      >
        {busy ? '올리는 중…' : '회의에 올리기'}
      </JdButton>
    </Sheet>
  );
}
