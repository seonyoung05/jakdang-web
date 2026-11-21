'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useId, useState, type FormEvent } from 'react';
import { signIn, signUp } from '@/lib/api';
import Ddari from '@/components/Ddari';
import { BackBar, Button, Note } from '@/components/ui';

export default function LoginPage() {
  const router = useRouter();
  const next = useSearchParams().get('next') || '/';
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const ids = { email: useId(), pw: useId(), nick: useId() };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    setInfo(null);
    if (mode === 'up' && !nickname.trim()) return setErr('닉네임을 적어 주세요');
    setBusy(true);
    try {
      if (mode === 'in') {
        await signIn(email.trim(), password);
        router.replace(next);
      } else {
        const r = await signUp(email.trim(), password, nickname.trim());
        if (r.needsEmailConfirm) {
          setInfo('가입 메일을 보냈어요. 메일함에서 인증 링크를 누른 뒤 로그인해 주세요.');
          setMode('in');
        } else {
          router.replace(next);
        }
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <BackBar title={mode === 'in' ? '로그인' : '회원가입'} />
      <div className="mt-2 mb-6 flex items-center gap-3">
        <Ddari mood="look" size={52} />
        <div>
          <h1 className="m-0 text-xl leading-snug font-black">{mode === 'in' ? '다시 오셨네요!' : '작당에 합류해요'}</h1>
          <p className="m-0 mt-1 text-[13px] text-sub">이메일로 {mode === 'in' ? '로그인' : '가입'}해요. 연락처는 받지 않아요.</p>
        </div>
      </div>

      <div role="tablist" aria-label="로그인 또는 회원가입" className="mb-5 grid grid-cols-2 gap-1 rounded-[14px] bg-mute p-1">
        {(['in', 'up'] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => {
              setMode(m);
              setErr(null);
            }}
            className={`min-h-10 rounded-[11px] text-sm font-bold ${mode === m ? 'bg-paper text-ink' : 'text-sub'}`}
          >
            {m === 'in' ? '로그인' : '회원가입'}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="flex flex-col gap-3">
        <label htmlFor={ids.email} className="flex flex-col gap-1.5">
          <span className="text-[13px] font-bold">이메일</span>
          <input id={ids.email} type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="min-h-12 rounded-[14px] border border-line-strong bg-paper px-3.5 text-[15px]" />
        </label>
        <label htmlFor={ids.pw} className="flex flex-col gap-1.5">
          <span className="text-[13px] font-bold">비밀번호</span>
          <input
            id={ids.pw}
            type="password"
            required
            minLength={6}
            autoComplete={mode === 'in' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="min-h-12 rounded-[14px] border border-line-strong bg-paper px-3.5 text-[15px]"
          />
        </label>
        {mode === 'up' ? (
          <label htmlFor={ids.nick} className="flex flex-col gap-1.5">
            <span className="text-[13px] font-bold">닉네임</span>
            <input id={ids.nick} maxLength={12} value={nickname} onChange={(e) => setNickname(e.target.value)} className="min-h-12 rounded-[14px] border border-line-strong bg-paper px-3.5 text-[15px]" />
            <span className="text-xs text-sub">모집 참여자 목록과 Q&A에 보이는 이름이에요.</span>
          </label>
        ) : null}

        {err ? (
          <p role="alert" className="m-0 text-[13px] font-bold text-rose">
            {err}
          </p>
        ) : null}
        {info ? (
          <p role="status" className="m-0 rounded-xl bg-mint p-3 text-[13px] text-mint-ink">
            {info}
          </p>
        ) : null}

        <div className="mt-2">
          <Button type="submit" variant="dark" disabled={busy}>
            {busy ? '잠시만요…' : mode === 'in' ? '로그인' : '가입하기'}
          </Button>
        </div>
        <Note icon="shield">비밀번호는 6자 이상이에요.</Note>
      </form>
    </>
  );
}
