-- Create guide_targets table
CREATE TABLE public.guide_targets (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    target_orders INTEGER NOT NULL DEFAULT 0,
    target_revenue DECIMAL(10,2) NOT NULL DEFAULT 0,
    target_conversion DECIMAL(5,2) NOT NULL DEFAULT 0,
    chat_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create formula_overrides table
CREATE TABLE public.formula_overrides (
    id TEXT NOT NULL PRIMARY KEY,
    name TEXT NOT NULL,
    formula TEXT NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.guide_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formula_overrides ENABLE ROW LEVEL SECURITY;

-- Create public read/write policies (no auth required for this simple dashboard)
CREATE POLICY "Allow public read on guide_targets" ON public.guide_targets FOR SELECT USING (true);
CREATE POLICY "Allow public insert on guide_targets" ON public.guide_targets FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on guide_targets" ON public.guide_targets FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on guide_targets" ON public.guide_targets FOR DELETE USING (true);

CREATE POLICY "Allow public read on formula_overrides" ON public.formula_overrides FOR SELECT USING (true);
CREATE POLICY "Allow public insert on formula_overrides" ON public.formula_overrides FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on formula_overrides" ON public.formula_overrides FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on formula_overrides" ON public.formula_overrides FOR DELETE USING (true);

-- Create update trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers
CREATE TRIGGER update_guide_targets_updated_at
    BEFORE UPDATE ON public.guide_targets
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_formula_overrides_updated_at
    BEFORE UPDATE ON public.formula_overrides
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default formulas
INSERT INTO public.formula_overrides (id, name, formula, enabled) VALUES
    ('revenue_deficit', 'Revenue Deficit', 'targetRevenue - newRevenue', true),
    ('order_deficit', 'Order Deficit', 'targetOrders - orders', true),
    ('current_conversion', 'Current Conversion', '(orders / chatCount) * 100', true),
    ('orders_to_target', 'Orders to Reach Target Conversion', 'Math.ceil((targetConversion / 100) * chatCount - orders)', true);