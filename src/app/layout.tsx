import type { Metadata, Viewport } from 'next';
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css';
// 제목용 주아체: 구글 폰트 서버 대신 npm 패키지로 직접 담아 둔다 (오프라인·빌드 환경에서도 안전)
import '@fontsource/jua';
import './globals.css';
import { AuthProvider } from '@/lib/auth';
import AppShell from '@/components/AppShell';

export const metadata: Metadata = {
  title: '작당모임 — 모이면, 열린다',
  description: '공공기관 공식 교육 프로그램에 함께 참여할 동네 이웃을 모으는 웹앱',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: '작당모임', statusBarStyle: 'default' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#FFF9F1',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="ko">
      <body>
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
