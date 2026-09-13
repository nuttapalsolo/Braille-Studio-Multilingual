import type { BrailleCharacterEntry, ValidationIssue, ValidationReport } from '../types/braille';
import { dotsToUnicode, formatDotsString } from './unicodeBraille';

export class BrailleValidator {
  public validateDataset(languageCode: string, entries: BrailleCharacterEntry[]): ValidationReport {
    const mismatches: ValidationIssue[] = [];
    let verifiedCount = 0;
    let unverifiedCount = 0;

    const charSeenMap = new Map<string, BrailleCharacterEntry>();

    for (const entry of entries) {
      if (entry.verified) {
        verifiedCount++;
      } else {
        unverifiedCount++;
      }

      if (charSeenMap.has(entry.character)) {
        const existing = charSeenMap.get(entry.character)!;
        mismatches.push({
          entryId: entry.id,
          character: entry.character,
          storedUnicode: entry.brailleUnicode,
          storedDots: entry.dots,
          expectedUnicode: existing.brailleUnicode,
          expectedDots: existing.dots,
          issueType: 'duplicate_character',
          message: `Duplicate entry for character '${entry.character}'. Conflicts with existing ID: ${existing.id}`,
          suggestion: 'Review and remove or merge duplicate mapping',
        });
      } else {
        charSeenMap.set(entry.character, entry);
      }

      const invalidDots = entry.dots.filter(d => d < 1 || d > 8);
      if (invalidDots.length > 0) {
        mismatches.push({
          entryId: entry.id,
          character: entry.character,
          storedUnicode: entry.brailleUnicode,
          storedDots: entry.dots,
          expectedUnicode: dotsToUnicode(entry.dots.filter(d => d >= 1 && d <= 8)),
          issueType: 'invalid_dot',
          message: `Invalid dot numbers [${invalidDots.join(', ')}] detected. Dots must be integers between 1 and 8.`,
          suggestion: 'Fix dot numbers to be within 1..8 range',
        });
      }

      const expectedUnicodeFromDots = dotsToUnicode(entry.dots);
      if (entry.brailleUnicode && entry.brailleUnicode !== expectedUnicodeFromDots) {
        mismatches.push({
          entryId: entry.id,
          character: entry.character,
          storedUnicode: entry.brailleUnicode,
          storedDots: entry.dots,
          expectedUnicode: expectedUnicodeFromDots,
          issueType: 'unicode_mismatch',
          message: `Mismatch between stored Braille Unicode '${entry.brailleUnicode}' and expected math Unicode '${expectedUnicodeFromDots}' derived from dots [${formatDotsString(entry.dots)}].`,
          suggestion: `Update Braille Unicode to '${expectedUnicodeFromDots}' or update dots to match '${entry.brailleUnicode}'`,
        });
      }

      if (!entry.verified) {
        mismatches.push({
          entryId: entry.id,
          character: entry.character,
          storedUnicode: entry.brailleUnicode,
          storedDots: entry.dots,
          expectedUnicode: expectedUnicodeFromDots,
          issueType: 'unverified',
          message: `Mapping for '${entry.character}' is marked as UNVERIFIED.`,
          suggestion: 'Review source documentation and mark verified when confirmed',
        });
      }
    }

    return {
      language: languageCode,
      totalEntries: entries.length,
      verifiedCount,
      unverifiedCount,
      mismatches,
      isValid: mismatches.filter(m => m.issueType !== 'unverified').length === 0,
    };
  }
}
