INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-attachments',
  'event-attachments',
  false,
  15728640,
  ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Authenticated users can view event attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload event attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete event attachments" ON storage.objects;

CREATE POLICY "Authenticated users can view event attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'event-attachments');

CREATE POLICY "Authenticated users can upload event attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'event-attachments');

CREATE POLICY "Authenticated users can delete event attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'event-attachments');
