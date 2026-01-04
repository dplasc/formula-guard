#!/usr/bin/env node
/**
 * Comprehensive ingredient inventory analysis
 * 
 * This script analyzes all ingredients from:
 * 1. ingredient_kb table (KB ingredients - regulatory/compliance-aware)
 * 2. data/mockIngredients.ts (Base ingredient library - not KB, not custom)
 * 3. Custom ingredients in saved formulas (formulas.formula_data JSONB)
 * 
 * Groups by: Oils & Butters, Emulsifiers, Actives
 * 
 * Usage: npx tsx scripts/analyze-ingredient-inventory.ts
 */

import 'dotenv/config';
import { createAdminClient } from '../lib/supabase/admin';
import { ingredients as mockIngredients } from '../data/mockIngredients';
import { readFileSync } from 'fs';
import { join } from 'path';

interface IngredientKbRow {
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

interface IngredientInventoryItem {
  name: string;
  inci: string;
  category: string;
  source: 'KB' | 'Custom' | 'Base';
  hasLeaveOnLimit: boolean;
  hasRinseOffLimit: boolean;
  participatesInCompliance: boolean;
  tableSource: string;
}

interface CategorizedInventory {
  'Oils & Butters': {
    kb: IngredientInventoryItem[];
    custom: IngredientInventoryItem[];
    base: IngredientInventoryItem[];
  };
  'Emulsifiers': {
    kb: IngredientInventoryItem[];
    custom: IngredientInventoryItem[];
    base: IngredientInventoryItem[];
  };
  'Actives': {
    kb: IngredientInventoryItem[];
    custom: IngredientInventoryItem[];
    base: IngredientInventoryItem[];
  };
}

type InventoryCategory = keyof CategorizedInventory;

async function analyzeInventory() {
  console.log('🔍 Starting comprehensive ingredient inventory analysis...\n');

  const inventory: CategorizedInventory = {
    'Oils & Butters': { kb: [], custom: [], base: [] },
    'Emulsifiers': { kb: [], custom: [], base: [] },
    'Actives': { kb: [], custom: [], base: [] },
  };

  // Step 1: Query ingredient_kb table
  console.log('📊 Step 1: Querying ingredient_kb table...');
  const supabase = createAdminClient();
  
  const { data: kbData, error: kbError } = await supabase
    .from('ingredient_kb')
    .select('inci, category, default_max_leave_on, default_max_rinse_off, is_fragrance_component, ifra_certificate_required, allergens, notes, source_urls')
    .order('category', { ascending: true, nullsFirst: false })
    .order('inci', { ascending: true });

  if (kbError) {
    console.error('❌ Error querying ingredient_kb:', kbError);
    process.exit(1);
  }

  console.log(`   Found ${kbData?.length || 0} KB ingredients\n`);

  // Step 2: Process KB ingredients
  if (kbData) {
    for (const kbIng of kbData) {
      const category = normalizeCategory(kbIng.category);
      if (!category) continue;

      // Check if participates in compliance (has limits or is flagged)
      const participatesInCompliance = 
        kbIng.default_max_leave_on !== null ||
        kbIng.default_max_rinse_off !== null ||
        kbIng.is_fragrance_component === true ||
        kbIng.ifra_certificate_required === true;

      const item: IngredientInventoryItem = {
        name: kbIng.inci, // KB uses INCI as name
        inci: kbIng.inci,
        category,
        source: 'KB',
        hasLeaveOnLimit: kbIng.default_max_leave_on !== null,
        hasRinseOffLimit: kbIng.default_max_rinse_off !== null,
        participatesInCompliance,
        tableSource: 'ingredient_kb',
      };

      inventory[category].kb.push(item);
    }
  }

  // Step 3: Process base ingredients from mockIngredients.ts
  console.log('📊 Step 2: Processing base ingredients from mockIngredients.ts...');
  let baseCount = 0;
  
  for (const ing of mockIngredients) {
    const category = normalizeCategory(ing.category);
    if (!category) continue;

    baseCount++;

    const participatesInCompliance = 
      ing.maxUsageLeaveOn !== null && ing.maxUsageLeaveOn !== undefined ||
      ing.maxUsageRinseOff !== null && ing.maxUsageRinseOff !== undefined ||
      ing.compliance !== undefined;

    const item: IngredientInventoryItem = {
      name: ing.name,
      inci: ing.inci,
      category,
      source: 'Base',
      hasLeaveOnLimit: ing.maxUsageLeaveOn !== null && ing.maxUsageLeaveOn !== undefined,
      hasRinseOffLimit: ing.maxUsageRinseOff !== null && ing.maxUsageRinseOff !== undefined,
      participatesInCompliance,
      tableSource: 'data/mockIngredients.ts',
    };

    inventory[category].base.push(item);
  }

  console.log(`   Found ${baseCount} base ingredients\n`);

  // Step 4: Query custom ingredients from saved formulas
  console.log('📊 Step 3: Querying custom ingredients from saved formulas...');
  
  const { data: formulasData, error: formulasError } = await supabase
    .from('formulas')
    .select('formula_data');

  if (formulasError) {
    console.error('⚠️  Error querying formulas:', formulasError);
    console.log('   Skipping custom ingredients analysis\n');
  } else {
    const customIngredientsMap = new Map<string, IngredientInventoryItem>();

    if (formulasData) {
      for (const formula of formulasData) {
        const formulaData = formula.formula_data as any;
        if (!formulaData?.ingredients) continue;

        for (const ing of formulaData.ingredients) {
          // Only process custom ingredients
          if (!ing.isCustom) continue;

          // Try to determine category from ingredient data or default
          const category = normalizeCategory(ing.category) || 'Oils & Butters'; // Default fallback
          
          const key = `${ing.name}-${ing.inci || ing.name}`;
          if (customIngredientsMap.has(key)) continue; // Deduplicate

          const item: IngredientInventoryItem = {
            name: ing.name,
            inci: ing.inci || ing.name,
            category,
            source: 'Custom',
            hasLeaveOnLimit: ing.maxUsageLeaveOn !== null && ing.maxUsageLeaveOn !== undefined,
            hasRinseOffLimit: ing.maxUsageRinseOff !== null && ing.maxUsageRinseOff !== undefined,
            participatesInCompliance: false, // Custom ingredients don't participate in compliance by default
            tableSource: 'formulas.formula_data (JSONB)',
          };

          customIngredientsMap.set(key, item);
        }
      }
    }

    // Add custom ingredients to inventory
    for (const item of customIngredientsMap.values()) {
      const category = item.category as InventoryCategory;
      if (!(category in inventory)) {
        continue;
      }
      inventory[category].custom.push(item);
    }

    console.log(`   Found ${customIngredientsMap.size} unique custom ingredients\n`);
  }

  // Step 5: Check compliance participation for KB and Base ingredients
  console.log('📊 Step 4: Checking EU compliance participation...');
  
  const allInciNames = [
    ...inventory['Oils & Butters'].kb.map(i => i.inci),
    ...inventory['Oils & Butters'].base.map(i => i.inci),
    ...inventory['Emulsifiers'].kb.map(i => i.inci),
    ...inventory['Emulsifiers'].base.map(i => i.inci),
    ...inventory['Actives'].kb.map(i => i.inci),
    ...inventory['Actives'].base.map(i => i.inci),
  ];

  const uniqueInci = Array.from(new Set(allInciNames.map(inci => inci.toLowerCase().trim())));

  const { data: euComplianceData } = await supabase
    .from('eu_annex_entries')
    .select('inci_canonical')
    .in('inci_canonical', uniqueInci);

  const complianceInciSet = new Set(
    (euComplianceData || []).map(e => e.inci_canonical.toLowerCase().trim())
  );

  // Update compliance participation for ingredients that appear in eu_annex_entries
  for (const category of ['Oils & Butters', 'Emulsifiers', 'Actives'] as const) {
    for (const source of ['kb', 'base'] as const) {
      for (const item of inventory[category][source]) {
        if (complianceInciSet.has(item.inci.toLowerCase().trim())) {
          item.participatesInCompliance = true;
        }
      }
    }
  }

  console.log(`   Checked ${uniqueInci.length} unique INCI names against eu_annex_entries\n`);

  // Step 6: Generate report
  console.log('\n' + '='.repeat(100));
  console.log('📋 COMPREHENSIVE INGREDIENT INVENTORY REPORT');
  console.log('='.repeat(100) + '\n');

  // Print by category
  for (const category of ['Oils & Butters', 'Emulsifiers', 'Actives'] as const) {
    console.log(`\n${'─'.repeat(100)}`);
    console.log(`📁 ${category.toUpperCase()}`);
    console.log('─'.repeat(100));

    // KB Ingredients
    const kbItems = inventory[category].kb;
    console.log(`\n  KB Ingredients (${kbItems.length}):`);
    if (kbItems.length === 0) {
      console.log('    (none)');
    } else {
      for (const item of kbItems.sort((a, b) => a.name.localeCompare(b.name))) {
        console.log(`    • ${item.name} (INCI: ${item.inci})`);
        console.log(`      Source: ${item.tableSource}`);
        console.log(`      Leave-on limit: ${item.hasLeaveOnLimit ? 'yes' : 'no'}`);
        console.log(`      Rinse-off limit: ${item.hasRinseOffLimit ? 'yes' : 'no'}`);
        console.log(`      Compliance enforcement: ${item.participatesInCompliance ? 'yes' : 'no'}`);
      }
    }

    // Base Ingredients
    const baseItems = inventory[category].base;
    console.log(`\n  Base Ingredients (${baseItems.length}):`);
    if (baseItems.length === 0) {
      console.log('    (none)');
    } else {
      for (const item of baseItems.sort((a, b) => a.name.localeCompare(b.name))) {
        console.log(`    • ${item.name} (INCI: ${item.inci})`);
        console.log(`      Source: ${item.tableSource}`);
        console.log(`      Leave-on limit: ${item.hasLeaveOnLimit ? 'yes' : 'no'}`);
        console.log(`      Rinse-off limit: ${item.hasRinseOffLimit ? 'yes' : 'no'}`);
        console.log(`      Compliance enforcement: ${item.participatesInCompliance ? 'yes' : 'no'}`);
      }
    }

    // Custom Ingredients
    const customItems = inventory[category].custom;
    console.log(`\n  Custom Ingredients (${customItems.length}):`);
    if (customItems.length === 0) {
      console.log('    (none)');
    } else {
      for (const item of customItems.sort((a, b) => a.name.localeCompare(b.name))) {
        console.log(`    • ${item.name} (INCI: ${item.inci})`);
        console.log(`      Source: ${item.tableSource}`);
        console.log(`      Leave-on limit: ${item.hasLeaveOnLimit ? 'yes' : 'no'}`);
        console.log(`      Rinse-off limit: ${item.hasRinseOffLimit ? 'yes' : 'no'}`);
        console.log(`      Compliance enforcement: ${item.participatesInCompliance ? 'yes' : 'no'}`);
      }
    }
  }

  // Final Summary
  console.log(`\n${'='.repeat(100)}`);
  console.log('📊 FINAL SUMMARY');
  console.log('='.repeat(100) + '\n');

  for (const category of ['Oils & Butters', 'Emulsifiers', 'Actives'] as const) {
    const kbCount = inventory[category].kb.length;
    const baseCount = inventory[category].base.length;
    const customCount = inventory[category].custom.length;
    const total = kbCount + baseCount + customCount;

    console.log(`${category}:`);
    console.log(`  KB: ${kbCount}`);
    console.log(`  Base: ${baseCount}`);
    console.log(`  Custom: ${customCount}`);
    console.log(`  Total: ${total}\n`);
  }

  const totalKb = 
    inventory['Oils & Butters'].kb.length +
    inventory['Emulsifiers'].kb.length +
    inventory['Actives'].kb.length;

  const totalBase = 
    inventory['Oils & Butters'].base.length +
    inventory['Emulsifiers'].base.length +
    inventory['Actives'].base.length;

  const totalCustom = 
    inventory['Oils & Butters'].custom.length +
    inventory['Emulsifiers'].custom.length +
    inventory['Actives'].custom.length;

  console.log('Grand Totals:');
  console.log(`  KB: ${totalKb}`);
  console.log(`  Base: ${totalBase}`);
  console.log(`  Custom: ${totalCustom}`);
  console.log(`  Total: ${totalKb + totalBase + totalCustom}\n`);

  console.log('✅ Analysis complete!\n');
}

function normalizeCategory(category: string | null | undefined): 'Oils & Butters' | 'Emulsifiers' | 'Actives' | null {
  if (!category) return null;

  const normalized = category.trim();

  // Oils & Butters
  if (normalized === 'Oils & Butters') {
    return 'Oils & Butters';
  }

  // Emulsifiers
  if (normalized === 'Emulsifiers' || normalized === 'Emulsifier/Thickener') {
    return 'Emulsifiers';
  }

  // Actives
  if (normalized === 'Actives' || normalized === 'Active/Extract') {
    return 'Actives';
  }

  return null;
}

// Run the analysis
analyzeInventory().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});

