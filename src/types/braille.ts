export type BrailleCharacterType = 
  | 'consonant' 
  | 'vowel' 
  | 'tone' 
  | 'number' 
  | 'punctuation' 
  | 'letter' 
  | 'special' 
  | 'other';

export interface BrailleCharacterEntry {
  id: string;
  language: string; // e.g. "th", "en", "ja", "zh", "ko", "de", "fr", "es", "it", "ru"
  character: string;
  brailleUnicode: string;
  dots: number[]; // 1..6 or 1..8
  type: BrailleCharacterType | string;
  category?: string;
  rule?: string;
  source?: string;
  verified: boolean;
  note?: string;
  createdAt?: string;
  updatedAt?: string;
  version?: number;
}

export interface CorrectionRecord {
  id: string;
  entryId: string;
  language: string;
  character: string;
  originalBraille: string;
  originalDots: number[];
  correctedBraille: string;
  correctedDots: number[];
  reason: string;
  source: string;
  verified: boolean;
  timestamp: string;
  version: number;
}

export interface ValidationIssue {
  entryId?: string;
  character: string;
  storedUnicode: string;
  storedDots: number[];
  expectedUnicode: string;
  expectedDots?: number[];
  issueType: 'unicode_mismatch' | 'invalid_dot' | 'duplicate_character' | 'unverified' | 'conflict';
  message: string;
  suggestion?: string;
}

export interface ValidationReport {
  language: string;
  totalEntries: number;
  verifiedCount: number;
  unverifiedCount: number;
  mismatches: ValidationIssue[];
  isValid: boolean;
}

export interface LanguageMeta {
  code: string;
  name: string;
  nativeName: string;
  file: string;
  verified: boolean;
  note?: string;
  entryCount?: number;
}

export interface ExternalReferenceResult {
  sourceName: string;
  character: string;
  brailleUnicode: string;
  dots: number[];
  definition: string;
  romaji?: string;
  kana?: string;
  status: 'connected' | 'offline_fallback';
  verified: boolean;
}

export interface ImportValidationReport {
  isValid: boolean;
  totalParsed: number;
  validEntries: BrailleCharacterEntry[];
  errors: string[];
  warnings: string[];
  conflicts: {
    existing: BrailleCharacterEntry;
    imported: BrailleCharacterEntry;
  }[];
}
