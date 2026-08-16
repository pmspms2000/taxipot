-- 반복 2: 정산(1/N) 테이블
-- Supabase 대시보드 > SQL Editor 에 붙여넣어 실행

create table public.settlements (
  id uuid primary key default gen_random_uuid(),
  pot_id uuid not null references public.pots (id) on delete cascade,
  total_fare int not null check (total_fare between 1000 and 200000),
  member_count int not null check (member_count between 1 and 4),
  per_person int not null,
  toss_id text, -- 결제자의 토스아이디 (toss.me 링크용, 선택)
  creator_nick text not null,
  created_at timestamptz not null default now()
);

alter table public.settlements enable row level security;
create policy "anon can read settlements" on public.settlements for select using (true);
create policy "anon can create settlements" on public.settlements for insert with check (true);
