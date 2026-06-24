export function detectRogueContent(text: string): { isRogue: boolean; reason?: string } {
  const trimmed = text.trim();
  if (!trimmed) return { isRogue: false };
  const words = trimmed.split(/\s+/);
  if (words.length < 10) return { isRogue: true, reason: 'Content too short (less than 10 words).' };
  const charRatio = trimmed.replace(/\s/g, '').length / trimmed.length;
  if (charRatio > 0.95) return { isRogue: true, reason: 'Suspicious content: very low whitespace ratio (possible gibberish).' };
  const uniqueChars = new Set(trimmed.toLowerCase().replace(/\s/g, '')).size;
  const totalChars = trimmed.replace(/\s/g, '').length;
  if (totalChars > 20 && uniqueChars < 5) return { isRogue: true, reason: 'Suspicious content: too few unique characters (possible keyboard spam).' };
  const lines = trimmed.split('\n').filter(Boolean);
  const repeatedLines = lines.filter((l, i) => lines.indexOf(l) !== i);
  if (repeatedLines.length > 2) return { isRogue: true, reason: 'Suspicious content: repeated lines detected (possible copy-paste spam).' };
  const repeatedWords = words.filter((w, i) => words.indexOf(w) !== i);
  if (repeatedWords.length > words.length * 0.6) return { isRogue: true, reason: 'Suspicious content: excessive word repetition.' };
  return { isRogue: false };
}
