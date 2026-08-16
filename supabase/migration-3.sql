-- 반복 3: 학교 이메일 인증 — 팟/참여자에 인증 사용자 연결
alter table public.pots add column user_id uuid;
alter table public.pot_members add column user_id uuid;
