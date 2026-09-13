/**
 * Unicode Braille Patterns ISO/IEC 11548-1 Bitmask Standard Engine
 * 
 * Codepoint range: U+2800 - U+28FF
 * Bit 0 (0x01) -> Dot 1
 * Bit 1 (0x02) -> Dot 2
 * Bit 2 (0x04) -> Dot 3
 * Bit 3 (0x08) -> Dot 4
 * Bit 4 (0x10) -> Dot 5
 * Bit 5 (0x20) -> Dot 6
 * Bit 6 (0x40) -> Dot 7
 * Bit 7 (0x80) -> Dot 8
 */

export function dotsToUnicode(dots: number[]): string {
  if (!dots || !Array.isArray(dots)) return '\u2800';
  let mask = 0;
  for (const dot of dots) {
    if (dot >= 1 && dot <= 8) {
      mask |= (1 << (dot - 1));
    }
  }
  return String.fromCharCode(0x2800 + mask);
}

export function unicodeToDots(brailleChar: string): number[] {
  if (!brailleChar || brailleChar.length === 0) return [];
  const code = brailleChar.charCodeAt(0);
  if (code < 0x2800 || code > 0x28FF) return [];
  
  const mask = code - 0x2800;
  const dots: number[] = [];
  for (let d = 1; d <= 8; d++) {
    if ((mask & (1 << (d - 1))) !== 0) {
      dots.push(d);
    }
  }
  return dots;
}

export function formatDotsString(dots: number[]): string {
  if (!dots || dots.length === 0) return 'Empty';
  const sorted = [...dots].sort((a, b) => a - b);
  return sorted.join('-');
}

export function parseDotsString(input: string): number[] {
  if (!input) return [];
  const parts = input.split(/[\s,\-]+/);
  const dots: number[] = [];
  for (const p of parts) {
    const val = parseInt(p.trim(), 10);
    if (!isNaN(val) && val >= 1 && val <= 8) {
      dots.push(val);
    }
  }
  return Array.from(new Set(dots)).sort((a, b) => a - b);
}

export function isBrailleUnicode(char: string): boolean {
  if (!char || char.length === 0) return false;
  const code = char.charCodeAt(0);
  return code >= 0x2800 && code <= 0x28FF;
}
