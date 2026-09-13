import React, { useState, useEffect } from 'react';
import type { BrailleCharacterEntry } from '../types/braille';
import { brailleService } from '../services/BrailleService';
import { formatDotsString } from '../engine/unicodeBraille';
import { Search, Filter, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

interface DictionaryPageProps {
  selectedLanguage: string;
  announce: (msg: string, mode?: 'polite' | 'assertive') => void;
}

export const DictionaryPage: React.FC<DictionaryPageProps> = ({
  selectedLanguage,
  announce,
}) => {
  const [entries, setEntries] = useState<BrailleCharacterEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [verifiedFilter, setVerifiedFilter] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadDictionary();
  }, [selectedLanguage]);

  const loadDictionary = async () => {
    setLoading(true);
    const data = await brailleService.getEntries(selectedLanguage);
    setEntries(data);
    setLoading(false);
  };

  const categories = Array.from(new Set(entries.map(e => e.category || e.type || 'General')));

  const filteredEntries = entries.filter(item => {
    if (categoryFilter !== 'all' && (item.category || item.type) !== categoryFilter) {
      return false;
    }

    if (verifiedFilter === 'verified' && !item.verified) return false;
    if (verifiedFilter === 'unverified' && item.verified) return false;

    if (!searchQuery.trim()) return true;

    const q = searchQuery.toLowerCase().trim();
    const dotsStr = formatDotsString(item.dots);

    return (
      item.character.toLowerCase().includes(q) ||
      item.brailleUnicode.includes(q) ||
      dotsStr.includes(q) ||
      (item.category && item.category.toLowerCase().includes(q)) ||
      (item.type && item.type.toLowerCase().includes(q)) ||
      (item.rule && item.rule.toLowerCase().includes(q)) ||
      (item.source && item.source.toLowerCase().includes(q))
    );
  });

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (val.trim()) {
      announce(`Searching dictionary for ${val}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-indigo-400" aria-hidden="true" />
            Braille Dictionary
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Search dictionary by Character, Braille Symbol, Dot Pattern (e.g. 1-2-4-5), Category or Source
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
          <div className="relative md:col-span-2">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" aria-hidden="true" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search by character, ⠁, dots '1-2-4-5', etc..."
              className="w-full bg-slate-950 border border-slate-700 text-slate-100 pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500 shadow-inner"
              aria-label="Search braille dictionary"
            />
          </div>

          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-100 px-3 py-2.5 rounded-xl text-sm focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500"
              aria-label="Filter dictionary by category"
            >
              <option value="all">All Categories</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={verifiedFilter}
              onChange={(e) => setVerifiedFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-100 px-3 py-2.5 rounded-xl text-sm focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500"
              aria-label="Filter by verification status"
            >
              <option value="all">All Statuses</option>
              <option value="verified">Verified Only</option>
              <option value="unverified">Unverified Only</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading dataset...</div>
      ) : filteredEntries.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <Filter className="w-10 h-10 text-slate-500 mx-auto" aria-hidden="true" />
          <h3 className="text-lg font-bold text-slate-300">No Dictionary Entries Found</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            No items in active language <strong className="text-indigo-300 uppercase">{selectedLanguage}</strong> match your filter.
            {selectedLanguage === 'th' && ' (Thai dataset is currently empty awaiting official import).' }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEntries.map(item => (
            <div
              key={item.id}
              className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg hover:border-slate-700 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                    {item.category || item.type || 'General'}
                  </div>
                  <div className="text-2xl font-bold text-white mt-0.5">
                    {item.character === ' ' ? '<Space>' : item.character}
                  </div>
                </div>

                <div className="w-14 h-14 bg-slate-950 border border-indigo-500/30 rounded-xl flex items-center justify-center text-3xl font-mono text-indigo-300 shadow-inner">
                  {item.brailleUnicode}
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-300 bg-slate-950/60 rounded-xl p-3 border border-slate-800">
                <div className="flex justify-between">
                  <span className="text-slate-400">Dot Pattern:</span>
                  <span className="font-mono font-bold text-indigo-200">
                    {formatDotsString(item.dots)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Language:</span>
                  <span className="font-semibold text-slate-200 uppercase">{item.language}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Source:</span>
                  <span className="text-slate-300 truncate max-w-[150px]">{item.source || 'Standard'}</span>
                </div>
                {item.rule && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Rule:</span>
                    <span className="text-slate-300">{item.rule}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                {item.verified ? (
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                    Verified Standard
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-amber-400 font-semibold bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full text-xs">
                    <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
                    Unverified Entry
                  </span>
                )}
                <span className="text-[11px] text-slate-500">ID: {item.id}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
