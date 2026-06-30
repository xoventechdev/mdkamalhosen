-- One-shot migration: rename public."Profile" to public.profile.
--
-- Run this ONCE in the Supabase SQL editor *after* updating
-- prisma/schema.prisma to include `@@map("profile")` on the Profile model
-- (so future `prisma db push` operations don't roll the table back to
-- "Profile"). Wrapped in a transaction so the rename is atomic.
--
-- Steps:
--   1. Add @@map("profile") to the Profile model in prisma/schema.prisma.
--   2. Run this script in the Supabase SQL Editor. (Or skip if you ran the
--      initial RLS at all — the patched rls.sql already references
--      public."Profile" with quotes and works correctly with the current
--      table name.)
--   3. Run `npm run prisma:push` afterwards. Prisma should report "database
--      is already in sync".

begin;

alter table if exists public."Profile" rename to profile;

-- Re-attach any policies that referenced the old quoted name. Postgres
-- updates policy.table references automatically when the underlying table is
-- renamed, so this should be a no-op in practice — kept as a sanity guard.
do $$
declare
  p record;
begin
  for p in
    select policyname, tablename
    from pg_policies
    where schemaname = 'public' and tablename = 'profile'
  loop
    raise notice 'policy % present on public.profile', p.policyname;
  end loop;
end $$;

commit;