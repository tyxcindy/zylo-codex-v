alter table public.profiles
add column if not exists planner_notes text not null default ''
check (char_length(planner_notes) <= 4000);
