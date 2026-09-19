import { useState, useEffect, useCallback } from 'react';
import { dotsToUnicode, formatDotsString } from '../engine/unicodeBraille';
import { speechService } from '../services/SpeechService';

export interface UseBrailleEditorProps {
  initialDots?: number[];
  cellMode?: '6-dot' | '8-dot';
  onSave?: (dots: number[], unicode: string) => void;
  onCancel?: () => void;
  announceFn?: (msg: string) => void;
}

export function useBrailleEditor({
  initialDots = [],
  cellMode = '6-dot',
  onSave,
  onCancel,
  announceFn,
}: UseBrailleEditorProps = {}) {
  const [selectedDots, setSelectedDots] = useState<number[]>(initialDots);
  const [mode, setMode] = useState<'6-dot' | '8-dot'>(cellMode);
  const [focusedDot, setFocusedDot] = useState<number | null>(1);

  const maxDots = mode === '6-dot' ? 6 : 8;

  useEffect(() => {
    setSelectedDots(initialDots);
  }, [JSON.stringify(initialDots)]);

  const toggleDot = useCallback(
    (dotNumber: number) => {
      if (dotNumber < 1 || dotNumber > maxDots) return;

      setSelectedDots(prev => {
        const exists = prev.includes(dotNumber);
        const next = exists
          ? prev.filter(d => d !== dotNumber).sort((a, b) => a - b)
          : [...prev, dotNumber].sort((a, b) => a - b);

        const statusStr = exists ? 'disabled' : 'enabled';
        const patternStr = next.length > 0 ? next.join(' ') : 'none';
        const msg = `Dot ${dotNumber} ${statusStr}. Current pattern: ${patternStr}`;

        if (announceFn) {
          announceFn(msg);
        }

        // Web Speech API Voice Announcement ("จุด 1", "จุด 2")
        speechService.speakDot(dotNumber, !exists);

        return next;
      });
    },
    [maxDots, announceFn]
  );

  const setDots = useCallback((dots: number[]) => {
    const sorted = [...dots].filter(d => d >= 1 && d <= 8).sort((a, b) => a - b);
    setSelectedDots(sorted);
    speechService.speakPattern(sorted);
  }, []);

  const clearDots = useCallback(() => {
    setSelectedDots([]);
    if (announceFn) announceFn('All dots cleared.');
    speechService.speakText('ล้างจุดทั้งหมด');
  }, [announceFn]);

  const unicodeChar = dotsToUnicode(selectedDots);
  const formattedDots = formatDotsString(selectedDots);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      const key = e.key;

      if (key >= '1' && key <= '8') {
        const num = parseInt(key, 10);
        if (num <= maxDots) {
          e.preventDefault();
          toggleDot(num);
          setFocusedDot(num);
        }
      } else if (key === ' ' || key === 'Spacebar') {
        if (focusedDot !== null && focusedDot <= maxDots) {
          e.preventDefault();
          toggleDot(focusedDot);
        }
      } else if (key === 'Enter') {
        if (onSave) {
          e.preventDefault();
          onSave(selectedDots, unicodeChar);
        }
      } else if (key === 'Escape') {
        if (onCancel) {
          e.preventDefault();
          onCancel();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [maxDots, focusedDot, selectedDots, unicodeChar, toggleDot, onSave, onCancel]);

  return {
    selectedDots,
    mode,
    setMode,
    maxDots,
    focusedDot,
    setFocusedDot,
    toggleDot,
    setDots,
    clearDots,
    unicodeChar,
    formattedDots,
  };
}
