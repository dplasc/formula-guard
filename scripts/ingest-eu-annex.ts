#!/usr/bin/env node
import 'dotenv/config'

/**
 * CLI script for ingesting CosIng Annex II/III CSV files into eu_annex_entries table
 * 
 * Usage:
 *   npx tsx scripts/ingest-eu-annex.ts <csv-file> --annex <II|III|VI> [options]
 * 
 * Options:
 *   --annex <II|III|VI>     Annex type (required)
 *   --source <string>        Source identifier (default: "CosIng CSV Import")
 *   --reference-url <url>   Reference URL (default: "https://ec.europa.eu/growth/tools-databases/cosing/")
 *   --dry-run               Run without inserting data
 *   --inci-column <name>    CSV column name for INCI (auto-detected if not provided)
 *   --product-type-column <name>  CSV column name for product type
 *   --max-percentage-column <name> CSV column name for max percentage
 *   --conditions-column <name>     CSV column name for conditions
 */

import { readFileSync } from 'fs';
import { ingestEuAnnexCsv } from '../lib/ingestion/euAnnexIngestion';
import { createAdminClient } from '../lib/supabase/admin';
import type { AnnexType } from '../app/builder/actions-eu-compliance';

interface CliOptions {
  csvFile: string;
  annex: AnnexType;
  source?: string;
  referenceUrl?: string;
  dryRun?: boolean;
  inciColumn?: string;
  inciFallbackColumn?: string;
  productTypeColumn?: string;
  maxPercentageColumn?: string;
  conditionsColumn?: string;
  skipDuplicatesCheck?: boolean;
}

function parseArgs(): CliOptions | null {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log(`
Usage: npx tsx scripts/ingest-eu-annex.ts <csv-file> --annex <II|III|VI> [options]

Required:
  <csv-file>              Path to CSV file
  --annex <II|III|VI>     Annex type

Options:
  --source <string>              Source identifier (default: "CosIng CSV Import")
  --reference-url <url>          Reference URL (default: "https://ec.europa.eu/growth/tools-databases/cosing/")
  --dry-run                      Run without inserting data
  --inci-column <name>           CSV column name for INCI (auto-detected if not provided)
  --inci-fallback-column <name>  CSV column name for INCI fallback (e.g., "Chemical name / INN")
  --product-type-column <name>   CSV column name for product type
  --max-percentage-column <name> CSV column name for max percentage
  --conditions-column <name>     CSV column name for conditions
  --skip-duplicates-check        Skip duplicate checking (useful if database connection fails)

Examples:
  npx tsx scripts/ingest-eu-annex.ts annex-ii.csv --annex II --dry-run
  npx tsx scripts/ingest-eu-annex.ts annex-iii.csv --annex III --source "CosIng Export 2024"
`);
    return null;
  }

  const csvFile = args[0];
  let annex: AnnexType | undefined;
  let source: string | undefined;
  let referenceUrl: string | undefined;
  let dryRun = false;
  let inciColumn: string | undefined;
  let inciFallbackColumn: string | undefined;
  let productTypeColumn: string | undefined;
  let maxPercentageColumn: string | undefined;
  let conditionsColumn: string | undefined;
  let skipDuplicatesCheck = false;

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case '--annex':
        if (!nextArg || !['II', 'III', 'VI'].includes(nextArg)) {
          console.error('Error: --annex must be II, III, or VI');
          return null;
        }
        annex = nextArg as AnnexType;
        i++;
        break;
      case '--source':
        source = nextArg;
        i++;
        break;
      case '--reference-url':
        referenceUrl = nextArg;
        i++;
        break;
      case '--dry-run':
        dryRun = true;
        break;
      case '--inci-column':
        inciColumn = nextArg;
        i++;
        break;
      case '--inci-fallback-column':
        inciFallbackColumn = nextArg;
        i++;
        break;
      case '--product-type-column':
        productTypeColumn = nextArg;
        i++;
        break;
      case '--max-percentage-column':
        maxPercentageColumn = nextArg;
        i++;
        break;
      case '--conditions-column':
        conditionsColumn = nextArg;
        i++;
        break;
      case '--skip-duplicates-check':
        skipDuplicatesCheck = true;
        break;
      default:
        console.error(`Error: Unknown option ${arg}`);
        return null;
    }
  }

  if (!annex) {
    console.error('Error: --annex is required');
    return null;
  }

  return {
    csvFile,
    annex,
    source,
    referenceUrl,
    dryRun,
    inciColumn,
    inciFallbackColumn,
    productTypeColumn,
    maxPercentageColumn,
    conditionsColumn,
    skipDuplicatesCheck,
  };
}

