-- Generated documents (proposal now; invoice and others later via `type`)
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid references public.meetings (id) on delete cascade not null,
  user_id uuid references auth.users (id) on delete cascade not null,
  type text not null default 'proposal',
  title text,
  content_html text,
  created_at timestamptz not null default now()
);

alter table public.documents enable row level security;

drop policy if exists "Users can select own documents" on public.documents;
create policy "Users can select own documents"
  on public.documents
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own documents" on public.documents;
create policy "Users can insert own documents"
  on public.documents
  for insert
  with check (auth.uid() = user_id);
