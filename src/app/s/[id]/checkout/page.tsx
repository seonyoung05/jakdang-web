'use client';

import { useRouter } from 'next/navigation';
import { use, useState } from 'react';
import { useStore } from '@/lib/store';
import Ddari from '@/components/Ddari';
import Icon from '@/components/Icon';
import { Avatar, BackBar, Button, Chip, LinkButton, Loading, Note, isVerified } from '@/components/ui';

const PRAISES = ['시간 약속을 잘 지켜요', '친절해요', '정리를 잘해요', '또 같이 하고 싶어요', '처음인데 편했어요'];
const CHECKS = ['쓰레기·설거지 정리했어요', '불·가스·창문 확인했어요', '빌린 물품 제자리에 뒀어요'];

/** 뒷정리 작전 = 퇴실 인증. 정리 확인 → 이웃 칭찬 → 믿음 도장 */
export default function CheckoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { ready, view, checkout, me } = useStore();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [photo, setPhoto] = useState<string | null>(null);
  const [checks, setChecks] = useState<string[]>([]);
  const [geo, setGeo] = useState<'idle' | 'ok' | 'denied'>('idle');
  const [praise, setPraise] = useState<Record<string, string[]>>({});
  const v = view(id);

  if (!ready) return <Loading />;
  if (!v) return <p>쪽지를 찾을 수 없어요</p>;

  const others = v.participants.filter((p) => p.id !== v.myParticipantId);
  const canNext = (photo || geo === 'ok') && checks.length === CHECKS.length;

  const locate = () => {
    if (!('geolocation' in navigator)) return setGeo('denied');
    navigator.geolocation.getCurrentPosition(
      () => setGeo('ok'),
      () => setGeo('denied'),
      { timeout: 8000 },
    );
  };

  return (
    <>
      <BackBar title="뒷정리 작전" />
      <div className="mb-5 flex gap-1.5" aria-label={`3단계 중 ${step}단계`}>
        {[1, 2, 3].map((i) => (
          <i key={i} className={`h-[5px] flex-1 rounded-full ${i <= step ? 'bg-green' : 'bg-line-strong'}`} />
        ))}
      </div>

      {step === 1 ? (
        <>
          <div className="flex items-center gap-3">
            <Ddari mood="sweep" size={52} />
            <div>
              <h2 className="m-0 text-xl leading-snug font-black">마무리만 함께 해 주세요</h2>
              <p className="m-0 mt-1 text-xs text-sub">{v.facility.facilityName} · 다음 이웃도 기분 좋게 쓰도록</p>
            </div>
          </div>

          <label className="mt-5 flex h-40 w-full cursor-pointer flex-col items-center justify-center gap-1.5 overflow-hidden rounded-[18px] border-2 border-dashed border-line-strong bg-paper text-[13px] text-sub">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt="정리된 공간 사진" className="h-full w-full object-cover" />
            ) : (
              <>
                <Icon name="camera" size={28} />
                <b className="text-ink">정리된 공간 사진 1장</b>
                멤버 중 한 명만 올리면 돼요
              </>
            )}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setPhoto(URL.createObjectURL(file));
              }}
            />
          </label>

          <div className="mt-3 flex flex-col gap-2">
            {CHECKS.map((c) => (
              <label key={c} className="flex min-h-12 items-center gap-2.5 rounded-[14px] border border-line bg-paper px-3 text-sm">
                <input
                  type="checkbox"
                  className="h-5 w-5 accent-[#2E6B52]"
                  checked={checks.includes(c)}
                  onChange={() => setChecks(checks.includes(c) ? checks.filter((x) => x !== c) : [...checks, c])}
                />
                {c}
              </label>
            ))}
            <button type="button" onClick={locate} className="flex min-h-12 items-center gap-2.5 rounded-[14px] border border-line bg-paper px-3 text-left text-sm">
              <Icon name="pin" size={18} className={geo === 'ok' ? 'text-green' : 'text-sub'} />
              <span className="flex-1">{geo === 'ok' ? '시설 위치에서 퇴실을 확인했어요' : '시설 위치에서 퇴실 확인'}</span>
              {geo === 'ok' ? <Icon name="check" size={18} className="text-green" /> : null}
            </button>
            {geo === 'denied' ? <Note>위치를 확인하지 못했어요. 사진으로 대신할 수 있어요.</Note> : null}
          </div>
          <div className="mt-5">
            <Button variant="green" disabled={!canNext} onClick={() => setStep(2)}>
              다음 · 이웃에게 한마디
            </Button>
          </div>
        </>
      ) : null}

      {step === 2 ? (
        <>
          <h2 className="m-0 text-xl leading-snug font-black">오늘 함께한 이웃,
            <br />
            어떤 점이 좋았나요?</h2>
          <p className="m-0 mt-1 mb-4 text-xs text-sub">좋은 점만 고를 수 있어요. 고르지 않아도 괜찮아요.</p>
          <div className="flex flex-col gap-3">
            {others.map((p) => (
              <div key={p.id} className="note-card flex flex-col gap-2.5 p-3.5">
                <div className="flex items-center gap-2">
                  <Avatar name={p.nickname} verified={isVerified(p)} size={32} ring={false} />
                  <b className="flex-1 text-sm">{p.nickname}</b>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {PRAISES.map((label) => {
                    const on = praise[p.id]?.includes(label) ?? false;
                    return (
                      <Chip
                        key={label}
                        soft
                        on={on}
                        onClick={() =>
                          setPraise((s) => ({ ...s, [p.id]: on ? (s[p.id] ?? []).filter((x) => x !== label) : [...(s[p.id] ?? []), label] }))
                        }
                      >
                        {label}
                      </Chip>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <Note icon="shield">아쉬운 점은 공개되지 않아요. 따로 조용히 알려 주시면 운영팀이 살펴봐요.</Note>
            <Button
              variant="green"
              onClick={() => {
                checkout(v.id, praise);
                setStep(3);
              }}
            >
              뒷정리 작전 완료
            </Button>
          </div>
        </>
      ) : null}

      {step === 3 ? (
        <div className="flex flex-col items-center gap-3 pt-8 text-center">
          <Ddari mood="cheer" size={80} />
          <h2 className="m-0 text-2xl font-black">작전 완료!</h2>
          <p className="m-0 text-sm leading-relaxed text-sub">
            약속을 지킨 기록이 쌓였어요.
            <br />
            믿음 도장 <b className="text-ink">{me.manner}점</b>
          </p>
          <div className="mt-4 flex w-full flex-col gap-2">
            <LinkButton href="/me" variant="dark">
              내 기록 보기
            </LinkButton>
            <Button variant="ghost" onClick={() => router.push('/')}>
              홈으로
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}
