'use server';

import { createClient } from '@/lib/supabase/server';

export interface SynonymResolutionResult {
  data: Record<string, string>; // synonym -> canonical_inci
  error: string | null;
}

/**
 * Resolves ingredient names (synonyms/trade names) to canonical INCI names
 * @param names Array of ingredient names or INCI names to resolve
 * @returns Map of name -> canonical_inci, or error message
 */
export async function resolveIngredientInci(names: string[]): Promise<SynonymResolutionResult> {
  try {
    // Return empty map if no names provided
    if (!names || names.length === 0) {
      return { data: {}, error: null };
    }

    // Normalize names: trim and lowercase for comparison
    const normalizedNames = names
      .filter(name => name && name.trim().length > 0)
      .map(name => name.trim().toLowerCase());

    // Remove duplicates
    const uniqueNames = Array.from(new Set(normalizedNames));

    if (uniqueNames.length === 0) {
      return { data: {}, error: null };
    }

    const supabase = await createClient();

    // Query ingredient_synonyms table where synonym IN (uniqueNames)
    const { data, error } = await supabase
      .from('ingredient_synonyms')
      .select('synonym, canonical_inci')
      .in('synonym', uniqueNames);

    if (error) {
      console.error('[resolveIngredientInci] Database error:', error);
      return { data: {}, error: error.message };
    }

    // Convert array to record (map) keyed by normalized (lowercase) synonym
    const dataMap: Record<string, string> = {};
    if (data) {
      for (const row of data) {
        // Store mapping using normalized (lowercase) synonym as key
        const normalizedSynonym = row.synonym.toLowerCase().trim();
        dataMap[normalizedSynonym] = row.canonical_inci;
      }
    }

    // Map original input names (trimmed) to canonical INCI
    // This ensures we can look up by the original name format (case-insensitive)
    const resultMap: Record<string, string> = {};
    for (const originalName of names) {
      const trimmed = originalName.trim();
      const normalized = trimmed.toLowerCase();
      if (dataMap[normalized]) {
        resultMap[trimmed] = dataMap[normalized];
      }
    }

    return { data: resultMap, error: null };
  } catch (error) {
    console.error('[resolveIngredientInci] Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { data: {}, error: errorMessage };
  }
}
