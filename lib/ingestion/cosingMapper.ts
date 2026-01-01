/**
 * CosIng CSV format mapper
 * Maps CosIng Annex II/III CSV columns to eu_annex_entries format
 */

import type { AnnexType, ProductTypeEnum } from '@/app/builder/actions-eu-compliance';

export interface CosIngRow {
  [key: string]: string;
}

export interface MappedEntry {
  inci_canonical: string;
  annex: AnnexType;
  product_type: ProductTypeEnum;
  max_percentage: number | null;
  conditions_text: string | null;
  reference_url: string | null;
  source: string;
  active_from: string | null;
  active_to: string | null;
}

export interface MappingConfig {
  annex: AnnexType;
  source: string;
  referenceUrl: string;
  // Column name mappings (flexible to handle different CSV formats)
  columnMappings: {
    inci?: string; // Column name for INCI name (primary)
    inciFallback?: string; // Fallback column name for INCI (e.g., "Chemical name / INN")
    productType?: string; // Column name for product type
    maxPercentage?: string; // Column name for max percentage
    conditions?: string; // Column name for conditions/restrictions
    activeFrom?: string; // Column name for active from date
    activeTo?: string; // Column name for active to date
  };
}

/**
 * Extracts INCI name from CSV row with fallback logic
 * @param row CSV row data
 * @param config Mapping configuration
 * @returns Extracted INCI name or empty string if not found
 */
export function extractInciName(row: CosIngRow, config: MappingConfig): string {
  // Helper to normalize a value (trim, treat '-' as empty)
  const normalizeValue = (value: string | undefined): string => {
    if (!value) return '';
    const trimmed = value.trim();
    return trimmed === '-' ? '' : trimmed;
  };

  // Try primary INCI column first
  if (config.columnMappings.inci) {
    const primaryInci = normalizeValue(row[config.columnMappings.inci]);
    if (primaryInci) {
      return primaryInci;
    }
  }

  // Fallback to secondary column (e.g., "Chemical name / INN")
  if (config.columnMappings.inciFallback) {
    const fallbackInci = normalizeValue(row[config.columnMappings.inciFallback]);
    if (fallbackInci) {
      return fallbackInci;
    }
  }

  return '';
}

/**
 * Maps a CosIng CSV row to eu_annex_entries format
 * @param row CSV row data
 * @param config Mapping configuration
 * @param normalizedInci Canonical INCI name (already normalized)
 * @returns Mapped entry or null if row is invalid
 */
export function mapCosIngRow(
  row: CosIngRow,
  config: MappingConfig,
  normalizedInci: string
): MappedEntry | null {
  if (!normalizedInci || normalizedInci.trim().length === 0) {
    return null;
  }

  // Extract product type
  let productType: ProductTypeEnum = 'both';
  if (config.columnMappings.productType) {
    const productTypeValue = (row[config.columnMappings.productType] || '').trim().toLowerCase();
    if (productTypeValue.includes('leave') || productTypeValue === 'leave-on') {
      productType = 'leave_on';
    } else if (productTypeValue.includes('rinse') || productTypeValue === 'rinse-off') {
      productType = 'rinse_off';
    } else if (productTypeValue === 'both' || productTypeValue === 'all') {
      productType = 'both';
    }
  }

  // Extract max percentage (Annex II has null, Annex III/VI have values)
  let maxPercentage: number | null = null;
  if (config.annex !== 'II' && config.columnMappings.maxPercentage) {
    const maxPercentStr = (row[config.columnMappings.maxPercentage] || '').trim();
    if (maxPercentStr) {
      const parsed = parseFloat(maxPercentStr.replace('%', '').replace(',', '.'));
      if (!isNaN(parsed) && parsed >= 0) {
        maxPercentage = parsed;
      }
    }
  }

  // Extract conditions text
  let conditionsText: string | null = null;
  if (config.columnMappings.conditions) {
    const conditions = (row[config.columnMappings.conditions] || '').trim();
    if (conditions.length > 0) {
      conditionsText = conditions;
    }
  }

  // Extract date fields
  let activeFrom: string | null = null;
  if (config.columnMappings.activeFrom) {
    const dateStr = (row[config.columnMappings.activeFrom] || '').trim();
    if (dateStr) {
      activeFrom = parseDate(dateStr);
    }
  }

  let activeTo: string | null = null;
  if (config.columnMappings.activeTo) {
    const dateStr = (row[config.columnMappings.activeTo] || '').trim();
    if (dateStr) {
      activeTo = parseDate(dateStr);
    }
  }

  return {
    inci_canonical: normalizedInci,
    annex: config.annex,
    product_type: productType,
    max_percentage: maxPercentage,
    conditions_text: conditionsText,
    reference_url: config.referenceUrl,
    source: config.source,
    active_from: activeFrom,
    active_to: activeTo,
  };
}

