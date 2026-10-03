-- Publicação do Report de Eventos em um único link estável.
-- Leitura pública apenas do arquivo HTML do report; escrita restrita a usuários autenticados.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-reports',
  'event-reports',
  true,
  10485760,
  ARRAY['text/html']::text[]
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Authenticated users can publish event reports" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update event reports" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete event reports" ON storage.objects;

CREATE POLICY "Authenticated users can publish event reports"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'event-reports');

CREATE POLICY "Authenticated users can update event reports"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'event-reports')
WITH CHECK (bucket_id = 'event-reports');

CREATE POLICY "Authenticated users can delete event reports"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'event-reports');
