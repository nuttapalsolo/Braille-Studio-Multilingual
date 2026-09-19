import React from 'react';
import { useBrailleEditor } from '../hooks/useBrailleEditor';
import { BrailleCell } from '../components/braille/BrailleCell';
import { speechService } from '../services/SpeechService';
import { Edit3, Keyboard, RotateCcw, Volume2, FileSpreadsheet, Lock } from 'lucide-react';

interface EditorPageProps {
  selectedLanguage: string;
  announce: (msg: string, mode?: 'polite' | 'assertive') => void;
}

export const EditorPage: React.FC<EditorPageProps> = ({
  selectedLanguage,
  announce,
}) => {
  const {
    selectedDots,
    mode,
    setMode,
    toggleDot,
    clearDots,
    unicodeChar,
    formattedDots,
  } = useBrailleEditor({
    initialDots: [1, 2, 4, 5],
    cellMode: '6-dot',
    announceFn: announce,
  });

  const handleSpeakPattern = () => {
    speechService.speakPattern(selectedDots);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Edit3 className="w-6 h-6 text-indigo-400" aria-hidden="true" />
              Braille Dot Audio Inspector & Visualizer
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Interactive 6/8-dot matrix visualizer with Web Speech API audio announcements ("จุด 1", "จุด 2", "รูปแบบจุด 1 2 4 5")
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
          <span><kbd className="bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-indigo-300">1-8</kbd> Toggle Dots (มีเสียงอ่าน)</span>
          <span>•</span>
          <span><kbd className="bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-indigo-300">Space</kbd> Toggle Focused</span>
          <span>•</span>
          <span><kbd className="bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-indigo-300">Esc</kbd> Reset</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 flex flex-col justify-between">
          <div className="bg-slate-950 border border-indigo-500/30 rounded-2xl p-6 text-center space-y-3 shadow-inner relative">
            <div className="text-xs font-bold uppercase tracking-widest text-indigo-400 flex items-center justify-center gap-2">
              <Volume2 className="w-4 h-4 text-emerald-400 animate-pulse" />
              Live Braille Unicode & Audio Preview
            </div>

            <div
              className="text-7xl font-mono text-white font-black py-2 tracking-widest"
              aria-label={`Current Braille Character: ${unicodeChar}`}
            >
              {unicodeChar}
            </div>

            <div className="flex items-center justify-center gap-3">
              <span className="text-sm font-mono text-indigo-300 font-bold bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5">
                Dots Pattern: {formattedDots}
              </span>

              <button
                type="button"
                onClick={handleSpeakPattern}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-emerald-500/40 shadow flex items-center gap-1.5 transition-all"
                aria-label="Play pattern audio out loud"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>ฟังเสียงจุด</span>
              </button>
            </div>
          </div>

          <BrailleCell
            selectedDots={selectedDots}
            onToggleDot={toggleDot}
            mode={mode}
          />

          <div className="flex justify-center gap-3 pt-2">
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

        <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" aria-hidden="true" />
              Google Sheets Data Policy
            </h3>

            <div className="bg-slate-950 border border-emerald-500/30 rounded-xl p-4 space-y-3 text-xs text-slate-300">
              <div className="flex items-center gap-2 font-bold text-emerald-300 text-sm">
                <Lock className="w-4 h-4 text-emerald-400" />
                การเพิ่ม/แก้ไขข้อมูลทำผ่าน Google Sheets เท่านั้น
              </div>
              <p className="text-slate-400 leading-relaxed">
                เพื่อความถูกต้องและเป็นระเบียบของข้อมูล ระบบได้ปิดฟอร์มการกดเพิ่ม/แก้ไขข้อมูลด้วยตนเองบนหน้าเว็บ (Manual Form Removed) 
              </p>
              <p className="text-slate-300 leading-relaxed font-semibold">
                ข้อมูลเบรลล์ทั้งหมดจะถูกอ่านและซิงค์มาจาก **Google Sheets** ของคุณโดยตรงผ่านแถบ <strong className="text-indigo-300">Google Sheets Sync</strong>
              </p>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2 text-xs">
              <div className="font-bold text-slate-200">🔊 ระบบเสียงอ่านจุดเบรลล์ (Audio Readout):</div>
              <ul className="list-disc list-inside text-slate-400 space-y-1 pl-1">
                <li>กดปุ่มจุดในกล่อง หรือกดเลข <kbd className="bg-slate-800 border border-slate-700 px-1 rounded text-indigo-300">1-8</kbd> บนคีย์บอร์ด</li>
                <li>ระบบจะออกเสียงภาษาไทย เช่น <strong className="text-emerald-300">"จุด 1"</strong>, <strong className="text-emerald-300">"จุด 2"</strong></li>
                <li>กดปุ่ม <strong className="text-indigo-300">"ฟังเสียงจุด"</strong> เพื่อฟังเสียงสรุปรูปแบบจุดทั้งหมด</li>
              </ul>
            </div>
          </div>

          <div className="text-xs text-slate-500 border-t border-slate-800 pt-3">
            Active Language: <strong className="text-indigo-300 uppercase">{selectedLanguage}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
