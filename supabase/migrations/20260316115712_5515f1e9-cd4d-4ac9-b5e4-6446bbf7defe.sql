
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now(),
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to check if user is any admin type
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('super_admin', 'admin')
  )
$$;

-- RLS: Users can read their own roles
CREATE POLICY "Users can read own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- RLS: Super admins can read all roles
CREATE POLICY "Super admins can read all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

-- RLS: Super admins can insert roles
CREATE POLICY "Super admins can insert roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- RLS: Super admins can delete roles
CREATE POLICY "Super admins can delete roles"
ON public.user_roles FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

-- Blog posts table
CREATE TABLE public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  content text NOT NULL DEFAULT '',
  summary text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'general',
  tags text[] DEFAULT '{}',
  cover_image_url text,
  is_published boolean NOT NULL DEFAULT false,
  is_featured boolean NOT NULL DEFAULT false,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name text,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Public can read published blog posts
CREATE POLICY "Public can read published blogs"
ON public.blog_posts FOR SELECT
TO anon, authenticated
USING (is_published = true);

-- Admins can read all blog posts
CREATE POLICY "Admins can read all blogs"
ON public.blog_posts FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Admins can insert blog posts
CREATE POLICY "Admins can insert blogs"
ON public.blog_posts FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

-- Admins can update blog posts
CREATE POLICY "Admins can update blogs"
ON public.blog_posts FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Admins can delete blog posts
CREATE POLICY "Admins can delete blogs"
ON public.blog_posts FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- Allow admins to insert/update/delete news_updates
CREATE POLICY "Admins can insert news"
ON public.news_updates FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update news"
ON public.news_updates FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete news"
ON public.news_updates FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- Updated_at trigger for blog_posts
CREATE TRIGGER set_blog_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Auto-assign super_admin role to specific email on signup
CREATE OR REPLACE FUNCTION public.auto_assign_super_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email = 'balkishan@futurevarsity.edu.in' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'super_admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_assign_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_super_admin();
