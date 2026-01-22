-- Add new roles to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'supervisor';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'lead';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'guide';