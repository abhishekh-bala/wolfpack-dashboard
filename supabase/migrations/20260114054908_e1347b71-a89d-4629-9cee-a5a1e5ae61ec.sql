-- Create app_role enum for role-based access
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table for role management
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to check if user is authenticated
CREATE OR REPLACE FUNCTION public.is_authenticated()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.role() = 'authenticated'
$$;

-- RLS policies for user_roles table
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Drop all existing public access policies on guide_targets
DROP POLICY IF EXISTS "Allow public delete on guide_targets" ON public.guide_targets;
DROP POLICY IF EXISTS "Allow public insert on guide_targets" ON public.guide_targets;
DROP POLICY IF EXISTS "Allow public read on guide_targets" ON public.guide_targets;
DROP POLICY IF EXISTS "Allow public update on guide_targets" ON public.guide_targets;

-- Create authenticated-only policies for guide_targets
CREATE POLICY "Authenticated users can read guide_targets"
ON public.guide_targets FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert guide_targets"
ON public.guide_targets FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update guide_targets"
ON public.guide_targets FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete guide_targets"
ON public.guide_targets FOR DELETE
TO authenticated
USING (true);

-- Drop all existing public access policies on formula_overrides
DROP POLICY IF EXISTS "Allow public delete on formula_overrides" ON public.formula_overrides;
DROP POLICY IF EXISTS "Allow public insert on formula_overrides" ON public.formula_overrides;
DROP POLICY IF EXISTS "Allow public read on formula_overrides" ON public.formula_overrides;
DROP POLICY IF EXISTS "Allow public update on formula_overrides" ON public.formula_overrides;

-- Create authenticated-only policies for formula_overrides
CREATE POLICY "Authenticated users can read formula_overrides"
ON public.formula_overrides FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert formula_overrides"
ON public.formula_overrides FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update formula_overrides"
ON public.formula_overrides FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete formula_overrides"
ON public.formula_overrides FOR DELETE
TO authenticated
USING (true);

-- Drop all existing public access policies on published_sales_data
DROP POLICY IF EXISTS "Allow public delete on published_sales_data" ON public.published_sales_data;
DROP POLICY IF EXISTS "Allow public insert on published_sales_data" ON public.published_sales_data;
DROP POLICY IF EXISTS "Allow public read on published_sales_data" ON public.published_sales_data;
DROP POLICY IF EXISTS "Allow public update on published_sales_data" ON public.published_sales_data;

-- Create authenticated-only policies for published_sales_data
CREATE POLICY "Authenticated users can read published_sales_data"
ON public.published_sales_data FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert published_sales_data"
ON public.published_sales_data FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update published_sales_data"
ON public.published_sales_data FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete published_sales_data"
ON public.published_sales_data FOR DELETE
TO authenticated
USING (true);