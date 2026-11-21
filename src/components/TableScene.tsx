'use client';

import { AnimatePresence, motion } from 'motion/react';
import Jakdangi, { colorFor, type JakdangiColor, type JakdangiMood } from './Jakdangi';

/**
 * 피그마 'table-scene': 테이블(타원)에 둘러앉은 작당이 6자리.
 * 자리 좌표는 피그마 02 화면(307×170) 기준 비율로 옮겼다. 위 줄 3자리 → 아래 줄 3자리 순으로 채운다.
 */
const SEATS = [
  { x: 0.0837, y: 0.12 },
  { x: 0.3837, y: 0.06 },
  { x: 0.6837, y: 0.12 },
  { x: 0.1337, y: 0.5 },
  { x: 0.4337, y: 0.55 },
  { x: 0.7037, y: 0.46 },
];
const SEAT_SIZE = 0.42; // 높이 대비 작당이 크기 (71.4 / 170)

export type Seat = { id: string; name?: string; color?: JakdangiColor } | null;

export default function TableScene({
  seats,
  height = 170,
  mood,
  bubbles = [],
  confetti = false,
  className = '',
  label,
}: {
  /** 최대 6칸. null = 빈자리 */
  seats: Seat[];
  height?: number;
  /** 지정하지 않으면 마지막으로 들어온 자리만 속닥속닥, 나머지는 찡긋 */
  mood?: JakdangiMood;
  /** 말풍선 (장식) — seat 번호와 글자 */
  bubbles?: { seat: number; text: string }[];
  confetti?: boolean;
  className?: string;
  label?: string;
}) {
  const size = Math.round(height * SEAT_SIZE);
  const lastFilled = seats.reduce((acc, s, i) => (s ? i : acc), -1);

  return (
    <div className={`relative w-full overflow-hidden rounded-[20px] ${className}`} style={{ height }} role="img" aria-label={label ?? '테이블에 모인 작당이들'}>
      {confetti ? <Confetti /> : null}
      {/* 테이블 */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/jakdangi/table.svg" alt="" aria-hidden="true" className="absolute" style={{ left: '14%', top: height * 0.5, width: '72%', height: height * 0.26 }} />
      {seats.slice(0, 6).map((s, i) => {
        const pos = SEATS[i];
        return (
          <div key={i} className="absolute" style={{ left: `${pos.x * 100}%`, top: pos.y * height, width: size, height: size }}>
            <AnimatePresence mode="popLayout">
              {s ? (
                <motion.div
                  key={s.id}
                  initial={{ y: -16, scale: 0.6, opacity: 0 }}
                  animate={{ y: 0, scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 480, damping: 18 }}
                >
                  <Jakdangi color={s.color ?? colorFor(s.id)} mood={mood ?? (i === lastFilled ? 'whisper' : 'sly')} size={size} />
                </motion.div>
              ) : (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <Jakdangi empty size={size} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
      {bubbles.map((b) => {
        const pos = SEATS[b.seat] ?? SEATS[0];
        return (
          <span
            key={b.seat + b.text}
            aria-hidden="true"
            className="absolute rounded-full bg-surface px-[9px] py-[3px] text-[10px] leading-[1.4] font-bold text-ink"
            style={{ left: `calc(${pos.x * 100}% + ${size * 0.55}px)`, top: Math.max(2, pos.y * height - 4) }}
          >
            {b.text}
          </span>
        );
      })}
    </div>
  );
}

/** 피그마 04 화면의 종이 조각 (장식) */
function Confetti() {
  const bits = [
    { l: 8, t: 7, r: -20, c: '#FF7A59' },
    { l: 21, t: 2, r: 30, c: '#FFD95E' },
    { l: 40, t: 9, r: -45, c: '#A8D7F2' },
    { l: 61, t: 3, r: 15, c: '#FFB39B' },
    { l: 78, t: 8, r: -30, c: '#FF7A59' },
    { l: 90, t: 4, r: 40, c: '#FFD95E' },
    { l: 15, t: 30, r: -10, c: '#A8D7F2' },
    { l: 87, t: 28, r: 20, c: '#FFB39B' },
  ];
  return (
    <>
      {bits.map((b, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="absolute h-[10px] w-[4px] rounded-[2px]"
          style={{ left: `${b.l}%`, top: `${b.t}%`, background: b.c, transform: `rotate(${b.r}deg)` }}
        />
      ))}
    </>
  );
}

/** 참여자 목록 → 6칸 자리 배열 (정원이 6보다 작으면 정원만큼만) */
export function seatsFrom(members: { id: string; name?: string }[], max: number): Seat[] {
  const n = Math.min(6, Math.max(max, 1));
  return Array.from({ length: n }, (_, i) => members[i] ?? null);
}
