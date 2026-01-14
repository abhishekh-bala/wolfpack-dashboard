-- Add report_type column to published_sales_data to store daily and monthly reports separately
ALTER TABLE public.published_sales_data 
ADD COLUMN IF NOT EXISTS report_type text NOT NULL DEFAULT 'daily';

-- Create index for faster lookups by report type
CREATE INDEX IF NOT EXISTS idx_published_sales_data_report_type 
ON public.published_sales_data(report_type);

-- Add constraint to ensure valid report types
ALTER TABLE public.published_sales_data 
ADD CONSTRAINT valid_report_type CHECK (report_type IN ('daily', 'monthly'));