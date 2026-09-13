import type { BrailleCharacterEntry, ImportValidationReport } from '../types/braille';
import { dotsToUnicode, parseDotsString } from './unicodeBraille';

export class BrailleImporterExporter {
  public static exportJSON(entries: BrailleCharacterEntry[]): string {
    return JSON.stringify(entries, null, 2);
  }

  public static exportCSV(entries: BrailleCharacterEntry[]): string {
    const headers = [
      'id',
      'language',
      'character',
      'brailleUnicode',
      'dots',
      'type',
      'category',
      'rule',
      'source',
      'verified',
      'note',
    ];

    const escapeCsv = (str: string | undefined | null) => {
      if (str === undefined || str === null) return '""';
      const val = String(str).replace(/"/g, '""');
      return `"${val}"`;
    };

    const rows = entries.map(e => [
      escapeCsv(e.id),
      escapeCsv(e.language),
      escapeCsv(e.character),
      escapeCsv(e.brailleUnicode),
      escapeCsv(e.dots ? e.dots.join('-') : ''),
      escapeCsv(e.type),
      escapeCsv(e.category),
      escapeCsv(e.rule),
      escapeCsv(e.source),
      escapeCsv(e.verified ? 'true' : 'false'),
      escapeCsv(e.note),
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  public static parseAndValidateJSON(
    jsonString: string,
    targetLanguageCode: string,
    existingEntries: BrailleCharacterEntry[] = []
  ): ImportValidationReport {
    const errors: string[] = [];
    const warnings: string[] = [];
    const validEntries: BrailleCharacterEntry[] = [];
    const conflicts: { existing: BrailleCharacterEntry; imported: BrailleCharacterEntry }[] = [];

    const existingCharMap = new Map<string, BrailleCharacterEntry>();
    for (const item of existingEntries) {
      if (item.character) existingCharMap.set(item.character, item);
    }

    let parsedData: any;
    try {
      parsedData = JSON.parse(jsonString);
    } catch (e: any) {
      return {
        isValid: false,
        totalParsed: 0,
        validEntries: [],
        errors: [`Invalid JSON format: ${e.message}`],
        warnings: [],
        conflicts: [],
      };
    }

    const items = Array.isArray(parsedData) ? parsedData : [parsedData];
    const seenImportChars = new Set<string>();

    items.forEach((raw: any, index: number) => {
      const rowNum = index + 1;

      if (!raw.character && raw.character !== '') {
        errors.push(`Row ${rowNum}: Missing 'character' field.`);
        return;
      }

      const character = String(raw.character);
      if (seenImportChars.has(character)) {
        warnings.push(`Row ${rowNum}: Duplicate character '${character}' in import file. Only first occurrence used.`);
        return;
      }
      seenImportChars.add(character);

      let dots: number[] = [];
      if (Array.isArray(raw.dots)) {
        dots = raw.dots.map((d: any) => Number(d)).filter((d: number) => !isNaN(d));
      } else if (typeof raw.dots === 'string') {
        dots = parseDotsString(raw.dots);
      }

      const invalidDots = dots.filter(d => d < 1 || d > 8);
      if (invalidDots.length > 0) {
        errors.push(`Row ${rowNum} ('${character}'): Invalid dots [${invalidDots.join(', ')}]. Dots must be 1..8.`);
        return;
      }

      let brailleUnicode = raw.brailleUnicode || dotsToUnicode(dots);
      const expectedUnicode = dotsToUnicode(dots);

      if (brailleUnicode && brailleUnicode !== expectedUnicode) {
        warnings.push(
          `Row ${rowNum} ('${character}'): Provided brailleUnicode '${brailleUnicode}' doesn't match math dots unicode '${expectedUnicode}'. Fixed to '${expectedUnicode}'.`
        );
        brailleUnicode = expectedUnicode;
      }

      const entry: BrailleCharacterEntry = {
        id: raw.id || `${targetLanguageCode}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        language: raw.language || targetLanguageCode,
        character,
        brailleUnicode,
        dots,
        type: raw.type || 'letter',
        category: raw.category || 'General',
        rule: raw.rule || '',
        source: raw.source || 'Imported Dataset',
        verified: Boolean(raw.verified),
        note: raw.note || '',
        createdAt: raw.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (existingCharMap.has(character)) {
        const existing = existingCharMap.get(character)!;
        conflicts.push({ existing, imported: entry });
      }

      validEntries.push(entry);
    });

    return {
      isValid: errors.length === 0,
      totalParsed: items.length,
      validEntries,
      errors,
      warnings,
      conflicts,
    };
  }

  public static parseAndValidateCSV(
    csvString: string,
    targetLanguageCode: string,
    existingEntries: BrailleCharacterEntry[] = []
  ): ImportValidationReport {
    const lines = csvString.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length === 0) {
      return {
        isValid: false,
        totalParsed: 0,
        validEntries: [],
        errors: ['CSV file is empty.'],
        warnings: [],
        conflicts: [],
      };
    }

    const parseCsvRow = (rowStr: string): string[] => {
      const res: string[] = [];
      let inQuotes = false;
      let field = '';
      for (let i = 0; i < rowStr.length; i++) {
        const char = rowStr[i];
        if (char === '"') {
          if (inQuotes && rowStr[i + 1] === '"') {
            field += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          res.push(field.trim());
          field = '';
        } else {
          field += char;
        }
      }
      res.push(field.trim());
      return res;
    };

    const header = parseCsvRow(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
    const rows = lines.slice(1);
    const jsonList: any[] = [];

    rows.forEach(r => {
      const values = parseCsvRow(r);
      const obj: any = {};
      header.forEach((h, idx) => {
        obj[h] = values[idx] !== undefined ? values[idx] : '';
      });
      jsonList.push(obj);
    });

    return this.parseAndValidateJSON(JSON.stringify(jsonList), targetLanguageCode, existingEntries);
  }
}
