import type { EuAnnexEntry, AnnexType, ProductTypeEnum } from '@/app/builder/actions-eu-compliance';

export interface BlockItem {
  id: string;
  annex: AnnexType;
  inci_canonical: string;
  ingredientName: string;
  ingredientId?: string;
  productType: ProductTypeEnum;
  max_percentage: number | null;
  actual_percentage: number;
  conditions_text: string | null;
  reference_url: string | null;
  source: string | null;
  reason: string; // Human-readable reason for the block
}

export interface EuComplianceResult {
  blocks: BlockItem[];
}

export interface ResolvedIngredient {
  id: string;
  name: string;
  percentage: number;
  canonicalInci: string; // Resolved canonical INCI name
}

export interface Formula {
  ingredients: ResolvedIngredient[];
  productType: 'leave-on' | 'rinse-off';
}

/**
 * Checks EU compliance for a formula against Annex II/III/VI entries
 * 
 * Rules:
 * - Annex II: Any match => BLOCK (prohibited ingredients)
 * - Annex III/VI: If product_type matches and max_percentage is not null and ingredient_percentage > max => BLOCK
 * 
 * @param formula The formula with ingredients and product type
 * @param resolvedIngredients Map of ingredient IDs to resolved canonical INCI names
 * @param euComplianceMap Map of canonical INCI to array of EuAnnexEntry
 * @returns Object containing array of blocks
 */
export function checkEUCompliance(
  formula: Formula,
  resolvedIngredients: Record<string, string>, // ingredientId -> canonicalInci
  euComplianceMap: Record<string, EuAnnexEntry[]> // canonicalInci -> entries[]
): EuComplianceResult {
  const blocks: BlockItem[] = [];

  // Normalize product type from formula to match database enum
  const dbProductType: ProductTypeEnum = formula.productType === 'leave-on' ? 'leave_on' : 'rinse_off';

  for (const ingredient of formula.ingredients) {
    // Get canonical INCI for this ingredient
    const canonicalInci = ingredient.canonicalInci || resolvedIngredients[ingredient.id] || '';
    
    if (!canonicalInci) {
      // Skip if we don't have a canonical INCI
      continue;
    }

    // Normalize for lookup (lowercase)
    const lookupKey = canonicalInci.toLowerCase().trim();
    const entries = euComplianceMap[lookupKey] || [];

    for (const entry of entries) {
      // Check product type compatibility
      const productTypeMatches = 
        entry.product_type === 'both' ||
        entry.product_type === dbProductType;

      if (!productTypeMatches) {
        continue; // Skip entries that don't apply to this product type
      }

      // Annex II: Any match => BLOCK
      if (entry.annex === 'II') {
        blocks.push({
          id: `eu-annex-ii-${entry.id}-${ingredient.id}`,
          annex: 'II',
          inci_canonical: entry.inci_canonical,
          ingredientName: ingredient.name,
          ingredientId: ingredient.id,
          productType: entry.product_type,
          max_percentage: null,
          actual_percentage: ingredient.percentage,
          conditions_text: entry.conditions_text,
          reference_url: entry.reference_url,
          source: entry.source,
          reason: `Annex II: This ingredient is prohibited in cosmetic products. ${entry.conditions_text || ''}`.trim(),
        });
        continue; // Don't check Annex III/VI for Annex II matches
      }

      // Annex III/VI: Check if percentage exceeds max
      if (entry.annex === 'III' || entry.annex === 'VI') {
        if (entry.max_percentage !== null && ingredient.percentage > entry.max_percentage) {
          blocks.push({
            id: `eu-annex-${entry.annex.toLowerCase()}-${entry.id}-${ingredient.id}`,
            annex: entry.annex,
            inci_canonical: entry.inci_canonical,
            ingredientName: ingredient.name,
            ingredientId: ingredient.id,
            productType: entry.product_type,
            max_percentage: entry.max_percentage,
            actual_percentage: ingredient.percentage,
            conditions_text: entry.conditions_text,
            reference_url: entry.reference_url,
            source: entry.source,
            reason: `Annex ${entry.annex}: Maximum allowed concentration is ${entry.max_percentage}%, but formula contains ${ingredient.percentage.toFixed(2)}%. ${entry.conditions_text || ''}`.trim(),
          });
        }
      }
    }
  }

  return { blocks };
}


