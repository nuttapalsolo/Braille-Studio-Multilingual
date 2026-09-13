import { useState, useEffect } from 'react';
import { Navbar, type NavTab } from './components/common/Navbar';
import { LiveAnnouncer } from './components/common/LiveAnnouncer';
import { useScreenReaderAnnounce } from './hooks/useScreenReaderAnnounce';
import { brailleService } from './services/BrailleService';
import type { LanguageMeta } from './types/braille';

import { ConverterPage } from './pages/ConverterPage';
import { DictionaryPage } from './pages/DictionaryPage';
import { EditorPage } from './pages/EditorPage';
import { DataManagerPage } from './pages/DataManagerPage';
import { ComparePage } from './pages/ComparePage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';

export function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('converter');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [languages, setLanguages] = useState<LanguageMeta[]>([]);
  const { announcement, politeness, announce } = useScreenReaderAnnounce();

  useEffect(() => {
    loadLanguages();
  }, []);

  const loadLanguages = async () => {
    const langs = await brailleService.getLanguages();
    setLanguages(langs);
  };

  const handleTabChange = (tab: NavTab) => {
    setActiveTab(tab);
    announce(`Switched to tab ${tab.replace('-', ' ')}`);
  };

  const handleLanguageChange = (code: string) => {
    setSelectedLanguage(code);
    const langObj = languages.find(l => l.code === code);
    announce(`Selected language changed to ${langObj?.name || code}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      <LiveAnnouncer message={announcement} politeness={politeness} />

      <Navbar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        selectedLanguage={selectedLanguage}
        setSelectedLanguage={handleLanguageChange}
        languages={languages}
      />

      <main id="main-content" tabIndex={-1} className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 focus:outline-none">
        {activeTab === 'converter' && (
          <ConverterPage selectedLanguage={selectedLanguage} announce={announce} />
        )}
        {activeTab === 'dictionary' && (
          <DictionaryPage selectedLanguage={selectedLanguage} announce={announce} />
        )}
        {activeTab === 'editor' && (
          <EditorPage selectedLanguage={selectedLanguage} announce={announce} />
        )}
        {activeTab === 'data-manager' && (
          <DataManagerPage selectedLanguage={selectedLanguage} announce={announce} />
        )}
        {activeTab === 'compare' && (
          <ComparePage selectedLanguage={selectedLanguage} announce={announce} />
        )}
        {activeTab === 'history' && (
          <HistoryPage selectedLanguage={selectedLanguage} announce={announce} />
        )}
        {activeTab === 'settings' && (
          <SettingsPage announce={announce} />
        )}
      </main>

      <footer className="bg-slate-900 border-t border-slate-800 py-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="font-semibold text-slate-300">Braille Studio Universal</span> • Screen Reader Compliant (NVDA, JAWS, VoiceOver, Narrator, TalkBack)
          </div>
          <div className="flex items-center space-x-4 text-slate-400">
            <span className="inline-flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              IndexedDB Local Repository Active
            </span>
            <span>•</span>
            <span>Unicode Braille ISO/IEC 11548-1</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
