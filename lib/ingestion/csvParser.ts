/**
 * Simple CSV parser for CosIng Annex II/III exports
 * Handles quoted fields and basic CSV format
 */

export interface CsvRow {
  [key: string]: string;
}

export interface ParsedCsv {
  headers: string[];
  rows: CsvRow[];
  errors: string[];
}

/**
 * Parses a CSV string into rows and headers
 * @param csvContent Raw CSV content as string
 * @returns Parsed CSV with headers, rows, and any errors
 */
export function parseCsv(csvContent: string): ParsedCsv {
  const errors: string[] = [];
  const lines = csvContent.split(/\r?\n/).filter(line => line.trim().length > 0);
  
  if (lines.length === 0) {
    return { headers: [], rows: [], errors: ['CSV file is empty'] };
  }

  // Parse headers (first line)
  const headers = parseCsvLine(lines[0]);
  if (headers.length === 0) {
    return { headers: [], rows: [], errors: ['CSV file has no headers'] };
  }

  // Parse data rows
  const rows: CsvRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    try {
      const values = parseCsvLine(lines[i]);
      if (values.length === 0) {
        continue; // Skip empty rows
      }

      // Create row object from headers and values
      const row: CsvRow = {};
      for (let j = 0; j < headers.length; j++) {
        const header = headers[j]?.trim() || `column_${j}`;
        row[header] = values[j]?.trim() || '';
      }
      rows.push(row);
    } catch (error) {
      errors.push(`Error parsing line ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return { headers, rows, errors };
}

/**
 * Parses a single CSV line, handling quoted fields
 * @param line CSV line to parse
 * @returns Array of field values
 */
function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];
    const nextChar = i + 1 < line.length ? line[i + 1] : null;

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote inside quoted field
        current += '"';
        i += 2;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      values.push(current);
      current = '';
      i++;
    } else {
      current += char;
      i++;
    }
  }

  // Add the last field
  values.push(current);

  return values;
}

/**
 * Reads a CSV file from the filesystem
 * @param filePath Path to CSV file
 * @returns Parsed CSV content
 */
export async function readCsvFile(filePath: string): Promise<ParsedCsv> {
  try {
    const fs = await import('fs/promises');
    const content = await fs.readFile(filePath, 'utf-8');
    return parseCsv(content);
  } catch (error) {
    return {
      headers: [],
      rows: [],
      errors: [`Failed to read file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`],
    };
  }
}


