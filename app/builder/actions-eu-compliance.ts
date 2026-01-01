'use server';

import { createClient } from '@/lib/supabase/server';

export type AnnexType = 'II' | 'III' | 'VI';
export type ProductTypeEnum = 'leave_on' | 'rinse_off' | 'both';

export interface EuAnnexEntry {
  id: string;
  inci_canonical: string;
  annex: AnnexType;
  product_type: ProductTypeEnum;
  max_percentage: number | null;
  conditions_text: string | null;
  reference_url: string | null;
  source: string | null;
  active_from: string | null; // ISO date string
  active_to: string | null; // ISO date string
  created_at: string;
}

export interface EuComplianceMapResult {
  data: Record<string, EuAnnexEntry[]>; // inci_canonical -> entries[]
  error: string | null;
}

/**
 * Fetches EU Annex compliance data from Supabase for a list of INCI names
 * @param inciList Array of canonical INCI names to look up
 * @returns Map of INCI name to array of EuAnnexEntry, or error message
 */
export async function getEuComplianceMap(inciList: string[]): Promise<EuComplianceMapResult> {
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

    // Get current date for filtering active entries
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    // Query eu_annex_entries table where inci_canonical IN (uniqueInciList)
    // Filter for active entries (active_from is NULL or <= today, active_to is NULL or >= today)
    let query = supabase
      .from('eu_annex_entries')
      .select('id, inci_canonical, annex, product_type, max_percentage, conditions_text, reference_url, source, active_from, active_to, created_at')
      .in('inci_canonical', uniqueInciList);

    // Filter for active entries: (active_from IS NULL OR active_from <= today) AND (active_to IS NULL OR active_to >= today)
    // We'll do this in two steps since Supabase doesn't support complex OR conditions easily
    const { data, error } = await query;

    if (error) {
      console.error('[getEuComplianceMap] Database error:', error);
      return { data: {}, error: error.message };
    }

    // Convert array to record (map) keyed by INCI name, with array of entries
    // Filter for active entries: (active_from IS NULL OR active_from <= today) AND (active_to IS NULL OR active_to >= today)
    const dataMap: Record<string, EuAnnexEntry[]> = {};
    if (data) {
      for (const row of data) {
        // Check if entry is active
        const isActiveFrom = !row.active_from || row.active_from <= today;
        const isActiveTo = !row.active_to || row.active_to >= today;
        
        if (!isActiveFrom || !isActiveTo) {
          continue; // Skip inactive entries
        }

        const inci = row.inci_canonical;
        if (!dataMap[inci]) {
          dataMap[inci] = [];
        }
        dataMap[inci].push({
          id: row.id,
          inci_canonical: row.inci_canonical,
          annex: row.annex as AnnexType,
          product_type: row.product_type as ProductTypeEnum,
          max_percentage: row.max_percentage,
          conditions_text: row.conditions_text,
          reference_url: row.reference_url,
          source: row.source,
          active_from: row.active_from,
          active_to: row.active_to,
          created_at: row.created_at,
        });
      }
    }

    return { data: dataMap, error: null };
  } catch (error) {
    console.error('[getEuComplianceMap] Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { data: {}, error: errorMessage };
  }
}

// ===============================
// IFRA (light) – read-only support
// ===============================

export interface IfraEntry {
  id: string;
  ifra_key: string;
  amendment_number: number;
  standard_name: string;
  cas_numbers: string | null;
  synonyms: string | null;
  ifra_standard_type: string;
  source: string | null;
  reference_url: string | null;
  created_at: string;
}

export interface IfraComplianceMapResult {
  data: Record<string, IfraEntry[]>; // inci -> IFRA entries
  error: string | null;
}

/**
 * Fetches IFRA light compliance data (read-only flags, no blocking)
 * @param inciList Array of canonical INCI names
 */
export async function getIfraComplianceMap(
  inciList: string[]
): Promise<IfraComplianceMapResult> {
  try {
    if (!inciList || inciList.length === 0) {
      return { data: {}, error: null };
    }

    // Remove duplicates and filter out empty strings
    const uniqueInciList = Array.from(new Set(inciList.filter(inci => inci && inci.trim().length > 0)));

    if (uniqueInciList.length === 0) {
      return { data: {}, error: null };
    }

    const supabase = await createClient();

    // Build OR filter for case-insensitive matching
    const orFilter = uniqueInciList.map(inci => `inci.ilike."${inci}"`).join(',');

    const { data, error } = await supabase
      .from('v_ifra_matches')
      .select('inci, ifra_key, standard_name, ifra_standard_type, amendment_number, reference_url')
      .or(orFilter);

    if (error) {
      console.error('[getIfraComplianceMap] Database error:', error);
      return { data: {}, error: error.message };
    }

    const dataMap: Record<string, IfraEntry[]> = {};

    if (data) {
      for (const row of data) {
        const key = row.inci.trim().toLowerCase();
        if (!dataMap[key]) {
          dataMap[key] = [];
        }
        dataMap[key].push({
          id: 'view',
          ifra_key: row.ifra_key,
          amendment_number: row.amendment_number,
          standard_name: row.standard_name,
          cas_numbers: null,
          synonyms: null,
          ifra_standard_type: row.ifra_standard_type,
          source: null,
          reference_url: row.reference_url,
          created_at: new Date().toISOString(),
        });
      }
    }

    return { data: dataMap, error: null };
  } catch (error) {
    console.error('[getIfraComplianceMap] Unexpected error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { data: {}, error: message };
  }
}

