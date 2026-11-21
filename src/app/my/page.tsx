'use client';

import { getMeetupsByIds, memberIndex, myMeetupIds } from '@/lib/api';
import { useAuth, useLoad } from '@/lib/auth';
import MeetupCard from '@/components/MeetupCard';
import Ddari from '@/components/Ddari';
import { LinkButton, Loading, SectionTitle } from '@/components/ui';

export default function MyMeetupsPage() {
  const { ready, user } = useAuth();
  const { data, loading, error, reload } = useLoad(async () => {
    if (!user) return null;
    const ids = await myMeetupIds(user.id);
    const meetups = await getMeetupsByIds(ids);
    const members = await memberIndex(meetups.map((m) => m.id));
    return { meetups, members };
  }, [user?.id]);

  if (!ready) return <Loading />;
  if (!user) {
    return (
      <div className="flex flex-col items-center gap-3 pt-16 text-center">
        <Ddari mood="look" />
        <b className="text-[17px]">로그인하면 내 모임이 보여요</b>
        <LinkButton href="/login?next=/my" variant="dark" className="!w-auto">
          로그인하러 가기
        </LinkButton>
      </div>
    );
  }

  const rows = (data?.meetups ?? []).map((m) => ({ m, count: data?.members ? (data.members.get(String(m.id))?.length ?? 0) : null }));
  const created = rows.filter((r) => r.m.creator_id === user.id);
  const joined = rows.filter((r) => r.m.creator_id !== user.id);

  return (
    <>
      <h1 className="m-0 text-[22px] font-black">내 모임</h1>
      {loading ? (
        <Loading />
      ) : error ? (
        <div role="alert" className="mt-3 rounded-2xl bg-[#FBE4E1] p-4 text-sm text-rose">
          {error}
          <button type="button" onClick={reload} className="ml-2 font-bold underline">
            다시 시도
          </button>
        </div>
      ) : rows.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-3 text-center">
          <Ddari mood="sleepy" />
          <b>아직 참여한 모임이 없어요</b>
          <LinkButton href="/" variant="dark" className="!w-auto">
            모집 보러 가기
          </LinkButton>
        </div>
      ) : (
        [
          { title: '내가 연 모집', items: created },
          { title: '참여 중인 모집', items: joined },
        ]
          .filter((g) => g.items.length)
          .map((g) => (
            <section key={g.title}>
              <SectionTitle>
                {g.title} <span className="text-green">{g.items.length}</span>
              </SectionTitle>
              <div className="flex flex-col gap-3">
                {g.items.map(({ m, count }) => (
                  <MeetupCard key={String(m.id)} m={m} count={count} />
                ))}
              </div>
            </section>
          ))
      )}
    </>
  );
}
