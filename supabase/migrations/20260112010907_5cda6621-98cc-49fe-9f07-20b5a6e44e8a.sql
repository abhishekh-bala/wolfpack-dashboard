-- Add monthly target columns to guide_targets table
ALTER TABLE public.guide_targets
ADD COLUMN IF NOT EXISTS monthly_target_orders integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_target_revenue numeric NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_target_conversion numeric NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_chat_count integer NOT NULL DEFAULT 0;