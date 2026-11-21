'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { animate } from 'motion/react';
import { useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import Icon, { type IconName } from './Icon';

const AV = ['#F6D9A8', '#CDE6F5', '#F3C9C4', '#D6E9C6', '#E2D4F0', '#FBE3B8', '#C9E4DE'];
export function avatarColor(name: string) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return AV[h % AV.length];
}

export function Avatar({ name, verified, size = 32, ring = true }: { name: string; verified?: boolean; size?: number; ring?: boolean }) {
  // verified: 백엔드에서 실제 인증이 확인될 때만 true로 넘길 것 (아직 미구현)
  return (
    <span
      title={name}
      className="relative inline-flex shrink-0 items-center justify-center rounded-full font-bold text-ink"
      style={{ width: size, height: size, background: avatarColor(name), fontSize: size * 0.4, boxShadow: ring ? '0 0 0 2px #fff' : undefined }}
    >
      {(name || '?').slice(0, 1)}
      {verified ? (
        <span
          className="absolute -right-0.5 -bottom-0.5 flex items-center justify-center rounded-full border-2 border-white bg-green text-white"
          style={{ width: Math.max(13, size * 0.38), height: Math.max(13, size * 0.38) }}
        >
          <Icon name="check" size={Math.max(7, size * 0.22)} strokeWidth={4} />
        </span>
      ) : null}
    </span>
  );
}

type Tone = 'green' | 'tangerine' | 'gray' | 'sky' | 'rose';
const tones: Record<Tone, string> = {
  green: 'bg-mint text-mint-ink',
  tangerine: 'bg-tangerine-soft text-tangerine-ink',
  gray: 'bg-mute text-[#4C554F]',
  sky: 'bg-sky text-sky-ink',
  rose: 'bg-[#FBE4E1] text-rose',
};
export function Badge({ tone = 'gray', icon, children }: { tone?: Tone; icon?: IconName; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold ${tones[tone]}`}>
      {icon ? <Icon name={icon} size={12} /> : null}
      {children}
    </span>
  );
}

export function Tag({ children }: { children: ReactNode }) {
  return <span className="rounded-[7px] bg-mute px-2 py-[3px] text-xs text-[#3F4943]">{children}</span>;
}

export function Chip({ on, onClick, children, soft, icon }: { on?: boolean; onClick?: () => void; children: ReactNode; soft?: boolean; icon?: IconName }) {
  const base = 'inline-flex min-h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-[13px] font-medium transition-colors';
  const cls = on
    ? soft
      ? 'border-green bg-mint text-mint-ink'
      : 'border-ink bg-ink text-white'
    : 'border-line-strong bg-paper text-ink hover:border-sub';
  return (
    <button type="button" aria-pressed={on} onClick={onClick} className={`${base} ${cls}`}>
      {on && soft ? <Icon name="check" size={13} strokeWidth={2.6} /> : icon ? <Icon name={icon} size={14} /> : null}
      {children}
    </button>
  );
}

type BtnVariant = 'dark' | 'green' | 'line' | 'ghost' | 'tangerine';
const btnCls: Record<BtnVariant, string> = {
  dark: 'bg-ink text-white hover:bg-[#2C3732]',
  green: 'bg-green text-white hover:bg-green-deep',
  line: 'border border-line-strong bg-paper text-ink hover:border-sub',
  ghost: 'bg-mute text-ink hover:bg-[#EAE6DC]',
  tangerine: 'bg-tangerine text-ink hover:bg-[#E87D2C]',
};
export function Button({
  variant = 'dark',
  icon,
  children,
  className = '',
  ...rest
}: { variant?: BtnVariant; icon?: IconName } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`inline-flex min-h-[50px] w-full items-center justify-center gap-1.5 rounded-2xl px-4 text-[15px] font-bold transition-colors disabled:cursor-not-allowed disabled:bg-mute disabled:text-[#6A726D] ${btnCls[variant]} ${className}`}
      {...rest}
    >
      {icon ? <Icon name={icon} size={18} /> : null}
      {children}
    </button>
  );
}

export function LinkButton({ href, variant = 'dark', icon, children, className = '' }: { href: string; variant?: BtnVariant; icon?: IconName; children: ReactNode; className?: string }) {
  return (
    <Link href={href} className={`inline-flex min-h-[50px] w-full items-center justify-center gap-1.5 rounded-2xl px-4 text-[15px] font-bold no-underline transition-colors ${btnCls[variant]} ${className}`}>
      {icon ? <Icon name={icon} size={18} /> : null}
      {children}
    </Link>
  );
}

export function IconButton({ label, icon, onClick, href, dot }: { label: string; icon: IconName; onClick?: () => void; href?: string; dot?: boolean }) {
  const cls = 'relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border border-line bg-paper text-ink';
  const inner = (
    <>
      <Icon name={icon} size={22} />
      {dot ? <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full border-2 border-white bg-rose" /> : null}
    </>
  );
  return href ? (
    <Link href={href} aria-label={label} className={cls}>
      {inner}
    </Link>
  ) : (
    <button type="button" aria-label={label} onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}

/** 상세 화면 상단: 뒤로 + 제목 */
export function BackBar({ title, right }: { title: string; right?: ReactNode }) {
  const router = useRouter();
  return (
    <div className="mb-3 flex items-center gap-2">
      <IconButton label="뒤로" icon="back" onClick={() => (window.history.length > 1 ? router.back() : router.push('/'))} />
      <h1 className="m-0 flex-1 truncate text-[15px] font-bold">{title}</h1>
      {right}
    </div>
  );
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mt-6 mb-2.5 flex items-baseline justify-between">
      <h2 className="m-0 text-[17px] font-black">{children}</h2>
      {right}
    </div>
  );
}

export function Note({ icon = 'info', children }: { icon?: IconName; children: ReactNode }) {
  return (
    <p className="m-0 flex items-start gap-1.5 text-xs leading-relaxed text-sub">
      <Icon name={icon} size={13} className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

/** 금액이 줄어드는 카운트다운 애니메이션 */
export function CountNumber({ value, className }: { value: number; className?: string }) {
  const [shown, setShown] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    const from = prev.current;
    prev.current = value;
    if (from === value) return;
    const c = animate(from, value, { duration: 0.7, ease: [0.2, 0.8, 0.2, 1], onUpdate: (v) => setShown(Math.round(v / 10) * 10) });
    return () => c.stop();
  }, [value]);
  return <span className={className}>{shown.toLocaleString('ko-KR')}</span>;
}

export function Loading() {
  return (
    <div className="flex flex-col gap-3 pt-2" aria-busy="true" aria-label="불러오는 중">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-40 animate-pulse rounded-[22px] bg-paper/70" />
      ))}
    </div>
  );
}
