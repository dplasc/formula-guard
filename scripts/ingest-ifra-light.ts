import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";

type IfraRow = {
  Key: string;
  "Amendment number": number | string;
  "Name of the IFRA Standard": string;
  "CAS numbers"?: string;
  Synonyms?: string;
  "IFRA Standard type": string;
};

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

function parseArgs(argv: string[]) {
  const args = {
    csvFile: "",
    dryRun: false,
    source: "IFRA Standards Overview (Excel)",
    referenceUrl: "https://ifrafragrance.org/safe-use/standards",
  };

  const positional: string[] = [];
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") args.dryRun = true;
    else if (a === "--source") args.source = argv[++i] ?? args.source;
    else if (a === "--reference-url") args.referenceUrl = argv[++i] ?? args.referenceUrl;
    else positional.push(a);
  }
  args.csvFile = positional[0] ?? "";

  if (!args.csvFile) {
    throw new Error("Usage: npx tsx scripts/ingest-ifra-light.ts <csv-file> [--dry-run] [--source <string>] [--reference-url <url>]");
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv);

  console.log("Initializing Supabase admin client...");
  const supabaseUrl = requireEnv("SUPABASE_URL");
  const serviceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  console.log("Supabase admin client initialized");

  console.log(`Reading IFRA light CSV: ${args.csvFile}...`);
  const wb = XLSX.readFile(args.csvFile);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<IfraRow>(ws, { defval: "" });

  console.log(`Parsed rows: ${rows.length}`);

  // Validation and mapping
  let validCount = 0;
  let skippedCount = 0;
  const warnings: Array<{ row: number; reason: string }> = [];
  const validRecords: Array<{
    ifra_key: string;
    amendment_number: number;
    standard_name: string;
    cas_numbers: string | null;
    synonyms: string | null;
    ifra_standard_type: string;
    source: string;
    reference_url: string;
  }> = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 1;
    const reasons: string[] = [];

    // Validate required fields
    if (!row.Key || typeof row.Key !== "string" || row.Key.trim() === "") {
      reasons.push("missing or invalid Key");
    }
    
    const amendmentNum = row["Amendment number"];
    if (amendmentNum === undefined || amendmentNum === null || amendmentNum === "") {
      reasons.push("missing Amendment number");
    } else {
      const num = typeof amendmentNum === "number" ? amendmentNum : Number(amendmentNum);
      if (isNaN(num)) {
        reasons.push("Amendment number must be numeric");
      }
    }

    if (!row["Name of the IFRA Standard"] || typeof row["Name of the IFRA Standard"] !== "string" || row["Name of the IFRA Standard"].trim() === "") {
      reasons.push("missing or invalid Name of the IFRA Standard");
    }

    if (!row["IFRA Standard type"] || typeof row["IFRA Standard type"] !== "string" || row["IFRA Standard type"].trim() === "") {
      reasons.push("missing or invalid IFRA Standard type");
    }

    if (reasons.length > 0) {
      skippedCount++;
      warnings.push({ row: rowNum, reason: reasons.join("; ") });
    } else {
      validCount++;
      const amendmentNum = row["Amendment number"];
      const num = typeof amendmentNum === "number" ? amendmentNum : Number(amendmentNum);
      validRecords.push({
        ifra_key: row.Key.trim(),
        amendment_number: num,
        standard_name: row["Name of the IFRA Standard"].trim(),
        cas_numbers: row["CAS numbers"] && typeof row["CAS numbers"] === "string" ? row["CAS numbers"].trim() || null : null,
        synonyms: row.Synonyms && typeof row.Synonyms === "string" ? row.Synonyms.trim() || null : null,
        ifra_standard_type: row["IFRA Standard type"].trim(),
        source: args.source,
        reference_url: args.referenceUrl,
      });
    }
  }

  if (args.dryRun) {
    // Output dry-run summary
    console.log("\n=== DRY-RUN SUMMARY ===");
    console.log(`Total Rows: ${rows.length}`);
    console.log(`Valid: ${validCount}`);
    console.log(`Skipped: ${skippedCount}`);
    console.log(`Warnings: ${warnings.length}`);
    
    if (warnings.length > 0) {
      console.log("\nFirst 10 Warnings:");
      warnings.slice(0, 10).forEach((w) => {
        console.log(`  Row ${w.row}: ${w.reason}`);
      });
    }

    if (validRecords.length > 0) {
      console.log("\nPreview of first 3 mapped records:");
      console.log(JSON.stringify(validRecords.slice(0, 3), null, 2));
    }
  } else {
    // Live import
    console.log(`\nStarting LIVE import of ${validRecords.length} valid records...`);
    
    const BATCH_SIZE = 200;
    let upsertedCount = 0;
    let errorsCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < validRecords.length; i += BATCH_SIZE) {
      const batch = validRecords.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(validRecords.length / BATCH_SIZE);
      
      console.log(`Processing batch ${batchNum}/${totalBatches} (${batch.length} records)...`);
      
      const { error } = await supabase
        .from("ifra_entries")
        .upsert(batch, { onConflict: "ifra_key" });

      if (error) {
        errorsCount += batch.length;
        const errorMsg = `Batch ${batchNum}: ${error.message}`;
        errors.push(errorMsg);
        console.error(`ERROR: ${errorMsg}`);
      } else {
        upsertedCount += batch.length;
      }
    }

    // Output live import result
    console.log("\n=== LIVE IMPORT RESULT ===");
    const status = errorsCount === 0 ? "SUCCESS" : "FAILED";
    console.log(`Status: ${status}`);
    console.log(`Total Rows: ${rows.length}`);
    console.log(`Valid: ${validCount}`);
    console.log(`Skipped: ${skippedCount}`);
    console.log(`Upserted: ${upsertedCount}`);
    console.log(`Errors: ${errorsCount}`);
    
    if (errors.length > 0) {
      console.log("\nFirst 10 Errors:");
      errors.slice(0, 10).forEach((e) => {
        console.log(`  ${e}`);
      });
    }

    if (errorsCount > 0) {
      throw new Error(`Import failed with ${errorsCount} errors`);
    }
  }
}

main().catch((err) => {
  console.error("FAILED:", err?.message ?? err);
  process.exit(1);
});
