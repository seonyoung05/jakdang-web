'use client';

import { useCallback, useState } from 'react';
import { useStore } from '@/lib/store';
import type { SlotView } from '@/lib/types';
import JoinSheet from './JoinSheet';
import Celebration from './Celebration';

/** 참여 → 도장 → (정원 도달 시) 작당 성공 연출까지 한 흐름으로 묶는다. */
export function useJoinFlow() {
  const { join, cancel, me } = useStore();
  const [target, setTarget] = useState<{ v: SlotView; mode: 'join' | 'cancel' } | null>(null);
  const [celebrate, setCelebrate] = useState<SlotView | null>(null);
  const close = useCallback(() => setTarget(null), []);

  const ui = (
    <>
      <JoinSheet
        open={!!target}
        mode={target?.mode ?? 'join'}
        title={target?.v.facility.facilityName ?? ''}
        defaultNickname={me.nickname}
        onClose={close}
        onSubmit={async (nickname, pin) => {
          if (!target) return null;
          if (target.mode === 'join') {
            const r = await join(target.v.id, nickname, pin);
            if (!r.ok) return r.message ?? '참여하지 못했어요';
            setTarget(null);
            if (r.opened) setCelebrate(target.v);
            return null;
          }
          const ok = await cancel(target.v.id, pin);
          if (!ok) return 'PIN이 맞지 않아요';
          setTarget(null);
          return null;
        }}
      />
      <Celebration
        open={!!celebrate}
        title={celebrate ? `${celebrate.facility.facilityName} · ${celebrate.requiredCount}명이 모였어요` : ''}
        chatHref={celebrate ? `/chat/${celebrate.id}` : '/chat'}
        onClose={() => setCelebrate(null)}
      />
    </>
  );

  return {
    openJoin: (v: SlotView) => setTarget({ v, mode: 'join' }),
    openCancel: (v: SlotView) => setTarget({ v, mode: 'cancel' }),
    ui,
  };
}
