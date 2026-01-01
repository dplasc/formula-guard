# EU Annex CSV Ingestion Pipeline

This pipeline ingests CosIng Annex II and III CSV exports into the `eu_annex_entries` table with automatic INCI normalization, idempotency checks, and comprehensive logging.

## Features

- **CSV Parsing**: Handles quoted fields and standard CSV format
- **INCI Normalization**: Automatically resolves INCI names to canonical form using the synonym database
- **Idempotency**: Prevents duplicate entries on re-import by checking existing records
- **Dry-Run Mode**: Test imports without making database changes
- **Comprehensive Logging**: Detailed progress and error reporting
- **Flexible Column Mapping**: Auto-detects CSV columns or allows manual specification

## Prerequisites

1. Install dependencies:
```bash
npm install
```

2. Ensure your Supabase environment variables are set:
- `NEXT_PUBLIC_SUPABASE_URL` (or `SUPABASE_URL`)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (required for CLI ingestion scripts)

   **Important for CLI usage**: The `SUPABASE_SERVICE_ROLE_KEY` is required when running ingestion scripts from the command line. This key bypasses Row Level Security (RLS) and should be kept secure. Never commit this key to version control.

3. Ensure the `eu_annex_entries` table exists (run migration if needed)

## Usage

### Basic Usage

```bash
npm run ingest:eu-annex <csv-file> --annex <II|III|VI>
```

### Examples

**Dry-run (test without inserting):**
```bash
npm run ingest:eu-annex annex-ii.csv --annex II --dry-run
```

**Import Annex III with custom source:**
```bash
npm run ingest:eu-annex annex-iii.csv --annex III --source "CosIng Export 2024-01-15"
```

**Import with custom column mappings:**
```bash
npm run ingest:eu-annex data.csv --annex II \
  --inci-column "INCI Name" \
  --product-type-column "Product Type" \
  --conditions-column "Restrictions"
```

**Using tsx directly:**
```bash
npx tsx scripts/ingest-eu-annex.ts annex-ii.csv --annex II --dry-run
```

## Command-Line Options

| Option | Description | Required | Default |
|--------|-------------|----------|---------|
| `<csv-file>` | Path to CSV file | Yes | - |
| `--annex <II\|III\|VI>` | Annex type | Yes | - |
| `--source <string>` | Source identifier | No | "CosIng CSV Import" |
| `--reference-url <url>` | Reference URL | No | "https://ec.europa.eu/growth/tools-databases/cosing/" |
| `--dry-run` | Run without inserting | No | false |
| `--inci-column <name>` | CSV column for INCI (primary) | No | Auto-detected |
| `--inci-fallback-column <name>` | CSV column for INCI fallback (e.g., "Chemical name / INN") | No | Auto-detected |
| `--product-type-column <name>` | CSV column for product type | No | Auto-detected |
| `--max-percentage-column <name>` | CSV column for max % | No | Auto-detected |
| `--conditions-column <name>` | CSV column for conditions | No | Auto-detected |

## CSV Format

The pipeline expects CSV files with the following columns (auto-detected or manually specified):

- **INCI Name** (primary): The ingredient INCI name from the primary column (e.g., "Identified INGREDIENTS or substances e.g.")
- **INCI Name** (fallback): If the primary column is empty, the pipeline will use the fallback column (e.g., "Chemical name / INN")
- **Product Type**: `leave-on`, `rinse-off`, or `both` (optional, defaults to `both`)
- **Max Percentage**: Maximum allowed percentage for Annex III/VI (optional, null for Annex II)
- **Conditions**: Additional conditions or restrictions text (optional)
- **Active From/To**: Date fields for entry validity (optional)

### INCI Name Extraction Logic

The pipeline implements a fallback mechanism for extracting INCI names:

1. **Primary column**: First tries to read from the configured INCI column (auto-detected as "Identified INGREDIENTS or substances e.g." for CosIng Annex II)
2. **Fallback column**: If the primary column is empty, null, or contains only "-", falls back to "Chemical name / INN" column
3. **Normalization**: Whitespace is trimmed, and "-" values are treated as empty
4. **Skip row**: If both columns are empty after normalization, the row is skipped

### Example CSV (Annex II)

```csv
INCI Name,Product Type,Restrictions
"Hydroquinone","both","Prohibited in all cosmetic products"
"Mercury compounds","both","Prohibited"
```

### Example CSV (Annex III)

```csv
INCI Name,Product Type,Max Percentage,Conditions
"Resorcinol","leave-on",0.5,"Not to be used in hair dye products"
"Salicylic Acid","both",3.0,"Not to be used in products for children under 3 years"
```

