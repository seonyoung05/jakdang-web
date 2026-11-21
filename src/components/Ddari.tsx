'use client';

import { motion } from 'motion/react';
import Jakdangi, { type JakdangiMood } from './Jakdangi';

/**
 * (구) 따리 → 작당이 캐릭터로 교체. 기존 호출부(mood: look/excited/cheer/sweep/sleepy)는 그대로 쓸 수 있다.
 * - look: 모집 중 → 찡긋
 * - excited: 1명만 남음 → 속닥속닥
 * - cheer: 작당 성공 → 만세
 * - sweep: 뒷정리 작전 → 속닥속닥
 * - sleepy: 빈 화면 → 졸린 얼굴
 */
export type DdariMood = 'look' | 'excited' | 'cheer' | 'sweep' | 'sleepy';

const MOOD: Record<DdariMood, JakdangiMood> = {
  look: 'sly',
  excited: 'whisper',
  cheer: 'joy',
  sweep: 'whisper',
  sleepy: 'sleepy',
};
const COLOR: Record<DdariMood, number> = { look: 0, excited: 1, cheer: 2, sweep: 1, sleepy: 0 };

export default function Ddari({ mood = 'look', size = 72, label }: { mood?: DdariMood; size?: number; label?: string }) {
  const bob =
    mood === 'excited'
      ? { y: [0, -4, 0], transition: { duration: 0.5, repeat: Infinity } }
      : mood === 'cheer'
        ? { y: [0, -8, 0], rotate: [0, -4, 4, 0], transition: { duration: 0.8, repeat: Infinity } }
        : mood === 'look'
          ? { rotate: [0, -5, 5, 0], transition: { duration: 3, repeat: Infinity } }
          : mood === 'sweep'
            ? { rotate: [0, 5, -5, 0], transition: { duration: 1.2, repeat: Infinity } }
            : { y: [0, 1.5, 0], transition: { duration: 2.4, repeat: Infinity } };

  return (
    <motion.span className="inline-flex" animate={bob} style={{ transformOrigin: '50% 90%' }}>
      <Jakdangi mood={MOOD[mood]} index={COLOR[mood]} size={size} label={label} />
    </motion.span>
  );
}
