import type { Metadata, Viewport } from 'next';
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css';
import './globals.css';
import { StoreProvider } from '@/lib/store';
import AppShell from '@/components/AppShell';

export const metadata: Metadata = {
  title: '작당모임 — 모이면, 열린다',
  description: '비어 있는 공공시설 시간에 동네 이웃과 작당해서 함께 쓰는 웹앱',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: '작당모임', statusBarStyle: 'default' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#FAF8F3',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="ko">
      <body>
        <StoreProvider>
          <AppShell>{children}</AppShell>
        </StoreProvider>
      </body>
    </html>
  );
}
