-- Supabase Row-Level Security policies.
-- Apply in the Supabase SQL Editor after `prisma db push` creates the tables.
-- Prisma uses the service role key (server-only) which bypasses RLS, so these
-- policies govern the anon key used by the public read path.
--
-- IDEMPOTENT: every statement uses IF NOT EXISTS / DO blocks so re-running
-- after a partial failure is safe.
--
-- NOTE: The Prisma `Profile` model has no `@@map("profile")` directive, so
-- Prisma created the actual table as public."Profile" (capitalised, quoted).
-- Postgres stores unquoted identifiers folded to lowercase, so `public.profile`
-- does not match. This script references the actual table name with quotes.
-- All other models have `@@map(...)` and resolve to lowercase as expected.

-- Helper: enable RLS on every content table. Wrapped in DO blocks so re-running
-- after a partial failure doesn't error.
do $$
declare
  t text;
  tables text[] := array[
    'public."Profile"',
    'public.experiences',
    'public.education',
    'public.certifications',
    'public.skill_groups',
    'public.skills',
    'public.projects',
    'public.blog_posts',
    'public.blog_tags',
    'public.messages',
    'public.activity_log'
  ];
begin
  foreach t in array tables loop
    execute format('alter table %s enable row level security;', t);
  end loop;
end $$;

-- ----------------------------------------------------------------------------
-- Public reads (drop + create so re-running is safe)
-- ----------------------------------------------------------------------------

drop policy if exists "public read profile"        on public."Profile";
create policy "public read profile"        on public."Profile"
  for select using (true);

drop policy if exists "public read experiences"     on public.experiences;
create policy "public read experiences"     on public.experiences
  for select using (true);

drop policy if exists "public read education"        on public.education;
create policy "public read education"        on public.education
  for select using (true);

drop policy if exists "public read certifications"   on public.certifications;
create policy "public read certifications"   on public.certifications
  for select using (true);

drop policy if exists "public read skill_groups"     on public.skill_groups;
create policy "public read skill_groups"     on public.skill_groups
  for select using (true);

drop policy if exists "public read skills"           on public.skills;
create policy "public read skills"           on public.skills
  for select using (true);

drop policy if exists "public read published projects" on public.projects;
create policy "public read published projects" on public.projects
  for select using (status = 'published');

drop policy if exists "public read published blog_posts" on public.blog_posts;
create policy "public read published blog_posts" on public.blog_posts
  for select using (status = 'published');

drop policy if exists "public read blog_tags"        on public.blog_tags;
create policy "public read blog_tags"        on public.blog_tags
  for select using (true);

-- activity_log: never public.
-- messages: anon may INSERT only; never SELECT.

-- ----------------------------------------------------------------------------
-- Admin writes (any authenticated user; middleware additionally enforces
-- the ADMIN_EMAIL allow-list). auth.uid() is not null = logged in.
-- ----------------------------------------------------------------------------

drop policy if exists "admin manage profile"        on public."Profile";
create policy "admin manage profile"        on public."Profile"
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

drop policy if exists "admin manage experiences"    on public.experiences;
create policy "admin manage experiences"    on public.experiences
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

drop policy if exists "admin manage education"      on public.education;
create policy "admin manage education"      on public.education
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

drop policy if exists "admin manage certifications" on public.certifications;
create policy "admin manage certifications" on public.certifications
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

drop policy if exists "admin manage skill_groups"   on public.skill_groups;
create policy "admin manage skill_groups"   on public.skill_groups
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

drop policy if exists "admin manage skills"         on public.skills;
create policy "admin manage skills"         on public.skills
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

drop policy if exists "admin manage projects"       on public.projects;
create policy "admin manage projects"       on public.projects
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

drop policy if exists "admin manage blog_posts"     on public.blog_posts;
create policy "admin manage blog_posts"     on public.blog_posts
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

drop policy if exists "admin manage blog_tags"      on public.blog_tags;
create policy "admin manage blog_tags"      on public.blog_tags
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

-- admins need to read messages, but the public may not.
drop policy if exists "admin read messages"   on public.messages;
create policy "admin read messages"   on public.messages
  for select using (auth.uid() is not null);
drop policy if exists "admin update messages" on public.messages;
create policy "admin update messages" on public.messages
  for update using (auth.uid() is not null) with check (auth.uid() is not null);
drop policy if exists "admin delete messages" on public.messages;
create policy "admin delete messages" on public.messages
  for delete using (auth.uid() is not null);

-- ----------------------------------------------------------------------------
-- Public submission of contact-form messages (insert-only)
-- ----------------------------------------------------------------------------

drop policy if exists "anon insert messages" on public.messages;
create policy "anon insert messages" on public.messages
  for insert to anon, authenticated with check (true);

-- storage buckets (object-level policies mirror the table approach):
-- project-covers, project-gallery, blog-covers, avatar — public read,
-- authenticated write. Apply via the Storage UI or:
-- create storage policy "public read covers" on storage.objects
--   for select using (bucket_id in ('project-covers','project-gallery','blog-covers','avatar'));
-- create storage policy "auth write covers" on storage.objects
--   for insert to authenticated with check (bucket_id in ('project-covers','project-gallery','blog-covers','avatar'));
