'use client';

import { AnimatePresence, motion } from 'motion/react';
import Jakdangi, { jakdangiMood } from './Jakdangi';

/**
 * 작당이 게이지 (디자인 v4): 정원(max_members)만큼 빈자리 작당이가 있고,
 * 선착순으로 참여할 때마다 작당이가 톡 들어온다. 정원이 다 차면 모두 만세.
 */
export default function StampGauge({ max, members, myId }: { max: number; members: { id: string; name: string }[]; myId?: string }) {
  const count = members.length;
  const full = count >= max;
  const d = max <= 6 ? 44 : max <= 8 ? 36 : 28;
  const cells = Array.from({ length: max }, (_, i) => members[i]);

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.min(count, max)}
      aria-label={`정원 ${max}명 중 ${count}명 참여`}
      className={`flex flex-wrap items-end gap-1 rounded-2xl p-2.5 transition-colors ${full ? 'bg-tangerine-soft' : 'bg-mute'}`}
    >
      {cells.map((m, i) => (
        <span key={i} className="relative flex flex-col items-center justify-end" style={{ width: d, height: d }}>
          {!m ? <Jakdangi mood="empty" size={d} /> : null}
          <AnimatePresence>
            {m ? (
              <motion.span
                key={m.id}
                initial={{ y: -14, scale: 0.6, opacity: 0 }}
                animate={{ y: 0, scale: 1, opacity: 1 }}
                exit={{ scale: 0.4, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 520, damping: 16 }}
                className="absolute inset-0 flex items-end justify-center"
                title={m.name}
              >
                <Jakdangi mood={full ? 'joy' : jakdangiMood(i)} index={i} size={d} label={m.name} />
                {m.id === myId ? (
                  <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 rounded-full bg-tangerine px-1.5 text-[9px] leading-[14px] font-bold text-white">나</span>
                ) : null}
              </motion.span>
            ) : null}
          </AnimatePresence>
        </span>
      ))}
    </div>
  );
}
