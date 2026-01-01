export type ProductType = 'leave-on' | 'rinse-off';
export type Severity = 'info' | 'warning' | 'critical';

export interface SafetyWarning {
  id: string;
  severity: Severity;
  title: string;
  message: string;
  ingredientId?: string;
  ingredientName?: string;
  category?: string;
  thresholdPercent?: number;
  actualPercent?: number;
}

export interface SafetyRule {
  category: string;
  leaveOnWarnPercent?: number;
  rinseOffWarnPercent?: number;
  severity: Severity;
  title: string;
  message: string; // should be actionable
}

export const SAFETY_RULES: SafetyRule[] = [
  {
    category: 'Fragrance',
    leaveOnWarnPercent: 0.3,
    rinseOffWarnPercent: 0.8,
    severity: 'warning',
    title: 'Fragrance Concentration',
    message: 'Get supplier IFRA certificate + allergen declaration if applicable.',
  },
  {
    category: 'Essential Oils',
    leaveOnWarnPercent: 0.2,
    rinseOffWarnPercent: 0.5,
    severity: 'warning',
    title: 'Essential Oil Concentration',
    message: 'Verify dermal limits for the specific essential oil.',
  },
  {
    category: 'Preservatives',
    leaveOnWarnPercent: 1.0,
    rinseOffWarnPercent: 1.0,
    severity: 'critical',
    title: 'Preservative Concentration',
    message: 'Verify Annex V limits for the specific preservative system.',
  },
  {
    category: 'Surfactants',
    leaveOnWarnPercent: 8,
    rinseOffWarnPercent: 20,
    severity: 'warning',
    title: 'High Surfactant Load',
    message: 'High surfactant load may increase irritation; consider product type and mildness.',
  },
  {
    category: 'pH Adjusters',
    leaveOnWarnPercent: 0.3,
    rinseOffWarnPercent: 0.5,
    severity: 'warning',
    title: 'pH Adjuster Concentration',
    message: 'Check final product pH; extremes irritate skin/eyes.',
  },
  {
    category: 'UV Filters',
    leaveOnWarnPercent: 5,
    rinseOffWarnPercent: 3,
    severity: 'warning',
    title: 'UV Filter Concentration',
    message: 'UV filters require Annex VI compliance; verify max % and conditions.',
  },
  {
    category: 'Colorants',
    leaveOnWarnPercent: 0.2,
    rinseOffWarnPercent: 0.5,
    severity: 'warning',
    title: 'Colorant Concentration',
    message: 'Colorants require Annex IV compliance; verify allowed CI and restrictions.',
  },
  {
    category: 'Actives',
    leaveOnWarnPercent: 2,
    rinseOffWarnPercent: 5,
    severity: 'warning',
    title: 'Active Ingredient Concentration',
    message: 'Actives may be restricted (Annex III) or need SCCS review; verify limits.',
  },
  {
    category: 'Extracts',
    leaveOnWarnPercent: 1.5,
    rinseOffWarnPercent: 3,
    severity: 'warning',
    title: 'Extract Concentration',
    message: 'Botanical extracts may increase sensitization risk; verify allergens and target group.',
  },
  {
    category: 'Solubilizers',
    leaveOnWarnPercent: 2.5,
    rinseOffWarnPercent: 4,
    severity: 'warning',
    title: 'High Solubilizer Load',
    message: 'High solubilizer load may irritate; keep as low as practical.',
  },
  {
    category: 'Emulsifiers',
    leaveOnWarnPercent: 4,
    rinseOffWarnPercent: 6,
    severity: 'info',
    title: 'High Emulsifier Load',
    message: 'High emulsifier load may affect skin feel; review formula balance.',
  },
  {
    category: 'Humectants',
    leaveOnWarnPercent: 8,
    rinseOffWarnPercent: 4,
    severity: 'info',
    title: 'High Humectant Load',
    message: 'High humectant load can feel tacky or affect stability.',
  },
  {
    category: 'Thickeners',
    leaveOnWarnPercent: 1.5,
    rinseOffWarnPercent: 2.5,
    severity: 'info',
    title: 'High Thickener Load',
    message: 'High thickener load may cause clumping or poor aesthetics.',
  },
  {
    category: 'Oils & Butters',
    leaveOnWarnPercent: 25,
    rinseOffWarnPercent: 8,
    severity: 'info',
    title: 'High Oil/Butter Load',
    message: 'High oil/butter load can be occlusive/comedogenic in leave-on facial products.',
  },
];

interface IngredientForEvaluation {
  id: string;
  name: string;
  percentage: number;
  category?: string;
  isVerified?: boolean;
  maxUsage?: number;
}

/**
 * Evaluates safety warnings for a list of ingredients based on product type
 */
export function evaluateSafetyWarnings(
  ingredients: IngredientForEvaluation[],
  productType: ProductType
): SafetyWarning[] {
  const warnings: SafetyWarning[] = [];

  for (const ingredient of ingredients) {
    // Skip if category is missing (backward compatibility)
    if (!ingredient.category) {
      continue;
    }

    // Find matching safety rule
    const rule = SAFETY_RULES.find((r) => r.category === ingredient.category);
    if (!rule) {
      continue;
    }

    // Get applicable threshold based on product type
    const threshold =
      productType === 'leave-on'
        ? rule.leaveOnWarnPercent
        : rule.rinseOffWarnPercent;

    // Skip if no threshold defined for this product type
    if (threshold === undefined) {
      continue;
    }

    // Check if ingredient percentage exceeds threshold
    if (ingredient.percentage > threshold) {
      warnings.push({
        id: `${ingredient.category}:${ingredient.id}`,
        severity: rule.severity,
        title: rule.title,
        message: rule.message,
        ingredientId: ingredient.id,
        ingredientName: ingredient.name,
        category: ingredient.category,
        thresholdPercent: threshold,
        actualPercent: ingredient.percentage,
      });
    }
  }

  return warnings;
}

/**
 * Returns ingredients that are unverified (isVerified === false or missing maxUsage on custom ingredients)
 */
export function getUnverifiedIngredients(
  ingredients: IngredientForEvaluation[]
): { id: string; name: string }[] {
  return ingredients
    .filter((ing) => {
      // Check if explicitly marked as unverified
      if (ing.isVerified === false) {
        return true;
      }
      // For custom ingredients, check if maxUsage is missing
      // Note: We can't directly check isCustom here, but if maxUsage is missing
      // and isVerified is not explicitly true, it's likely unverified
      if (ing.isVerified === undefined && ing.maxUsage === undefined) {
        return true;
      }
      return false;
    })
    .map((ing) => ({
      id: ing.id,
      name: ing.name,
    }));
}

