import React, { useState, useEffect } from 'react';
import { brailleService } from '../services/BrailleService';
import { dotsToUnicode } from '../engine/unicodeBraille';
import type { BrailleCharacterEntry, ValidationReport } from '../types/braille';
import {
  Database,
  Download,
  Upload,
  FileCode,
  FileSpreadsheet,
  CheckCircle2,
  PlusCircle,
  Trash2,
  Edit,
  Save,
  XCircle,
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
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'view-dataset' | 'add-entry' | 'import-export'>('view-dataset');

  // Form State for Adding / Editing Entry
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formChar, setFormChar] = useState<string>('');
  const [formDots, setFormDots] = useState<number[]>([]);
  const [formCategory, setFormCategory] = useState<string>('General');
  const [formType, setFormType] = useState<BrailleCharacterEntry['type']>('letter');
  const [formSource, setFormSource] = useState<string>('Local Computer Input');
  const [formVerified, setFormVerified] = useState<boolean>(true);

  useEffect(() => {
    loadDataset();
  }, [selectedLanguage]);

  const loadDataset = async () => {
    const data = await brailleService.getEntries(selectedLanguage);
    setEntries(data);
    const report = await brailleService.validateLanguageDataset(selectedLanguage);
    setValidationReport(report);
  };

  const handleDotToggle = (dotNum: number) => {
    if (formDots.includes(dotNum)) {
      setFormDots(formDots.filter(d => d !== dotNum).sort((a, b) => a - b));
    } else {
      setFormDots([...formDots, dotNum].sort((a, b) => a - b));
    }
  };

  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formChar.trim()) {
      announce('กรุณาป้อนตัวอักษร', 'assertive');
      return;
    }
    if (formDots.length === 0) {
      announce('กรุณาเลือกจุดเบรลล์อย่างน้อย 1 จุด', 'assertive');
      return;
    }

    const brailleChar = dotsToUnicode(formDots);
    const newEntry: BrailleCharacterEntry = {
      id: editingId || `local-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      language: selectedLanguage,
      character: formChar.trim(),
      brailleUnicode: brailleChar,
      dots: formDots,
      type: formType,
      category: formCategory.trim() || 'General',
      source: formSource.trim() || 'Local Entry',
      verified: formVerified,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await brailleService.saveEntry(newEntry);
      const msg = `บันทึกข้อมูลอักขระ "${formChar.trim()}" (${brailleChar}) ลงในเครื่องสำเร็จ!`;
      setStatusMessage(msg);
      announce(msg);

      // Reset form
      setEditingId(null);
      setFormChar('');
      setFormDots([]);
      setActiveTab('view-dataset');
      loadDataset();

      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      announce(`เกิดข้อผิดพลาดในการบันทึก: ${err.message}`, 'assertive');
    }
  };

  const handleEditClick = (entry: BrailleCharacterEntry) => {
    setEditingId(entry.id);
    setFormChar(entry.character);
    setFormDots(entry.dots || []);
    setFormCategory(entry.category || 'General');
    setFormType(entry.type || 'letter');
    setFormSource(entry.source || 'Local Entry');
    setFormVerified(entry.verified);
    setActiveTab('add-entry');
  };

  const handleDeleteClick = async (id: string, char: string) => {
    if (window.confirm(`คุณต้องการลบข้อมูลอักขระ "${char}" ออกจากฐานข้อมูลในเครื่องใช่หรือไม่?`)) {
      try {
        await brailleService.deleteEntry(id);
        announce(`ลบข้อมูล "${char}" เรียบร้อยแล้ว`);
        loadDataset();
      } catch (err: any) {
        announce(`เกิดข้อผิดพลาดในการลบ: ${err.message}`, 'assertive');
      }
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, format: 'json' | 'csv') => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      if (!content) return;

      try {
        let report;
        if (format === 'json') {
          report = await brailleService.validateImportJSON(content, selectedLanguage);
        } else {
          report = await brailleService.validateImportCSV(content, selectedLanguage);
        }

        if (report.validEntries && report.validEntries.length > 0) {
          await brailleService.importValidatedEntries(report.validEntries);
          const msg = `นำเข้าข้อมูล ${report.validEntries.length} รายการเข้าสู่ฐานข้อมูลในเครื่องเรียบร้อยแล้ว!`;
          setStatusMessage(msg);
          announce(msg);
          loadDataset();
        } else {
          announce('ไม่พบรายการข้อมูลที่ถูกต้องในไฟล์', 'assertive');
        }
      } catch (err: any) {
        announce(`เกิดข้อผิดพลาดในการนำเข้าไฟล์: ${err.message}`, 'assertive');
      }
    };
    reader.readAsText(file);
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
              การจัดการชุดข้อมูลในเครื่อง (Local Storage & IndexedDB)
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              เพิ่ม แก้ไข และจัดการชุดข้อมูลเบรลล์โดยตรงบนเครื่องสำหรับภาษา:{' '}
              <strong className="text-indigo-300 uppercase">{selectedLanguage}</strong>
            </p>
          </div>

          <div className="flex space-x-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('view-dataset')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'view-dataset' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              รายการข้อมูล ({entries.length})
            </button>
            <button
              onClick={() => {
                setEditingId(null);
                setFormChar('');
                setFormDots([]);
                setActiveTab('add-entry');
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'add-entry' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              + เพิ่ม/แก้ไขข้อมูล
            </button>
            <button
              onClick={() => setActiveTab('import-export')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'import-export' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              นำเข้า / ส่งออก (Import/Export)
            </button>
          </div>
        </div>
      </div>

      {statusMessage && (
        <div className="bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-semibold">{statusMessage}</span>
        </div>
      )}

      {/* TAB 1: VIEW DATASET & MANAGE */}
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
            </div>
          )}

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">
                รายการอักขระเบรลล์ในเครื่อง ({entries.length} รายการ)
              </h3>
              <button
                onClick={() => {
                  setEditingId(null);
                  setFormChar('');
                  setFormDots([]);
                  setActiveTab('add-entry');
                }}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow"
              >
                <PlusCircle className="w-4 h-4" />
                <span>เพิ่มข้อมูลใหม่ออฟไลน์</span>
              </button>
            </div>

            {entries.length === 0 ? (
              <div className="text-center py-12 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <p className="text-slate-400 text-sm">ยังไม่มีรายการข้อมูลสำหรับภาษา '{selectedLanguage}'.</p>
                <p className="text-xs text-indigo-300">กดปุ่ม "+ เพิ่มข้อมูลใหม่ออฟไลน์" ด้านบนเพื่อเริ่มป้อนข้อมูลในเครื่อง</p>
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
                      <th className="px-4 py-3">Verified</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                    {entries.map(e => (
                      <tr key={e.id} className="hover:bg-slate-800/40">
                        <td className="px-4 py-3 font-mono font-bold text-white text-base">{e.character}</td>
                        <td className="px-4 py-3 font-mono text-2xl text-indigo-300">{e.brailleUnicode || dotsToUnicode(e.dots)}</td>
                        <td className="px-4 py-3 font-mono text-xs text-indigo-200">{(e.dots || []).join('-')}</td>
                        <td className="px-4 py-3 text-xs text-slate-300">{e.category || e.type}</td>
                        <td className="px-4 py-3 text-xs">
                          {e.verified ? (
                            <span className="text-emerald-400 font-semibold">✓ Verified</span>
                          ) : (
                            <span className="text-amber-400 font-semibold">⚠️ Unverified</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleEditClick(e)}
                              className="bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white p-1.5 rounded-lg border border-slate-700 transition-colors"
                              title="แก้ไขข้อมูล"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(e.id, e.character)}
                              className="bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white p-1.5 rounded-lg border border-slate-700 transition-colors"
                              title="ลบข้อมูล"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
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

      {/* TAB 2: ADD / EDIT ENTRY FORM */}
      {activeTab === 'add-entry' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-indigo-400" />
              {editingId ? 'แก้ไขข้อมูลอักขระเบรลล์' : 'เพิ่มข้อมูลอักขระเบรลล์ใหม่ในเครื่อง'}
            </h3>
            {editingId && (
              <button
                onClick={() => {
                  setEditingId(null);
                  setFormChar('');
                  setFormDots([]);
                }}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
              >
                <XCircle className="w-4 h-4" /> ยกเลิกการแก้ไข
              </button>
            )}
          </div>

          <form onSubmit={handleSaveEntry} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="form-char" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    ตัวอักษรปกติ (Character):
                  </label>
                  <input
                    id="form-char"
                    type="text"
                    value={formChar}
                    onChange={(e) => setFormChar(e.target.value)}
                    placeholder="เช่น ก, ฎ, ฌ, ญ, ?, ,"
                    className="w-full bg-slate-950 border border-slate-700 text-white text-base px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="form-category" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    หมวดหมู่ (Category):
                  </label>
                  <input
                    id="form-category"
                    type="text"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="เช่น พยัญชนะไทย, สระ, เครื่องหมายวรรคตอน"
                    className="w-full bg-slate-950 border border-slate-700 text-white text-sm px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center space-x-3 pt-2">
                  <input
                    id="form-verified"
                    type="checkbox"
                    checked={formVerified}
                    onChange={(e) => setFormVerified(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 bg-slate-950 border-slate-700"
                  />
                  <label htmlFor="form-verified" className="text-xs font-semibold text-slate-300">
                    ยืนยันความถูกต้องแล้ว (Verified Entry)
                  </label>
                </div>
              </div>

              {/* 6-Dot Interactive Selector */}
              <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-4 text-center">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  เลือกจุดเบรลล์ 6 จุด (Braille 6-Dot Matrix):
                </label>

                <div className="grid grid-cols-2 gap-4 max-w-[180px] mx-auto">
                  {[1, 4, 2, 5, 3, 6].map((d) => {
                    const active = formDots.includes(d);
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => handleDotToggle(d)}
                        className={`w-12 h-12 rounded-full border-2 font-bold text-sm transition-all shadow ${
                          active
                            ? 'bg-indigo-600 border-indigo-400 text-white shadow-indigo-500/50 scale-105 ring-2 ring-indigo-400'
                            : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-indigo-500'
                        }`}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>

                <div className="text-xs text-slate-300 pt-2 flex justify-between items-center border-t border-slate-800">
                  <span>รูปแบบจุด: <strong className="text-indigo-400 font-mono">{formDots.length > 0 ? formDots.join('-') : 'ยังไม่ได้เลือก'}</strong></span>
                  <span>Unicode: <strong className="text-indigo-300 font-mono text-xl">{dotsToUnicode(formDots)}</strong></span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold text-sm px-6 py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all"
            >
              <Save className="w-5 h-5" />
              <span>บันทึกข้อมูลเข้าสู่ฐานข้อมูลในเครื่อง</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: IMPORT / EXPORT */}
      {activeTab === 'import-export' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-8">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Upload className="w-5 h-5 text-indigo-400" />
              นำเข้าชุดข้อมูล (Import JSON / CSV into Local Storage)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              เลือกไฟล์ JSON หรือ CSV จากเครื่องเพื่อนำเข้าข้อมูลเข้าสู่ฐานข้อมูลออฟไลน์
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <label className="bg-slate-950 border border-slate-800 hover:border-indigo-500/50 p-6 rounded-2xl text-left space-y-2 cursor-pointer transition-all block">
                <FileCode className="w-8 h-8 text-indigo-400" />
                <div className="font-bold text-white text-base">Import JSON File</div>
                <div className="text-xs text-slate-400">เลือกไฟล์ .json เพื่อโหลดชุดข้อมูลลงในเครื่อง</div>
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => handleFileUpload(e, 'json')}
                  className="hidden"
                />
              </label>

              <label className="bg-slate-950 border border-slate-800 hover:border-indigo-500/50 p-6 rounded-2xl text-left space-y-2 cursor-pointer transition-all block">
                <FileSpreadsheet className="w-8 h-8 text-emerald-400" />
                <div className="font-bold text-white text-base">Import CSV File</div>
                <div className="text-xs text-slate-400">เลือกไฟล์ .csv เพื่อโหลดชุดข้อมูลลงในเครื่อง</div>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => handleFileUpload(e, 'csv')}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Download className="w-5 h-5 text-emerald-400" />
              ส่งออกชุดข้อมูล (Export Dataset Files)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              ดาวน์โหลดไฟล์ชุดข้อมูลปัจจุบันสำหรับภาษา <strong>{selectedLanguage.toUpperCase()}</strong> ({entries.length} รายการ)
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <button
                onClick={() => handleExport('json')}
                className="bg-slate-950 border border-slate-800 hover:border-indigo-500/50 p-6 rounded-2xl text-left space-y-2 group transition-all"
              >
                <FileCode className="w-8 h-8 text-indigo-400 group-hover:scale-110 transition-transform" />
                <div className="font-bold text-white text-base">Export as JSON</div>
                <div className="text-xs text-slate-400">โครงสร้าง JSON ครบถ้วนตามมาตรฐานระบบ</div>
              </button>

              <button
                onClick={() => handleExport('csv')}
                className="bg-slate-950 border border-slate-800 hover:border-indigo-500/50 p-6 rounded-2xl text-left space-y-2 group transition-all"
              >
                <FileSpreadsheet className="w-8 h-8 text-emerald-400 group-hover:scale-110 transition-transform" />
                <div className="font-bold text-white text-base">Export as CSV</div>
                <div className="text-xs text-slate-400">รูปแบบตาราง CSV สำหรับเปิดใน Excel</div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
