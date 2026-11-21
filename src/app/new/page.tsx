'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useId, useMemo, useState, type FormEvent } from 'react';
import { useStore } from '@/lib/store';
import { deadlineOf, deadlineText, feeAtTarget, requiredCount, won } from '@/lib/calc';
import type { Audience } from '@/lib/types';
import Icon from '@/components/Icon';
import { BackBar, Button, Chip, Loading, Note } from '@/components/ui';

const PURPOSES = ['배드민턴', '풋살', '농구', '스터디', '요리', '보드게임', '모각작'];
const VIBES = ['초보 환영', '처음이어도 OK', '조용히', '실력자만', '끝나고 밥', '재료 각자 준비'];
const AUDIENCES: { id: Audience; label: string; sub: string }[] = [
  { id: 'anyone', label: '누구나', sub: '가장 빨리 모여요' },
  { id: 'verified', label: '인증 멤버만', sub: '학교·동네 인증' },
  { id: 'peers', label: '또래끼리', sub: '내 나이 ±5세' },
  { id: 'sameGender', label: '같은 성별끼리', sub: '선호로 표시돼요' },
];

function pad(n: number) {
  return String(n).padStart(2, '0');
}
function toLocalInput(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function nextSaturday10() {
  const d = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
  d.setHours(10, 0, 0, 0);
  while (d.getDay() !== 6) d.setDate(d.getDate() + 1);
  return toLocalInput(d);
}

function NewSlotForm() {
  const router = useRouter();
  const search = useSearchParams();
  const { facilities, createSlot, me, now } = useStore();
  const [facilityId, setFacilityId] = useState(search.get('facility') ?? facilities[0].id);
  const [start, setStart] = useState(nextSaturday10);
  const [hours, setHours] = useState(2);
  const [purpose, setPurpose] = useState('배드민턴');
  const [vibes, setVibes] = useState<string[]>(['초보 환영']);
  const [audience, setAudience] = useState<Audience>('anyone');
  const [nickname, setNickname] = useState(me.nickname);
  const [pin, setPin] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const ids = { start: useId(), hours: useId(), nick: useId(), pin: useId() };

  const f = facilities.find((x) => x.id === facilityId)!;
  const preview = useMemo(() => {
    const startAt = new Date(start);
    const req = requiredCount(f);
    const fakeSlot = { startAt: startAt.toISOString() } as Parameters<typeof deadlineOf>[1];
    const dl = deadlineOf(f, fakeSlot);
    const dt = deadlineText(dl, now);
    return { req, fee: feeAtTarget(f, req), deadline: dt.passed ? '이미 지남' : `${dt.text} 뒤`, passed: dt.passed };
  }, [f, start, now]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(pin)) return setErr('PIN은 숫자 4자리예요');
    if (preview.passed) return setErr('모집 마감이 이미 지난 시간이에요. 조금 뒤 시간으로 골라 주세요');
    setBusy(true);
    const startAt = new Date(start);
    const endAt = new Date(startAt.getTime() + hours * 60 * 60 * 1000);
    const id = await createSlot({ facilityId, startAt: startAt.toISOString(), endAt: endAt.toISOString(), purpose, vibeTags: vibes, audience, nickname: nickname.trim() || me.nickname, pin });
    router.push(`/s/${id}`);
  };

  return (
    <form onSubmit={submit}>
      <BackBar title="새 작당 쪽지 쓰기" />

      <fieldset className="m-0 mb-5 border-0 p-0">
        <legend className="mb-2 p-0 text-[13px] font-bold">어디서</legend>
        <div className="flex flex-col gap-2">
          {facilities.map((x) => {
            const on = x.id === facilityId;
            return (
              <button
                key={x.id}
                type="button"
                aria-pressed={on}
                onClick={() => setFacilityId(x.id)}
                className={`flex min-h-14 items-center gap-3 rounded-[14px] border px-3.5 py-2.5 text-left ${on ? 'border-2 border-green bg-mint' : 'border-line-strong bg-paper'}`}
              >
                <Icon name="pin" size={18} className={on ? 'text-green' : 'text-sub'} />
                <span className="min-w-0 flex-1">
                  <b className="block truncate text-sm">{x.facilityName}</b>
                  <span className="text-xs text-sub">
                    {x.district} {x.dong} · 수용 {x.capacity}명 · {x.isFree ? '무료' : `${won(x.totalFee)}원`}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="mb-5 grid grid-cols-[1fr_96px] gap-2">
        <label htmlFor={ids.start} className="flex flex-col gap-1.5">
          <span className="text-[13px] font-bold">
            언제 <span className="font-normal text-sub">(제안 시간)</span>
          </span>
          <input id={ids.start} type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} className="min-h-12 rounded-[14px] border border-line-strong bg-paper px-3 text-sm" />
        </label>
        <label htmlFor={ids.hours} className="flex flex-col gap-1.5">
          <span className="text-[13px] font-bold">시간</span>
          <select id={ids.hours} value={hours} onChange={(e) => setHours(Number(e.target.value))} className="min-h-12 rounded-[14px] border border-line-strong bg-paper px-3 text-sm">
            {[1, 1.5, 2, 2.5, 3].map((h) => (
              <option key={h} value={h}>
                {h}시간
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mb-5">
        <p className="m-0 mb-2 text-[13px] font-bold">무엇을</p>
        <div className="flex flex-wrap gap-1.5">
          {PURPOSES.map((p) => (
            <Chip key={p} on={purpose === p} onClick={() => setPurpose(p)}>
              {p}
            </Chip>
          ))}
        </div>
      </div>

      <div className="mb-5">
        <p className="m-0 mb-2 text-[13px] font-bold">분위기</p>
        <div className="flex flex-wrap gap-1.5">
          {VIBES.map((p) => (
            <Chip key={p} soft on={vibes.includes(p)} onClick={() => setVibes(vibes.includes(p) ? vibes.filter((x) => x !== p) : [...vibes, p])}>
              {p}
            </Chip>
          ))}
        </div>
      </div>

      <fieldset className="m-0 mb-5 border-0 p-0">
        <legend className="mb-2 p-0 text-[13px] font-bold">함께할 분</legend>
        <div className="grid grid-cols-2 gap-1.5">
          {AUDIENCES.map((a) => {
            const on = audience === a.id;
            return (
              <button
                key={a.id}
                type="button"
                aria-pressed={on}
                onClick={() => setAudience(a.id)}
                className={`flex min-h-[52px] flex-col items-start justify-center rounded-[13px] border px-3 py-1.5 text-left text-[13px] leading-snug ${on ? 'border-2 border-green bg-mint font-bold text-mint-ink' : 'border-line-strong bg-paper'}`}
              >
                {a.label}
                <small className="text-[11px] font-normal text-sub">{a.sub}</small>
              </button>
            );
          })}
        </div>
        <div className="mt-2">
          <Note>조건을 걸수록 모이는 데 시간이 더 걸릴 수 있어요.</Note>
        </div>
      </fieldset>

      <div className="mb-5 grid grid-cols-2 gap-2">
        <label htmlFor={ids.nick} className="flex flex-col gap-1.5">
          <span className="text-[13px] font-bold">닉네임</span>
          <input id={ids.nick} value={nickname} onChange={(e) => setNickname(e.target.value)} maxLength={10} className="min-h-12 rounded-[14px] border border-line-strong bg-paper px-3 text-sm" />
        </label>
        <label htmlFor={ids.pin} className="flex flex-col gap-1.5">
          <span className="text-[13px] font-bold">반장 PIN 4자리</span>
          <input
            id={ids.pin}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            inputMode="numeric"
            placeholder="••••"
            className="min-h-12 rounded-[14px] border border-line-strong bg-paper px-3 text-base tracking-[0.4em]"
          />
        </label>
      </div>

      <section aria-label="미리보기" className="grid grid-cols-3 gap-2 rounded-[20px] bg-ink p-4 text-center text-white">
        <div>
          <b className="block text-[19px] font-black">{preview.req}명</b>
          <small className="text-[11px] text-[#C4CEC8]">필요 인원</small>
        </div>
        <div>
          <b className="block text-[19px] font-black">{preview.fee === null ? '무료' : `${won(preview.fee)}원`}</b>
          <small className="text-[11px] text-[#C4CEC8]">목표 1인당</small>
        </div>
        <div>
          <b className={`block text-[19px] font-black ${preview.passed ? 'text-tangerine' : ''}`}>{preview.deadline}</b>
          <small className="text-[11px] text-[#C4CEC8]">모집 마감</small>
        </div>
      </section>
      <div className="my-3">
        <Note icon="shield">쪽지를 쓴 사람이 작당 반장(대표 예약자)이 되고, 첫 번째 도장을 찍어요.</Note>
      </div>
      {err ? (
        <p role="alert" className="m-0 mb-3 text-[13px] font-bold text-rose">
          {err}
        </p>
      ) : null}
      <Button type="submit" variant="dark" disabled={busy}>
        {busy ? '쪽지 붙이는 중…' : '작당 쪽지 붙이기'}
      </Button>
    </form>
  );
}

function Gate() {
  const { ready } = useStore();
  return ready ? <NewSlotForm /> : <Loading />;
}

export default function NewSlotPage() {
  return (
    <Suspense fallback={<Loading />}>
      <Gate />
    </Suspense>
  );
}
