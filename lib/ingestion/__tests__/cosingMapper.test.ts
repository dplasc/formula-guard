import { extractInciName, detectColumnMappings, type MappingConfig } from '../cosingMapper';
import type { CosIngRow } from '../cosingMapper';
import type { AnnexType } from '@/app/builder/actions-eu-compliance';

describe('cosingMapper', () => {
  describe('extractInciName', () => {
    const createConfig = (inci?: string, inciFallback?: string): MappingConfig => ({
      annex: 'II' as AnnexType,
      source: 'test',
      referenceUrl: 'https://example.com',
      columnMappings: {
        inci,
        inciFallback,
      },
    });

    it('should extract INCI from primary column when available', () => {
      const row: CosIngRow = {
        'Identified INGREDIENTS or substances e.g.': 'Hydroquinone',
        'Chemical name / INN': 'Some Chemical',
      };
      const config = createConfig('Identified INGREDIENTS or substances e.g.', 'Chemical name / INN');
      
      const result = extractInciName(row, config);
      expect(result).toBe('Hydroquinone');
    });

    it('should fallback to "Chemical name / INN" when primary column is empty', () => {
      const row: CosIngRow = {
        'Identified INGREDIENTS or substances e.g.': '',
        'Chemical name / INN': 'Spironolactone (INN)',
      };
      const config = createConfig('Identified INGREDIENTS or substances e.g.', 'Chemical name / INN');
      
      const result = extractInciName(row, config);
      expect(result).toBe('Spironolactone (INN)');
    });

    it('should fallback to "Chemical name / INN" when primary column is null/undefined', () => {
      const row: CosIngRow = {
        'Identified INGREDIENTS or substances e.g.': undefined as any,
        'Chemical name / INN': 'Deanol aceglumate (INN)',
      };
      const config = createConfig('Identified INGREDIENTS or substances e.g.', 'Chemical name / INN');
      
      const result = extractInciName(row, config);
      expect(result).toBe('Deanol aceglumate (INN)');
    });

    it('should treat "-" as empty and fallback to secondary column', () => {
      const row: CosIngRow = {
        'Identified INGREDIENTS or substances e.g.': '-',
        'Chemical name / INN': 'Methotrexate (INN)',
      };
      const config = createConfig('Identified INGREDIENTS or substances e.g.', 'Chemical name / INN');
      
      const result = extractInciName(row, config);
      expect(result).toBe('Methotrexate (INN)');
    });

    it('should trim whitespace from INCI values', () => {
      const row: CosIngRow = {
        'Identified INGREDIENTS or substances e.g.': '  Hydroquinone  ',
        'Chemical name / INN': 'Some Chemical',
      };
      const config = createConfig('Identified INGREDIENTS or substances e.g.', 'Chemical name / INN');
      
      const result = extractInciName(row, config);
      expect(result).toBe('Hydroquinone');
    });

    it('should return empty string when both columns are empty', () => {
      const row: CosIngRow = {
        'Identified INGREDIENTS or substances e.g.': '',
        'Chemical name / INN': '',
      };
      const config = createConfig('Identified INGREDIENTS or substances e.g.', 'Chemical name / INN');
      
      const result = extractInciName(row, config);
      expect(result).toBe('');
    });

    it('should return empty string when both columns are "-"', () => {
      const row: CosIngRow = {
        'Identified INGREDIENTS or substances e.g.': '-',
        'Chemical name / INN': '-',
      };
      const config = createConfig('Identified INGREDIENTS or substances e.g.', 'Chemical name / INN');
      
      const result = extractInciName(row, config);
      expect(result).toBe('');
    });

    it('should work when only primary column is configured', () => {
      const row: CosIngRow = {
        'Identified INGREDIENTS or substances e.g.': 'Test INCI',
      };
      const config = createConfig('Identified INGREDIENTS or substances e.g.');
      
      const result = extractInciName(row, config);
      expect(result).toBe('Test INCI');
    });

    it('should work when only fallback column is configured', () => {
      const row: CosIngRow = {
        'Chemical name / INN': 'Test Chemical',
      };
      const config = createConfig(undefined, 'Chemical name / INN');
      
      const result = extractInciName(row, config);
      expect(result).toBe('Test Chemical');
    });
  });

  describe('detectColumnMappings', () => {
    it('should detect "Identified INGREDIENTS or substances e.g." as primary INCI column', () => {
      const headers = [
        'Reference Number',
        'Chemical name / INN',
        'Identified INGREDIENTS or substances e.g.',
        'CAS Number',
      ];
      
      const mappings = detectColumnMappings(headers);
      expect(mappings.inci).toBe('Identified INGREDIENTS or substances e.g.');
    });

    it('should detect "Chemical name / INN" as fallback INCI column', () => {
      const headers = [
        'Reference Number',
        'Chemical name / INN',
        'Identified INGREDIENTS or substances e.g.',
        'CAS Number',
      ];
      
      const mappings = detectColumnMappings(headers);
      expect(mappings.inciFallback).toBe('Chemical name / INN');
    });

    it('should detect fallback column even when primary is not found', () => {
      const headers = [
        'Reference Number',
        'Chemical name / INN',
        'CAS Number',
      ];
      
      const mappings = detectColumnMappings(headers);
      expect(mappings.inciFallback).toBe('Chemical name / INN');
    });

    it('should handle case-insensitive header detection', () => {
      const headers = [
        'Reference Number',
        'CHEMICAL NAME / INN',
        'identified ingredients or substances e.g.',
      ];
      
      const mappings = detectColumnMappings(headers);
      expect(mappings.inci).toBe('identified ingredients or substances e.g.');
      expect(mappings.inciFallback).toBe('CHEMICAL NAME / INN');
    });
  });
});


