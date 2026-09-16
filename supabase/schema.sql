create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 50),
  message text not null check (char_length(message) between 1 and 250),
  image_url text not null,
  image_path text not null,
  created_at timestamptz not null default now()
);

alter table public.submissions enable row level security;

drop policy if exists "Anyone can submit" on public.submissions;
drop policy if exists "Anyone can read submissions" on public.submissions;
drop policy if exists "Anyone can delete submissions" on public.submissions;
create policy "Anyone can submit" on public.submissions for insert to anon, authenticated with check (true);
create policy "Anyone can read submissions" on public.submissions for select to anon, authenticated using (true);
create policy "Anyone can delete submissions" on public.submissions for delete to anon, authenticated using (true);

insert into storage.buckets (id, name, public) values ('photos', 'photos', true)
on conflict (id) do update set public = true;

drop policy if exists "Anyone can upload wall photos" on storage.objects;
drop policy if exists "Anyone can view wall photos" on storage.objects;
drop policy if exists "Anyone can delete wall photos" on storage.objects;
create policy "Anyone can upload wall photos" on storage.objects for insert to anon, authenticated with check (bucket_id = 'photos');
create policy "Anyone can view wall photos" on storage.objects for select to anon, authenticated using (bucket_id = 'photos');
create policy "Anyone can delete wall photos" on storage.objects for delete to anon, authenticated using (bucket_id = 'photos');

alter table public.submissions replica identity full;
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'submissions'
  ) then
    alter publication supabase_realtime add table public.submissions;
  end if;
end $$;
