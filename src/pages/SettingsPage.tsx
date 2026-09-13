import React, { useState } from 'react';
import { Settings, Volume2, RefreshCw, CheckCircle2, Shield } from 'lucide-react';

interface SettingsPageProps {
  announce: (msg: string, mode?: 'polite' | 'assertive') => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ announce }) => {
  const [highContrast, setHighContrast] = useState<boolean>(true);
  const [screenReaderVerbosity, setScreenReaderVerbosity] = useState<'polite' | 'assertive'>('polite');
  const [dbMessage, setDbMessage] = useState<string | null>(null);

  const handleResetDatabase = async () => {
    if (window.confirm('Are you sure you want to reset IndexedDB data and re-seed default datasets?')) {
      try {
        indexedDB.deleteDatabase('MultilingualBrailleDB');
        setDbMessage('IndexedDB database cleared. Please refresh the page to reload default datasets.');
        announce('IndexedDB database cleared. Refresh the page to reload datasets.');
      } catch (e: any) {
        setDbMessage(`Error clearing database: ${e.message}`);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-indigo-400" aria-hidden="true" />
            Application Settings & Accessibility Options
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Configure screen reader speech verbosity, accessibility contrast, keyboard navigation, and database controls
          </p>
        </div>
      </div>

      {dbMessage && (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" aria-hidden="true" />
          <span className="text-sm font-semibold">{dbMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Volume2 className="w-5 h-5 text-indigo-400" aria-hidden="true" />
            Screen Reader & ARIA Live Announcements
          </h3>

          <div className="space-y-4 text-sm text-slate-300">
            <div>
              <label htmlFor="setting-verbosity" className="block font-semibold text-slate-200 mb-1">
                ARIA Live Region Announcement Politeness:
              </label>
              <select
                id="setting-verbosity"
                value={screenReaderVerbosity}
                onChange={(e) => {
                  const val = e.target.value as 'polite' | 'assertive';
                  setScreenReaderVerbosity(val);
                  announce(`Screen reader announcement mode updated to ${val}`);
                }}
                className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl p-2.5 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500"
              >
                <option value="polite">Polite (Recommended for NVDA/JAWS/VoiceOver)</option>
                <option value="assertive">Assertive (Immediate interrupt for critical alerts)</option>
              </select>
              <p className="text-xs text-slate-400 mt-1">
                Announces dot toggles ("Dot 1 enabled", "Current pattern: 1 2 4 5") live to NVDA, JAWS, Narrator, VoiceOver, and TalkBack.
              </p>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <input
                id="setting-contrast"
                type="checkbox"
                checked={highContrast}
                onChange={(e) => {
                  setHighContrast(e.target.checked);
                  announce(`High contrast focus indicators ${e.target.checked ? 'enabled' : 'disabled'}`);
                }}
                className="w-5 h-5 text-indigo-600 bg-slate-950 border-slate-700 rounded focus:ring-indigo-500"
              />
              <label htmlFor="setting-contrast" className="font-semibold text-slate-200 cursor-pointer">
                Enhanced Focus Ring & High Contrast Focus Outline
              </label>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Shield className="w-5 h-5 text-purple-400" aria-hidden="true" />
            Local IndexedDB Repository Management
          </h3>

          <div className="space-y-4 text-xs text-slate-300">
            <p className="text-slate-400">
              This application uses client-side IndexedDB for zero-latency local storage. Data repositories are abstracted via the <code className="text-indigo-300">IBrailleRepository</code> interface to enable future Firebase/Supabase backend sync without rewriting core logic.
            </p>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Database Name:</span>
                <span className="font-mono text-indigo-300">MultilingualBrailleDB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Storage Engine:</span>
                <span className="font-mono text-slate-200">IndexedDB (Dexie.js ORM)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Supported Languages:</span>
                <span className="font-semibold text-emerald-400">10 Multilingual Datasets</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleResetDatabase}
              className="w-full bg-rose-600/90 hover:bg-rose-600 text-white font-bold text-xs py-3 rounded-xl shadow-lg transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-rose-400 flex items-center justify-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
              <span>Clear IndexedDB & Re-seed Datasets</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
