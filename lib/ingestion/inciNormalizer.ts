/**
 * INCI name normalization utilities
 * Normalizes INCI names to canonical form using synonym resolution
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { resolveIngredientInci } from '@/app/builder/actions-ingredient-synonyms';

/**
 * Normalizes an INCI name to its canonical form
 * @param inciName Raw INCI name from CSV
 * @param synonymCache Optional cache of already-resolved synonyms
 * @returns Canonical INCI name (or original if no synonym found)
 */
export async function normalizeInciName(
  inciName: string,
  synonymCache?: Map<string, string>
): Promise<string> {
  if (!inciName || inciName.trim().length === 0) {
    return '';
  }

  const trimmed = inciName.trim();

  // Check cache first
  if (synonymCache) {
    const cached = synonymCache.get(trimmed.toLowerCase());
    if (cached) {
      return cached;
    }
  }

  // Resolve using synonym database
  const result = await resolveIngredientInci([trimmed]);
  if (result.error) {
    console.warn(`[normalizeInciName] Error resolving ${trimmed}: ${result.error}`);
    return trimmed; // Return original on error
  }

  const canonical = result.data[trimmed] || trimmed;

  // Update cache
  if (synonymCache) {
    synonymCache.set(trimmed.toLowerCase(), canonical);
  }

  return canonical;
}

/**
 * Normalizes multiple INCI names in batch
 * @param inciNames Array of INCI names to normalize
 * @param synonymCache Optional cache of already-resolved synonyms
 * @returns Map of original -> canonical INCI names
 */
export async function normalizeInciNamesBatch(
  inciNames: string[],
  synonymCache?: Map<string, string>
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  const uniqueNames = Array.from(new Set(inciNames.filter(name => name && name.trim().length > 0)));

  // Check cache first
  const uncached: string[] = [];
  for (const name of uniqueNames) {
    const trimmed = name.trim();
    const lower = trimmed.toLowerCase();
    if (synonymCache?.has(lower)) {
      result.set(trimmed, synonymCache.get(lower)!);
    } else {
      uncached.push(trimmed);
    }
  }

  // Resolve uncached names
  if (uncached.length > 0) {
    const resolveResult = await resolveIngredientInci(uncached);
    if (resolveResult.error) {
      console.warn(`[normalizeInciNamesBatch] Error resolving batch: ${resolveResult.error}`);
    }

    for (const name of uncached) {
      const canonical = resolveResult.data[name] || name;
      result.set(name, canonical);
      if (synonymCache) {
        synonymCache.set(name.toLowerCase(), canonical);
      }
    }
  }

  return result;
}

/**
 * Standalone version of normalizeInciNamesBatch that accepts a Supabase client
 * This version is used in CLI scripts to avoid using Next.js server actions (which require cookies())
 * @param inciNames Array of INCI names to normalize
 * @param supabaseClient Supabase client instance (admin client for CLI)
 * @param synonymCache Optional cache of already-resolved synonyms
 * @returns Map of original -> canonical INCI names
 */
export async function normalizeInciNamesBatchWithClient(
  inciNames: string[],
  supabaseClient: SupabaseClient,
  synonymCache?: Map<string, string>
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  const uniqueNames = Array.from(new Set(inciNames.filter(name => name && name.trim().length > 0)));

  // Check cache first
  const uncached: string[] = [];
  for (const name of uniqueNames) {
    const trimmed = name.trim();
    const lower = trimmed.toLowerCase();
    if (synonymCache?.has(lower)) {
      result.set(trimmed, synonymCache.get(lower)!);
    } else {
      uncached.push(trimmed);
    }
  }

  // Resolve uncached names using direct Supabase query
  if (uncached.length > 0) {
    const normalizedUncached = uncached.map(n => n.toLowerCase());
    
    const { data, error } = await supabaseClient
      .from('ingredient_synonyms')
      .select('synonym, canonical_inci')
      .in('synonym', normalizedUncached);

    if (error) {
      console.warn(`[normalizeInciNamesBatchWithClient] Error resolving batch: ${error.message}`);
    }

    // Build result map
    const dataMap: Record<string, string> = {};
    if (data) {
      for (const row of data) {
        const normalizedSynonym = row.synonym.toLowerCase().trim();
        dataMap[normalizedSynonym] = row.canonical_inci;
      }
    }

    for (const name of uncached) {
      const normalized = name.toLowerCase();
      const canonical = dataMap[normalized] || name;
      result.set(name, canonical);
      if (synonymCache) {
        synonymCache.set(normalized, canonical);
      }
    }
  }

  return result;
}

