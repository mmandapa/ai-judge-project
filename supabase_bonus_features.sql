alter table if exists submissions
  add column if not exists has_attachments boolean not null default false;

alter table if exists evaluations
  add column if not exists attachments_used boolean not null default false;

alter table if exists judges
  add column if not exists prompt_field_config jsonb not null default '{
    "includeQuestionText": true,
    "includeQuestionType": true,
    "includeAnswer": true,
    "includeSubmissionId": true,
    "includeLabelingTaskId": true,
    "includeAttachments": true
  }'::jsonb;

alter table if exists judge_assignments
  add column if not exists prompt_field_config jsonb not null default '{
    "includeQuestionText": true,
    "includeQuestionType": true,
    "includeAnswer": true,
    "includeSubmissionId": true,
    "includeLabelingTaskId": true,
    "includeAttachments": true
  }'::jsonb;

create table if not exists submission_attachments (
  id uuid primary key default gen_random_uuid(),
  submission_id text not null references submissions(id) on delete cascade,
  file_name text not null,
  storage_path text not null,
  mime_type text not null,
  file_size int,
  created_at timestamptz not null default now()
);

create index if not exists idx_submission_attachments_submission_id
  on submission_attachments (submission_id);

alter table if exists submission_attachments enable row level security;

drop policy if exists "anon can read submission_attachments" on submission_attachments;
create policy "anon can read submission_attachments"
  on submission_attachments
  for select
  to anon, authenticated
  using (true);

drop policy if exists "anon can insert submission_attachments" on submission_attachments;
create policy "anon can insert submission_attachments"
  on submission_attachments
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "anon can update submissions attachments flag" on submissions;
create policy "anon can update submissions attachments flag"
  on submissions
  for update
  to anon, authenticated
  using (true)
  with check (true);

insert into storage.buckets (id, name, public)
values ('submission-attachments', 'submission-attachments', false)
on conflict (id) do nothing;

drop policy if exists "anon can read submission attachment objects" on storage.objects;
create policy "anon can read submission attachment objects"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'submission-attachments');

drop policy if exists "anon can insert submission attachment objects" on storage.objects;
create policy "anon can insert submission attachment objects"
  on storage.objects
  for insert
  to anon, authenticated
  with check (bucket_id = 'submission-attachments');
