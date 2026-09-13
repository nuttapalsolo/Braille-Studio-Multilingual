import React, { useState, useEffect } from 'react';
import { brailleService } from '../services/BrailleService';
import type { CorrectionRecord } from '../types/braille';
import { formatDotsString } from '../engine/unicodeBraille';
import { History, RotateCcw, Clock, CheckCircle2 } from 'lucide-react';

interface HistoryPageProps {
  selectedLanguage: string;
  announce: (msg: string, mode?: 'polite' | 'assertive') => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({
  selectedLanguage,
  announce,
}) => {
  const [historyRecords, setHistoryRecords] = useState<CorrectionRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, [selectedLanguage]);

  const loadHistory = async () => {
    setLoading(true);
    const records = await brailleService.getHistory(undefined, selectedLanguage);
    setHistoryRecords(records);
    setLoading(false);
  };

  const handleRestore = async (record: CorrectionRecord) => {
    try {
      const restored = await brailleService.restoreVersion(record.id);
      const msg = `Successfully restored '${restored.character}' to previous version (Braille: ${restored.brailleUnicode}, Dots: ${formatDotsString(restored.dots)}).`;
      setRestoreMessage(msg);
      announce(msg);
      loadHistory();

      setTimeout(() => setRestoreMessage(null), 4000);
    } catch (err: any) {
      console.error('Failed to restore:', err);
      announce(`Restore failed: ${err.message}`, 'assertive');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <History className="w-6 h-6 text-indigo-400" aria-hidden="true" />
            Data Correction & Version Audit Trail
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Complete history of data corrections, modifications, and version restore logs for active language:{' '}
            <strong className="text-indigo-300 uppercase">{selectedLanguage}</strong>
          </p>
        </div>
      </div>

      {restoreMessage && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" aria-hidden="true" />
          <span className="text-sm font-semibold">{restoreMessage}</span>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading version history log...</div>
      ) : historyRecords.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <Clock className="w-10 h-10 text-slate-500 mx-auto" aria-hidden="true" />
          <h3 className="text-lg font-bold text-slate-300">No Correction History Yet</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            When you edit or correct Braille mappings in the Editor, version logs will appear here with 1-click restore options.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {historyRecords.map(rec => (
            <div
              key={rec.id}
              className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4 hover:border-slate-700 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/30 rounded-xl flex items-center justify-center font-mono font-bold text-xl text-indigo-300">
                    {rec.character}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      Character: '{rec.character}'
                      <span className="text-xs bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-full font-mono">
                        Version {rec.version}
                      </span>
                    </h3>
                    <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                      <span>{new Date(rec.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRestore(rec)}
                  className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white font-semibold text-xs px-3.5 py-2 rounded-xl border border-slate-700 transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-400 self-start sm:self-auto"
                >
                  <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Restore Original Values</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3.5 space-y-1">
                  <div className="font-semibold text-rose-400 uppercase tracking-wider text-[11px]">
                    Original Previous Values
                  </div>
                  <div className="flex items-center space-x-2 text-sm font-mono text-slate-300 pt-1">
                    <span>Braille: <strong className="text-2xl text-slate-200">{rec.originalBraille || 'None'}</strong></span>
                  </div>
                  <div className="text-slate-400 font-mono">
                    Dots: {formatDotsString(rec.originalDots)}
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3.5 space-y-1">
                  <div className="font-semibold text-emerald-400 uppercase tracking-wider text-[11px]">
                    New / Corrected Values
                  </div>
                  <div className="flex items-center space-x-2 text-sm font-mono text-emerald-300 pt-1">
                    <span>Braille: <strong className="text-2xl text-emerald-400">{rec.correctedBraille}</strong></span>
                  </div>
                  <div className="text-indigo-300 font-mono">
                    Dots: {formatDotsString(rec.correctedDots)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-400 pt-1 border-t border-slate-800/60">
                <div>
                  <strong className="text-slate-300">Reason:</strong> {rec.reason}
                </div>
                <div>
                  <strong className="text-slate-300">Source:</strong> {rec.source}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
