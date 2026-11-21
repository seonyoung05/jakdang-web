'use client';

import { AnimatePresence, motion } from 'motion/react';
import type { Participant } from '@/lib/types';
import { avatarColor, isVerified } from './ui';
import Icon from './Icon';

/**
 * 도장판 게이지: 필요 인원만큼 빈 칸이 있고, 참여할 때마다 도장이 쾅 찍힌다.
 * 필요 인원이 차면 초록으로 바뀌고(작당 성공), 정원까지는 +N으로 더 받는다.
 */
export default function StampGauge({
  required,
  capacity,
  participants,
  myId,
  size,
}: {
  required: number;
  capacity: number;
  participants: Participant[];
  myId?: string;
  size?: number;
}) {
  const count = participants.length;
  const open = count >= required;
  const d = size ?? (required <= 6 ? 40 : required <= 8 ? 32 : 26);
  const slots = Array.from({ length: required }, (_, i) => participants[i]);
  const extra = Math.max(0, count - required);

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={required}
      aria-valuenow={Math.min(count, required)}
      aria-label={`도장 ${count}개 / 필요 ${required}명`}
      className={`flex flex-wrap items-center gap-1.5 rounded-2xl border border-dashed p-2.5 transition-colors ${open ? 'border-green bg-mint' : 'border-line-strong bg-cream'}`}
    >
      {slots.map((p, i) => (
        <span key={i} className="relative flex items-center justify-center" style={{ width: d, height: d }}>
          <span
            className={`absolute inset-0 rounded-full border-2 border-dashed ${open ? 'border-green/40' : 'border-line-strong'}`}
            aria-hidden="true"
          />
          <AnimatePresence>
            {p ? (
              <motion.span
                key={p.id}
                initial={{ scale: 1.9, opacity: 0, rotate: -24 }}
                animate={{ scale: 1, opacity: 1, rotate: (i % 2 ? 1 : -1) * 8 }}
                exit={{ scale: 0.4, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 520, damping: 18 }}
                className="absolute inset-0 flex items-center justify-center rounded-full font-black text-ink"
                style={{
                  background: avatarColor(p.nickname),
                  boxShadow: `inset 0 0 0 2.5px ${p.id === myId ? '#F08A3C' : open ? '#2E6B52' : 'rgba(30,38,34,.25)'}`,
                  fontSize: d * 0.38,
                }}
                title={`${p.nickname}${isVerified(p) ? ' · 인증' : ''}`}
              >
                {p.nickname.slice(0, 1)}
                {isVerified(p) ? (
                  <span className="absolute -right-0.5 -bottom-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-white bg-green text-white">
                    <Icon name="check" size={7} strokeWidth={4} />
                  </span>
                ) : null}
              </motion.span>
            ) : null}
          </AnimatePresence>
        </span>
      ))}
      {extra > 0 ? <span className="ml-1 text-xs font-bold text-mint-ink">+{extra}명</span> : null}
      <span className="ml-auto text-[11px] text-sub">최대 {capacity}명</span>
    </div>
  );
}
