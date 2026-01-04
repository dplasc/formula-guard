'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// Formula input type matching the new schema
export type FormulaInput = {
  id?: string;
  name: string;
  data: any; // Full formula state snapshot (ingredients, processSteps, etc.) as JSONB
};

export async function saveFormula(input: FormulaInput) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    throw new Error('You must be logged in to save formulas.');
  }

  // Validate JSON structure for jsonb column
  let validatedFormulaData = input.data;
  try {
    // Ensure data is a valid JSON-serializable object
    if (typeof input.data === 'string') {
      validatedFormulaData = JSON.parse(input.data);
    } else if (typeof input.data !== 'object' || input.data === null) {
      throw new Error('data must be a valid JSON object');
    }
    // Test serialization
    JSON.stringify(validatedFormulaData);
  } catch (jsonError) {
    const errorMsg = `Invalid JSON structure in data: ${jsonError instanceof Error ? jsonError.message : 'Unknown error'}`;
    throw new Error(`Invalid formula data structure: ${errorMsg}`);
  }

  // Build payload matching new schema
  const payload: {
    id?: string;
    name: string;
    data: any;
    user_id: string;
  } = {
    id: input.id, 
    name: input.name,
    data: validatedFormulaData,
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