import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface GuideTarget {
  id?: string;
  name: string;
  targetOrders: number;
  targetRevenue: number;
  targetConversion: number;
  chatCount: number;
}

export interface FormulaOverride {
  id: string;
  name: string;
  formula: string;
  enabled: boolean;
}

export function useGuideTargets() {
  const [targets, setTargets] = useState<GuideTarget[]>([]);
  const [formulas, setFormulas] = useState<FormulaOverride[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Fetch targets from database
  const fetchTargets = async () => {
    const { data, error } = await supabase
      .from('guide_targets')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching targets:', error);
      return;
    }
    
    const mapped: GuideTarget[] = (data || []).map((row) => ({
      id: row.id,
      name: row.name,
      targetOrders: row.target_orders,
      targetRevenue: Number(row.target_revenue),
      targetConversion: Number(row.target_conversion),
      chatCount: row.chat_count,
    }));
    
    setTargets(mapped);
  };

  // Fetch formulas from database
  const fetchFormulas = async () => {
    const { data, error } = await supabase
      .from('formula_overrides')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching formulas:', error);
      return;
    }
    
    const mapped: FormulaOverride[] = (data || []).map((row) => ({
      id: row.id,
      name: row.name,
      formula: row.formula,
      enabled: row.enabled,
    }));
    
    setFormulas(mapped);
  };

  // Save targets to database
  const saveTargets = async (newTargets: GuideTarget[]) => {
    try {
      // Get existing targets to determine which to delete
      const { data: existing } = await supabase.from('guide_targets').select('name');
      const existingNames = new Set((existing || []).map(r => r.name.toLowerCase()));
      const newNames = new Set(newTargets.map(t => t.name.toLowerCase()));
      
      // Delete removed targets
      const toDelete = [...existingNames].filter(n => !newNames.has(n));
      if (toDelete.length > 0) {
        for (const name of toDelete) {
          await supabase.from('guide_targets').delete().ilike('name', name);
        }
      }

      // Upsert all targets
      for (const target of newTargets) {
        const { error } = await supabase
          .from('guide_targets')
          .upsert({
            name: target.name,
            target_orders: target.targetOrders,
            target_revenue: target.targetRevenue,
            target_conversion: target.targetConversion,
            chat_count: target.chatCount,
          }, { onConflict: 'name' });
        
        if (error) throw error;
      }

      setTargets(newTargets);
      toast({
        title: 'Saved',
        description: 'All targets have been saved to the database.',
      });
    } catch (error) {
      console.error('Error saving targets:', error);
      toast({
        title: 'Error',
        description: 'Failed to save targets. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Save formulas to database
  const saveFormulas = async (newFormulas: FormulaOverride[]) => {
    try {
      for (const formula of newFormulas) {
        const { error } = await supabase
          .from('formula_overrides')
          .upsert({
            id: formula.id,
            name: formula.name,
            formula: formula.formula,
            enabled: formula.enabled,
          }, { onConflict: 'id' });
        
        if (error) throw error;
      }

      setFormulas(newFormulas);
      toast({
        title: 'Formulas Saved',
        description: 'Formula overrides have been saved.',
      });
    } catch (error) {
      console.error('Error saving formulas:', error);
      toast({
        title: 'Error',
        description: 'Failed to save formulas. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Reset formulas to defaults
  const resetFormulas = async () => {
    const defaults: FormulaOverride[] = [
      { id: 'revenue_deficit', name: 'Revenue Deficit', formula: 'targetRevenue - newRevenue', enabled: true },
      { id: 'order_deficit', name: 'Order Deficit', formula: 'targetOrders - orders', enabled: true },
      { id: 'current_conversion', name: 'Current Conversion', formula: '(orders / chatCount) * 100', enabled: true },
      { id: 'orders_to_target', name: 'Orders to Reach Target Conversion', formula: 'Math.ceil((targetConversion / 100) * chatCount - orders)', enabled: true },
    ];
    
    await saveFormulas(defaults);
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchTargets(), fetchFormulas()]);
      setIsLoading(false);
    };
    loadData();
  }, []);

  return {
    targets,
    formulas,
    isLoading,
    saveTargets,
    saveFormulas,
    resetFormulas,
    refetchTargets: fetchTargets,
    refetchFormulas: fetchFormulas,
  };
}
