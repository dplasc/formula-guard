'use server';

import { createClient } from '@/lib/supabase/server';

export type Formula = {
  id: string;
  name: string;
  product_type: 'leaveOn' | 'rinseOff';
  batch_size: number | null;
  formula_data: {
    ingredients: Array<{
      id: string;
      name: string;
      percentage: number;
      maxUsage?: number;
      description?: string;
      ingredientId?: string;
      phase: string;
      pricePerKg?: number;
      isPremium?: boolean;
      isCustom?: boolean;
    }>;
    batchSize: number;
    unitSize?: number;
    procedure: string;
    notes: string;
    processSteps?: Array<{
      id: string;
      order: number;
      title: string;
      description?: string;
      phase?: string;
      tempC?: number | null;
      timeMin?: number | null;
      notes?: string;
    }>;
    total?: number;
    totalBatchCost?: number;
    costPerUnit?: number;
  };
  updated_at: string;
};

export async function getFormulaById(id: string): Promise<{ data: Formula | null; error: string | null }> {
  const supabase = await createClient();
  
  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return {
      data: null,
      error: authError ? `Auth error: ${authError.message}` : 'No user found in session',
    };
  }

  // Query formula by ID for the current user (RLS ensures user can only access their own formulas)
  const { data, error } = await supabase
    .from('formulas')
    .select('id, name, product_type, batch_size, formula_data, updated_at')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error) {
    return {
      data: null,
      error: `Database error: ${error.message}`,
    };
  }

  if (!data) {
    return {
      data: null,
      error: 'Formula not found',
    };
  }

  return {
    data: data as Formula,
    error: null,
  };
}

