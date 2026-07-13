
-- Add flyer image URL to events
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS flyer_image_url TEXT;

-- Add pass_code to event_registrations for QR verification
ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS pass_code TEXT UNIQUE DEFAULT encode(gen_random_bytes(8), 'hex');
