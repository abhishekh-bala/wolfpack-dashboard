-- Add login_name column to guide_targets table for CSV login name mapping
ALTER TABLE public.guide_targets 
ADD COLUMN login_name text;

-- Add a comment to clarify the purpose of this column
COMMENT ON COLUMN public.guide_targets.login_name IS 'Login name used for CSV file mapping - not displayed in dashboard';