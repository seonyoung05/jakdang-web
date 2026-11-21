'use client';

import confetti from 'canvas-confetti';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect } from 'react';
import Ddari from './Ddari';
import Icon from './Icon';
import { Button } from './ui';

/** 정원이 다 모였을 때 연출. 수강 신청은 각자 공식 기관에서 한다는 안내를 함께 준다. */
export default function Celebration({
  open,
  title,
  registrationUrl,
  onClose,
}: {
  open: boolean;
  title: string;
  registrationUrl: string | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.55 }, colors: ['#FF8A5B', '#FFE07D', '#B8DEF2', '#FFC9AC'] });
    }
  }, [open]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div className="absolute inset-0 z-50 flex items-center justify-center bg-ink/55 px-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="모집 완료"
            initial={{ scale: 0.85, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="flex w-full flex-col items-center gap-3 rounded-[28px] bg-green px-6 py-6 text-center text-white"
          >
            <Ddari mood="cheer" size={64} />
            <h2 className="m-0 text-[26px] font-black">작당 성공!</h2>
            <p className="m-0 text-sm leading-relaxed text-[#F3E6DA]">
              {title}
              <br />
              정원이 다 모였어요. 이제 각자 공식 기관에서 수강 신청을 해 주세요.
            </p>
            <div className="mt-2 flex w-full flex-col gap-2">
              {registrationUrl ? (
                <a
                  href={registrationUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-[50px] items-center justify-center gap-1.5 rounded-2xl bg-tangerine text-[15px] font-bold text-ink no-underline"
                >
                  <Icon name="external" size={18} />
                  공식 신청 안내 확인
                </a>
              ) : null}
              <Button variant="ghost" className="!bg-white/10 !text-white" onClick={onClose}>
                닫기
              </Button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
