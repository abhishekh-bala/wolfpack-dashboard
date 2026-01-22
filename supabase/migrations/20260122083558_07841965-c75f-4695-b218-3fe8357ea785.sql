-- Create user_accounts table to track managed users with their credentials
CREATE TABLE public.user_accounts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    email text NOT NULL UNIQUE,
    display_name text NOT NULL,
    login_name text UNIQUE,
    role app_role NOT NULL DEFAULT 'guide',
    password_hint text,
    is_active boolean NOT NULL DEFAULT true,
    created_by uuid REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_accounts
CREATE POLICY "Admins can manage all user_accounts"
ON public.user_accounts
FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own account"
ON public.user_accounts
FOR SELECT
USING (auth.uid() = user_id);

-- Create function to check if user has any of the specified roles
CREATE OR REPLACE FUNCTION public.has_any_role(_user_id uuid, _roles app_role[])
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
      AND role = ANY(_roles)
  )
$$;

-- Create trigger for updated_at
CREATE TRIGGER update_user_accounts_updated_at
BEFORE UPDATE ON public.user_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();