import React, { useState } from 'react';
import {
  Languages,
  BookOpen,
  Edit3,
  Database,
  GitCompare,
  History,
  Settings,
  Sparkles,
  Volume2,
  VolumeX,
  FileSpreadsheet,
} from 'lucide-react';
import { speechService } from '../../services/SpeechService';

export type NavTab =
  | 'converter'
  | 'dictionary'
  | 'editor'
  | 'data-manager'
  | 'compare'
  | 'history'
  | 'settings';

interface NavbarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  selectedLanguage: string;
  setSelectedLanguage: (lang: string) => void;
  languages: Array<{ code: string; name: string; nativeName: string; verified: boolean }>;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  selectedLanguage,
  setSelectedLanguage,
  languages,
}) => {
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(speechService.getIsMuted());

  const toggleAudio = () => {
    const nextState = !isAudioMuted;
    setIsAudioMuted(nextState);
    speechService.setMuted(nextState);
    if (!nextState) {
      speechService.speakText('เปิด เสียงอ่าน จุดเบรลล์');
    }
  };

  const navItems: Array<{ id: NavTab; label: string; icon: React.ReactNode; description: string }> = [
    {
      id: 'converter',
      label: 'Converter',
      icon: <Languages className="w-5 h-5" aria-hidden="true" />,
      description: 'Text to Braille and Braille to Text translation',
    },
    {
      id: 'dictionary',
      label: 'Dictionary',
      icon: <BookOpen className="w-5 h-5" aria-hidden="true" />,
      description: 'Search & explore character mappings',
    },
    {
      id: 'editor',
      label: 'Braille Dot Audio Inspector',
      icon: <Edit3 className="w-5 h-5" aria-hidden="true" />,
      description: 'Interactive dot visualizer with Thai speech audio',
    },
    {
      id: 'data-manager',
      label: 'Google Sheets Sync',
      icon: <Database className="w-5 h-5" aria-hidden="true" />,
      description: 'Connect & Sync dataset from Google Sheets',
    },
    {
      id: 'compare',
      label: 'Compare',
      icon: <GitCompare className="w-5 h-5" aria-hidden="true" />,
      description: 'Compare mappings & external reference adapters',
    },
    {
      id: 'history',
      label: 'History',
      icon: <History className="w-5 h-5" aria-hidden="true" />,
      description: 'Audit trail and version restore',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="w-5 h-5" aria-hidden="true" />,
      description: 'Accessibility, screen reader & theme options',
    },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between py-3 gap-4">
          
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 ring-2 ring-indigo-400/50">
              <span className="text-2xl font-black text-white select-none" aria-hidden="true">⠃</span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  Braille Studio
                  <span className="text-xs bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                    <FileSpreadsheet className="w-3 h-3" />
                    Google Sheets Sourced
                  </span>
                </h1>
              </div>
              <p className="text-xs text-slate-400">
                Universal Braille System powered by Google Sheets & Web Speech API Audio
              </p>
            </div>
          </div>

          {/* Right Controls: Audio Voice Toggle & Language Selector */}
          <div className="flex items-center gap-3">
            {/* Audio Speech Toggle Button */}
            <button
              type="button"
              onClick={toggleAudio}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-400 ${
                !isAudioMuted
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-emerald-500/20 shadow'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
              aria-label={isAudioMuted ? 'Enable Braille Dot Audio Speech' : 'Disable Braille Dot Audio Speech'}
            >
              {!isAudioMuted ? (
                <>
                  <Volume2 className="w-4 h-4 text-emerald-400 animate-pulse" aria-hidden="true" />
                  <span>เสียงอ่านจุด: เปิด (Voice ON)</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4 text-slate-400" aria-hidden="true" />
                  <span>เสียงอ่านจุด: ปิด (Voice OFF)</span>
                </>
              )}
            </button>

            {/* Language Selector */}
            <div className="flex items-center gap-2">
              <label htmlFor="global-language-select" className="text-xs font-semibold text-slate-300 whitespace-nowrap flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" aria-hidden="true" />
                Language:
              </label>
              <select
                id="global-language-select"
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="bg-slate-800 text-slate-100 text-sm font-medium border border-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500 shadow-sm transition-all"
                aria-label="Select active language dataset"
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.nativeName} ({lang.name}) {!lang.verified ? '⚠️ Unverified' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <nav aria-label="Main Navigation" className="mt-1 border-t border-slate-800/80 pt-2 overflow-x-auto scrollbar-none">
          <ul role="tablist" className="flex space-x-1 min-w-max pb-2">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <li key={item.id} role="presentation">
                  <button
                    role="tab"
                    id={`nav-tab-${item.id}`}
                    aria-selected={isActive}
                    aria-controls={`nav-panel-${item.id}`}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-400 ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
};
