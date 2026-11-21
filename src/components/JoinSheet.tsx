'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { Button } from './ui';
import Icon from './Icon';

/**
 * 참여/취소 시트 (명세서 5-3): 닉네임 + 4자리 PIN. 연락처·회원가입 없음.
 */
export default function JoinSheet({
  open,
  mode,
  title,
  defaultNickname,
  onClose,
  onSubmit,
}: {
  open: boolean;
  mode: 'join' | 'cancel';
  title: string;
  defaultNickname: string;
  onClose: () => void;
  onSubmit: (nickname: string, pin: string) => Promise<string | null>; // 에러 문구 or null
}) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div className="absolute inset-0 z-40 flex items-end bg-ink/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <SheetForm mode={mode} title={title} defaultNickname={defaultNickname} onClose={onClose} onSubmit={onSubmit} />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function SheetForm({
  mode,
  title,
  defaultNickname,
  onClose,
  onSubmit,
}: {
  mode: 'join' | 'cancel';
  title: string;
  defaultNickname: string;
  onClose: () => void;
  onSubmit: (nickname: string, pin: string) => Promise<string | null>;
}) {
  const [nickname, setNickname] = useState(defaultNickname);
  const [pin, setPin] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const firstRef = useRef<HTMLInputElement>(null);
  const nid = useId();
  const pid = useId();

  // 열릴 때마다 새로 마운트되므로 입력값은 자연히 비워진다
  useEffect(() => {
    const t = setTimeout(() => firstRef.current?.focus(), 50);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(pin)) return setErr('PIN은 숫자 4자리예요');
    if (mode === 'join' && !nickname.trim()) return setErr('닉네임을 적어 주세요');
    setBusy(true);
    const r = await onSubmit(nickname, pin);
    setBusy(false);
    if (r) setErr(r);
  };

  return (
          <motion.form
            role="dialog"
            aria-modal="true"
            aria-label={title}
            onSubmit={submit}
            onClick={(e) => e.stopPropagation()}
            initial={{ y: 40 }}
            animate={{ y: 0 }}
            exit={{ y: 60 }}
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
            className="w-full rounded-t-[28px] bg-cream px-5 pt-3 pb-8"
          >
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-line-strong" aria-hidden="true" />
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="m-0 text-xs font-bold text-tangerine-ink">{mode === 'join' ? '작당에 합류하기' : '참여 취소'}</p>
                <h2 className="m-0 mt-1 text-lg leading-snug font-black">{title}</h2>
              </div>
              <button type="button" onClick={onClose} aria-label="닫기" className="flex h-11 w-11 items-center justify-center rounded-[14px] text-sub">
                <Icon name="x" />
              </button>
            </div>
            {mode === 'join' ? (
              <label htmlFor={nid} className="mb-3 flex flex-col gap-1.5">
                <span className="text-[13px] font-bold">닉네임</span>
                <input
                  id={nid}
                  ref={firstRef}
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  maxLength={10}
                  className="min-h-12 rounded-[14px] border border-line-strong bg-paper px-3.5 text-[15px]"
                />
              </label>
            ) : null}
            <label htmlFor={pid} className="flex flex-col gap-1.5">
              <span className="text-[13px] font-bold">PIN 4자리</span>
              <input
                id={pid}
                ref={mode === 'cancel' ? firstRef : undefined}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                inputMode="numeric"
                autoComplete="off"
                placeholder="••••"
                className="min-h-12 rounded-[14px] border border-line-strong bg-paper px-3.5 text-[20px] tracking-[0.5em]"
              />
              <span className="text-xs text-sub">PIN은 참여 취소할 때만 쓰여요. 연락처는 받지 않아요.</span>
            </label>
            {err ? (
              <p role="alert" className="m-0 mt-3 text-[13px] font-bold text-rose">
                {err}
              </p>
            ) : null}
            <div className="mt-5">
              <Button type="submit" variant={mode === 'join' ? 'dark' : 'line'} disabled={busy}>
                {busy ? '잠시만요…' : mode === 'join' ? '도장 찍고 참여하기' : '참여 취소하기'}
              </Button>
            </div>
          </motion.form>
  );
}
