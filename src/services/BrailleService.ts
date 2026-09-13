import type { IBrailleRepository } from '../repositories/IBrailleRepository';
import { IndexedDBBrailleRepository } from '../repositories/IndexedDBBrailleRepository';
import { BrailleConverter, type ConversionResult } from '../engine/BrailleConverter';
import { BrailleValidator } from '../engine/BrailleValidator';
import { BrailleImporterExporter } from '../engine/BrailleImporterExporter';
import { JapaneseBrailleViewerAdapter } from '../adapters/ExternalReferenceAdapter';
import type {
  BrailleCharacterEntry,
  CorrectionRecord,
  ImportValidationReport,
  LanguageMeta,
  ValidationReport,
} from '../types/braille';

export class BrailleService {
  private repository: IBrailleRepository;
  private validator: BrailleValidator;
  private externalAdapter: JapaneseBrailleViewerAdapter;

  constructor(repository?: IBrailleRepository) {
    this.repository = repository || new IndexedDBBrailleRepository();
    this.validator = new BrailleValidator();
    this.externalAdapter = new JapaneseBrailleViewerAdapter();
  }

  public async getLanguages(): Promise<LanguageMeta[]> {
    return await this.repository.getLanguages();
  }

  public async getEntries(languageCode: string): Promise<BrailleCharacterEntry[]> {
    return await this.repository.getEntriesByLanguage(languageCode);
  }

  public async convertTextToBraille(text: string, languageCode: string): Promise<ConversionResult> {
    const entries = await this.getEntries(languageCode);
    const converter = new BrailleConverter(entries);
    return converter.textToBraille(text, languageCode);
  }

  public async convertBrailleToText(brailleText: string, languageCode: string): Promise<ConversionResult> {
    const entries = await this.getEntries(languageCode);
    const converter = new BrailleConverter(entries);
    return converter.brailleToText(brailleText, languageCode);
  }

  public async validateLanguageDataset(languageCode: string): Promise<ValidationReport> {
    const entries = await this.getEntries(languageCode);
    return this.validator.validateDataset(languageCode, entries);
  }

  public async saveEntry(entry: BrailleCharacterEntry): Promise<void> {
    await this.repository.saveEntry(entry);
  }

  public async addCorrection(
    entryId: string,
    corrected: Partial<BrailleCharacterEntry>,
    reason: string,
    source: string
  ): Promise<CorrectionRecord> {
    return await this.repository.addCorrection(entryId, corrected, reason, source);
  }

  public async getHistory(entryId?: string, languageCode?: string): Promise<CorrectionRecord[]> {
    return await this.repository.getCorrectionHistory(entryId, languageCode);
  }

  public async restoreVersion(correctionId: string): Promise<BrailleCharacterEntry> {
    return await this.repository.restoreCorrectionVersion(correctionId);
  }

  public async validateImportJSON(
    jsonStr: string,
    languageCode: string
  ): Promise<ImportValidationReport> {
    const existing = await this.getEntries(languageCode);
    return BrailleImporterExporter.parseAndValidateJSON(jsonStr, languageCode, existing);
  }

  public async validateImportCSV(
    csvStr: string,
    languageCode: string
  ): Promise<ImportValidationReport> {
    const existing = await this.getEntries(languageCode);
    return BrailleImporterExporter.parseAndValidateCSV(csvStr, languageCode, existing);
  }

  public async importValidatedEntries(entries: BrailleCharacterEntry[]): Promise<void> {
    await this.repository.saveEntriesBulk(entries);
  }

  public exportJSON(entries: BrailleCharacterEntry[]): string {
    return BrailleImporterExporter.exportJSON(entries);
  }

  public exportCSV(entries: BrailleCharacterEntry[]): string {
    return BrailleImporterExporter.exportCSV(entries);
  }

  public getExternalAdapter(): JapaneseBrailleViewerAdapter {
    return this.externalAdapter;
  }
}

export const brailleService = new BrailleService();
