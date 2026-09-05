-- Meetings table schema and RLS policies
create table if not exists public.meetings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade not null,
  bot_id text not null,
  meeting_title text,
  status text not null default 'joining', -- 'joining' | 'completed' | 'extracted' | 'failed'
  transcript_text text,
  extracted_client text,
  extracted_scope text,
  extracted_price text,
  extracted_timeline text,
  extracted_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.meetings enable row level security;

drop policy if exists "Users can select own meetings" on public.meetings;
create policy "Users can select own meetings"
  on public.meetings
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own meetings" on public.meetings;
create policy "Users can insert own meetings"
  on public.meetings
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own meetings" on public.meetings;
create policy "Users can update own meetings"
  on public.meetings
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
