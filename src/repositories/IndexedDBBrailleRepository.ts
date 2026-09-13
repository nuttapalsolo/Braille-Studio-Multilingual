import Dexie, { type Table } from 'dexie';
import type { BrailleCharacterEntry, CorrectionRecord, LanguageMeta } from '../types/braille';
import type { IBrailleRepository } from './IBrailleRepository';
import { dotsToUnicode } from '../engine/unicodeBraille';

class BrailleDexieDatabase extends Dexie {
  entries!: Table<BrailleCharacterEntry, string>;
  corrections!: Table<CorrectionRecord, string>;
  languages!: Table<LanguageMeta, string>;

  constructor() {
    super('MultilingualBrailleDB');
    this.version(1).stores({
      entries: 'id, language, character, brailleUnicode, type, category, verified',
      corrections: 'id, entryId, language, character, timestamp, version',
      languages: 'code, name, file',
    });
  }
}

export class IndexedDBBrailleRepository implements IBrailleRepository {
  private db: BrailleDexieDatabase;
  private isInitialized = false;

  constructor() {
    this.db = new BrailleDexieDatabase();
  }

  public async initDatabase(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const res = await fetch('/data/braille/languages.json');
      if (res.ok) {
        const langsMeta: LanguageMeta[] = await res.json();
        await this.db.languages.bulkPut(langsMeta);

        // Sync JSON datasets from public folder into IndexedDB
        for (const lang of langsMeta) {
          try {
            const langRes = await fetch(`/data/braille/${lang.file}`);
            if (langRes.ok) {
              const entries: BrailleCharacterEntry[] = await langRes.json();
              if (entries && entries.length > 0) {
                await this.db.entries.bulkPut(entries);
              }
            }
          } catch (err) {
            console.warn(`Could not sync language dataset: ${lang.file}`, err);
          }
        }
      }
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize IndexedDB Braille repository:', error);
      this.isInitialized = true;
    }
  }

  public async getLanguages(): Promise<LanguageMeta[]> {
    await this.initDatabase();
    return await this.db.languages.toArray();
  }

  public async getLanguage(code: string): Promise<LanguageMeta | undefined> {
    await this.initDatabase();
    return await this.db.languages.get(code);
  }

  public async getEntriesByLanguage(languageCode: string): Promise<BrailleCharacterEntry[]> {
    await this.initDatabase();
    return await this.db.entries.where('language').equals(languageCode).toArray();
  }

  public async getEntryById(id: string): Promise<BrailleCharacterEntry | undefined> {
    await this.initDatabase();
    return await this.db.entries.get(id);
  }

  public async saveEntry(entry: BrailleCharacterEntry): Promise<void> {
    await this.initDatabase();
    const updated = {
      ...entry,
      updatedAt: new Date().toISOString(),
    };
    await this.db.entries.put(updated);
  }

  public async saveEntriesBulk(entries: BrailleCharacterEntry[]): Promise<void> {
    await this.initDatabase();
    await this.db.entries.bulkPut(entries);
  }

  public async deleteEntry(id: string): Promise<void> {
    await this.initDatabase();
    await this.db.entries.delete(id);
  }

  public async addCorrection(
    entryId: string,
    correctedEntry: Partial<BrailleCharacterEntry>,
    reason: string,
    source: string
  ): Promise<CorrectionRecord> {
    await this.initDatabase();

    const original = await this.db.entries.get(entryId);
    const targetId = original ? original.id : entryId;
    const language = original ? original.language : (correctedEntry.language || 'en');
    const character = original ? original.character : (correctedEntry.character || '');
    const currentVersion = original?.version || 1;

    const newDots = correctedEntry.dots || original?.dots || [];
    const newUnicode = correctedEntry.brailleUnicode || dotsToUnicode(newDots);
    const newVersion = currentVersion + 1;

    const updatedEntry: BrailleCharacterEntry = {
      id: targetId,
      language,
      character,
      brailleUnicode: newUnicode,
      dots: newDots,
      type: correctedEntry.type || original?.type || 'letter',
      category: correctedEntry.category || original?.category || 'General',
      rule: correctedEntry.rule || original?.rule || '',
      source: source || correctedEntry.source || original?.source || 'User Correction',
      verified: correctedEntry.verified !== undefined ? correctedEntry.verified : true,
      note: correctedEntry.note || original?.note || '',
      createdAt: original?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: newVersion,
    };

    await this.db.entries.put(updatedEntry);

    const record: CorrectionRecord = {
      id: `corr-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      entryId: targetId,
      language,
      character,
      originalBraille: original?.brailleUnicode || '',
      originalDots: original?.dots || [],
      correctedBraille: newUnicode,
      correctedDots: newDots,
      reason,
      source,
      verified: updatedEntry.verified,
      timestamp: new Date().toISOString(),
      version: newVersion,
    };

    await this.db.corrections.put(record);
    return record;
  }

  public async getCorrectionHistory(entryId?: string, languageCode?: string): Promise<CorrectionRecord[]> {
    await this.initDatabase();

    let query = this.db.corrections.toCollection();

    if (entryId) {
      return await this.db.corrections.where('entryId').equals(entryId).reverse().sortBy('timestamp');
    }

    if (languageCode) {
      return await this.db.corrections.where('language').equals(languageCode).reverse().sortBy('timestamp');
    }

    return await query.reverse().sortBy('timestamp');
  }

  public async restoreCorrectionVersion(correctionId: string): Promise<BrailleCharacterEntry> {
    await this.initDatabase();

    const record = await this.db.corrections.get(correctionId);
    if (!record) {
      throw new Error(`Correction record '${correctionId}' not found.`);
    }

    const current = await this.db.entries.get(record.entryId);

    const restored: BrailleCharacterEntry = {
      id: record.entryId,
      language: record.language,
      character: record.character,
      brailleUnicode: record.originalBraille,
      dots: record.originalDots,
      type: current?.type || 'letter',
      category: current?.category || 'General',
      rule: current?.rule || '',
      source: `Restored to version ${record.version - 1} from record ${record.id}`,
      verified: true,
      note: `Restored prior values (Braille: ${record.originalBraille})`,
      createdAt: current?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: (current?.version || 1) + 1,
    };

    await this.db.entries.put(restored);

    const restoreHistoryRecord: CorrectionRecord = {
      id: `corr-restore-${Date.now()}`,
      entryId: record.entryId,
      language: record.language,
      character: record.character,
      originalBraille: record.correctedBraille,
      originalDots: record.correctedDots,
      correctedBraille: record.originalBraille,
      correctedDots: record.originalDots,
      reason: `Restored to previous version (Correction #${record.id})`,
      source: 'User System Restore',
      verified: true,
      timestamp: new Date().toISOString(),
      version: restored.version!,
    };

    await this.db.corrections.put(restoreHistoryRecord);
    return restored;
  }
}
