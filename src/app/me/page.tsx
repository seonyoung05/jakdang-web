'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { signOut, verifyNeighborhood } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import Jakdangi, { colorFor } from '@/components/Jakdangi';
import { JdButton, JdLinkButton, JdPill } from '@/components/jd';
import Icon, { type IconName } from '@/components/Icon';
import { Loading } from '@/components/ui';

/** 백엔드에 아직 없는 기능. 완료된 것처럼 보이지 않게 '준비 중'으로만 보여 준다. */
const SOON: { icon: IconName; title: string; desc: string }[] = [
  { icon: 'star', title: '믿음 도장 (매너점수)', desc: '약속을 지킨 기록으로 쌓여요' },
  { icon: 'bell', title: '알림', desc: '자리가 1개 남았을 때, 정원이 찼을 때 알려 줘요' },
];

const fmt = (iso: string) =>
  new Date(iso).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function MePage() {
  const router = useRouter();
  const { ready, user, profile, nickname, refreshProfile } = useAuth();
  const [checking, setChecking] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  if (!ready) return <Loading />;
  if (!user) {
    return (
      <div className="flex flex-col items-center gap-3 pt-20 text-center">
        <Jakdangi color="peach" mood="whisper" size={64} />
        <b className="text-[17px]">로그인하고 작당에 합류해요</b>
        <JdLinkButton href="/login" kind="dark" className="!w-auto">
          로그인 / 회원가입
        </JdLinkButton>
      </div>
    );
  }

  const checkLocation = async () => {
    setChecking(true);
    setErr(null);
    setDone(null);
    try {
      const r = await verifyNeighborhood();
      await refreshProfile();
      setDone(`${r.neighborhood_name}에 있는 걸 확인했어요`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="flex flex-col gap-[14px]">
      <header className="flex items-center gap-3">
        <Jakdangi color={colorFor(user.id)} mood="sly" size={64} />
        <div className="min-w-0 flex-1 leading-[1.4]">
          <h1 className="m-0 truncate text-[20px] font-black">{nickname}</h1>
          <span className="block truncate text-[12px] text-ink-2">{user.email}</span>
        </div>
      </header>

      {/* 동네 위치 확인 */}
      <section className="flex flex-col gap-[10px] rounded-[24px] bg-peach p-4" aria-label="동네 위치 확인">
        <div className="flex items-center justify-between gap-2 leading-[1.4]">
          <h2 className="m-0 text-[15px] font-black">동네 위치 확인</h2>
          {profile?.location_checked_at ? <JdPill style="dark">확인함</JdPill> : <JdPill style="outline">아직 안 함</JdPill>}
        </div>
        {profile?.location_checked_at ? (
          <p className="m-0 text-[13px] leading-[1.5]">
            <b className="text-[17px] font-black">{profile.neighborhood_name}</b>
            <br />
            <span className="text-ink-2">{fmt(profile.location_checked_at)}에 이 동네에 있었어요</span>
          </p>
        ) : (
          <p className="m-0 text-[13px] leading-[1.5] text-ink-2">지금 있는 곳의 동네 이름을 프로필에 표시해요. 다른 이웃에게는 동네 이름과 확인한 날짜만 보여요.</p>
        )}
        <JdButton kind={profile?.location_checked_at ? 'light' : 'dark'} onClick={checkLocation} disabled={checking}>
          {checking ? '위치 확인 중…' : profile?.location_checked_at ? '지금 위치로 다시 확인' : '지금 위치로 확인하기'}
        </JdButton>
        {err ? (
          <div role="alert" className="flex flex-col gap-1 rounded-[14px] bg-surface p-3 text-[12px] leading-[1.5]">
            <b className="text-rose">{err}</b>
            <span className="text-ink-2">실내에서는 위치가 부정확할 수 있어요. 잠시 뒤 다시 눌러 주세요.</span>
          </div>
        ) : null}
        {done ? (
          <p role="status" className="m-0 text-[12px] font-bold text-coral-ink">
            {done}
          </p>
        ) : null}
        <p className="m-0 text-[11px] leading-[1.5] text-ink-2">현재 위치를 보여 주는 기능이에요. 거주지나 신원을 인증하는 건 아니에요. 정확한 좌표나 주소는 저장해서 보여 주지 않아요.</p>
      </section>

      <section className="note-card flex flex-col px-4 py-1 text-[13px] leading-[1.4]" aria-label="내 프로필">
        {[
          ['닉네임', profile?.nickname || nickname],
          ['가입일', profile?.created_at ? new Date(profile.created_at).toLocaleDateString('ko-KR') : '-'],
        ].map(([k, v]) => (
          <div key={k} className="flex items-center justify-between border-b border-line py-3 last:border-0">
            <span className="text-ink-2">{k}</span>
            <b>{v}</b>
          </div>
        ))}
      </section>
      <p className="m-0 -mt-2 text-[11px] text-ink-2">닉네임 수정은 아직 지원하지 않아요.</p>

      <h2 className="m-0 mt-2 text-[16px] leading-[1.4] font-black">곧 생길 기능</h2>
      <div className="flex flex-col gap-2">
        {SOON.map((s) => (
          <div key={s.title} className="flex items-center gap-3 rounded-[20px] border border-dashed border-line p-3.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-bg text-ink-2">
              <Icon name={s.icon} size={18} />
            </span>
            <div className="min-w-0 flex-1 leading-[1.4]">
              <b className="block text-[13px]">{s.title}</b>
              <span className="text-[11px] text-ink-2">{s.desc}</span>
            </div>
            <JdPill style="soft">준비 중</JdPill>
          </div>
        ))}
      </div>

      <JdButton
        kind="light"
        className="mt-4"
        onClick={async () => {
          await signOut();
          router.replace('/');
        }}
      >
        로그아웃
      </JdButton>
    </div>
  );
}
