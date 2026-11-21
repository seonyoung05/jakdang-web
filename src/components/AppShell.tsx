'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Suspense, type ReactNode } from 'react';
import Icon, { type IconName } from './Icon';
import Ddari from './Ddari';
import { Loading } from './ui';
import { useAuth } from '@/lib/auth';

const TABS: { href: string; label: string; icon: IconName; plus?: boolean }[] = [
  { href: '/', label: '홈', icon: 'home' },
  { href: '/programs', label: '강좌', icon: 'book' },
  { href: '/new', label: '모집 열기', icon: 'plus', plus: true },
  { href: '/my', label: '내 모임', icon: 'users' },
  { href: '/me', label: '내 정보', icon: 'user' },
];
const WITH_TABS = new Set(['/', '/programs', '/my', '/me']);

/** 모바일 웹앱 틀. 화면 폭을 430px로 고정해 노트북에서 시연해도 앱처럼 보인다. */
export default function AppShell({ children }: { children: ReactNode }) {
  const { configured } = useAuth();

  return (
    <div className="flex min-h-dvh justify-center lg:items-center lg:gap-16 lg:py-6">
      <aside className="hidden max-w-xs flex-col gap-4 lg:flex">
        <Ddari mood="look" size={80} />
        <h1 className="m-0 text-4xl font-black tracking-tight">
          <span className="scribble">작당모임</span>
        </h1>
        <p className="m-0 text-base leading-relaxed text-sub">
          공공기관의 공식 교육 프로그램, 동네 이웃과 같이 들어요. <b className="text-ink">모이면, 열린다.</b>
        </p>
        <p className="m-0 text-xs leading-relaxed text-sub">수강 신청은 각자 공식 기관에서 해요. 작당모임은 함께할 이웃을 모아 줘요.</p>
      </aside>

      <div className="relative h-dvh w-full max-w-[430px] overflow-hidden bg-cream lg:h-[860px] lg:rounded-[44px] lg:border-[10px] lg:border-[#23302A] lg:shadow-[var(--shadow-phone)]">
        <main className="no-scrollbar h-full overflow-y-auto px-[18px] pt-5 pb-28">
          {!configured ? (
            <div role="alert" className="mb-4 rounded-2xl bg-[#FBE4E1] p-3.5 text-[13px] leading-relaxed text-rose">
              <b>Supabase 연결 정보가 없어요.</b> <code>.env.local</code>에 <code>NEXT_PUBLIC_SUPABASE_URL</code>, <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code>를 넣고
              개발 서버를 다시 켜 주세요.
            </div>
          ) : null}
          <Suspense fallback={<Loading />}>{children}</Suspense>
        </main>
        <Suspense fallback={null}>
          <TabBar />
        </Suspense>
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
