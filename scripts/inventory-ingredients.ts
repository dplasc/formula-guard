#!/usr/bin/env node
import 'dotenv/config'

/**
 * CLI script to generate an inventory of all ingredients in the ingredient_kb table
 * 
 * Usage:
 *   npx tsx scripts/inventory-ingredients.ts
 * 
 * Output:
 *   A structured summary of ingredients grouped by category
 */

import { createAdminClient } from '../lib/supabase/admin';
import { writeFileSync } from 'fs';
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

interface CategorizedIngredients {
  [category: string]: IngredientKbRow[];
}

async function generateInventory() {
  try {
    console.log('🔍 Querying ingredient_kb table...\n');
    
    const supabase = createAdminClient();
    
    // Query all ingredients from ingredient_kb
    const { data, error } = await supabase
      .from('ingredient_kb')
      .select('inci, category, default_max_leave_on, default_max_rinse_off, is_fragrance_component, ifra_certificate_required, allergens, notes, source_urls')
      .order('category', { ascending: true, nullsFirst: false })
      .order('inci', { ascending: true });

    if (error) {
      console.error('❌ Database error:', error);
      process.exit(1);
    }

    if (!data || data.length === 0) {
      console.log('⚠️  No ingredients found in ingredient_kb table.');
      return;
    }

    // Group ingredients by category
    const categorized: CategorizedIngredients = {};
    const uncategorized: IngredientKbRow[] = [];

    for (const ingredient of data) {
      const category = ingredient.category || 'Uncategorized';
      if (category === 'Uncategorized') {
        uncategorized.push(ingredient);
      } else {
        if (!categorized[category]) {
          categorized[category] = [];
        }
        categorized[category].push(ingredient);
      }
    }

    // Print summary
    console.log('='.repeat(80));
    console.log('📊 INGREDIENT KNOWLEDGE BASE INVENTORY');
    console.log('='.repeat(80));
    console.log(`\nTotal Ingredients: ${data.length}`);
    console.log(`Categories: ${Object.keys(categorized).length}${uncategorized.length > 0 ? ' (+ Uncategorized)' : ''}\n`);

    // Print by category
    const sortedCategories = Object.keys(categorized).sort();
    
    for (const category of sortedCategories) {
      const ingredients = categorized[category];
      console.log(`\n${'─'.repeat(80)}`);
      console.log(`📁 ${category.toUpperCase()} (${ingredients.length} ingredients)`);
      console.log('─'.repeat(80));
      
      for (const ing of ingredients) {
        console.log(`\n  • ${ing.inci}`);
        
        // Flags
        const flags: string[] = [];
        if (ing.is_fragrance_component) flags.push('Fragrance Component');
        if (ing.ifra_certificate_required) flags.push('IFRA Certificate Required');
        if (ing.allergens && ing.allergens.length > 0) flags.push(`Allergens: ${ing.allergens.join(', ')}`);
        
        if (flags.length > 0) {
          console.log(`    Flags: ${flags.join(' | ')}`);
        }
        
        // Usage limits
        const limits: string[] = [];
        if (ing.default_max_leave_on !== null) {
          limits.push(`Max Leave-On: ${ing.default_max_leave_on}%`);
        }
        if (ing.default_max_rinse_off !== null) {
          limits.push(`Max Rinse-Off: ${ing.default_max_rinse_off}%`);
        }
        
        if (limits.length > 0) {
          console.log(`    Usage Limits: ${limits.join(' | ')}`);
        }
        
        // Notes
        if (ing.notes) {
          console.log(`    Notes: ${ing.notes.substring(0, 100)}${ing.notes.length > 100 ? '...' : ''}`);
        }
      }
    }

    // Print uncategorized if any
    if (uncategorized.length > 0) {
      console.log(`\n${'─'.repeat(80)}`);
      console.log(`📁 UNCATEGORIZED (${uncategorized.length} ingredients)`);
      console.log('─'.repeat(80));
      
      for (const ing of uncategorized) {
        console.log(`\n  • ${ing.inci}`);
        
        const flags: string[] = [];
        if (ing.is_fragrance_component) flags.push('Fragrance Component');
        if (ing.ifra_certificate_required) flags.push('IFRA Certificate Required');
        if (ing.allergens && ing.allergens.length > 0) flags.push(`Allergens: ${ing.allergens.join(', ')}`);
        
        if (flags.length > 0) {
          console.log(`    Flags: ${flags.join(' | ')}`);
        }
        
        const limits: string[] = [];
        if (ing.default_max_leave_on !== null) {
          limits.push(`Max Leave-On: ${ing.default_max_leave_on}%`);
        }
        if (ing.default_max_rinse_off !== null) {
          limits.push(`Max Rinse-Off: ${ing.default_max_rinse_off}%`);
        }
        
        if (limits.length > 0) {
          console.log(`    Usage Limits: ${limits.join(' | ')}`);
        }
        
        if (ing.notes) {
          console.log(`    Notes: ${ing.notes.substring(0, 100)}${ing.notes.length > 100 ? '...' : ''}`);
        }
      }
    }

    // Print category summary table
    console.log(`\n${'='.repeat(80)}`);
    console.log('📈 CATEGORY SUMMARY');
    console.log('='.repeat(80));
    console.log('\nCategory'.padEnd(30) + 'Count'.padStart(10));
    console.log('─'.repeat(40));
    
    for (const category of sortedCategories) {
      const count = categorized[category].length;
      console.log(category.padEnd(30) + count.toString().padStart(10));
    }
    
    if (uncategorized.length > 0) {
      console.log('Uncategorized'.padEnd(30) + uncategorized.length.toString().padStart(10));
    }
    
    console.log('─'.repeat(40));
    console.log('Total'.padEnd(30) + data.length.toString().padStart(10));
    
    // Print flag statistics
    console.log(`\n${'='.repeat(80)}`);
    console.log('🏷️  FLAG STATISTICS');
    console.log('='.repeat(80));
    
    const fragranceCount = data.filter(ing => ing.is_fragrance_component === true).length;
    const ifraCount = data.filter(ing => ing.ifra_certificate_required === true).length;
    const allergenCount = data.filter(ing => ing.allergens && ing.allergens.length > 0).length;
    const hasLeaveOnLimit = data.filter(ing => ing.default_max_leave_on !== null).length;
    const hasRinseOffLimit = data.filter(ing => ing.default_max_rinse_off !== null).length;
    
    console.log(`\nFragrance Components: ${fragranceCount}`);
    console.log(`IFRA Certificate Required: ${ifraCount}`);
    console.log(`Contains Allergens: ${allergenCount}`);
    console.log(`Has Leave-On Limit: ${hasLeaveOnLimit}`);
    console.log(`Has Rinse-Off Limit: ${hasRinseOffLimit}`);
    
    console.log(`\n${'='.repeat(80)}`);
    console.log('✅ Inventory generation complete!');
    console.log('='.repeat(80));
    
    // Generate JSON output for programmatic access
    const jsonOutput = {
      generatedAt: new Date().toISOString(),
      summary: {
        totalIngredients: data.length,
        totalCategories: Object.keys(categorized).length,
        uncategorizedCount: uncategorized.length,
      },
      categories: sortedCategories.map(cat => ({
        name: cat,
        count: categorized[cat].length,
        ingredients: categorized[cat].map(ing => ({
          inci: ing.inci,
          category: ing.category,
          default_max_leave_on: ing.default_max_leave_on,
          default_max_rinse_off: ing.default_max_rinse_off,
          is_fragrance_component: ing.is_fragrance_component,
          ifra_certificate_required: ing.ifra_certificate_required,
          allergens: ing.allergens,
          has_notes: !!ing.notes,
          has_source_urls: !!ing.source_urls,
        })),
      })),
      uncategorized: uncategorized.length > 0 ? uncategorized.map(ing => ({
        inci: ing.inci,
        category: ing.category,
        default_max_leave_on: ing.default_max_leave_on,
        default_max_rinse_off: ing.default_max_rinse_off,
        is_fragrance_component: ing.is_fragrance_component,
        ifra_certificate_required: ing.ifra_certificate_required,
        allergens: ing.allergens,
        has_notes: !!ing.notes,
        has_source_urls: !!ing.source_urls,
      })) : [],
      statistics: {
        fragrance_components: data.filter(ing => ing.is_fragrance_component === true).length,
        ifra_certificate_required: data.filter(ing => ing.ifra_certificate_required === true).length,
        contains_allergens: data.filter(ing => ing.allergens && ing.allergens.length > 0).length,
        has_leave_on_limit: data.filter(ing => ing.default_max_leave_on !== null).length,
        has_rinse_off_limit: data.filter(ing => ing.default_max_rinse_off !== null).length,
      },
    };
    
    // Write JSON to file
    const outputPath = join(process.cwd(), 'ingredient-inventory.json');
    writeFileSync(outputPath, JSON.stringify(jsonOutput, null, 2));
    console.log(`\n💾 JSON export saved to: ${outputPath}`);
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
    }
    process.exit(1);
  }
}

// Run the script
generateInventory();

