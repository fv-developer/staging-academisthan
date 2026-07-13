
-- Fix overly permissive INSERT policy
DROP POLICY "Authenticated can register institution" ON public.institutions;

CREATE POLICY "Authenticated can register institution"
ON public.institutions FOR INSERT
TO authenticated
WITH CHECK (representative_user_id = auth.uid());
