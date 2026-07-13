
-- Fix: prevent self-issuance of certificates. Only admins (or service role via edge functions) may insert.
DROP POLICY IF EXISTS "Users can insert own certificates" ON public.certificates;

CREATE POLICY "Admins can insert certificates"
ON public.certificates
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update certificates"
ON public.certificates
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete certificates"
ON public.certificates
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- Lock down SECURITY DEFINER helpers that are only meant to run from triggers / internal code.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_assign_super_admin() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_institution_membership_id() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_membership_id() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_institution_membership_id() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_certificate_number() FROM PUBLIC, anon, authenticated;

-- has_role / is_admin must remain executable because RLS policies call them as the invoking role.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
