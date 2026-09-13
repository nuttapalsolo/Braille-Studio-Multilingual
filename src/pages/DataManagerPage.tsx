import React, { useState, useEffect } from 'react';
import { brailleService } from '../services/BrailleService';
import type { BrailleCharacterEntry, ImportValidationReport, ValidationReport } from '../types/braille';
import {
  Database,
  Upload,
  Download,
  FileCode,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Check,
} from 'lucide-react';

interface DataManagerPageProps {
  selectedLanguage: string;
  announce: (msg: string, mode?: 'polite' | 'assertive') => void;
}

export const DataManagerPage: React.FC<DataManagerPageProps> = ({
  selectedLanguage,
  announce,
}) => {
  const [entries, setEntries] = useState<BrailleCharacterEntry[]>([]);
  const [validationReport, setValidationReport] = useState<ValidationReport | null>(null);
  const [importReport, setImportReport] = useState<ImportValidationReport | null>(null);
  const [importText, setImportText] = useState<string>('');
  const [importFormat, setImportFormat] = useState<'json' | 'csv'>('json');
  const [activeTab, setActiveTab] = useState<'manage' | 'import' | 'export'>('manage');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    loadDataset();
  }, [selectedLanguage]);

  const loadDataset = async () => {
    const data = await brailleService.getEntries(selectedLanguage);
    setEntries(data);
    const report = await brailleService.validateLanguageDataset(selectedLanguage);
    setValidationReport(report);
  };

  const handleValidateImport = async () => {
    if (!importText.trim()) {
      announce('Import text cannot be empty.', 'assertive');
      return;
    }

    let report: ImportValidationReport;
    if (importFormat === 'json') {
      report = await brailleService.validateImportJSON(importText, selectedLanguage);
    } else {
      report = await brailleService.validateImportCSV(importText, selectedLanguage);
    }

    setImportReport(report);
    if (report.isValid) {
      announce(`Import validation passed cleanly. ${report.validEntries.length} entries ready.`);
    } else {
      announce(`Import validation found ${report.errors.length} errors. Please review report.`, 'assertive');
    }
  };

  const handleExecuteImport = async () => {
    if (!importReport || !importReport.isValid) return;

    try {
      await brailleService.importValidatedEntries(importReport.validEntries);
      setMessage(`Successfully imported ${importReport.validEntries.length} entries into ${selectedLanguage.toUpperCase()} dataset.`);
      announce(`Successfully imported ${importReport.validEntries.length} entries.`);
      setImportReport(null);
      setImportText('');
      loadDataset();
    } catch (err: any) {
      setMessage(`Import failed: ${err.message}`);
    }
  };

  const handleExport = (format: 'json' | 'csv') => {
    let content = '';
    let fileName = `${selectedLanguage}-braille-dataset.${format}`;
    let mimeType = 'text/plain';

    if (format === 'json') {
      content = brailleService.exportJSON(entries);
      mimeType = 'application/json';
    } else {
      content = brailleService.exportCSV(entries);
      mimeType = 'text/csv';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);

    announce(`Exported ${entries.length} entries as ${format.toUpperCase()}.`);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Database className="w-6 h-6 text-indigo-400" aria-hidden="true" />
              Braille Data Manager & Importer
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Import, export, validate, and manage dataset schema for active language:{' '}
              <strong className="text-indigo-300 uppercase">{selectedLanguage}</strong>
            </p>
          </div>

          <div className="flex space-x-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('manage')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'manage' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Manage Dataset ({entries.length})
            </button>
            <button
              onClick={() => setActiveTab('import')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'import' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Import JSON/CSV
            </button>
            <button
              onClick={() => setActiveTab('export')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'export' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Export Dataset
            </button>
          </div>
        </div>
      </div>

      {message && (
        <div className="bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0" />
          <span className="text-sm font-semibold">{message}</span>
        </div>
      )}

      {activeTab === 'manage' && (
        <div className="space-y-6">
          {validationReport && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" aria-hidden="true" />
                  Dataset Math & Logic Validation Report
                </h3>
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full border ${
                    validationReport.isValid
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  }`}
                >
                  {validationReport.isValid ? 'Valid Dataset Math' : 'Issues Found'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="text-slate-400">Total Entries</div>
                  <div className="text-lg font-bold text-white mt-1">{validationReport.totalEntries}</div>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="text-slate-400">Verified</div>
                  <div className="text-lg font-bold text-emerald-400 mt-1">{validationReport.verifiedCount}</div>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="text-slate-400">Unverified</div>
                  <div className="text-lg font-bold text-amber-400 mt-1">{validationReport.unverifiedCount}</div>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="text-slate-400">Math Mismatches</div>
                  <div className="text-lg font-bold text-rose-400 mt-1">
                    {validationReport.mismatches.filter(m => m.issueType !== 'unverified').length}
                  </div>
                </div>
              </div>

              {validationReport.mismatches.length > 0 && (
                <div className="mt-3 space-y-2 pt-2 border-t border-slate-800">
                  <div className="text-xs font-semibold text-slate-300">Detailed Issues & Warnings:</div>
                  <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                    {validationReport.mismatches.map((issue, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs flex items-start gap-2.5"
                      >
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-semibold text-slate-200">
                            Character '{issue.character}': {issue.message}
                          </div>
                          {issue.suggestion && (
                            <div className="text-indigo-300 text-[11px] mt-0.5">
                              Suggestion: {issue.suggestion}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-white">Current Dataset Entries ({entries.length})</h3>

            {entries.length === 0 ? (
              <div className="text-center py-12 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <p className="text-slate-400 text-sm">No entries currently in database for dataset '{selectedLanguage}'.</p>
                <p className="text-xs text-indigo-300">Use the Import JSON/CSV tab to import the official dataset file.</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-800 rounded-xl">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 text-xs uppercase tracking-wider font-semibold border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Char</th>
                      <th className="px-4 py-3">Braille</th>
                      <th className="px-4 py-3">Dots</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Source</th>
                      <th className="px-4 py-3">Verified</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                    {entries.map(e => (
                      <tr key={e.id} className="hover:bg-slate-800/40">
                        <td className="px-4 py-3 font-mono font-bold text-white">{e.character}</td>
                        <td className="px-4 py-3 font-mono text-2xl text-indigo-300">{e.brailleUnicode}</td>
                        <td className="px-4 py-3 font-mono text-xs text-indigo-200">{e.dots.join('-')}</td>
                        <td className="px-4 py-3 text-xs text-slate-300">{e.category || e.type}</td>
                        <td className="px-4 py-3 text-xs text-slate-400">{e.source}</td>
                        <td className="px-4 py-3 text-xs">
                          {e.verified ? (
                            <span className="text-emerald-400 font-semibold">✓ Verified</span>
                          ) : (
                            <span className="text-amber-400 font-semibold">⚠️ Unverified</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'import' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-indigo-400" />
                Import Dataset (JSON / CSV)
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Paste JSON array or CSV text with pre-import validation check for active language ({selectedLanguage.toUpperCase()})
              </p>
            </div>

            <div className="flex items-center space-x-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setImportFormat('json')}
                className={`px-3 py-1 text-xs font-semibold rounded ${
                  importFormat === 'json' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                }`}
              >
                JSON Format
              </button>
              <button
                onClick={() => setImportFormat('csv')}
                className={`px-3 py-1 text-xs font-semibold rounded ${
                  importFormat === 'csv' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                }`}
              >
                CSV Format
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <textarea
              rows={8}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder={
                importFormat === 'json'
                  ? `[\n  {\n    "character": "ก",\n    "dots": [1, 2, 4, 5],\n    "category": "Consonant",\n    "source": "Official Standard",\n    "verified": true\n  }\n]`
                  : `character,dots,category,source,verified\nก,1-2-4-5,Consonant,Official Standard,true`
              }
              className="w-full bg-slate-950 border border-slate-700 text-slate-100 p-4 rounded-xl font-mono text-xs focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500 shadow-inner"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleValidateImport}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-lg transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-400"
            >
              Step 1: Validate Import Data
            </button>
          </div>

          {importReport && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  Pre-Import Validation Check Report
                </h4>
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full border ${
                    importReport.isValid
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  }`}
                >
                  {importReport.isValid ? 'Validation Passed' : 'Validation Failed'}
                </span>
              </div>

              {importReport.errors.length > 0 && (
                <div className="space-y-1 bg-rose-950/40 border border-rose-800/60 rounded-lg p-3 text-xs text-rose-300">
                  <div className="font-bold flex items-center gap-1.5 text-rose-400">
                    <XCircle className="w-4 h-4" /> Errors Blocking Import:
                  </div>
                  {importReport.errors.map((err, i) => (
                    <div key={i} className="pl-5">• {err}</div>
                  ))}
                </div>
              )}

              {importReport.warnings.length > 0 && (
                <div className="space-y-1 bg-amber-950/40 border border-amber-800/60 rounded-lg p-3 text-xs text-amber-300">
                  <div className="font-bold flex items-center gap-1.5 text-amber-400">
                    <AlertTriangle className="w-4 h-4" /> Warnings / Auto-Fixes:
                  </div>
                  {importReport.warnings.map((warn, i) => (
                    <div key={i} className="pl-5">• {warn}</div>
                  ))}
                </div>
              )}

              {importReport.isValid && (
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-300">
                    Ready to write <strong>{importReport.validEntries.length}</strong> entries to IndexedDB.
                  </span>
                  <button
                    onClick={handleExecuteImport}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm px-6 py-2.5 rounded-xl shadow-lg transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400 flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Confirm & Execute Import
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'export' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Download className="w-5 h-5 text-indigo-400" />
              Export Dataset Files
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Download complete dataset for <strong>{selectedLanguage.toUpperCase()}</strong> ({entries.length} entries)
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => handleExport('json')}
              className="bg-slate-950 border border-slate-800 hover:border-indigo-500/50 p-6 rounded-2xl text-left space-y-2 group transition-all"
            >
              <FileCode className="w-8 h-8 text-indigo-400 group-hover:scale-110 transition-transform" />
              <div className="font-bold text-white text-base">Export as JSON</div>
              <div className="text-xs text-slate-400">Formatted JSON dataset structure matching application schema</div>
            </button>

            <button
              onClick={() => handleExport('csv')}
              className="bg-slate-950 border border-slate-800 hover:border-indigo-500/50 p-6 rounded-2xl text-left space-y-2 group transition-all"
            >
              <FileSpreadsheet className="w-8 h-8 text-emerald-400 group-hover:scale-110 transition-transform" />
              <div className="font-bold text-white text-base">Export as CSV</div>
              <div className="text-xs text-slate-400">Comma-separated values spreadsheet format for easy editing in Excel</div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
