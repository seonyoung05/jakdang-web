'use client';

import confetti from 'canvas-confetti';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect } from 'react';
import Ddari from './Ddari';
import { Button, LinkButton } from './ui';

/** 작당 성공! 연출 (명세서 5-4 P1): 문이 열리고 따리가 만세, 컨페티 */
export default function Celebration({ open, title, chatHref, onClose }: { open: boolean; title: string; chatHref: string; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduce) {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.55 }, colors: ['#F08A3C', '#2E6B52', '#FAF8F3', '#E6A03A'] });
    }
  }, [open]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div className="absolute inset-0 z-50 flex items-center justify-center bg-ink/55 px-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="작당 성공"
            initial={{ scale: 0.85, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="flex w-full flex-col items-center gap-3 rounded-[28px] bg-green px-6 pt-6 pb-6 text-center text-white"
          >
            <div className="relative flex h-28 w-full items-end justify-center">
              {/* 문이 열리는 모양 */}
              <motion.span
                className="absolute bottom-0 left-1/2 h-24 w-16 origin-left rounded-t-lg bg-green-deep"
                style={{ marginLeft: -32 }}
                initial={{ rotateY: 0 }}
                animate={{ rotateY: -70 }}
                transition={{ delay: 0.15, duration: 0.6 }}
                aria-hidden="true"
              />
              <span className="absolute bottom-0 left-1/2 -ml-8 h-24 w-16 rounded-t-lg border-2 border-white/30" aria-hidden="true" />
              <motion.span initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.45 }} className="relative">
                <Ddari mood="cheer" size={64} />
              </motion.span>
            </div>
            <h2 className="m-0 text-[26px] font-black">작당 성공!</h2>
            <p className="m-0 text-sm leading-relaxed text-[#D3EBDD]">
              {title}
              <br />
              작당방이 열렸어요. 먼저 인사 나눠 볼까요?
            </p>
            <div className="mt-2 flex w-full flex-col gap-2">
              <LinkButton href={chatHref} variant="tangerine" icon="chat">
                작당방 입장
              </LinkButton>
              <Button variant="ghost" className="!bg-white/10 !text-white" onClick={onClose}>
                나중에
              </Button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
