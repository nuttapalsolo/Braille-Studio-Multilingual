import type { BrailleCharacterEntry, CorrectionRecord, LanguageMeta } from '../types/braille';

export interface IBrailleRepository {
  getLanguages(): Promise<LanguageMeta[]>;
  getLanguage(code: string): Promise<LanguageMeta | undefined>;
  
  getEntriesByLanguage(languageCode: string): Promise<BrailleCharacterEntry[]>;
  getEntryById(id: string): Promise<BrailleCharacterEntry | undefined>;
  saveEntry(entry: BrailleCharacterEntry): Promise<void>;
  saveEntriesBulk(entries: BrailleCharacterEntry[]): Promise<void>;
  deleteEntry(id: string): Promise<void>;
  
  addCorrection(
    entryId: string,
    correctedEntry: Partial<BrailleCharacterEntry>,
    reason: string,
    source: string
  ): Promise<CorrectionRecord>;
  getCorrectionHistory(entryId?: string, languageCode?: string): Promise<CorrectionRecord[]>;
  restoreCorrectionVersion(correctionId: string): Promise<BrailleCharacterEntry>;
  
  initDatabase(): Promise<void>;
}
