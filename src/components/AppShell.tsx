'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Suspense, type ReactNode } from 'react';
import Jakdangi from './Jakdangi';
import { IconChat, IconHome, IconSearch, IconUser } from './jd';
import { Loading } from './ui';
import { useAuth } from '@/lib/auth';

/** 피그마 'tab-bar': 홈 · 강좌 찾기 · (+) 작당 꾸미기 · 내 모임 · 내 정보 */
const TABS = [
  { href: '/', label: '홈', Icon: IconHome },
  { href: '/programs', label: '강좌 찾기', Icon: IconSearch },
  { href: '/new', label: '작당 꾸미기', plus: true },
  { href: '/my', label: '내 모임', Icon: IconChat },
  { href: '/me', label: '내 정보', Icon: IconUser },
] as const;
const WITH_TABS = new Set(['/', '/programs', '/my', '/me']);

/** 모바일 웹앱 틀. 화면 폭을 430px로 고정해 노트북에서 시연해도 앱처럼 보인다. */
export default function AppShell({ children }: { children: ReactNode }) {
  const { configured } = useAuth();

  return (
    <div className="flex min-h-dvh justify-center lg:items-center lg:gap-16 lg:py-6">
      <aside className="hidden max-w-xs flex-col gap-4 lg:flex">
        <div className="flex">
          <Jakdangi color="peach" mood="sly" size={64} />
          <span className="-ml-4">
            <Jakdangi color="yellow" mood="whisper" size={64} />
          </span>
          <span className="-ml-4">
            <Jakdangi color="sky" mood="sly" size={64} />
          </span>
        </div>
        <h1 className="m-0 text-4xl font-black tracking-tight">작당모임</h1>
        <p className="m-0 text-base leading-relaxed text-ink-2">
          공공기관의 공식 교육 프로그램, 동네 이웃과 같이 들어요. <b className="text-ink">모이면, 열린다.</b>
        </p>
        <p className="m-0 text-xs leading-relaxed text-ink-2">수강 신청은 각자 공식 기관에서 해요. 작당모임은 함께할 이웃을 모아 줘요.</p>
      </aside>

      <div className="relative h-dvh w-full max-w-[430px] overflow-hidden bg-surface lg:h-[860px] lg:rounded-[36px] lg:shadow-[var(--shadow-phone)]">
        <main className="no-scrollbar h-full overflow-y-auto px-[18px] pt-4 pb-28">
          {!configured ? (
            <div role="alert" className="mb-4 rounded-2xl bg-peach p-3.5 text-[13px] leading-relaxed text-coral-ink">
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
    <nav
      aria-label="하단 메뉴"
      className="absolute inset-x-[18px] bottom-4 z-30 flex h-[60px] items-center justify-between rounded-[30px] border border-line bg-surface px-[14px]"
    >
      {TABS.map((t) => {
        const on = t.href === '/' ? path === '/' : path.startsWith(t.href);
        if ('plus' in t) {
          return (
            <Link key={t.href} href={t.href} aria-label={t.label} className="flex h-11 w-11 items-center justify-center">
              <span className="flex h-[42px] w-[42px] items-center justify-center rounded-[21px] bg-coral text-[22px] leading-none font-bold text-white">+</span>
            </Link>
          );
        }
        const { Icon } = t;
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-label={t.label}
            aria-current={on ? 'page' : undefined}
            className={`flex h-11 w-11 items-center justify-center ${on ? 'text-ink' : 'text-ink-3'}`}
          >
            <Icon />
          </Link>
        );
      })}
    </nav>
  );
}
