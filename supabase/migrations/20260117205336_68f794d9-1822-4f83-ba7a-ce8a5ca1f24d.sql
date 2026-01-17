-- Fix overly permissive RLS policies on business tables
-- Keep read access for authenticated users, restrict write to admins only

-- === published_sales_data ===
DROP POLICY IF EXISTS "Authenticated users can insert published_sales_data" ON published_sales_data;
DROP POLICY IF EXISTS "Authenticated users can update published_sales_data" ON published_sales_data;
DROP POLICY IF EXISTS "Authenticated users can delete published_sales_data" ON published_sales_data;

CREATE POLICY "Admins can insert published_sales_data"
ON published_sales_data FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update published_sales_data"
ON published_sales_data FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete published_sales_data"
ON published_sales_data FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- === formula_overrides ===
DROP POLICY IF EXISTS "Authenticated users can insert formula_overrides" ON formula_overrides;
DROP POLICY IF EXISTS "Authenticated users can update formula_overrides" ON formula_overrides;
DROP POLICY IF EXISTS "Authenticated users can delete formula_overrides" ON formula_overrides;

CREATE POLICY "Admins can insert formula_overrides"
ON formula_overrides FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update formula_overrides"
ON formula_overrides FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete formula_overrides"
ON formula_overrides FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- === guide_targets ===
DROP POLICY IF EXISTS "Authenticated users can insert guide_targets" ON guide_targets;
DROP POLICY IF EXISTS "Authenticated users can update guide_targets" ON guide_targets;
DROP POLICY IF EXISTS "Authenticated users can delete guide_targets" ON guide_targets;

CREATE POLICY "Admins can insert guide_targets"
ON guide_targets FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update guide_targets"
ON guide_targets FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete guide_targets"
ON guide_targets FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'));