## Idempotency

The pipeline ensures idempotency by checking for existing entries based on:
- `inci_canonical`
- `annex`
- `product_type`
- `max_percentage`

If an entry with the same combination exists, it will be skipped (counted as a duplicate).

## INCI Normalization

All INCI names are automatically normalized to canonical form using the `ingredient_synonyms` table. This ensures:
- Trade names are resolved to standard INCI names
- Variations are mapped to canonical forms
- Consistent data across imports

## Logging

The pipeline provides detailed logging:

- **Progress**: Step-by-step progress through parsing, normalization, mapping, and insertion
- **Statistics**: Total rows, inserted, duplicates, skipped, errors
- **Warnings**: Non-fatal issues (missing data, mapping failures)
- **Errors**: Fatal errors that prevent insertion

### Example Output

```
============================================================
EU Annex CSV Ingestion Pipeline
============================================================
CSV File: annex-ii.csv
Annex: II
Source: CosIng CSV Import
Reference URL: https://ec.europa.eu/growth/tools-databases/cosing/
Mode: DRY RUN (no changes)
============================================================

Reading CSV file: annex-ii.csv...
Read 15234 characters from CSV file

[ingestEuAnnexCsv] Parsing CSV...
[ingestEuAnnexCsv] Column mappings: { inci: 'INCI Name', ... }
[ingestEuAnnexCsv] Normalizing INCI names...
[ingestEuAnnexCsv] Normalized 245 INCI names
[ingestEuAnnexCsv] Mapping rows to entries...
[ingestEuAnnexCsv] Mapped 245 entries
[ingestEuAnnexCsv] Checking for duplicates...
[ingestEuAnnexCsv] Found 12 duplicates, 233 new entries to insert
[ingestEuAnnexCsv] DRY RUN: Would insert 233 entries

============================================================
Ingestion Results
============================================================
Status: SUCCESS
Total Rows: 245
Inserted: 233
Duplicates (skipped): 12
Skipped: 0
Errors: 0
```

## Error Handling

The pipeline handles various error scenarios:

- **File not found**: Returns error immediately
- **Invalid CSV format**: Reports parsing errors
- **Missing required columns**: Returns error with suggestions
- **Database errors**: Reports batch insertion errors
- **Normalization failures**: Continues with original INCI name

## Best Practices

1. **Always use dry-run first**: Test your CSV file before actual import
   ```bash
   npm run ingest:eu-annex data.csv --annex II --dry-run
   ```

2. **Verify column mappings**: Check the auto-detected mappings in the logs

3. **Check for duplicates**: Review duplicate counts to understand existing data

4. **Use descriptive sources**: Include dates or version info in `--source` for traceability
   ```bash
   --source "CosIng Export 2024-01-15 v2.1"
   ```

5. **Monitor errors**: Review error messages and fix CSV issues before re-running

## Troubleshooting

### "Could not detect INCI column"
- Manually specify the column: `--inci-column "Your INCI Column Name"`

### "Error checking duplicates"
- Verify database connection and table permissions
- Check Supabase environment variables
- For CLI scripts, ensure `SUPABASE_SERVICE_ROLE_KEY` is set

### "Missing SUPABASE_SERVICE_ROLE_KEY environment variable"
- This error occurs when running CLI ingestion scripts without the required service role key
- Add `SUPABASE_SERVICE_ROLE_KEY` to your `.env` file or environment variables
- Find your service role key in the Supabase dashboard under Project Settings > API

### "Error inserting batch"
- Check database constraints
- Verify data types match table schema
- Review error message for specific field issues

### High duplicate count
- Normal - indicates data already exists
- Re-imports are safe due to idempotency

## API Usage

The ingestion pipeline can also be used programmatically:

```typescript
import { ingestEuAnnexCsv } from '@/lib/ingestion/euAnnexIngestion';

const csvContent = await fs.readFile('annex-ii.csv', 'utf-8');
const result = await ingestEuAnnexCsv(csvContent, {
  annex: 'II',
  source: 'CosIng Export 2024',
  referenceUrl: 'https://example.com/reference',
  dryRun: false,
  logProgress: true,
});

console.log(`Inserted: ${result.stats.inserted}`);
console.log(`Duplicates: ${result.stats.duplicates}`);
```

## Related Files

- `lib/ingestion/csvParser.ts` - CSV parsing utilities
- `lib/ingestion/inciNormalizer.ts` - INCI normalization
- `lib/ingestion/cosingMapper.ts` - CosIng format mapping
- `lib/ingestion/euAnnexIngestion.ts` - Main ingestion logic
- `scripts/ingest-eu-annex.ts` - CLI script

