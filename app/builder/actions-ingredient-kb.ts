'use server';

import { createClient } from '@/lib/supabase/server';

export interface IngredientKbRow {
  inci: string;
  category: string | null;
  default_max_leave_on: number | null;
  default_max_rinse_off: number | null;
  is_fragrance_component: boolean | null;
  ifra_certificate_required: boolean | null;
  allergens: string[] | null;
  notes: string | null;
  source_urls: string | null;
}

export interface IngredientKbMapResult {
  data: Record<string, IngredientKbRow>;
  error: string | null;
}

/**
 * Fetches ingredient knowledge base data from Supabase for a list of INCI names
 * @param inciList Array of INCI names to look up
 * @returns Map of INCI name to IngredientKbRow data, or error message
 */
export async function getIngredientKbMap(inciList: string[]): Promise<IngredientKbMapResult> {
  try {
    // Return empty map if no INCI names provided
    if (!inciList || inciList.length === 0) {
      return { data: {}, error: null };
    }

    // Remove duplicates and filter out empty strings
    const uniqueInciList = Array.from(new Set(inciList.filter(inci => inci && inci.trim().length > 0)));

    if (uniqueInciList.length === 0) {
      return { data: {}, error: null };
    }

    const supabase = await createClient();

    // Query ingredient_kb table where inci IN (uniqueInciList)
    const { data, error } = await supabase
      .from('ingredient_kb')
      .select('inci, category, default_max_leave_on, default_max_rinse_off, is_fragrance_component, ifra_certificate_required, allergens, notes, source_urls')
      .in('inci', uniqueInciList);

    if (error) {
      console.error('[getIngredientKbMap] Database error:', error);
      return { data: {}, error: error.message };
    }

    // Convert array to record (map) keyed by INCI name
    const dataMap: Record<string, IngredientKbRow> = {};
    if (data) {
      for (const row of data) {
        dataMap[row.inci] = {
          inci: row.inci,
          category: row.category,
          default_max_leave_on: row.default_max_leave_on,
          default_max_rinse_off: row.default_max_rinse_off,
          is_fragrance_component: row.is_fragrance_component,
          ifra_certificate_required: row.ifra_certificate_required,
          allergens: row.allergens,
          notes: row.notes,
          source_urls: row.source_urls,
        };
      }
    }

    return { data: dataMap, error: null };
  } catch (error) {
    console.error('[getIngredientKbMap] Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { data: {}, error: errorMessage };
  }
}


