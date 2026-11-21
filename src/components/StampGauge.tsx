'use client';

import { AnimatePresence, motion } from 'motion/react';
import { avatarColor } from './ui';

/**
 * 도장판 게이지: 정원(max_members)만큼 빈 칸이 있고, 선착순으로 참여할 때마다 도장이 찍힌다.
 * 정원이 다 차면 초록으로 바뀐다.
 */
export default function StampGauge({ max, members, myId }: { max: number; members: { id: string; name: string }[]; myId?: string }) {
  const count = members.length;
  const full = count >= max;
  const d = max <= 6 ? 40 : max <= 10 ? 32 : 24;
  const cells = Array.from({ length: max }, (_, i) => members[i]);

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.min(count, max)}
      aria-label={`정원 ${max}명 중 ${count}명 참여`}
      className={`flex flex-wrap items-center gap-1.5 rounded-2xl border border-dashed p-2.5 transition-colors ${full ? 'border-green bg-mint' : 'border-line-strong bg-cream'}`}
    >
      {cells.map((m, i) => (
        <span key={i} className="relative flex items-center justify-center" style={{ width: d, height: d }}>
          <span className={`absolute inset-0 rounded-full border-2 border-dashed ${full ? 'border-green/40' : 'border-line-strong'}`} aria-hidden="true" />
          <AnimatePresence>
            {m ? (
              <motion.span
                key={m.id}
                initial={{ scale: 1.9, opacity: 0, rotate: -24 }}
                animate={{ scale: 1, opacity: 1, rotate: (i % 2 ? 1 : -1) * 8 }}
                exit={{ scale: 0.4, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 520, damping: 18 }}
                className="absolute inset-0 flex items-center justify-center rounded-full font-black text-ink"
                style={{
                  background: avatarColor(m.name),
                  boxShadow: `inset 0 0 0 2.5px ${m.id === myId ? '#F08A3C' : full ? '#2E6B52' : 'rgba(30,38,34,.25)'}`,
                  fontSize: d * 0.38,
                }}
                title={m.name}
              >
                {m.name.slice(0, 1)}
              </motion.span>
            ) : null}
          </AnimatePresence>
        </span>
      ))}
    </div>
  );
}
