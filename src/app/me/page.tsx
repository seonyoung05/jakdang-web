'use client';

import { useStore } from '@/lib/store';
import { history } from '@/lib/mock';
import type { HistoryState } from '@/lib/types';
import Icon, { type IconName } from '@/components/Icon';
import { Avatar, Badge, Button, IconButton, SectionTitle } from '@/components/ui';

/** '노쇼'라는 말 대신 담담한 상태 이름으로 기록한다 */
const STATE: Record<HistoryState, { label: string; tone: 'green' | 'gray' | 'sky'; icon: IconName }> = {
  checkedOut: { label: '뒷정리 완료', tone: 'green', icon: 'broom' },
  attended: { label: '함께했어요', tone: 'green', icon: 'door' },
  missed: { label: '함께하지 못함', tone: 'gray', icon: 'cal' },
  notOpened: { label: '열리지 않음', tone: 'sky', icon: 'clock' },
};

function mannerWord(n: number) {
  if (n >= 90) return '믿고 함께하는 이웃이에요';
  if (n >= 75) return '꾸준히 약속을 지키고 있어요';
  return '조금씩 믿음을 쌓는 중이에요';
}

export default function MePage() {
  const { me, reset, mode } = useStore();
  const circ = 2 * Math.PI * 42;

  return (
    <>
      <header className="flex items-center gap-3.5">
        <Avatar name={me.nickname} verified size={64} ring={false} />
        <div className="flex-1">
          <h1 className="m-0 text-[19px] font-black">{me.nickname}</h1>
          <span className="text-xs text-sub">
            {me.district} {me.dong} · {me.ageBand}
          </span>
        </div>
        <IconButton label="알림" icon="bell" href="/notifications" />
      </header>

      <section className="note-card mt-4 flex items-center gap-4 p-4" aria-label="믿음 도장">
        <div className="relative h-24 w-24 shrink-0">
          <svg viewBox="0 0 100 100" width="96" height="96" aria-hidden="true">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#EEE9DE" strokeWidth="10" />
            <circle cx="50" cy="50" r="42" fill="none" stroke="#2E6B52" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${(me.manner / 100) * circ} ${circ}`} transform="rotate(-90 50 50)" />
          </svg>
          <b className="absolute inset-0 flex flex-col items-center justify-center text-[26px] leading-none font-black">
            {me.manner}
            <small className="mt-1 text-[11px] font-medium text-sub">믿음 도장</small>
          </b>
        </div>
        <div className="flex flex-col gap-1.5">
          <b className="text-[15px]">{mannerWord(me.manner)}</b>
          <span className="text-xs text-sub">
            약속 지킨 모임 <b className="text-ink">{me.keptPromises}</b> / {me.totalPromises}
          </span>
          <span className="text-xs text-sub">
            뒷정리 작전 <b className="text-ink">{me.checkouts}</b>회 · 받은 칭찬 <b className="text-ink">{me.praises.reduce((a, p) => a + p.count, 0)}</b>개
          </span>
        </div>
      </section>

      <SectionTitle>인증</SectionTitle>
      <div className="grid grid-cols-2 gap-2">
        {[
          { icon: 'school' as const, label: '학교 인증', value: me.verification.school, how: '학교 메일로 인증' },
          { icon: 'pin' as const, label: '동네 인증', value: me.verification.neighborhood, how: '현재 위치로 인증 · 30일마다 갱신' },
        ].map((x) => (
          <div key={x.label} className={`flex flex-col gap-1 rounded-2xl p-3 text-xs ${x.value ? 'bg-mint' : 'border border-dashed border-line-strong bg-paper'}`}>
            <b className={`flex items-center gap-1.5 text-sm ${x.value ? 'text-mint-ink' : ''}`}>
              <Icon name={x.icon} size={16} />
              {x.label}
            </b>
            <span className={x.value ? 'text-mint-ink' : 'text-sub'}>{x.value ?? x.how}</span>
            {!x.value ? (
              <button type="button" className="mt-1 min-h-9 rounded-[10px] bg-ink text-xs font-bold text-white">
                인증하기
              </button>
            ) : null}
          </div>
        ))}
      </div>

      <SectionTitle>받은 칭찬</SectionTitle>
      <div className="flex flex-wrap gap-1.5">
        {me.praises.map((p) => (
          <span key={p.label} className="rounded-full border border-line bg-paper px-2.5 py-1.5 text-xs">
            {p.label}
            <b className="ml-1 text-green">{p.count}</b>
          </span>
        ))}
      </div>

      <SectionTitle>이전 내역</SectionTitle>
      <section className="note-card px-3.5 py-0.5">
        {history.map((h) => {
          const s = STATE[h.state];
          return (
            <div key={h.id} className="flex items-center gap-3 border-b border-line py-3 last:border-0">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${s.tone === 'green' ? 'bg-mint text-green' : s.tone === 'sky' ? 'bg-sky text-sky-ink' : 'bg-mute text-[#4C554F]'}`}>
                <Icon name={s.icon} size={17} />
              </span>
              <div className="min-w-0 flex-1">
                <b className="block truncate text-sm">{h.title}</b>
                <span className="text-xs text-sub">
                  {h.date} · {h.people}명{h.note ? ` · ${h.note}` : ''}
                </span>
              </div>
              <Badge tone={s.tone}>{s.label}</Badge>
            </div>
          );
        })}
      </section>
      <p className="m-0 mt-2 text-[11px] leading-relaxed text-sub">함께하지 못한 기록은 나에게만 보여요. 다른 이웃에게는 &lsquo;약속 지킨 모임&rsquo; 숫자만 보여요.</p>

      <SectionTitle>작당 동료 {me.friends.length}명</SectionTitle>
      <div className="flex flex-wrap gap-3">
        {me.friends.map((f) => (
          <div key={f} className="flex flex-col items-center gap-1 text-xs">
            <Avatar name={f} verified size={48} ring={false} />
            {f}
          </div>
        ))}
      </div>

      <div className="mt-8">
        <Button variant="ghost" onClick={reset}>
          시연 데이터 처음으로 되돌리기
        </Button>
        <p className="m-0 mt-2 text-center text-[11px] text-sub">데이터 모드: {mode === 'supabase' ? 'Supabase 실시간' : '로컬 목업'}</p>
      </div>
    </>
  );
}
