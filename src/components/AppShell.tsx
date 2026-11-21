'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Suspense, type ReactNode } from 'react';
import Icon, { type IconName } from './Icon';
import Ddari from './Ddari';
import { useStore } from '@/lib/store';
import { Loading } from './ui';

const TABS: { href: string; label: string; icon: IconName; plus?: boolean }[] = [
  { href: '/', label: '홈', icon: 'home' },
  { href: '/my', label: '내 작당', icon: 'users' },
  { href: '/new', label: '작당 만들기', icon: 'plus', plus: true },
  { href: '/chat', label: '작당방', icon: 'chat' },
  { href: '/me', label: '내 기록', icon: 'user' },
];
const WITH_TABS = new Set(['/', '/my', '/chat', '/me']);

/**
 * 모바일 웹앱 틀. 화면 폭을 430px로 고정해 노트북에서 시연해도 앱처럼 보인다.
 */
export default function AppShell({ children }: { children: ReactNode }) {
  const { mode } = useStore();

  return (
    <div className="flex min-h-dvh justify-center lg:items-center lg:gap-16 lg:py-6">
      <aside className="hidden max-w-xs flex-col gap-4 lg:flex">
        <Ddari mood="look" size={80} />
        <h1 className="m-0 text-4xl font-black tracking-tight">
          <span className="scribble">작당모임</span>
        </h1>
        <p className="m-0 text-base leading-relaxed text-sub">
          비어 있는 공공시설 시간, 동네 이웃과 작당해서 함께 열어요. <b className="text-ink">모이면, 열린다.</b>
        </p>
        <p className="m-0 text-xs text-sub">
          데이터 모드: {mode === 'supabase' ? 'Supabase 실시간' : '로컬 목업 (브라우저 저장)'}
        </p>
      </aside>

      <div className="relative h-dvh w-full max-w-[430px] overflow-hidden bg-cream lg:h-[860px] lg:rounded-[44px] lg:border-[10px] lg:border-[#23302A] lg:shadow-[var(--shadow-phone)]">
        <main className="no-scrollbar h-full overflow-y-auto px-[18px] pt-5 pb-28">
          <Suspense fallback={<Loading />}>{children}</Suspense>
        </main>

        <Suspense fallback={null}>
          <TabBar />
        </Suspense>
        <div id="overlay-root" />
      </div>
    </div>
  );
}

function TabBar() {
  const path = usePathname();
  if (!WITH_TABS.has(path)) return null;
  return (
          <nav aria-label="하단 메뉴" className="absolute inset-x-0 bottom-0 z-30 flex h-[78px] items-start justify-around border-t border-line bg-white/95 pt-2 backdrop-blur">
            {TABS.map((t) => {
              const on = t.href === '/' ? path === '/' : path.startsWith(t.href);
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  aria-label={t.plus ? t.label : undefined}
                  aria-current={on ? 'page' : undefined}
                  className={`flex min-h-11 min-w-14 flex-col items-center gap-[3px] text-[11px] no-underline ${on ? 'font-bold text-green' : 'text-sub'}`}
                >
                  {t.plus ? (
                    <span className="-mt-1.5 flex h-11 w-11 items-center justify-center rounded-2xl bg-green text-white">
                      <Icon name="plus" size={22} />
                    </span>
                  ) : (
                    <>
                      <Icon name={t.icon} size={22} />
                      {t.label}
                    </>
                  )}
                </Link>
              );
            })}
          </nav>
  );
}
