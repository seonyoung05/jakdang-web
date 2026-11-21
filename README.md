# 작당모임 — 모이면, 열린다

**공공기관의 공식 교육 프로그램에 함께 참여할 동네 이웃을 모집**하는 모바일 웹앱입니다.
작당모임은 수강 신청·예약을 처리하지 않아요. 이웃이 모이면, 각자 공식 기관 안내에 따라 신청합니다.

## 빠르게 시작하기

```bash
npm install
cp .env.example .env.local      # Windows: copy .env.example .env.local
npm run dev                     # http://localhost:3000
```

`.env.example`에는 백엔드가 공유한 Supabase **Project URL**과 **publishable key**가 들어 있어요(브라우저에 공개돼도 되는 키).
DB 비밀번호, service_role 키, secret 키는 절대 프론트 코드나 `.env` 파일에 넣지 마세요.

> 백엔드가 준 URL이 `https://<ref>.supabase.co/rest/v1/`처럼 끝나도 `src/lib/supabase.ts`가 기본 주소만 잘라서 씁니다.

## 백엔드 연동 (FE_supabase_contract_v2 기준)

| 기능 | 호출 (`src/lib/api.ts`) | 화면 |
|---|---|---|
| 회원가입 / 로그인 / 로그아웃 | `signUp`(닉네임은 메타데이터) · `signIn` · `signOut` | `/login`, `/me` |
| 내 프로필 | `profiles` 조회 | `/me` |
| 종로구 공식 프로그램 | `programs` (`district = 종로구`) | `/programs`, `/new` |
| 모집글 목록·상세 | `meetups` + `programs(...)` 조인 | `/`, `/m/[id]` |
| 모집 열기 (개설자 자동 참여) | `meetups` insert | `/new` |
| 선착순 참여 / 참여 취소 | `meetup_members` insert / delete | `/m/[id]` |
| 참여자 목록 (로그인 필요) | `meetup_members` + `profiles(...)` | `/m/[id]` |
| 공개 Q&A (질문·답변) | `qna_posts` (`parent_id`로 답변) | `/m/[id]` |
| 내 모임 | `meetup_members`(내 것) → `meetups` | `/my` |

DB 에러(중복 참여, 정원 초과, 권한 없음 등)는 `friendlyError()`가 한국어 문장으로 바꿔 보여 줍니다.

### 표기 원칙 (백엔드 요청 사항)

- 외부 링크 버튼은 **‘공식 신청 안내 확인’** — 예약 URL이 아닐 수 있어요.
- **‘신청 가능’, ‘예약 완료’, ‘인증 완료’를 임의로 표시하지 않아요.** 접수 여부·잔여석은 검증되지 않은 정보예요.
- 일정(`schedule_text`)은 기관 문구 그대로 보여 줘요.
- 개인 채팅/DM 없음 → **공개 Q&A**만.
- 아직 없는 기능(동네 GPS 인증, 수강 신청 증빙, 매너점수, 알림)은 `/me`에 **‘준비 중’**으로만 보여 줘요.

## 통합 테스트 순서

1. 계정 A 가입·로그인 → `/me`에 닉네임 확인 (profiles 자동 생성)
2. `/programs` → 강좌 선택 → 정원 2명으로 모집 열기 → 상세에서 A가 참여자 1명으로 보이는지
3. 다른 브라우저(시크릿 창)에서 계정 B로 참여 → 2/2, ‘작당 성공!’ 확인. 같은 계정 중복 참여, 세 번째 계정 참여가 막히는지
4. Q&A 질문·답변 작성 및 조회 (로그아웃 상태에서도 보이는지)
5. A가 참여 취소해도 모집글이 남는지

쿼리·RLS 오류는 화면의 빨간 안내 문구와 브라우저 개발자 도구 Network 탭 응답을 같이 BE에 전달해 주세요.

## 기술 스택

Next.js (App Router) · TypeScript · Tailwind CSS v4 · Motion · canvas-confetti · Supabase JS v2 · Pretendard

## 폴더 구조

```
src/
  app/
    page.tsx            # 홈: 모집 목록 (모집 중 / 전체 / 내가 참여한)
    programs/           # 종로구 공식 강좌 목록
    new/                # 모집 열기
    m/[id]/             # 모집 상세: 참여·취소, 참여자, 공개 Q&A
    my/                 # 내 모임
    me/                 # 내 정보, 준비 중 기능, 로그아웃
    login/              # 로그인 / 회원가입
  components/           # AppShell(탭바), MeetupCard, StampGauge, Celebration, Ddari(캐릭터), ui
  lib/
    api.ts              # Supabase 호출 전부 (화면은 이것만 사용)
    auth.tsx            # 로그인 상태 + useLoad 훅
    supabase.ts         # 클라이언트 생성
    types.ts            # 테이블 타입
```
