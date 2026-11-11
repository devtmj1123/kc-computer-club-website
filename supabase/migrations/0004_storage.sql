-- KC Computer Club — Storage buckets + policies
-- Run after 0003_rls.sql.
--
-- Buckets
--   public-assets : notice / activity / project images, club logo and hero.
--   avatars       : profile pictures, one folder per user id.
--   private       : future exports and sensitive attachments (signed URLs).
--
-- Uploads always go through a server route that checks size, MIME type and
-- admin/owner rights. These policies are the second line of defence for
-- direct Supabase Storage API access.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'public-assets',
    'public-assets',
    true,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  ),
  (
    'avatars',
    'avatars',
    true,
    2097152,
    array['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'private',
    'private',
    false,
    20971520,
    null
  )
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- ─────────────────────────────────────────────────────────────
-- public-assets: everyone reads, admins write
-- ─────────────────────────────────────────────────────────────
drop policy if exists "public_assets_read" on storage.objects;
create policy "public_assets_read" on storage.objects
for select to anon, authenticated
using (bucket_id = 'public-assets');

drop policy if exists "public_assets_admin_write" on storage.objects;
create policy "public_assets_admin_write" on storage.objects
for all to authenticated
using (bucket_id = 'public-assets' and (select public.is_admin()))
with check (bucket_id = 'public-assets' and (select public.is_admin()));

-- ─────────────────────────────────────────────────────────────
-- avatars: everyone reads, each user writes only their own folder
-- Path: avatars/{userId}/{uuid}.webp
-- ─────────────────────────────────────────────────────────────
drop policy if exists "avatars_read" on storage.objects;
create policy "avatars_read" on storage.objects
for select to anon, authenticated
using (bucket_id = 'avatars');

drop policy if exists "avatars_owner_insert" on storage.objects;
create policy "avatars_owner_insert" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "avatars_owner_update" on storage.objects;
create policy "avatars_owner_update" on storage.objects
for update to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "avatars_owner_delete" on storage.objects;
create policy "avatars_owner_delete" on storage.objects
for delete to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

-- ─────────────────────────────────────────────────────────────
-- private: admins only; downloads use short-lived signed URLs
-- ─────────────────────────────────────────────────────────────
drop policy if exists "private_admin_all" on storage.objects;
create policy "private_admin_all" on storage.objects
for all to authenticated
using (bucket_id = 'private' and (select public.is_admin()))
with check (bucket_id = 'private' and (select public.is_admin()));
