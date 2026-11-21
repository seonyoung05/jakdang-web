-- 작당모임 Supabase 스키마 (해커톤 MVP)
-- 시설(facilities)은 정적 JSON(src/lib/mock.ts → 추후 data/facilities.json)으로 두고 DB에는 넣지 않는다.
-- currentCount는 저장하지 않고 participants 행 수로 계산한다.

create table if not exists slots (
  id text primary key,
  facility_id text not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  purpose text not null default '',
  vibe_tags text[] not null default '{}',
  audience text not null default 'anyone', -- anyone | verified | peers | sameGender
  required_count int not null,
  host_nickname text not null,
  host_pin_hash text not null,
  chat_enabled boolean not null default true,
  status text not null default 'recruiting', -- recruiting | opened | booked | failed
  opened_at timestamptz,
  booked_at timestamptz,
  parent_slot_id text references slots(id),
  created_at timestamptz not null default now()
);

create table if not exists participants (
  id text primary key,
  slot_id text not null references slots(id) on delete cascade,
  nickname text not null,
  pin_hash text not null,
  is_host boolean not null default false,
  joined_at timestamptz not null default now(),
  school text,
  neighborhood text,
  manner int
);
create index if not exists participants_slot_idx on participants(slot_id);

create table if not exists messages (
  id text primary key,
  slot_id text not null references slots(id) on delete cascade,
  nickname text not null, -- 'system' = 시스템 메시지
  text text not null,
  at timestamptz not null default now()
);
create index if not exists messages_slot_idx on messages(slot_id);

-- 실시간 구독
alter publication supabase_realtime add table slots, participants, messages;

-- 해커톤용: 익명 읽기/쓰기 허용. 실서비스 전에는 반드시 인증 기반 정책으로 바꿀 것.
alter table slots enable row level security;
alter table participants enable row level security;
alter table messages enable row level security;
create policy "anon all slots" on slots for all using (true) with check (true);
create policy "anon all participants" on participants for all using (true) with check (true);
create policy "anon all messages" on messages for all using (true) with check (true);
