/**
 * Web Speech API Audio Engine for Braille Dot Announcements
 * Speaks dot numbers, dot patterns, and Braille characters aloud for Screen Reader / Audio users.
 */

export class SpeechService {
  private synth: SpeechSynthesis | null = null;
  private isMuted: boolean = false;
  private voice: SpeechSynthesisVoice | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.initVoice();
    }
  }

  private initVoice() {
    if (!this.synth) return;

    const setVoice = () => {
      const voices = this.synth!.getVoices();
      // Prefer Thai voice, fallback to default
      const thaiVoice = voices.find(v => v.lang.includes('th') || v.lang.includes('TH'));
      this.voice = thaiVoice || voices[0] || null;
    };

    setVoice();
    if (typeof window !== 'undefined' && 'onvoiceschanged' in this.synth) {
      this.synth.onvoiceschanged = setVoice;
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && this.synth) {
      this.synth.cancel();
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Speaks a specific Braille dot number (e.g. "จุด 1", "ยกเลิก จุด 2")
   */
  public speakDot(dotNumber: number, enabled: boolean) {
    if (this.isMuted || !this.synth) return;

    this.synth.cancel(); // Cancel prior speech for immediate response
    const actionText = enabled ? 'จุด' : 'ยกเลิก จุด';
    const text = `${actionText} ${dotNumber}`;

    const utterance = new SpeechSynthesisUtterance(text);
    if (this.voice) utterance.voice = this.voice;
    utterance.lang = 'th-TH';
    utterance.rate = 1.1; // Slightly faster for quick responsiveness

    this.synth.speak(utterance);
  }

  /**
   * Speaks a full Braille dot pattern (e.g. "รูปแบบจุด 1 2 4 5")
   */
  public speakPattern(dots: number[]) {
    if (this.isMuted || !this.synth) return;

    this.synth.cancel();
    const sorted = [...dots].sort((a, b) => a - b);
    const patternStr = sorted.length > 0 ? sorted.join(' ') : 'ไม่มีจุด';
    const text = `รูปแบบจุด ${patternStr}`;

    const utterance = new SpeechSynthesisUtterance(text);
    if (this.voice) utterance.voice = this.voice;
    utterance.lang = 'th-TH';
    utterance.rate = 1.0;

    this.synth.speak(utterance);
  }

  /**
   * Speaks general text or character aloud
   */
  public speakText(text: string, langCode: string = 'th-TH') {
    if (this.isMuted || !this.synth || !text) return;

    this.synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    if (this.voice) utterance.voice = this.voice;
    utterance.lang = langCode;
    utterance.rate = 1.0;

    this.synth.speak(utterance);
  }
}

export const speechService = new SpeechService();
