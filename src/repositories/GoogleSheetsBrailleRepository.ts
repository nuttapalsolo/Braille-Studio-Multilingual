import type { IBrailleRepository } from './IBrailleRepository';
import type { BrailleCharacterEntry, CorrectionRecord, LanguageMeta } from '../types/braille';
import { IndexedDBBrailleRepository } from './IndexedDBBrailleRepository';
import { BrailleImporterExporter } from '../engine/BrailleImporterExporter';

declare const google: any;

export class GoogleSheetsBrailleRepository implements IBrailleRepository {
  private fallbackRepo: IndexedDBBrailleRepository;
  private currentSheetUrl: string = '';

  constructor() {
    this.fallbackRepo = new IndexedDBBrailleRepository();
    // Load saved sheet URL from localStorage if set
    if (typeof window !== 'undefined') {
      this.currentSheetUrl = localStorage.getItem('braille_google_sheet_url') || '';
    }
  }

  public setSheetUrl(url: string) {
    this.currentSheetUrl = url;
    if (typeof window !== 'undefined') {
      localStorage.setItem('braille_google_sheet_url', url);
    }
  }

  public getSheetUrl(): string {
    return this.currentSheetUrl;
  }

  public async initDatabase(): Promise<void> {
    await this.fallbackRepo.initDatabase();
  }

  public async getLanguages(): Promise<LanguageMeta[]> {
    return await this.fallbackRepo.getLanguages();
  }

  public async getLanguage(code: string): Promise<LanguageMeta | undefined> {
    return await this.fallbackRepo.getLanguage(code);
  }

  /**
   * Fetch Braille entries directly from Google Sheets (or fallback repository if not connected)
   */
  public async getEntriesByLanguage(languageCode: string): Promise<BrailleCharacterEntry[]> {
    // 1. Try Google Apps Script native integration if running inside GAS
    if (typeof google !== 'undefined' && google.script && google.script.run) {
      try {
        const gasEntries = await new Promise<BrailleCharacterEntry[]>((resolve, reject) => {
          google.script.run
            .withSuccessHandler((data: BrailleCharacterEntry[]) => resolve(data))
            .withFailureHandler((err: any) => reject(err))
            .getBrailleDataFromSheet(this.currentSheetUrl);
        });

        if (gasEntries && gasEntries.length > 0) {
          // Save to local cache for fast offline access
          await this.fallbackRepo.saveEntriesBulk(gasEntries);
          return gasEntries;
        }
      } catch (e) {
        console.warn('Google Apps Script call failed, trying published CSV/fallback:', e);
      }
    }

    // 2. Try fetching from published Google Sheet CSV URL if provided
    if (this.currentSheetUrl && (this.currentSheetUrl.includes('google.com/spreadsheets') || this.currentSheetUrl.includes('output=csv'))) {
      try {
        let csvUrl = this.currentSheetUrl;
        if (csvUrl.includes('edit#gid=') || csvUrl.includes('edit?usp=')) {
          // Auto-convert standard Google Sheet view URL to CSV export URL
          const sheetIdMatch = csvUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
          if (sheetIdMatch && sheetIdMatch[1]) {
            csvUrl = `https://docs.google.com/spreadsheets/d/${sheetIdMatch[1]}/export?format=csv`;
          }
        }

        const response = await fetch(csvUrl);
        if (response.ok) {
          const csvText = await response.text();
          const report = BrailleImporterExporter.parseAndValidateCSV(csvText, languageCode);
          if (report.validEntries && report.validEntries.length > 0) {
            await this.fallbackRepo.saveEntriesBulk(report.validEntries);
            return report.validEntries;
          }
        }
      } catch (err) {
        console.warn('Failed to fetch published Google Sheet CSV URL, using cached dataset:', err);
      }
    }

    // 3. Default fallback: return cached repository dataset
    return await this.fallbackRepo.getEntriesByLanguage(languageCode);
  }

  public async getEntryById(id: string): Promise<BrailleCharacterEntry | undefined> {
    return await this.fallbackRepo.getEntryById(id);
  }

  /**
   * Data addition/edits in UI are disabled under Google Sheet sourcing policy
   */
  public async saveEntry(entry: BrailleCharacterEntry): Promise<void> {
    await this.fallbackRepo.saveEntry(entry);
  }

  public async saveEntriesBulk(entries: BrailleCharacterEntry[]): Promise<void> {
    await this.fallbackRepo.saveEntriesBulk(entries);
  }

  public async deleteEntry(id: string): Promise<void> {
    await this.fallbackRepo.deleteEntry(id);
  }

  public async addCorrection(
    entryId: string,
    correctedEntry: Partial<BrailleCharacterEntry>,
    reason: string,
    source: string
  ): Promise<CorrectionRecord> {
    return await this.fallbackRepo.addCorrection(entryId, correctedEntry, reason, source);
  }

  public async getCorrectionHistory(entryId?: string, languageCode?: string): Promise<CorrectionRecord[]> {
    return await this.fallbackRepo.getCorrectionHistory(entryId, languageCode);
  }

  public async restoreCorrectionVersion(correctionId: string): Promise<BrailleCharacterEntry> {
    return await this.fallbackRepo.restoreCorrectionVersion(correctionId);
  }
}