/**
 * Parses various date formats to ISO date string (YYYY-MM-DD)
 * @param dateStr Date string in various formats
 * @returns ISO date string or null if parsing fails
 */
function parseDate(dateStr: string): string | null {
  try {
    // Try parsing as ISO date
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }

    // Try DD/MM/YYYY or DD-MM-YYYY
    const parts = dateStr.split(/[\/\-]/);
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        const date = new Date(year, month - 1, day);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Auto-detects column mappings from CSV headers
 * @param headers CSV header row
 * @returns Detected column mappings
 */
export function detectColumnMappings(headers: string[]): Partial<MappingConfig['columnMappings']> {
  const mappings: Partial<MappingConfig['columnMappings']> = {};
  const lowerHeaders = headers.map(h => h.toLowerCase().trim());

  // Find INCI column (primary: "Identified INGREDIENTS or substances e.g." or similar)
  const inciIndices = lowerHeaders.findIndex(h => 
    h.includes('identified') && (h.includes('ingredient') || h.includes('substance'))
  );
  if (inciIndices >= 0) {
    mappings.inci = headers[inciIndices];
  } else {
    // Fallback: try generic INCI/name patterns
    const genericInciIndices = lowerHeaders.findIndex(h => 
      h.includes('inci') || (h.includes('name') && h.includes('ingredient'))
    );
    if (genericInciIndices >= 0) {
      mappings.inci = headers[genericInciIndices];
    }
  }

  // Find fallback INCI column ("Chemical name / INN")
  const fallbackInciIndices = lowerHeaders.findIndex(h => 
    (h.includes('chemical') && h.includes('name')) || h.includes('inn')
  );
  if (fallbackInciIndices >= 0) {
    mappings.inciFallback = headers[fallbackInciIndices];
  }

  // Find product type column
  const productTypeIndices = lowerHeaders.findIndex(h => 
    h.includes('product') || h.includes('type') || h.includes('application')
  );
  if (productTypeIndices >= 0) {
    mappings.productType = headers[productTypeIndices];
  }

  // Find max percentage column
  const maxPercentIndices = lowerHeaders.findIndex(h => 
    h.includes('max') || h.includes('maximum') || h.includes('limit') || h.includes('percentage') || h.includes('%')
  );
  if (maxPercentIndices >= 0) {
    mappings.maxPercentage = headers[maxPercentIndices];
  }

  // Find conditions column
  const conditionsIndices = lowerHeaders.findIndex(h => 
    h.includes('condition') || h.includes('restriction') || h.includes('note') || h.includes('remark')
  );
  if (conditionsIndices >= 0) {
    mappings.conditions = headers[conditionsIndices];
  }

  // Find date columns
  const activeFromIndices = lowerHeaders.findIndex(h => 
    h.includes('active') && (h.includes('from') || h.includes('start') || h.includes('valid'))
  );
  if (activeFromIndices >= 0) {
    mappings.activeFrom = headers[activeFromIndices];
  }

  const activeToIndices = lowerHeaders.findIndex(h => 
    h.includes('active') && (h.includes('to') || h.includes('end') || h.includes('expire'))
  );
  if (activeToIndices >= 0) {
    mappings.activeTo = headers[activeToIndices];
  }

  return mappings;
}

