import React, { useState, useEffect } from 'react';
import type { ConversionResult } from '../engine/BrailleConverter';
import { brailleService } from '../services/BrailleService';
import { ArrowLeftRight, CheckCircle2, AlertCircle, Copy, Check, Info } from 'lucide-react';

interface ConverterPageProps {
  selectedLanguage: string;
  announce: (msg: string, mode?: 'polite' | 'assertive') => void;
}

export const ConverterPage: React.FC<ConverterPageProps> = ({
  selectedLanguage,
  announce,
}) => {
  const [direction, setDirection] = useState<'text-to-braille' | 'braille-to-text'>('text-to-braille');
  const [inputText, setInputText] = useState<string>('hello world');
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    handleConvert();
  }, [inputText, selectedLanguage, direction]);

  const handleConvert = async () => {
    if (!inputText) {
      setResult(null);
      return;
    }

    if (direction === 'text-to-braille') {
      const res = await brailleService.convertTextToBraille(inputText, selectedLanguage);
      setResult(res);
    } else {
      const res = await brailleService.convertBrailleToText(inputText, selectedLanguage);
      setResult(res);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    const textToCopy = result.brailleText;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    announce('Converted text copied to clipboard.');
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleDirection = () => {
    const nextDir = direction === 'text-to-braille' ? 'braille-to-text' : 'text-to-braille';
    setDirection(nextDir);
    if (result) {
      setInputText(result.brailleText);
    }
    announce(`Conversion direction changed to ${nextDir === 'text-to-braille' ? 'Text to Braille' : 'Braille to Text'}`);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <ArrowLeftRight className="w-6 h-6 text-indigo-400" aria-hidden="true" />
              Braille Converter
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Bi-directional Text <span aria-hidden="true">⇄</span> Braille conversion with character breakdown table
            </p>
          </div>

          <button
            type="button"
            onClick={toggleDirection}
            className="flex items-center space-x-2 bg-indigo-600/90 hover:bg-indigo-600 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-lg transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-400"
            aria-label={`Switch conversion mode. Current mode: ${
              direction === 'text-to-braille' ? 'Text to Braille' : 'Braille to Text'
            }`}
          >
            <ArrowLeftRight className="w-4 h-4" aria-hidden="true" />
            <span>
              Mode: {direction === 'text-to-braille' ? 'Text ➔ Braille' : 'Braille ➔ Text'}
            </span>
          </button>
        </div>

        <div className="mt-6 space-y-2">
          <label htmlFor="converter-input" className="block text-sm font-semibold text-slate-200">
            {direction === 'text-to-braille' ? 'Input Plain Text:' : 'Input Braille Unicode Text:'}
          </label>
          <textarea
            id="converter-input"
            rows={3}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              direction === 'text-to-braille'
                ? 'Type plain text here...'
                : 'Paste Braille Unicode characters here (e.g. ⠁⠃⠉)...'
            }
            className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl p-4 text-base focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500 shadow-inner font-mono transition-all"
            aria-describedby="input-help"
          />
          <p id="input-help" className="text-xs text-slate-400">
            Active dataset: <strong className="text-indigo-300 uppercase">{selectedLanguage}</strong>. Real-time conversion active.
          </p>
        </div>
      </div>

      {result && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              Conversion Result
            </h3>
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center space-x-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-400"
              aria-label="Copy result output to clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-400" aria-hidden="true" />
                  <span>Copy Result</span>
                </>
              )}
            </button>
          </div>

          <div className="bg-slate-950 border border-indigo-500/30 rounded-xl p-6 text-center space-y-2 shadow-inner">
            <div className="text-xs font-semibold uppercase tracking-widest text-indigo-400">
              Braille Output Unicode
            </div>
            <div
              className="text-4xl sm:text-5xl font-mono tracking-wider text-white font-bold py-2 select-all break-all"
              aria-label={`Converted Braille Unicode: ${result.brailleText}`}
            >
              {result.brailleText || '⠀'}
            </div>
            <div className="text-xs text-slate-400 flex items-center justify-center gap-4 pt-2 border-t border-slate-800">
              <span>Total Length: <strong>{result.totalChars}</strong></span>
              <span>Mapped: <strong className="text-emerald-400">{result.mappedCharsCount}</strong></span>
              <span>Unmapped: <strong className="text-amber-400">{result.unmappedCharsCount}</strong></span>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Info className="w-4 h-4 text-indigo-400" aria-hidden="true" />
              Character Breakdown & Mapping Metadata
            </h4>

            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950 text-slate-400 text-xs uppercase tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th scope="col" className="px-4 py-3">Character</th>
                    <th scope="col" className="px-4 py-3">Braille Unicode</th>
                    <th scope="col" className="px-4 py-3">Dots Pattern</th>
                    <th scope="col" className="px-4 py-3">Category</th>
                    <th scope="col" className="px-4 py-3">Source</th>
                    <th scope="col" className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                  {result.breakdown.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-white text-base">
                        {item.character === ' ' ? '<Space>' : item.character}
                      </td>
                      <td className="px-4 py-3 font-mono text-2xl text-indigo-300">
                        {item.brailleUnicode}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-200">
                        <span className="bg-slate-800 border border-slate-700 px-2 py-1 rounded">
                          {item.formattedDots}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-300">
                        {item.category}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">
                        {item.source}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {item.verified ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-400 font-semibold bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
                            <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
                            Unverified
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
