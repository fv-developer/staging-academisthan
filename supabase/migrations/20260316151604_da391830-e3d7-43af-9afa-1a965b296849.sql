
-- Event registrations table
CREATE TABLE public.event_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  registered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  attended BOOLEAN NOT NULL DEFAULT false,
  certificate_id UUID REFERENCES public.certificates(id),
  UNIQUE(event_id, user_id)
);

ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

-- Teachers can register themselves
CREATE POLICY "Users can register for events" ON public.event_registrations
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Teachers can read own registrations
CREATE POLICY "Users can read own registrations" ON public.event_registrations
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Admins can read all registrations
CREATE POLICY "Admins can read all registrations" ON public.event_registrations
  FOR SELECT TO authenticated
  USING (is_admin(auth.uid()));

-- Admins can update registrations (mark attendance)
CREATE POLICY "Admins can update registrations" ON public.event_registrations
  FOR UPDATE TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Make program_id nullable on certificates (so event certs can have null program_id)
ALTER TABLE public.certificates ALTER COLUMN program_id DROP NOT NULL;

-- Add event_id to certificates
ALTER TABLE public.certificates ADD COLUMN event_id UUID REFERENCES public.events(id);
