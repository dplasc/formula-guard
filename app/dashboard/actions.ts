'use server';

import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export type FormulaListItem = {
  id: string;
  name: string;
  product_type?: 'leaveOn' | 'rinseOff';
  batch_size?: number | null;
  updated_at: string;
  data?: {
    ingredients?: Array<{ percentage?: number }>;
  };
};

export async function getFormulas(): Promise<{ data: FormulaListItem[] | null; error: string | null }> {
  try {
    // Guard: Skip execution on admin routes
    const headersList = await headers();
    const pathname = headersList.get('x-pathname') || '';
    
    if (pathname.startsWith('/admin')) {
      return {
        data: null,
        error: null,
      };
    }

    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      const errorMsg = authError ? `Auth error: ${authError.message}` : 'No user found in session';
      return {
        data: null,
        error: errorMsg,
      };
    }

    // Query formulas for the current user (only fields needed for list)
    const { data, error } = await supabase
      .from('formulas')
      .select('id, name, updated_at, data')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      const msg =
        (error as any)?.message ??
        (error as any)?.toString?.() ??
        "Unknown database error";

      const code = (error as any)?.code
        ? ` (${(error as any).code})`
        : "";

      return {
        data: null,
        error: `Database error: ${msg}${code}`,
      };
    }

    return {
      data: data as FormulaListItem[],
      error: null,
    };
  } catch (err: any) {
    return {
      data: null,
      error: `Unexpected error: ${err?.message || 'Unknown error occurred'}`,
    };
  }
}

export async function deleteFormula(formulaId: string): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient();
  
  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return {
      success: false,
      error: authError ? `Auth error: ${authError.message}` : 'No user found in session',
    };
  }

  // Delete formula with RLS check (user_id must match)
  const { error } = await supabase
    .from('formulas')
    .delete()
    .eq('id', formulaId)
    .eq('user_id', user.id);

  if (error) {
    return {
      success: false,
      error: `Database error: ${error.message}`,
    };
  }

  revalidatePath('/dashboard');
  
  return {
    success: true,
    error: null,
  };
}

export async function duplicateFormula(formulaId: string): Promise<{ success: boolean; data: FormulaListItem | null; error: string | null }> {
  const supabase = await createClient();
  
  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return {
      success: false,
      data: null,
      error: authError ? `Auth error: ${authError.message}` : 'No user found in session',
    };
  }

  // Load the original formula with ownership verification
  const { data: originalFormula, error: fetchError } = await supabase
    .from('formulas')
    .select('*')
    .eq('id', formulaId)
    .eq('user_id', user.id)
    .single();

  if (fetchError || !originalFormula) {
    return {
      success: false,
      data: null,
      error: fetchError ? `Database error: ${fetchError.message}` : 'Formula not found or access denied',
    };
  }

  // Generate unique duplicate name with incremental numbers
  // First, get all formula names for this user to check for existing copies
  const { data: allFormulas, error: namesError } = await supabase
    .from('formulas')
    .select('name')
    .eq('user_id', user.id);

  if (namesError) {
    return {
      success: false,
      data: null,
      error: `Database error: ${namesError.message}`,
    };
  }

  const existingNames = (allFormulas || []).map((f) => f.name);
  const originalName = originalFormula.name;

  // Determine base name: if original already ends with "(copy)" or "(copy N)", extract base
  // Example: "test (copy)" -> base "test", "test (copy 2)" -> base "test"
  let baseName = originalName;
  const copySuffixMatch = originalName.match(/^(.+?)\s+\(copy(?:\s+(\d+))?\)$/);
  if (copySuffixMatch) {
    baseName = copySuffixMatch[1];
  }

  // Escape special regex characters in base name
  const escapedBaseName = baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Find all existing copies of this formula
  // Pattern matches: "Base Name (copy)" or "Base Name (copy 2)", "Base Name (copy 3)", etc.
  const copyPattern = new RegExp(`^${escapedBaseName}\\s+\\(copy(?:\\s+(\\d+))?\\)$`);
  
  const copyNumbers: number[] = [];
  existingNames.forEach((name) => {
    const match = name.match(copyPattern);
    if (match) {
      // If no number in match, it's the first copy "(copy)" which is number 1
      const copyNum = match[1] ? parseInt(match[1], 10) : 1;
      copyNumbers.push(copyNum);
    }
  });

  // Determine next copy number
  let newName: string;
  if (copyNumbers.length === 0) {
    // No copies exist yet, use "(copy)"
    newName = `${baseName} (copy)`;
  } else {
    // Find highest number and increment
    const maxNumber = Math.max(...copyNumbers);
    const nextNumber = maxNumber + 1;
    newName = `${baseName} (copy ${nextNumber})`;
  }

  // Create duplicate with new schema fields
  const duplicatePayload = {
    name: newName,
    product_type: originalFormula.product_type,
    batch_size: originalFormula.batch_size,
    formula_data: originalFormula.formula_data, // Copy the entire JSON formula_data field
    user_id: user.id,
  };

  const { data: newFormula, error: insertError } = await supabase
    .from('formulas')
    .insert(duplicatePayload)
    .select('id, name, product_type, batch_size, updated_at, formula_data')
    .single();

  if (insertError) {
    return {
      success: false,
      data: null,
      error: `Database error: ${insertError.message}`,
    };
  }

  revalidatePath('/dashboard');
  
  return {
    success: true,
    data: newFormula as FormulaListItem,
    error: null,
  };
}

