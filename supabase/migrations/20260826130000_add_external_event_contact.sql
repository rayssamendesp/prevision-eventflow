ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS external_contact_name TEXT,
  ADD COLUMN IF NOT EXISTS external_contact_email TEXT,
  ADD COLUMN IF NOT EXISTS external_contact_phone TEXT;
