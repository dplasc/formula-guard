export type IngredientCategory =
  | 'Preservatives' | 'Fragrance' | 'Essential Oils' | 'UV Filters' | 'Colorants'
  | 'Surfactants' | 'pH Adjusters' | 'Actives' | 'Emulsifiers' | 'Humectants'
  | 'Thickeners' | 'Solubilizers' | 'Chelators' | 'Extracts' | 'Oils & Butters'
  | 'Water Phase' | 'Other'
  | 'Emulsifier/Thickener' | 'Active/Extract'; // Legacy categories from existing data

export type ProductType = 'leave-on' | 'rinse-off' | 'both';

export type AnnexType = 'II' | 'III' | 'IV' | 'V' | 'VI' | 'NONE' | 'UNKNOWN';

export interface IngredientCompliance {
  inci?: string;
  cas?: string;
  ec?: string;
  cosingUrl?: string;
  annex?: AnnexType;
  annexEntry?: string;          // e.g. "Annex III/123"
  maxAllowedPercent?: number;   // official limit if known
  ifraCategory?: string;        // optional
  allergens?: string[];         // optional
  notes?: string;
  needsReview?: boolean;        // true for custom/unknown
  lastReviewedAt?: string;      // ISO
}

export interface IngredientBase {
  id: string;
  name: string;
  category: IngredientCategory;
  subcategory?: string;
  minUsage: number;
  maxUsage: number;
  maxUsageLeaveOn?: number | null;
  maxUsageRinseOff?: number | null;
  description: string;
  averagePricePerKg: number;
  isPremium?: boolean;
  isCustom?: boolean;

  // Safety normalization fields
  isVerified?: boolean;
  productType?: ProductType;

  // NEW compliance
  compliance?: IngredientCompliance;
}

// Extended interface for ingredients with additional optional fields
// Note: inci is required for existing mock data but can be optional for custom ingredients
export interface Ingredient extends IngredientBase {
  inci: string; // Required for existing mock data
  absorption?: string;
  comedogenicRating?: number;
  heatSensitive?: boolean;
  hlb?: number;
  charge?: string;
  solubility?: string;
  priceIndex?: number;
}

