-- Private Supabase Storage bucket for user-owned trip albums. Object paths are
-- scoped as <auth.uid()>/<trip-id>/<uuid>.<extension>.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'trip-media',
  'trip-media',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/heic']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY "trip_media_owner_select"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'trip-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "trip_media_owner_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'trip-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "trip_media_owner_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'trip-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
