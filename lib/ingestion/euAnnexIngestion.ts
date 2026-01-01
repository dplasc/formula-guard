/**
 * EU Annex entries CSV ingestion pipeline
 * Handles parsing, normalization, idempotency checks, and insertion
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import type { AnnexType, ProductTypeEnum } from '@/app/builder/actions-eu-compliance';
import { parseCsv, type ParsedCsv } from './csvParser';
import { normalizeInciNamesBatch } from './inciNormalizer';
import { normalizeInciNamesBatchWithClient } from './inciNormalizer';
import { mapCosIngRow, detectColumnMappings, extractInciName, type MappingConfig, type MappedEntry } from './cosingMapper';

export interface IngestionStats {
  totalRows: number;
  skipped: number;
  inserted: number;
  errors: number;
  duplicates: number;
}

export interface IngestionResult {
  success: boolean;
  stats: IngestionStats;
  errors: string[];
  warnings: string[];
}

export interface IngestionOptions {
  dryRun?: boolean;
  annex: AnnexType;
  source: string;
  referenceUrl: string;
  columnMappings?: Partial<MappingConfig['columnMappings']>;
  logProgress?: boolean;
  supabaseClient?: SupabaseClient; // Optional: for CLI usage (avoids cookies() call)
  skipDuplicatesCheck?: boolean; // Skip duplicate checking (useful if database connection fails)
}

/**
 * Main ingestion function
 * @param csvContent Raw CSV content as string
 * @param options Ingestion options
 * @returns Ingestion result with stats and errors
 */
