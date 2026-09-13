import { useState, useCallback } from 'react';

export function useScreenReaderAnnounce() {
  const [announcement, setAnnouncement] = useState<string>('');
  const [politeness, setPoliteness] = useState<'polite' | 'assertive'>('polite');

  const announce = useCallback((message: string, mode: 'polite' | 'assertive' = 'polite') => {
    setPoliteness(mode);
    setAnnouncement(message);
    
    // Clear after announcement to allow repeating identical announcements if triggered again
    setTimeout(() => {
      setAnnouncement('');
    }, 1500);
  }, []);

  return { announcement, politeness, announce };
}
