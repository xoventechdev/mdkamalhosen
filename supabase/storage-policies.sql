-- Supabase Storage buckets + policies.
-- Apply in the Supabase SQL Editor, or via `npx tsx scripts/apply-storage-policies.mts`.
--
-- The portfolio uses 4 public-read, authenticated-write buckets. Names match
-- the ALLOWED_BUCKETS set in src/app/api/admin/upload/route.ts:
--   avatars, projects, blog, cvs
--
-- Public read is required so images render on the public site via
-- getPublicUrl(). Write goes through the service-role client (which bypasses
-- RLS) but we still add an authenticated role policy so future client-side
-- uploads work without code changes.
--
-- IDEMPOTENT: every bucket insert and policy create is wrapped in a check so
-- re-running after a partial failure is safe.

-- ============================================================================
-- BUCKETS
-- ============================================================================
-- storage.create_bucket is not exposed in the public API in older Supabase
-- versions; the table-insert pattern works on every release.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars',  'avatars',  true, 2097152, array['image/jpeg','image/png','image/webp','image/avif']),
  ('projects', 'projects', true, 2097152, array['image/jpeg','image/png','image/webp','image/avif']),
  ('blog',     'blog',     true, 2097152, array['image/jpeg','image/png','image/webp','image/avif']),
  ('cvs',      'cvs',      true, 5242880, array['application/pdf'])
on conflict (id) do update set
  public            = excluded.public,
  file_size_limit   = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ============================================================================
-- POLICIES — public read for every bucket
-- ============================================================================
do $$
declare
  b text;
  bucket_names text[] := array['avatars', 'projects', 'blog', 'cvs'];
begin
  foreach b in array bucket_names loop
    -- Drop in case it exists with the wrong definition (idempotent recreate).
    execute format('drop policy if exists "public read %I" on storage.objects', b);

    execute format(
      'create policy "public read %I" on storage.objects '
      'for select to anon, authenticated '
      'using (bucket_id = %L)',
      b, b
    );
  end loop;
end
$$;

-- ============================================================================
-- POLICIES — authenticated write (insert/update/delete) for every bucket
-- ============================================================================
-- Service-role writes bypass RLS, but we add this so future client-side
-- uploads (e.g. drag-drop in admin) work without server roundtrips.
do $$
declare
  b text;
  bucket_names text[] := array['avatars', 'projects', 'blog', 'cvs'];
begin
  foreach b in array bucket_names loop
    execute format('drop policy if exists "authenticated write %I" on storage.objects', b);
    execute format(
      'create policy "authenticated write %I" on storage.objects '
      'for all to authenticated '
      'using (bucket_id = %L) '
      'with check (bucket_id = %L)',
      b, b, b
    );
  end loop;
end
$$;

-- ============================================================================
-- VERIFY
-- ============================================================================
-- Run after applying to confirm the 4 buckets + 8 policies are in place.
-- Note: `storage.policies` is a Supabase UI convenience view that isn't
-- always exposed over the SQL editor; `pg_policies` works on every version.
select
  b.id,
  b.public,
  b.file_size_limit,
  (select count(*)
     from pg_policies p
    where p.schemaname = 'storage'
      and p.tablename  = 'objects'
      and p.qual ~* ('bucket_id\s*=\s*''\s*' || b.id || '''\s*'::text)
  ) as public_read_policies,
  (select count(*)
     from pg_policies p
    where p.schemaname = 'storage'
      and p.tablename  = 'objects'
      and p.qual ~* ('bucket_id\s*=\s*''\s*' || b.id || '''\s*'::text)
      and p.cmd = 'ALL'
  ) as write_policies
from storage.buckets b
where b.id in ('avatars','projects','blog','cvs')
order by b.id;