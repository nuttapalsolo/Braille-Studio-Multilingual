import React, { useState, useEffect } from 'react';
import { useBrailleEditor } from '../hooks/useBrailleEditor';
import { BrailleCell } from '../components/braille/BrailleCell';
import { brailleService } from '../services/BrailleService';
import type { BrailleCharacterEntry } from '../types/braille';
import { Edit3, Keyboard, Save, RotateCcw, CheckCircle2, ShieldCheck } from 'lucide-react';

interface EditorPageProps {
  selectedLanguage: string;
  announce: (msg: string, mode?: 'polite' | 'assertive') => void;
}

export const EditorPage: React.FC<EditorPageProps> = ({
  selectedLanguage,
  announce,
}) => {
  const [targetChar, setTargetChar] = useState<string>('a');
  const [existingEntry, setExistingEntry] = useState<BrailleCharacterEntry | null>(null);
  const [reason, setReason] = useState<string>('');
  const [source, setSource] = useState<string>('User Editor');
  const [isVerified, setIsVerified] = useState<boolean>(true);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const {
    selectedDots,
    mode,
    setMode,
    toggleDot,
    setDots,
    clearDots,
    unicodeChar,
    formattedDots,
  } = useBrailleEditor({
    initialDots: [1],
    cellMode: '6-dot',
    announceFn: announce,
  });

  useEffect(() => {
    loadExistingChar(targetChar);
  }, [targetChar, selectedLanguage]);

  const loadExistingChar = async (char: string) => {
    if (!char) return;
    const entries = await brailleService.getEntries(selectedLanguage);
    const match = entries.find(e => e.character === char || e.character.toLowerCase() === char.toLowerCase());
    if (match) {
      setExistingEntry(match);
      setDots(match.dots);
      setIsVerified(match.verified);
      if (match.source) setSource(match.source);
    } else {
      setExistingEntry(null);
    }
  };

  const handleSaveCorrection = async () => {
    if (!targetChar) {
      announce('Please specify a target character to save.', 'assertive');
      return;
    }

    try {
      const entryId = existingEntry ? existingEntry.id : `${selectedLanguage}-${targetChar}-${Date.now()}`;
      
      const record = await brailleService.addCorrection(
        entryId,
        {
          language: selectedLanguage,
          character: targetChar,
          brailleUnicode: unicodeChar,
          dots: selectedDots,
          verified: isVerified,
          source,
        },
        reason || 'Manual Braille Editor Update',
        source || 'Braille Editor'
      );

      const msg = `Saved mapping for '${targetChar}' (Unicode: ${unicodeChar}, Dots: ${formattedDots}) as Version ${record.version}.`;
      setSaveSuccess(msg);
      announce(msg);

      setTimeout(() => setSaveSuccess(null), 3000);
      loadExistingChar(targetChar);
    } catch (err: any) {
      console.error('Failed to save correction:', err);
      announce(`Save failed: ${err.message}`, 'assertive');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Edit3 className="w-6 h-6 text-indigo-400" aria-hidden="true" />
              Braille Dot Editor & Data Correction
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Interactive 6/8-dot matrix with real-time Unicode calculation, keyboard shortcuts and version history logging
            </p>
          </div>

          <div className="flex items-center space-x-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => { setMode('6-dot'); announce('Switched to 6-dot mode.'); }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                mode === '6-dot' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              6-Dot Cell
            </button>
            <button
              type="button"
              onClick={() => { setMode('8-dot'); announce('Switched to 8-dot mode.'); }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                mode === '8-dot' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              8-Dot Cell
            </button>
          </div>
        </div>

        <div className="mt-4 bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 text-xs text-slate-300 flex items-center gap-2 overflow-x-auto">
          <Keyboard className="w-4 h-4 text-indigo-400 shrink-0" aria-hidden="true" />
          <span className="font-semibold text-white">Shortcuts:</span>
          <span><kbd className="bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-indigo-300">1-8</kbd> Toggle Dots</span>
          <span>•</span>
          <span><kbd className="bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-indigo-300">Space</kbd> Toggle Focused</span>
          <span>•</span>
          <span><kbd className="bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-indigo-300">Enter</kbd> Save Entry</span>
          <span>•</span>
          <span><kbd className="bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-indigo-300">Esc</kbd> Reset</span>
        </div>
      </div>

      {saveSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" aria-hidden="true" />
          <p className="text-sm font-semibold">{saveSuccess}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 flex flex-col justify-between">
          <div className="bg-slate-950 border border-indigo-500/30 rounded-2xl p-6 text-center space-y-2 shadow-inner">
            <div className="text-xs font-bold uppercase tracking-widest text-indigo-400">
              Live Unicode Preview
            </div>
            <div
              className="text-6xl font-mono text-white font-black py-2 tracking-widest"
              aria-label={`Current Braille Character: ${unicodeChar}`}
            >
              {unicodeChar}
            </div>
            <div className="text-sm font-mono text-indigo-300 font-bold bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 inline-block">
              Dots Pattern: {formattedDots}
            </div>
          </div>

          <BrailleCell
            selectedDots={selectedDots}
            onToggleDot={toggleDot}
            mode={mode}
          />

          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={clearDots}
              className="flex items-center space-x-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl border border-slate-700 transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-400"
            >
              <RotateCcw className="w-4 h-4 text-slate-400" aria-hidden="true" />
              <span>Clear All Dots</span>
            </button>
          </div>
        </div>

        <div className="lg:col-span-6 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <ShieldCheck className="w-5 h-5 text-indigo-400" aria-hidden="true" />
            Mapping Metadata & Correction Form
          </h3>

          <form onSubmit={(e) => { e.preventDefault(); handleSaveCorrection(); }} className="space-y-4">
            <div>
              <label htmlFor="edit-target-char" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Target Character:
              </label>
              <input
                id="edit-target-char"
                type="text"
                maxLength={5}
                value={targetChar}
                onChange={(e) => setTargetChar(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white text-lg font-mono font-bold px-4 py-2.5 rounded-xl focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500 shadow-inner"
                required
              />
              {existingEntry ? (
                <p className="text-xs text-emerald-400 mt-1">
                  ✓ Found existing mapping in <strong>{selectedLanguage.toUpperCase()}</strong> dataset (Version {existingEntry.version || 1}).
                </p>
              ) : (
                <p className="text-xs text-amber-400 mt-1">
                  + New character entry for <strong>{selectedLanguage.toUpperCase()}</strong>.
                </p>
              )}
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2 text-xs">
              <div className="font-bold text-slate-300 border-b border-slate-800 pb-1">
                Comparison View
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-slate-400 font-semibold">Original Mapping:</div>
                  <div className="text-sm font-mono text-slate-300 mt-1">
                    Braille: {existingEntry ? existingEntry.brailleUnicode : 'None'}
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    Dots: {existingEntry ? existingEntry.dots.join('-') || 'Empty' : 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-indigo-400 font-semibold">New/Corrected:</div>
                  <div className="text-sm font-mono text-white font-bold mt-1">
                    Braille: {unicodeChar}
                  </div>
                  <div className="text-xs text-indigo-300 font-mono">
                    Dots: {formattedDots}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="edit-reason" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Correction Reason / Note:
              </label>
              <input
                id="edit-reason"
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Fixed dot 4 typo from official standard..."
                className="w-full bg-slate-950 border border-slate-700 text-slate-100 text-sm px-4 py-2.5 rounded-xl focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500 shadow-inner"
              />
            </div>

            <div>
              <label htmlFor="edit-source" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Source Reference:
              </label>
              <input
                id="edit-source"
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="e.g. National Braille Authority 2026..."
                className="w-full bg-slate-950 border border-slate-700 text-slate-100 text-sm px-4 py-2.5 rounded-xl focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500 shadow-inner"
              />
            </div>

            <div className="flex items-center space-x-3 pt-1">
              <input
                id="edit-verified-checkbox"
                type="checkbox"
                checked={isVerified}
                onChange={(e) => setIsVerified(e.target.checked)}
                className="w-5 h-5 text-indigo-600 bg-slate-950 border-slate-700 rounded focus:ring-indigo-500 focus:ring-offset-slate-900"
              />
              <label htmlFor="edit-verified-checkbox" className="text-sm font-semibold text-slate-200 cursor-pointer">
                Mark as Verified Official Mapping
              </label>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm py-3 rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-400"
            >
              <Save className="w-5 h-5" aria-hidden="true" />
              <span>Save & Log Version Correction</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
