'use client';

/**
 * 피그마 컴포넌트 'JD/Button', 'JD/Pill'과 바텀시트·탭 아이콘.
 */
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, type ButtonHTMLAttributes, type ReactNode } from 'react';

/* ───────── JD/Button: dark · light · coral, 높이 52, 둥글기 26 ───────── */
type Kind = 'dark' | 'light' | 'coral';
const KIND: Record<Kind, string> = {
  dark: 'bg-ink text-white',
  light: 'border border-line bg-surface text-ink',
  coral: 'bg-coral text-white',
};
const BTN = 'inline-flex h-[52px] w-full items-center justify-center gap-1.5 rounded-[26px] px-5 text-[15px] leading-[1.4] font-bold transition-opacity disabled:cursor-not-allowed disabled:opacity-45';

export function JdButton({ kind = 'dark', className = '', ...rest }: { kind?: Kind } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" className={`${BTN} ${KIND[kind]} ${className}`} {...rest} />;
}

export function JdLinkButton({ href, kind = 'dark', external, children, className = '' }: { href: string; kind?: Kind; external?: boolean; children: ReactNode; className?: string }) {
  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={`${BTN} ${KIND[kind]} no-underline ${className}`}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={`${BTN} ${KIND[kind]} no-underline ${className}`}>
      {children}
    </Link>
  );
}

/* ───────── JD/Pill: peach · dark · coral · outline · soft ───────── */
type PillStyle = 'peach' | 'dark' | 'coral' | 'outline' | 'soft';
const PILL: Record<PillStyle, string> = {
  peach: 'bg-peach-strong text-coral-ink',
  dark: 'bg-ink text-white',
  coral: 'bg-coral text-white',
  outline: 'border border-line bg-surface text-ink',
  soft: 'bg-bg text-ink-2',
};
export function JdPill({ style = 'peach', children, className = '' }: { style?: PillStyle; children: ReactNode; className?: string }) {
  return <span className={`inline-flex shrink-0 items-center rounded-full px-[10px] py-[4px] text-[11px] leading-[1.4] font-bold whitespace-nowrap ${PILL[style]} ${className}`}>{children}</span>;
}

/** 눌러지는 Pill (안건 칩, '+ 내 자리' 등) — 터치 영역은 넉넉하게 */
export function JdPillButton({ style = 'outline', children, onClick, pressed }: { style?: PillStyle; children: ReactNode; onClick?: () => void; pressed?: boolean }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={pressed} className="-my-2 inline-flex min-h-[44px] shrink-0 items-center">
      <JdPill style={style}>{children}</JdPill>
    </button>
  );
}

/* ───────── 바텀시트 (피그마 03·08·09·10) ───────── */
export function Sheet({ open, onClose, label, children }: { open: boolean; onClose: () => void; label: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div className="absolute inset-0 z-50 flex items-end bg-[#2E2420]/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={label}
            onClick={(e) => e.stopPropagation()}
            initial={{ y: 60 }}
            animate={{ y: 0 }}
            exit={{ y: 80 }}
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
            className="no-scrollbar flex max-h-[92%] w-full flex-col items-center gap-[14px] overflow-y-auto rounded-t-[30px] bg-surface px-5 pt-3 pb-7"
          >
            <span className="h-[5px] w-[44px] shrink-0 rounded-[3px] bg-line" aria-hidden="true" />
            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

/* ───────── 탭 아이콘 (피그마 icon/home·search·chat·user·close, 색만 currentColor로) ───────── */
const ICON = { width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true } as const;
export function IconHome() {
  return (
    <svg {...ICON}>
      <path d="M4 10.5L12 4L20 10.5V19C20 19.2652 19.8946 19.5196 19.7071 19.7071C19.5196 19.8946 19.2652 20 19 20H14.5V15H9.5V20H5C4.73478 20 4.48043 19.8946 4.29289 19.7071C4.10536 19.5196 4 19.2652 4 19V10.5Z" strokeWidth="2" strokeLinejoin="round" stroke="currentColor" />
    </svg>
  );
}
export function IconSearch() {
  return (
    <svg {...ICON}>
      <path d="M17.5 11C17.5 14.5899 14.5899 17.5 11 17.5C7.41015 17.5 4.5 14.5899 4.5 11C4.5 7.41015 7.41015 4.5 11 4.5C14.5899 4.5 17.5 7.41015 17.5 11Z" strokeWidth="2" stroke="currentColor" />
      <path d="M16 16L20 20" strokeWidth="2" strokeLinecap="round" stroke="currentColor" />
    </svg>
  );
}
export function IconChat() {
  return (
    <svg {...ICON}>
      <path d="M5 5H19C19.2652 5 19.5196 5.10536 19.7071 5.29289C19.8946 5.48043 20 5.73478 20 6V15C20 15.2652 19.8946 15.5196 19.7071 15.7071C19.5196 15.8946 19.2652 16 19 16H11L7 19.5V16H5C4.73478 16 4.48043 15.8946 4.29289 15.7071C4.10536 15.5196 4 15.2652 4 15V6C4 5.73478 4.10536 5.48043 4.29289 5.29289C4.48043 5.10536 4.73478 5 5 5Z" strokeWidth="2" strokeLinejoin="round" stroke="currentColor" />
    </svg>
  );
}
export function IconUser() {
  return (
    <svg {...ICON}>
      <path d="M15.6 9.00002C15.6 10.9882 13.9882 12.6 12 12.6C10.0118 12.6 8.39999 10.9882 8.39999 9.00002C8.39999 7.0118 10.0118 5.40002 12 5.40002C13.9882 5.40002 15.6 7.0118 15.6 9.00002Z" strokeWidth="2" stroke="currentColor" />
      <path d="M5 20C6 16.5 8.8 15 12 15C15.2 15 18 16.5 19 20" strokeWidth="2" strokeLinecap="round" stroke="currentColor" />
    </svg>
  );
}
export function IconClose() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3.5 3.5L12.5 12.5M12.5 3.5L3.5 12.5" strokeWidth="2" strokeLinecap="round" stroke="currentColor" />
    </svg>
  );
}

/** 피그마의 36px 원형 뒤로가기·닫기 버튼 (터치 영역 44px) */
export function CircleButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-label={label} onClick={onClick} className="-m-1 flex h-11 w-11 items-center justify-center">
      <span className="flex h-9 w-9 items-center justify-center rounded-[18px] border border-line bg-surface text-[20px] leading-none font-bold text-ink">{children}</span>
    </button>
  );
}
