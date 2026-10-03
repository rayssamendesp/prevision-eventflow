-- Upsert requires SELECT in addition to INSERT/UPDATE on storage.objects.
DROP POLICY IF EXISTS "Authenticated users can read event reports" ON storage.objects;

CREATE POLICY "Authenticated users can read event reports"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'event-reports');
