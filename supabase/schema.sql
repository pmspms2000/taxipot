-- 택시팟 반복 1 스키마
-- Supabase 대시보드 > SQL Editor 에 붙여넣어 실행

create table public.pots (
  id uuid primary key default gen_random_uuid(),
  direction text not null check (direction in ('myeong_to_yul', 'yul_to_myeong')),
  pickup_spot text not null,
  dropoff text not null,
  depart_at timestamptz not null,
  capacity int not null default 4 check (capacity between 2 and 4),
  creator_nick text not null,
  contact text, -- 카카오 오픈채팅 링크 등
  created_at timestamptz not null default now()
);

create table public.pot_members (
  id uuid primary key default gen_random_uuid(),
  pot_id uuid not null references public.pots (id) on delete cascade,
  nickname text not null,
  joined_at timestamptz not null default now(),
  unique (pot_id, nickname)
);

-- MVP 단계: 계정 없이 anon 키로 읽기/쓰기 허용 (반복 3에서 인증 도입 시 강화)
alter table public.pots enable row level security;
alter table public.pot_members enable row level security;

create policy "anon can read pots" on public.pots for select using (true);
create policy "anon can create pots" on public.pots for insert with check (true);
create policy "anon can read members" on public.pot_members for select using (true);
create policy "anon can join pots" on public.pot_members for insert with check (true);
