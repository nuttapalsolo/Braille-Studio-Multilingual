import React, { useState, useEffect } from 'react';
import { brailleService } from '../services/BrailleService';
import type { BrailleCharacterEntry, ValidationReport } from '../types/braille';
import {
  Database,
  Download,
  FileCode,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Link,
  ShieldCheck,
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
  const [sheetUrlInput, setSheetUrlInput] = useState<string>(brailleService.getGoogleSheetUrl());
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'sheet-sync' | 'view-dataset' | 'export'>('sheet-sync');

  useEffect(() => {
    loadDataset();
  }, [selectedLanguage]);

  const loadDataset = async () => {
    setLoading(true);
    const data = await brailleService.getEntries(selectedLanguage);
    setEntries(data);
    const report = await brailleService.validateLanguageDataset(selectedLanguage);
    setValidationReport(report);
    setLoading(false);
  };

  const handleSyncGoogleSheet = async () => {
    if (!sheetUrlInput.trim()) {
      announce('Please enter a Google Sheet URL or ID.', 'assertive');
      return;
    }

    setLoading(true);
    try {
      brailleService.setGoogleSheetUrl(sheetUrlInput.trim());
      const data = await brailleService.getEntries(selectedLanguage);
      setEntries(data);

      const msg = `ซิงค์ข้อมูลสำเร็จ! โหลดข้อมูล ${data.length} รายการจาก Google Sheet เรียบร้อยแล้ว`;
      setSyncMessage(msg);
      announce(msg);

      loadDataset();
      setTimeout(() => setSyncMessage(null), 4000);
    } catch (err: any) {
      setSyncMessage(`เกิดข้อผิดพลาดในการเชื่อมต่อ Google Sheet: ${err.message}`);
      announce(`Sync error: ${err.message}`, 'assertive');
    } finally {
      setLoading(false);
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
              Google Sheets Data Sync & Management
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              เพิ่มและจัดการข้อมูลเบรลล์ผ่าน **Google Sheets** เท่านั้นสำหรับภาษา:{' '}
              <strong className="text-indigo-300 uppercase">{selectedLanguage}</strong>
            </p>
          </div>

          <div className="flex space-x-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('sheet-sync')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'sheet-sync' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Google Sheet Connector
            </button>
            <button
              onClick={() => setActiveTab('view-dataset')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'view-dataset' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              View Dataset ({entries.length})
            </button>
            <button
              onClick={() => setActiveTab('export')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'export' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Export Data
            </button>
          </div>
        </div>
      </div>

      {syncMessage && (
        <div className="bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-semibold">{syncMessage}</span>
        </div>
      )}

      {activeTab === 'sheet-sync' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
              เชื่อมต่อและซิงค์ข้อมูลจาก Google Sheets
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              วาง URL ของ Google Sheet หรือ ID ของไฟล์เพื่อดึงข้อมูลเบรลล์มาใช้แปลงบนเว็บแอปพลิเคชัน
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="sheet-url-input" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Link className="w-4 h-4 text-indigo-400" />
                Google Sheet URL หรือ Spreadsheet ID:
              </label>
              <input
                id="sheet-url-input"
                type="text"
                value={sheetUrlInput}
                onChange={(e) => setSheetUrlInput(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit..."
                className="w-full bg-slate-950 border border-slate-700 text-white text-sm px-4 py-3 rounded-xl focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500 shadow-inner font-mono"
              />
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={handleSyncGoogleSheet}
              className="bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>ซิงค์ข้อมูลจาก Google Sheets ทันที</span>
            </button>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3 text-xs text-slate-300">
            <div className="font-bold text-white text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              โครงสร้างคอลัมน์ใน Google Sheet ที่รองรับ:
            </div>
            <p className="text-slate-400">
              สร้างแถวแรก (Header) ใน Google Sheet ของคุณให้มีชื่อคอลัมน์ดังนี้:
            </p>
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg font-mono text-indigo-200 overflow-x-auto">
              Character | BrailleUnicode | Dots | Category | Source | Verified
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-400 pt-1">
              <div>• <strong>Character</strong>: ตัวอักษรปกติ (เช่น ก, あ, a)</div>
              <div>• <strong>Dots</strong>: รูปแบบจุด (เช่น 1-2-4-5 หรือ 1,2,4,5)</div>
              <div>• <strong>BrailleUnicode</strong>: สัญลักษณ์เบรลล์ (คำนวณให้อัตโนมัติถ้าเว้นว่าง)</div>
              <div>• <strong>Verified</strong>: TRUE / FALSE</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'view-dataset' && (
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
                <p className="text-slate-400 text-sm">No entries currently loaded for language '{selectedLanguage}'.</p>
                <p className="text-xs text-indigo-300">Use the Google Sheet Connector tab to sync data from your sheet.</p>
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

      {activeTab === 'export' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Download className="w-5 h-5 text-indigo-400" />
              Export Dataset Files
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Download dataset for <strong>{selectedLanguage.toUpperCase()}</strong> ({entries.length} entries)
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
              <div className="text-xs text-slate-400">Comma-separated values spreadsheet format</div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
