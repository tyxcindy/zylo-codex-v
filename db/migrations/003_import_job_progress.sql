alter table public.source_artifacts
  add column if not exists destination_hint text not null default '' check (char_length(destination_hint) <= 80);

alter table public.import_jobs
  add column if not exists stage text not null default 'queued'
    check (stage in ('queued', 'extracting', 'persisting', 'complete', 'failed')),
  add column if not exists stage_detail text not null default '',
  add column if not exists analysis_preview jsonb not null default '{}'::jsonb,
  add column if not exists provider_runs jsonb not null default '[]'::jsonb,
  add column if not exists started_at timestamptz,
  add column if not exists finished_at timestamptz;
