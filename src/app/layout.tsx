import type { Metadata, Viewport } from 'next';
// 피그마와 같은 Noto Sans KR. 구글 폰트 서버 대신 npm 패키지로 담아 둔다 (오프라인·빌드 환경에서도 안전)
import '@fontsource/noto-sans-kr/400.css';
import '@fontsource/noto-sans-kr/500.css';
import '@fontsource/noto-sans-kr/700.css';
import '@fontsource/noto-sans-kr/900.css';
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
  themeColor: '#FBF4EC',
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
