'use client';

import { motion } from 'motion/react';

/**
 * 따리: 머리가 둥근 열쇠 친구. 혼자는 작은 열쇠지만 모이면 큰 문을 연다.
 * mood로 상태를 보여 준다.
 * - look: 모집 중 (두리번)
 * - excited: 1명만 남음 (두근두근)
 * - cheer: 작당 성공 (만세)
 * - sweep: 뒷정리 작전
 * - sleepy: 아직 아무도 없음 / 빈 화면
 */
export type DdariMood = 'look' | 'excited' | 'cheer' | 'sweep' | 'sleepy';

export default function Ddari({ mood = 'look', size = 72, label }: { mood?: DdariMood; size?: number; label?: string }) {
  const bob =
    mood === 'excited'
      ? { y: [0, -4, 0], transition: { duration: 0.5, repeat: Infinity } }
      : mood === 'cheer'
        ? { y: [0, -8, 0], rotate: [0, -4, 4, 0], transition: { duration: 0.8, repeat: Infinity } }
        : mood === 'look'
          ? { rotate: [0, -6, 6, 0], transition: { duration: 3, repeat: Infinity } }
          : mood === 'sweep'
            ? { rotate: [0, 5, -5, 0], transition: { duration: 1.2, repeat: Infinity } }
            : { y: [0, 1.5, 0], transition: { duration: 2.4, repeat: Infinity } };

  return (
    <motion.svg
      width={size}
      height={size * 1.25}
      viewBox="0 0 80 100"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      animate={bob}
      style={{ overflow: 'visible', transformOrigin: '50% 90%' }}
    >
      {/* 팔 */}
      {mood === 'cheer' ? (
        <>
          <path d="M18 40 6 22" stroke="#1E2622" strokeWidth="4" strokeLinecap="round" />
          <path d="M62 40 74 22" stroke="#1E2622" strokeWidth="4" strokeLinecap="round" />
        </>
      ) : mood === 'sweep' ? (
        <>
          <path d="M60 46 72 62" stroke="#1E2622" strokeWidth="4" strokeLinecap="round" />
          <path d="M70 52 78 88" stroke="#8A3F0A" strokeWidth="3" strokeLinecap="round" />
          <path d="M72 84 84 92 74 94z" fill="#E6A03A" />
        </>
      ) : null}
      {/* 머리 */}
      <circle cx="40" cy="34" r="26" fill="#F08A3C" />
      <circle cx="40" cy="34" r="8" fill="#FAF8F3" opacity="0.9" />
      {/* 눈 */}
      {mood === 'sleepy' ? (
        <>
          <path d="M26 30q4 3 8 0" stroke="#1E2622" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M46 30q4 3 8 0" stroke="#1E2622" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </>
      ) : mood === 'cheer' ? (
        <>
          <path d="M26 31q4-5 8 0" stroke="#1E2622" strokeWidth="2.8" fill="none" strokeLinecap="round" />
          <path d="M46 31q4-5 8 0" stroke="#1E2622" strokeWidth="2.8" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx={mood === 'look' ? 29 : 30} cy="29" r="3.2" fill="#1E2622" />
          <circle cx={mood === 'look' ? 49 : 50} cy="29" r="3.2" fill="#1E2622" />
        </>
      )}
      {/* 볼 */}
      <circle cx="23" cy="40" r="3.5" fill="#E0663A" opacity="0.5" />
      <circle cx="57" cy="40" r="3.5" fill="#E0663A" opacity="0.5" />
      {/* 입 */}
      {mood === 'cheer' || mood === 'excited' ? (
        <path d="M33 44q7 7 14 0z" fill="#1E2622" />
      ) : mood === 'sleepy' ? (
        <circle cx="40" cy="46" r="2" fill="#1E2622" />
      ) : (
        <path d="M34 45q6 4 12 0" stroke="#1E2622" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      )}
      {/* 열쇠 몸통 */}
      <rect x="33" y="58" width="14" height="36" rx="6" fill="#2E6B52" />
      <rect x="47" y="74" width="10" height="7" rx="2.5" fill="#2E6B52" />
      <rect x="47" y="85" width="7" height="6" rx="2.5" fill="#2E6B52" />
      {mood === 'excited' ? (
        <g fill="#F08A3C">
          <path d="M68 12l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" />
          <path d="M10 8l1.4 3.4L15 13l-3.6 1.4L10 18l-1.4-3.6L5 13l3.6-1.6z" />
        </g>
      ) : null}
    </motion.svg>
  );
}
