import { checkEUCompliance, type BlockItem } from '../euCompliance';
import type { EuAnnexEntry } from '@/app/builder/actions-eu-compliance';

describe('checkEUCompliance', () => {
  describe('Annex II (Prohibited Ingredients)', () => {
    it('should block any ingredient in Annex II regardless of percentage', () => {
      const formula = {
        ingredients: [
          {
            id: 'ing1',
            name: 'Prohibited Ingredient',
            percentage: 0.1, // Even very low percentage should be blocked
            canonicalInci: 'prohibited_inci',
          },
        ],
        productType: 'leave-on' as const,
      };

      const resolvedIngredients: Record<string, string> = {
        ing1: 'prohibited_inci',
      };

      const euComplianceMap: Record<string, EuAnnexEntry[]> = {
        prohibited_inci: [
          {
            id: 'entry1',
            inci_canonical: 'prohibited_inci',
            annex: 'II',
            product_type: 'both',
            max_percentage: null,
            conditions_text: 'This ingredient is prohibited in all cosmetic products',
            reference_url: 'https://example.com/annex-ii',
            source: 'EU Regulation 1223/2009',
            active_from: null,
            active_to: null,
            created_at: '2024-01-01T00:00:00Z',
          },
        ],
      };

      const result = checkEUCompliance(formula, resolvedIngredients, euComplianceMap);

      expect(result.blocks).toHaveLength(1);
      expect(result.blocks[0].annex).toBe('II');
      expect(result.blocks[0].inci_canonical).toBe('prohibited_inci');
      expect(result.blocks[0].ingredientName).toBe('Prohibited Ingredient');
      expect(result.blocks[0].max_percentage).toBeNull();
      expect(result.blocks[0].actual_percentage).toBe(0.1);
      expect(result.blocks[0].reason).toContain('Annex II');
      expect(result.blocks[0].reason).toContain('prohibited');
    });

    it('should block Annex II ingredient for leave-on product type', () => {
      const formula = {
        ingredients: [
          {
            id: 'ing1',
            name: 'Prohibited Ingredient',
            percentage: 5.0,
            canonicalInci: 'prohibited_inci',
          },
        ],
        productType: 'leave-on' as const,
      };

      const resolvedIngredients: Record<string, string> = {
        ing1: 'prohibited_inci',
      };

      const euComplianceMap: Record<string, EuAnnexEntry[]> = {
        prohibited_inci: [
          {
            id: 'entry1',
            inci_canonical: 'prohibited_inci',
            annex: 'II',
            product_type: 'leave_on',
            max_percentage: null,
            conditions_text: null,
            reference_url: null,
            source: null,
            active_from: null,
            active_to: null,
            created_at: '2024-01-01T00:00:00Z',
          },
        ],
      };

      const result = checkEUCompliance(formula, resolvedIngredients, euComplianceMap);

      expect(result.blocks).toHaveLength(1);
      expect(result.blocks[0].annex).toBe('II');
    });

    it('should not block Annex II ingredient if product type does not match', () => {
      const formula = {
        ingredients: [
          {
            id: 'ing1',
            name: 'Prohibited Ingredient',
            percentage: 5.0,
            canonicalInci: 'prohibited_inci',
          },
        ],
        productType: 'rinse-off' as const,
      };

      const resolvedIngredients: Record<string, string> = {
        ing1: 'prohibited_inci',
      };

      const euComplianceMap: Record<string, EuAnnexEntry[]> = {
        prohibited_inci: [
          {
            id: 'entry1',
            inci_canonical: 'prohibited_inci',
            annex: 'II',
            product_type: 'leave_on', // Only for leave-on, but formula is rinse-off
            max_percentage: null,
            conditions_text: null,
            reference_url: null,
            source: null,
            active_from: null,
            active_to: null,
            created_at: '2024-01-01T00:00:00Z',
          },
        ],
      };

      const result = checkEUCompliance(formula, resolvedIngredients, euComplianceMap);

      expect(result.blocks).toHaveLength(0);
    });
  });

  describe('Annex III (Restricted Ingredients)', () => {
    it('should block ingredient when percentage exceeds max_percentage', () => {
      const formula = {
        ingredients: [
          {
            id: 'ing1',
            name: 'Restricted Ingredient',
            percentage: 3.0, // Exceeds max of 2.0%
            canonicalInci: 'restricted_inci',
          },
        ],
        productType: 'leave-on' as const,
      };

      const resolvedIngredients: Record<string, string> = {
        ing1: 'restricted_inci',
      };

      const euComplianceMap: Record<string, EuAnnexEntry[]> = {
        restricted_inci: [
          {
            id: 'entry1',
            inci_canonical: 'restricted_inci',
            annex: 'III',
            product_type: 'leave_on',
            max_percentage: 2.0,
            conditions_text: 'Maximum 2% in leave-on products',
            reference_url: 'https://example.com/annex-iii',
            source: 'EU Regulation 1223/2009',
            active_from: null,
            active_to: null,
            created_at: '2024-01-01T00:00:00Z',
          },
        ],
      };

      const result = checkEUCompliance(formula, resolvedIngredients, euComplianceMap);

      expect(result.blocks).toHaveLength(1);
      expect(result.blocks[0].annex).toBe('III');
      expect(result.blocks[0].max_percentage).toBe(2.0);
      expect(result.blocks[0].actual_percentage).toBe(3.0);
      expect(result.blocks[0].reason).toContain('Annex III');
      expect(result.blocks[0].reason).toContain('2.0%');
      expect(result.blocks[0].reason).toContain('3.00%');
    });

    it('should not block when percentage equals max_percentage', () => {
      const formula = {
        ingredients: [
          {
            id: 'ing1',
            name: 'Restricted Ingredient',
            percentage: 2.0, // Exactly at max
            canonicalInci: 'restricted_inci',
          },
        ],
        productType: 'leave-on' as const,
      };

      const resolvedIngredients: Record<string, string> = {
        ing1: 'restricted_inci',
      };

      const euComplianceMap: Record<string, EuAnnexEntry[]> = {
        restricted_inci: [
          {
            id: 'entry1',
            inci_canonical: 'restricted_inci',
            annex: 'III',
            product_type: 'leave_on',
            max_percentage: 2.0,
            conditions_text: null,
            reference_url: null,
            source: null,
            active_from: null,
            active_to: null,
            created_at: '2024-01-01T00:00:00Z',
          },
        ],
      };

      const result = checkEUCompliance(formula, resolvedIngredients, euComplianceMap);

      expect(result.blocks).toHaveLength(0);
    });

    it('should not block when percentage is below max_percentage', () => {
      const formula = {
        ingredients: [
          {
            id: 'ing1',
            name: 'Restricted Ingredient',
            percentage: 1.5, // Below max of 2.0%
            canonicalInci: 'restricted_inci',
          },
        ],
        productType: 'leave-on' as const,
      };

      const resolvedIngredients: Record<string, string> = {
        ing1: 'restricted_inci',
      };

      const euComplianceMap: Record<string, EuAnnexEntry[]> = {
        restricted_inci: [
          {
            id: 'entry1',
            inci_canonical: 'restricted_inci',
            annex: 'III',
            product_type: 'leave_on',
            max_percentage: 2.0,
            conditions_text: null,
            reference_url: null,
            source: null,
            active_from: null,
            active_to: null,
            created_at: '2024-01-01T00:00:00Z',
          },
        ],
      };

      const result = checkEUCompliance(formula, resolvedIngredients, euComplianceMap);

      expect(result.blocks).toHaveLength(0);
    });

    it('should not block when max_percentage is null (no limit specified)', () => {
      const formula = {
        ingredients: [
          {
            id: 'ing1',
            name: 'Restricted Ingredient',
            percentage: 10.0,
            canonicalInci: 'restricted_inci',
          },
        ],
        productType: 'leave-on' as const,
      };

      const resolvedIngredients: Record<string, string> = {
        ing1: 'restricted_inci',
      };

      const euComplianceMap: Record<string, EuAnnexEntry[]> = {
        restricted_inci: [
          {
            id: 'entry1',
            inci_canonical: 'restricted_inci',
            annex: 'III',
            product_type: 'leave_on',
            max_percentage: null, // No limit
            conditions_text: null,
            reference_url: null,
            source: null,
            active_from: null,
            active_to: null,
            created_at: '2024-01-01T00:00:00Z',
          },
        ],
      };

      const result = checkEUCompliance(formula, resolvedIngredients, euComplianceMap);

      expect(result.blocks).toHaveLength(0);
    });

    it('should block for "both" product type when percentage exceeds max', () => {
      const formula = {
        ingredients: [
          {
            id: 'ing1',
            name: 'Restricted Ingredient',
            percentage: 3.0,
            canonicalInci: 'restricted_inci',
          },
        ],
        productType: 'rinse-off' as const,
      };

      const resolvedIngredients: Record<string, string> = {
        ing1: 'restricted_inci',
      };

      const euComplianceMap: Record<string, EuAnnexEntry[]> = {
        restricted_inci: [
          {
            id: 'entry1',
            inci_canonical: 'restricted_inci',
            annex: 'III',
            product_type: 'both', // Applies to both product types
            max_percentage: 2.0,
            conditions_text: null,
            reference_url: null,
            source: null,
            active_from: null,
            active_to: null,
            created_at: '2024-01-01T00:00:00Z',
          },
        ],
      };

      const result = checkEUCompliance(formula, resolvedIngredients, euComplianceMap);

      expect(result.blocks).toHaveLength(1);
    });
  });

  describe('Annex VI (UV Filters)', () => {
    it('should block UV filter when percentage exceeds max_percentage', () => {
      const formula = {
        ingredients: [
          {
            id: 'ing1',
            name: 'UV Filter',
            percentage: 8.0, // Exceeds max of 5.0%
            canonicalInci: 'uv_filter_inci',
          },
        ],
        productType: 'leave-on' as const,
      };

      const resolvedIngredients: Record<string, string> = {
        ing1: 'uv_filter_inci',
      };

      const euComplianceMap: Record<string, EuAnnexEntry[]> = {
        uv_filter_inci: [
          {
            id: 'entry1',
            inci_canonical: 'uv_filter_inci',
            annex: 'VI',
            product_type: 'leave_on',
            max_percentage: 5.0,
            conditions_text: 'Maximum 5% in leave-on products',
            reference_url: 'https://example.com/annex-vi',
            source: 'EU Regulation 1223/2009',
            active_from: null,
            active_to: null,
            created_at: '2024-01-01T00:00:00Z',
          },
        ],
      };

      const result = checkEUCompliance(formula, resolvedIngredients, euComplianceMap);

      expect(result.blocks).toHaveLength(1);
      expect(result.blocks[0].annex).toBe('VI');
      expect(result.blocks[0].max_percentage).toBe(5.0);
      expect(result.blocks[0].actual_percentage).toBe(8.0);
    });
  });

  describe('Multiple ingredients and entries', () => {
    it('should handle multiple ingredients with different compliance issues', () => {
      const formula = {
        ingredients: [
          {
            id: 'ing1',
            name: 'Prohibited Ingredient',
            percentage: 1.0,
            canonicalInci: 'prohibited_inci',
          },
          {
            id: 'ing2',
            name: 'Restricted Ingredient',
            percentage: 3.0,
            canonicalInci: 'restricted_inci',
          },
          {
            id: 'ing3',
            name: 'Safe Ingredient',
            percentage: 1.0,
            canonicalInci: 'safe_inci',
          },
        ],
        productType: 'leave-on' as const,
      };

      const resolvedIngredients: Record<string, string> = {
        ing1: 'prohibited_inci',
        ing2: 'restricted_inci',
        ing3: 'safe_inci',
      };

      const euComplianceMap: Record<string, EuAnnexEntry[]> = {
        prohibited_inci: [
          {
            id: 'entry1',
            inci_canonical: 'prohibited_inci',
            annex: 'II',
            product_type: 'both',
            max_percentage: null,
            conditions_text: null,
            reference_url: null,
            source: null,
            active_from: null,
            active_to: null,
            created_at: '2024-01-01T00:00:00Z',
          },
        ],
        restricted_inci: [
          {
            id: 'entry2',
            inci_canonical: 'restricted_inci',
            annex: 'III',
            product_type: 'leave_on',
            max_percentage: 2.0,
            conditions_text: null,
            reference_url: null,
            source: null,
            active_from: null,
            active_to: null,
            created_at: '2024-01-01T00:00:00Z',
          },
        ],
      };

      const result = checkEUCompliance(formula, resolvedIngredients, euComplianceMap);

      expect(result.blocks).toHaveLength(2);
      expect(result.blocks.find(b => b.annex === 'II')).toBeDefined();
      expect(result.blocks.find(b => b.annex === 'III')).toBeDefined();
    });

    it('should handle ingredient with multiple entries (only block if applicable)', () => {
      const formula = {
        ingredients: [
          {
            id: 'ing1',
            name: 'Multi Entry Ingredient',
            percentage: 3.0,
            canonicalInci: 'multi_inci',
          },
        ],
        productType: 'leave-on' as const,
      };

      const resolvedIngredients: Record<string, string> = {
        ing1: 'multi_inci',
      };

      const euComplianceMap: Record<string, EuAnnexEntry[]> = {
        multi_inci: [
          {
            id: 'entry1',
            inci_canonical: 'multi_inci',
            annex: 'III',
            product_type: 'leave_on',
            max_percentage: 2.0, // This should trigger a block
            conditions_text: null,
            reference_url: null,
            source: null,
            active_from: null,
            active_to: null,
            created_at: '2024-01-01T00:00:00Z',
          },
          {
            id: 'entry2',
            inci_canonical: 'multi_inci',
            annex: 'III',
            product_type: 'rinse_off', // Different product type, should not block
            max_percentage: 1.0,
            conditions_text: null,
            reference_url: null,
            source: null,
            active_from: null,
            active_to: null,
            created_at: '2024-01-01T00:00:00Z',
          },
        ],
      };

      const result = checkEUCompliance(formula, resolvedIngredients, euComplianceMap);

      expect(result.blocks).toHaveLength(1);
      expect(result.blocks[0].id).toContain('entry1');
    });
  });

  describe('Edge cases', () => {
    it('should return empty blocks when no compliance map provided', () => {
      const formula = {
        ingredients: [
          {
            id: 'ing1',
            name: 'Some Ingredient',
            percentage: 5.0,
            canonicalInci: 'some_inci',
          },
        ],
        productType: 'leave-on' as const,
      };

      const resolvedIngredients: Record<string, string> = {
        ing1: 'some_inci',
      };

      const euComplianceMap: Record<string, EuAnnexEntry[]> = {};

      const result = checkEUCompliance(formula, resolvedIngredients, euComplianceMap);

      expect(result.blocks).toHaveLength(0);
    });

    it('should handle ingredient without canonical INCI', () => {
      const formula = {
        ingredients: [
          {
            id: 'ing1',
            name: 'Unknown Ingredient',
            percentage: 5.0,
            canonicalInci: '', // Empty INCI
          },
        ],
        productType: 'leave-on' as const,
      };

      const resolvedIngredients: Record<string, string> = {};

      const euComplianceMap: Record<string, EuAnnexEntry[]> = {
        some_inci: [
          {
            id: 'entry1',
            inci_canonical: 'some_inci',
            annex: 'II',
            product_type: 'both',
            max_percentage: null,
            conditions_text: null,
            reference_url: null,
            source: null,
            active_from: null,
            active_to: null,
            created_at: '2024-01-01T00:00:00Z',
          },
        ],
      };

      const result = checkEUCompliance(formula, resolvedIngredients, euComplianceMap);

      expect(result.blocks).toHaveLength(0);
    });
  });
});



