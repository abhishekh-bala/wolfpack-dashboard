-- Create table to store published sales data
CREATE TABLE public.published_sales_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sales_data JSONB NOT NULL,
  kpi_overrides JSONB DEFAULT '{}',
  published_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.published_sales_data ENABLE ROW LEVEL SECURITY;

-- Public access policies (same as other tables in this project)
CREATE POLICY "Allow public read on published_sales_data"
ON public.published_sales_data
FOR SELECT
USING (true);

CREATE POLICY "Allow public insert on published_sales_data"
ON public.published_sales_data
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public update on published_sales_data"
ON public.published_sales_data
FOR UPDATE
USING (true);

CREATE POLICY "Allow public delete on published_sales_data"
ON public.published_sales_data
FOR DELETE
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_published_sales_data_updated_at
BEFORE UPDATE ON public.published_sales_data
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();