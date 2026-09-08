-- Correlate joins with webhooks even if Meeting BaaS bot_id differs.
-- calendar_event_id is used to make "Join with Bespken" idempotent.

alter table public.meetings
  add column if not exists calendar_event_id text;

create unique index if not exists meetings_bot_id_key
  on public.meetings (bot_id);

create unique index if not exists meetings_user_calendar_event_joining
  on public.meetings (user_id, calendar_event_id)
  where calendar_event_id is not null and status = 'joining';

-- Stuck rows cannot be matched to a completed webhook after the fact.
-- Mark stale in-progress joins as failed; leave very recent ones (possible live calls).
update public.meetings
set
  status = 'failed',
  updated_at = now()
where status = 'joining'
  and created_at < now() - interval '2 hours';
