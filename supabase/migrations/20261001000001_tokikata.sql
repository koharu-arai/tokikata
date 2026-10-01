-- トキカタ：Supabase（kgu-app プロジェクト）の SQL Editor に貼り付けて「Run」してください（1回だけ）
-- 1.01・kgu-app のテーブルと名前が重ならないように、tokikata_ を付けています。
-- 1つの問題 = 1行。中身（段階・TODO・予定など）は data 列に JSON でまとめて入れます。

create table if not exists public.tokikata_problems (
  id          text primary key,
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  data        jsonb not null,
  updated_at  timestamptz not null default now(),
  created_at  timestamptz not null default now()
);

create index if not exists tokikata_problems_user_id_idx on public.tokikata_problems (user_id);

-- 行レベルセキュリティ：自分の問題だけ読める・書ける
alter table public.tokikata_problems enable row level security;

drop policy if exists "tokikata: 自分の問題を読む" on public.tokikata_problems;
create policy "tokikata: 自分の問題を読む" on public.tokikata_problems
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "tokikata: 自分の問題を作る" on public.tokikata_problems;
create policy "tokikata: 自分の問題を作る" on public.tokikata_problems
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "tokikata: 自分の問題を更新する" on public.tokikata_problems;
create policy "tokikata: 自分の問題を更新する" on public.tokikata_problems
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "tokikata: 自分の問題を削除する" on public.tokikata_problems;
create policy "tokikata: 自分の問題を削除する" on public.tokikata_problems
  for delete to authenticated using ((select auth.uid()) = user_id);
