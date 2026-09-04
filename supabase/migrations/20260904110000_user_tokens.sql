-- Google Calendar OAuth tokens (run in the Supabase SQL editor)

create table if not exists public.user_tokens (
  user_id uuid primary key references auth.users (id) on delete cascade,
  google_access_token text,
  google_refresh_token text,
  token_expires_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.user_tokens enable row level security;

drop policy if exists "Users can select own tokens" on public.user_tokens;
create policy "Users can select own tokens"
  on public.user_tokens
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own tokens" on public.user_tokens;
create policy "Users can insert own tokens"
  on public.user_tokens
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own tokens" on public.user_tokens;
create policy "Users can update own tokens"
  on public.user_tokens
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
