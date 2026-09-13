import React, { useState, useEffect } from 'react';
import { brailleService } from '../services/BrailleService';
import type { ExternalReferenceResult, BrailleCharacterEntry } from '../types/braille';
import { formatDotsString } from '../engine/unicodeBraille';
import { GitCompare, ExternalLink, ShieldCheck, Wifi, WifiOff } from 'lucide-react';

interface ComparePageProps {
  selectedLanguage: string;
  announce: (msg: string, mode?: 'polite' | 'assertive') => void;
}

export const ComparePage: React.FC<ComparePageProps> = ({
  selectedLanguage,
  announce,
}) => {
  const [characterToCompare, setCharacterToCompare] = useState<string>('a');
  const [localEntry, setLocalEntry] = useState<BrailleCharacterEntry | null>(null);
  const [externalResult, setExternalResult] = useState<ExternalReferenceResult | null>(null);
  const [isExternalConnected, setIsExternalConnected] = useState<boolean>(false);

  useEffect(() => {
    runComparison();
  }, [characterToCompare, selectedLanguage, isExternalConnected]);

  const runComparison = async () => {
    const entries = await brailleService.getEntries(selectedLanguage);
    const localMatch = entries.find(e => e.character === characterToCompare || e.character.toLowerCase() === characterToCompare.toLowerCase());
    setLocalEntry(localMatch || null);

    const adapter = brailleService.getExternalAdapter();
    adapter.setConnectionState(isExternalConnected);
    const ext = await adapter.lookupCharacter(characterToCompare, selectedLanguage);
    setExternalResult(ext);
  };

  const toggleAdapterConnection = () => {
    const nextState = !isExternalConnected;
    setIsExternalConnected(nextState);
    announce(`External Reference Adapter toggled to ${nextState ? 'Connected Live' : 'Offline Local Fallback'}`);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <GitCompare className="w-6 h-6 text-indigo-400" aria-hidden="true" />
              Braille Comparison & External Reference Adapter
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Compare local dataset entries with external reference services (e.g. Japanese Braille Viewer Adapter)
            </p>
          </div>

          <button
            type="button"
            onClick={toggleAdapterConnection}
            className={`flex items-center space-x-2 text-xs font-semibold px-4 py-2.5 rounded-xl border transition-all ${
              isExternalConnected
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
            aria-label="Toggle mock external reference connection"
          >
            {isExternalConnected ? (
              <>
                <Wifi className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                <span>Adapter Status: Live External Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-amber-400" aria-hidden="true" />
                <span>Adapter Status: Local Fallback Standalone</span>
              </>
            )}
          </button>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <label htmlFor="compare-char-input" className="text-sm font-semibold text-slate-200">
            Compare Character:
          </label>
          <input
            id="compare-char-input"
            type="text"
            maxLength={5}
            value={characterToCompare}
            onChange={(e) => setCharacterToCompare(e.target.value)}
            className="w-28 bg-slate-950 border border-slate-700 text-white font-mono text-center font-bold px-3 py-2 rounded-xl text-lg focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-400" aria-hidden="true" />
              Local Application Dataset ({selectedLanguage.toUpperCase()})
            </h3>
            <span className="text-xs text-indigo-300 font-semibold bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-full">
              Primary Source
            </span>
          </div>

          {localEntry ? (
            <div className="space-y-4">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-center space-y-1">
                <div className="text-4xl font-mono font-bold text-indigo-300">
                  {localEntry.brailleUnicode}
                </div>
                <div className="text-xs font-mono text-slate-300">
                  Dots: {formatDotsString(localEntry.dots)}
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                  <span className="text-slate-400">Character:</span>
                  <span className="font-bold text-white font-mono">{localEntry.character}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                  <span className="text-slate-400">Category:</span>
                  <span>{localEntry.category || localEntry.type}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                  <span className="text-slate-400">Source:</span>
                  <span>{localEntry.source}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                  <span className="text-slate-400">Verified:</span>
                  <span className={localEntry.verified ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                    {localEntry.verified ? 'Verified Standard' : 'Unverified'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 text-sm">
              No local entry found for '{characterToCompare}' in {selectedLanguage.toUpperCase()} dataset.
            </div>
          )}
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ExternalLink className="w-5 h-5 text-purple-400" aria-hidden="true" />
              External Reference Adapter
            </h3>
            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                isExternalConnected
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
              }`}
            >
              {isExternalConnected ? 'Live Connection' : 'Local Fallback'}
            </span>
          </div>

          {externalResult ? (
            <div className="space-y-4">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-center space-y-1">
                <div className="text-4xl font-mono font-bold text-purple-300">
                  {externalResult.brailleUnicode}
                </div>
                <div className="text-xs font-mono text-slate-300">
                  Dots: {formatDotsString(externalResult.dots)}
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                  <span className="text-slate-400">Adapter Source:</span>
                  <span className="font-bold text-slate-200">{externalResult.sourceName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                  <span className="text-slate-400">Definition:</span>
                  <span className="text-slate-300">{externalResult.definition}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                  <span className="text-slate-400">Connection Status:</span>
                  <span className="font-semibold text-slate-200 uppercase">{externalResult.status}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 text-sm">
              No external reference available for language '{selectedLanguage}'.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
