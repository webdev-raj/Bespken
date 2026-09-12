alter table public.meetings
  add column if not exists original_extracted_client text,
  add column if not exists original_extracted_scope text,
  add column if not exists original_extracted_price text,
  add column if not exists original_extracted_timeline text,
  add column if not exists original_extracted_notes text,
  add column if not exists edit_log jsonb not null default '[]'::jsonb;

update public.meetings
set
  original_extracted_client = coalesce(original_extracted_client, extracted_client),
  original_extracted_scope = coalesce(original_extracted_scope, extracted_scope),
  original_extracted_price = coalesce(original_extracted_price, extracted_price),
  original_extracted_timeline = coalesce(original_extracted_timeline, extracted_timeline),
  original_extracted_notes = coalesce(original_extracted_notes, extracted_notes)
where status = 'extracted';