export async function ingestEuAnnexCsv(
  csvContent: string,
  options: IngestionOptions
): Promise<IngestionResult> {
  const stats: IngestionStats = {
    totalRows: 0,
    skipped: 0,
    inserted: 0,
    errors: 0,
    duplicates: 0,
  };
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Step 1: Parse CSV
    if (options.logProgress) {
      console.log('[ingestEuAnnexCsv] Parsing CSV...');
    }
    const parsed = parseCsv(csvContent);
    
    if (parsed.errors.length > 0) {
      errors.push(...parsed.errors);
    }

    if (parsed.rows.length === 0) {
      return {
        success: false,
        stats,
        errors: ['No data rows found in CSV'],
        warnings: [],
      };
    }

    stats.totalRows = parsed.rows.length;

    // Step 2: Detect or use provided column mappings
    let columnMappings = options.columnMappings || {};
    if (!columnMappings.inci) {
      const detected = detectColumnMappings(parsed.headers);
      columnMappings = { ...detected, ...columnMappings };
    }

    if (!columnMappings.inci) {
      return {
        success: false,
        stats,
        errors: ['Could not detect INCI column. Please provide columnMappings.inci'],
        warnings: [],
      };
    }

    if (options.logProgress) {
      console.log('[ingestEuAnnexCsv] Column mappings:', columnMappings);
    }

    // Create config object early (needed for extractInciName)
    const config: MappingConfig = {
      annex: options.annex,
      source: options.source,
      referenceUrl: options.referenceUrl,
      columnMappings,
    };

    // Step 3: Extract and normalize INCI names (with fallback)
    if (options.logProgress) {
      console.log('[ingestEuAnnexCsv] Normalizing INCI names...');
    }
    const inciNames = parsed.rows
      .map(row => extractInciName(row, config))
      .filter(name => name.length > 0);

    const synonymCache = new Map<string, string>();
    // Use client-specific normalization if client provided (CLI mode), otherwise use server action
    const inciNormalizationMap = options.supabaseClient
      ? await normalizeInciNamesBatchWithClient(inciNames, options.supabaseClient, synonymCache)
      : await normalizeInciNamesBatch(inciNames, synonymCache);

    if (options.logProgress) {
      console.log(`[ingestEuAnnexCsv] Normalized ${inciNormalizationMap.size} INCI names`);
    }

    // Step 4: Map rows to entries
    if (options.logProgress) {
      console.log('[ingestEuAnnexCsv] Mapping rows to entries...');
    }
    const mappedEntries: MappedEntry[] = [];

    for (let i = 0; i < parsed.rows.length; i++) {
      const row = parsed.rows[i];
      // Extract INCI with fallback logic
      const rawInci = extractInciName(row, config);
      
      if (!rawInci) {
        stats.skipped++;
        warnings.push(`Row ${i + 2}: Missing INCI name (both primary and fallback columns empty)`);
        continue;
      }

      const normalizedInci = inciNormalizationMap.get(rawInci) || rawInci;
      const mapped = mapCosIngRow(row, config, normalizedInci);

      if (!mapped) {
        stats.skipped++;
        warnings.push(`Row ${i + 2}: Failed to map entry`);
        continue;
      }

      mappedEntries.push(mapped);
    }

    if (options.logProgress) {
      console.log(`[ingestEuAnnexCsv] Mapped ${mappedEntries.length} entries`);
    }

    // Step 5: Check for duplicates (idempotency)
    // Create client early (needed for duplicate check and/or inserts)
    // Only create if not in dry-run mode (dry-run doesn't need client) or if we need it for duplicate check
    let supabase: SupabaseClient | undefined;
    if (!options.dryRun || !options.skipDuplicatesCheck) {
      supabase = options.supabaseClient || await createClient();
    }
    
    const existingKeys = new Set<string>();
    
    if (options.skipDuplicatesCheck) {
      if (options.logProgress) {
        console.log('[ingestEuAnnexCsv] Skipping duplicate check (--skip-duplicates-check flag set)');
      }
    } else {
      if (options.logProgress) {
        console.log('[ingestEuAnnexCsv] Checking for duplicates...');
      }
      
      try {
        if (!supabase) {
          supabase = options.supabaseClient || await createClient();
        }
        const uniqueInciNames = Array.from(new Set(mappedEntries.map(e => e.inci_canonical)));
        
        const { data: existingEntries, error: queryError } = await supabase
          .from('eu_annex_entries')
          .select('inci_canonical, annex, product_type, max_percentage')
          .in('inci_canonical', uniqueInciNames)
          .eq('annex', options.annex);

        if (queryError) {
          const errorMsg = `Error checking duplicates: ${queryError.message}`;
          warnings.push(errorMsg);
          if (options.logProgress) {
            console.log(`[ingestEuAnnexCsv] WARNING: ${errorMsg} - proceeding without duplicate check`);
          }
        } else if (existingEntries) {
          // Build duplicate check key: inci_canonical + annex + product_type + max_percentage
          for (const entry of existingEntries) {
            const key = `${entry.inci_canonical}|${entry.annex}|${entry.product_type}|${entry.max_percentage ?? 'null'}`;
            existingKeys.add(key);
          }
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        const warningMsg = `Failed to check duplicates: ${errorMsg} - proceeding without duplicate check`;
        warnings.push(warningMsg);
        if (options.logProgress) {
          console.log(`[ingestEuAnnexCsv] WARNING: ${warningMsg}`);
        }
      }
    }

    // Step 6: Filter out duplicates and insert
    const entriesToInsert = mappedEntries.filter(entry => {
      const key = `${entry.inci_canonical}|${entry.annex}|${entry.product_type}|${entry.max_percentage ?? 'null'}`;
      if (existingKeys.has(key)) {
        stats.duplicates++;
        return false;
      }
      return true;
    });

    if (options.logProgress) {
      console.log(`[ingestEuAnnexCsv] Found ${stats.duplicates} duplicates, ${entriesToInsert.length} new entries to insert`);
    }

    // Step 7: Insert entries (or simulate in dry-run)
    if (options.dryRun) {
      if (options.logProgress) {
        console.log('[ingestEuAnnexCsv] DRY RUN: Would insert', entriesToInsert.length, 'entries');
        entriesToInsert.slice(0, 5).forEach((entry, idx) => {
          console.log(`  [${idx + 1}] ${entry.inci_canonical} (Annex ${entry.annex}, ${entry.product_type})`);
        });
        if (entriesToInsert.length > 5) {
          console.log(`  ... and ${entriesToInsert.length - 5} more`);
        }
      }
      stats.inserted = entriesToInsert.length;
    } else {
      if (options.logProgress) {
        console.log('[ingestEuAnnexCsv] Inserting entries into database...');
      }

      // Ensure client is available for inserts
      if (!supabase) {
        supabase = options.supabaseClient || await createClient();
      }

      // Insert in batches to avoid overwhelming the database
      const batchSize = 100;
      for (let i = 0; i < entriesToInsert.length; i += batchSize) {
        const batch = entriesToInsert.slice(i, i + batchSize);
        const { error: insertError } = await supabase
          .from('eu_annex_entries')
          .insert(batch);

        if (insertError) {
          errors.push(`Error inserting batch ${Math.floor(i / batchSize) + 1}: ${insertError.message}`);
          stats.errors += batch.length;
        } else {
          stats.inserted += batch.length;
          if (options.logProgress) {
            console.log(`[ingestEuAnnexCsv] Inserted batch ${Math.floor(i / batchSize) + 1} (${stats.inserted}/${entriesToInsert.length})`);
          }
        }
      }
    }

    return {
      success: errors.length === 0,
      stats,
      errors,
      warnings,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    errors.push(`Fatal error: ${errorMessage}`);
    return {
      success: false,
      stats,
      errors,
      warnings,
    };
  }
}

