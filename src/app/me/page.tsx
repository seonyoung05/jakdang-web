'use client';

import { useRouter } from 'next/navigation';
import { signOut } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import Jakdangi from '@/components/Jakdangi';
import Icon, { type IconName } from '@/components/Icon';
import { Avatar, Badge, Button, LinkButton, Loading, SectionTitle } from '@/components/ui';

/** 백엔드에 아직 없는 기능. 완료된 것처럼 보이지 않게 '준비 중'으로만 보여 준다. */
const SOON: { icon: IconName; title: string; desc: string }[] = [
  { icon: 'pin', title: '동네 위치 인증', desc: 'GPS로 우리 동네 이웃인지 확인해요' },
  { icon: 'camera', title: '수강 신청 확인', desc: '각자 신청했는지 서로 확인할 수 있게 해요' },
  { icon: 'star', title: '믿음 도장 (매너점수)', desc: '약속을 지킨 기록으로 쌓여요' },
  { icon: 'bell', title: '알림', desc: '자리가 1개 남았을 때, 정원이 찼을 때 알려 줘요' },
];

export default function MePage() {
  const router = useRouter();
  const { ready, user, profile, nickname } = useAuth();

  if (!ready) return <Loading />;
  if (!user) {
    return (
      <div className="flex flex-col items-center gap-3 pt-16 text-center">
        <Jakdangi color="peach" mood="whisper" size={64} />
        <b className="text-[17px]">로그인하고 작당에 합류해요</b>
        <LinkButton href="/login?next=/me" variant="dark" className="!w-auto">
          로그인 / 회원가입
        </LinkButton>
      </div>
    );
  }

  return (
    <>
      <header className="flex items-center gap-3.5">
        <Avatar name={nickname} size={64} ring={false} />
        <div className="min-w-0 flex-1">
          <h1 className="m-0 truncate text-[19px] font-black">{nickname}</h1>
          <span className="block truncate text-xs text-sub">{user.email}</span>
        </div>
      </header>

      <section className="note-card mt-4 flex flex-col divide-y divide-line px-4" aria-label="내 프로필">
        <div className="flex items-center justify-between py-3 text-sm">
          <span className="text-sub">닉네임</span>
          <b>{profile?.nickname || nickname}</b>
        </div>
        <div className="flex items-center justify-between py-3 text-sm">
          <span className="text-sub">동네</span>
          <b>{profile?.neighborhood_name || '아직 등록되지 않았어요'}</b>
        </div>
        <div className="flex items-center justify-between py-3 text-sm">
          <span className="text-sub">가입일</span>
          <b>{profile?.created_at ? new Date(profile.created_at).toLocaleDateString('ko-KR') : '-'}</b>
        </div>
      </section>
      <p className="m-0 mt-2 text-[11px] text-sub">프로필 수정은 아직 지원하지 않아요.</p>

      <SectionTitle>곧 생길 기능</SectionTitle>
      <div className="flex flex-col gap-2">
        {SOON.map((s) => (
          <div key={s.title} className="flex items-center gap-3 rounded-2xl border border-dashed border-line-strong bg-paper/70 p-3.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mute text-sub">
              <Icon name={s.icon} size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <b className="block text-sm">{s.title}</b>
              <span className="text-xs text-sub">{s.desc}</span>
            </div>
            <Badge>준비 중</Badge>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <Button
          variant="ghost"
          icon="logout"
          onClick={async () => {
            await signOut();
            router.replace('/');
          }}
        >
          로그아웃
        </Button>
      </div>
    </>
  );
}