async function main() {
  const options = parseArgs();
  if (!options) {
    process.exit(1);
  }

  console.log('='.repeat(60));
  console.log('EU Annex CSV Ingestion Pipeline');
  console.log('='.repeat(60));
  console.log(`CSV File: ${options.csvFile}`);
  console.log(`Annex: ${options.annex}`);
  console.log(`Source: ${options.source || 'CosIng CSV Import'}`);
  console.log(`Reference URL: ${options.referenceUrl || 'https://ec.europa.eu/growth/tools-databases/cosing/'}`);
  console.log(`Mode: ${options.dryRun ? 'DRY RUN (no changes)' : 'LIVE (will insert data)'}`);
  console.log(`Skip Duplicates Check: ${options.skipDuplicatesCheck ? 'YES' : 'NO'}`);
  console.log('='.repeat(60));
  console.log();

  try {
    // Create admin client for CLI (avoids cookies() requirement)
    console.log('Initializing Supabase admin client...');
    const supabaseClient = createAdminClient();
    console.log('Supabase admin client initialized');
    console.log();

    // Read CSV file
    console.log(`Reading CSV file: ${options.csvFile}...`);
    const csvContent = readFileSync(options.csvFile, 'utf-8');
    console.log(`Read ${csvContent.length} characters from CSV file`);
    console.log();

    // Run ingestion with admin client
    const result = await ingestEuAnnexCsv(csvContent, {
      annex: options.annex,
      source: options.source || 'CosIng CSV Import',
      referenceUrl: options.referenceUrl || 'https://ec.europa.eu/growth/tools-databases/cosing/',
      dryRun: options.dryRun,
      skipDuplicatesCheck: options.skipDuplicatesCheck,
      columnMappings: {
        inci: options.inciColumn,
        inciFallback: options.inciFallbackColumn,
        productType: options.productTypeColumn,
        maxPercentage: options.maxPercentageColumn,
        conditions: options.conditionsColumn,
      },
      logProgress: true,
      supabaseClient, // Use admin client for CLI
    });

    // Print results
    console.log();
    console.log('='.repeat(60));
    console.log('Ingestion Results');
    console.log('='.repeat(60));
    console.log(`Status: ${result.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`Total Rows: ${result.stats.totalRows}`);
    console.log(`Inserted: ${result.stats.inserted}`);
    console.log(`Duplicates (skipped): ${result.stats.duplicates}`);
    console.log(`Skipped: ${result.stats.skipped}`);
    console.log(`Errors: ${result.stats.errors}`);
    console.log();

    if (result.warnings.length > 0) {
      console.log(`Warnings (${result.warnings.length}):`);
      result.warnings.slice(0, 10).forEach(warning => console.log(`  - ${warning}`));
      if (result.warnings.length > 10) {
        console.log(`  ... and ${result.warnings.length - 10} more warnings`);
      }
      console.log();
    }

    if (result.errors.length > 0) {
      console.log(`Errors (${result.errors.length}):`);
      result.errors.forEach(error => console.log(`  - ${error}`));
      console.log();
    }

    process.exit(result.success ? 0 : 1);
  } catch (error) {
    console.error('Fatal error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();

