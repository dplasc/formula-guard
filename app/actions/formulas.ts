'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// Formula input type matching the new schema
export type FormulaInput = {
  id?: string;
  name: string;
  product_type: 'leaveOn' | 'rinseOff';
  batch_size?: number | null;
  formula_data: any; // Full formula state snapshot (ingredients, processSteps, etc.)
};

export async function saveFormula(input: FormulaInput) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    throw new Error('You must be logged in to save formulas.');
  }

  // Validate JSON structure for jsonb column
  let validatedFormulaData = input.formula_data;
  try {
    // Ensure formula_data is a valid JSON-serializable object
    if (typeof input.formula_data === 'string') {
      validatedFormulaData = JSON.parse(input.formula_data);
    } else if (typeof input.formula_data !== 'object' || input.formula_data === null) {
      throw new Error('formula_data must be a valid JSON object');
    }
    // Test serialization
    JSON.stringify(validatedFormulaData);
  } catch (jsonError) {
    const errorMsg = `Invalid JSON structure in formula_data: ${jsonError instanceof Error ? jsonError.message : 'Unknown error'}`;
    throw new Error(`Invalid formula data structure: ${errorMsg}`);
  }

  // Build payload matching new schema
  const payload: {
    id?: string;
    name: string;
    product_type: 'leaveOn' | 'rinseOff';
    batch_size?: number | null;
    formula_data: any;
    user_id: string;
  } = {
    id: input.id, 
    name: input.name,
    product_type: input.product_type,
    batch_size: input.batch_size ?? null,
    formula_data: validatedFormulaData,
    user_id: user.id,
  };

  if (payload.user_id !== user.id) {
    throw new Error('Security check failed: User ID mismatch');
  }

  const { data, error } = await supabase
    .from('formulas')
    .upsert(payload)
    .select('id')
    .single();

  if (error) {
    throw new Error(`Database error: ${error.message}${error.hint ? ` (Hint: ${error.hint})` : ''}${error.code ? ` [Code: ${error.code}]` : ''}`);
  }
  revalidatePath('/dashboard'); 
  return data;
}

export async function listFormulas() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('formulas')
    .select('id, name, status, updated_at')
    .order('updated_at', { ascending: false });

  if (error) return [];
  return data;
}