'use client';

import { useStore } from '@/lib/store';
import SlotCard from '@/components/SlotCard';
import Ddari from '@/components/Ddari';
import { LinkButton, Loading, SectionTitle } from '@/components/ui';
import { useJoinFlow } from '@/components/useJoinFlow';

export default function MySlotsPage() {
  const { ready, views } = useStore();
  const { openJoin, openCancel, ui } = useJoinFlow();
  const mine = views.filter((v) => v.isMine);
  const groups = [
    { title: '열린 작당', items: mine.filter((v) => v.isOpen) },
    { title: '도장 모으는 중', items: mine.filter((v) => !v.isOpen && v.status !== 'failed') },
    { title: '이번엔 못 열렸어요', items: mine.filter((v) => v.status === 'failed') },
  ].filter((g) => g.items.length);

  return (
    <>
      <h1 className="m-0 text-[22px] font-black">내 작당</h1>
      {!ready ? (
        <Loading />
      ) : mine.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-3 text-center">
          <Ddari mood="sleepy" />
          <b>아직 참여한 작당이 없어요</b>
          <LinkButton href="/" variant="dark" className="!w-auto">
            작당 쪽지 보러 가기
          </LinkButton>
        </div>
      ) : (
        groups.map((g) => (
          <section key={g.title}>
            <SectionTitle>
              {g.title} <span className="text-green">{g.items.length}</span>
            </SectionTitle>
            <div className="flex flex-col gap-3">
              {g.items.map((v) => (
                <SlotCard key={v.id} v={v} onJoin={() => openJoin(v)} onCancel={() => openCancel(v)} />
              ))}
            </div>
          </section>
        ))
      )}
      {ui}
    </>
  );
}
