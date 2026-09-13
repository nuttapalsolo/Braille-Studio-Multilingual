import type { BrailleCharacterEntry } from '../types/braille';
import { formatDotsString, unicodeToDots } from './unicodeBraille';

export interface BreakdownItem {
  character: string;
  brailleUnicode: string;
  dots: number[];
  formattedDots: string;
  category: string;
  source: string;
  verified: boolean;
  type: string;
  foundInDataset: boolean;
  note?: string;
}

export interface ConversionResult {
  originalText: string;
  brailleText: string;
  breakdown: BreakdownItem[];
  language: string;
  totalChars: number;
  mappedCharsCount: number;
  unmappedCharsCount: number;
}

export class BrailleConverter {
  private entryMap: Map<string, BrailleCharacterEntry> = new Map();
  private reverseMap: Map<string, BrailleCharacterEntry> = new Map();

  constructor(entries: BrailleCharacterEntry[] = []) {
    this.setDataset(entries);
  }

  public setDataset(entries: BrailleCharacterEntry[]) {
    this.entryMap.clear();
    this.reverseMap.clear();

    for (const entry of entries) {
      if (entry.character) {
        this.entryMap.set(entry.character, entry);
        if (entry.character.length === 1 && entry.character !== entry.character.toLowerCase()) {
          this.entryMap.set(entry.character.toLowerCase(), entry);
        }
      }
      if (entry.brailleUnicode) {
        this.reverseMap.set(entry.brailleUnicode, entry);
      }
    }
  }

  /**
   * Converts plain text to Braille Unicode sequence with greedy multi-character prefix matching
   */
  public textToBraille(text: string, languageCode: string): ConversionResult {
    if (!text) {
      return {
        originalText: '',
        brailleText: '',
        breakdown: [],
        language: languageCode,
        totalChars: 0,
        mappedCharsCount: 0,
        unmappedCharsCount: 0,
      };
    }

    const breakdown: BreakdownItem[] = [];
    let brailleText = '';
    let mappedCount = 0;
    let unmappedCount = 0;

    const chars = Array.from(text);
    let i = 0;

    while (i < chars.length) {
      let matched = false;

      // Try multi-character matches first (greedy match up to 4 characters e.g. "きゃ", "ぎゃ", "ぴょ")
      const maxSubLen = Math.min(4, chars.length - i);
      for (let len = maxSubLen; len >= 1; len--) {
        const subStr = chars.slice(i, i + len).join('');
        const match = this.entryMap.get(subStr) || this.entryMap.get(subStr.toLowerCase());

        if (match) {
          brailleText += match.brailleUnicode;
          mappedCount += len;
          breakdown.push({
            character: subStr,
            brailleUnicode: match.brailleUnicode,
            dots: match.dots,
            formattedDots: formatDotsString(match.dots),
            category: match.category || match.type || 'General',
            source: match.source || 'Dataset',
            verified: match.verified,
            type: match.type || 'letter',
            foundInDataset: true,
            note: match.note,
          });
          i += len;
          matched = true;
          break;
        }
      }

      if (!matched) {
        const singleChar = chars[i];
        if (singleChar === ' ') {
          const spaceChar = '⠀';
          brailleText += spaceChar;
          mappedCount++;
          breakdown.push({
            character: ' ',
            brailleUnicode: spaceChar,
            dots: [],
            formattedDots: 'Empty',
            category: 'Space',
            source: 'Standard',
            verified: true,
            type: 'special',
            foundInDataset: true,
            note: 'Space character',
          });
        } else {
          brailleText += singleChar;
          unmappedCount++;
          breakdown.push({
            character: singleChar,
            brailleUnicode: '?',
            dots: [],
            formattedDots: 'Unmapped',
            category: 'Unmapped',
            source: 'N/A',
            verified: false,
            type: 'unknown',
            foundInDataset: false,
            note: 'No Braille mapping in active dataset',
          });
        }
        i++;
      }
    }

    return {
      originalText: text,
      brailleText,
      breakdown,
      language: languageCode,
      totalChars: chars.length,
      mappedCharsCount: mappedCount,
      unmappedCharsCount: unmappedCount,
    };
  }

  /**
   * Converts Braille Unicode sequence to text with greedy multi-cell lookup
   */
  public brailleToText(braille: string, languageCode: string): ConversionResult {
    if (!braille) {
      return {
        originalText: '',
        brailleText: '',
        breakdown: [],
        language: languageCode,
        totalChars: 0,
        mappedCharsCount: 0,
        unmappedCharsCount: 0,
      };
    }

    const breakdown: BreakdownItem[] = [];
    let plainText = '';
    let mappedCount = 0;
    let unmappedCount = 0;

    const chars = Array.from(braille);
    let i = 0;

    while (i < chars.length) {
      let matched = false;

      // Try multi-cell Braille matches first (e.g. 2-cell Dakuten/Yōon sequence ⠐⠱ -> ざ)
      const maxSubLen = Math.min(3, chars.length - i);
      for (let len = maxSubLen; len >= 1; len--) {
        const subBraille = chars.slice(i, i + len).join('');
        const match = this.reverseMap.get(subBraille);

        if (match) {
          plainText += match.character;
          mappedCount += len;
          breakdown.push({
            character: match.character,
            brailleUnicode: subBraille,
            dots: match.dots,
            formattedDots: formatDotsString(match.dots),
            category: match.category || match.type || 'General',
            source: match.source || 'Dataset',
            verified: match.verified,
            type: match.type || 'letter',
            foundInDataset: true,
            note: match.note,
          });
          i += len;
          matched = true;
          break;
        }
      }

      if (!matched) {
        const char = chars[i];
        if (char === '⠀' || char === ' ') {
          plainText += ' ';
          mappedCount++;
          breakdown.push({
            character: ' ',
            brailleUnicode: '⠀',
            dots: [],
            formattedDots: 'Empty',
            category: 'Space',
            source: 'Standard',
            verified: true,
            type: 'special',
            foundInDataset: true,
            note: 'Space character',
          });
        } else {
          const dots = unicodeToDots(char);
          const hasDots = dots.length > 0;
          
          plainText += char;
          unmappedCount++;
          breakdown.push({
            character: char,
            brailleUnicode: char,
            dots,
            formattedDots: hasDots ? formatDotsString(dots) : 'N/A',
            category: 'Unmapped Braille',
            source: 'Unicode Math',
            verified: false,
            type: 'unknown',
            foundInDataset: false,
            note: 'Braille character not found in language dictionary',
          });
        }
        i++;
      }
    }

    return {
      originalText: braille,
      brailleText: plainText,
      breakdown,
      language: languageCode,
      totalChars: chars.length,
      mappedCharsCount: mappedCount,
      unmappedCharsCount: unmappedCount,
    };
  }
}
