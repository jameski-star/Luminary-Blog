import type { WritingTone } from '../types';

const AI_PATTERNS = [
  /\bin (today's|this) (digital|modern|ever-evolving|rapidly evolving) (landscape|world|era)\b/i,
  /\bit is (important|crucial|essential|worth noting|no surprise)\b/i,
  /\b(as we (move|look|venture) (into|toward|ahead))\b/i,
  /\b(in (conclusion|summary|the final analysis))\b/i,
  /\b(furthermore|moreover|nevertheless|nonetheless|consequently)\b/gi,
  /\b(a (multifaceted|comprehensive|holistic) (approach|view|perspective))\b/i,
  /\b(the (cornerstone|backbone|bedrock|linchpin) of\b)/i,
  /\b(delve (into|deeper)|unpack|navigate the (complexities|nuances))\b/i,
  /\b(it goes without saying\b|needless to say\b)/i,
  /\b(in a (similar|comparable) vein\b)/i,
  /\b(pivot|paradigm|synergy|leverage|utilize|leverage|streamline)\b/gi,
  /\b(testament|testimony) to\b/i,
  /\b(not only.*but also)\b/gi,
];

const HUMAN_ALTERNATIVES: [RegExp, string][] = [
  [/\bin (today's|this) (digital|modern|ever-evolving|rapidly evolving) (landscape|world|era)\b/gi, ''],
  [/\bit is (important|crucial|essential) to\b/gi, 'You should'],
  [/\bit is worth noting that\b/gi, 'Worth noting:'],
  [/\b(as we move (into|toward|forward)\b)/gi, 'looking at'],
  [/\bin conclusion\b/gi, 'So'],
  [/\bin summary\b/gi, 'Long story short'],
  [/\bfurthermore\b/gi, 'Plus'],
  [/\bmoreover\b/gi, 'On top of that'],
  [/\bnevertheless\b/gi, 'Even so'],
  [/\bnonetheless\b/gi, 'Still'],
  [/\bconsequently\b/gi, 'As a result'],
  [/\bdelve\b/gi, 'dig'],
  [/\bdelve deeper\b/gi, 'go deeper'],
  [/\bunpack\b/gi, 'break down'],
  [/\bnavigate the complexities\b/gi, 'work through'],
  [/\bmultifaceted\b/gi, 'complex'],
  [/\bcomprehensive\b/gi, 'thorough'],
  [/\bholistic\b/gi, 'big-picture'],
  [/\bcornerstone\b/gi, 'foundation'],
  [/\bbackbone\b/gi, 'core'],
  [/\bbedrock\b/gi, 'basis'],
  [/\bparadigm\b/gi, 'model'],
  [/\bsynergy\b/gi, 'collaboration'],
  [/\bleverage\b/gi, 'use'],
  [/\butilize\b/gi, 'use'],
  [/\btestament\b/gi, 'proof'],
  [/\bpivot\b/gi, 'shift'],
  [/\bit goes without saying\b/gi, 'Obviously'],
  [/\bneedless to say\b/gi, 'Unsurprisingly'],
  [/\bin a similar vein\b/gi, 'Similarly'],
];

const TRANSITIONS_HUMAN = [
  'Look,', 'Here\'s the thing:', 'Honestly,', 'The reality is,',
  'What matters:', 'Think about it:', 'Plain and simple:',
  'Sure,', 'Of course,', 'Now,', 'True,', 'Admittedly,',
  'That said,', 'Then again,', 'Meanwhile,', 'Here\'s what\'s interesting:',
  'Let\'s be real:', 'Best part?', 'Worst part?',
  'Point is,', 'Which brings us to:', 'Counterintuitively,',
  'Funny enough,', 'Go figure:',
];

const TONE_SYSTEM_INSTRUCTIONS: Record<WritingTone, string> = {
  professional: `You write like a senior analyst at a respected publication. Your tone is measured, confident, and precise. You state conclusions plainly without hedges. You cite specific data and name names. You never sound like a press release.`,
  conversational: `You write like a knowledgeable friend explaining something interesting over coffee. Your tone is warm, accessible, and natural. You use contractions freely, ask rhetorical questions, and keep sentences short. You never sound like a textbook.`,
  persuasive: `You write like a columnist with strong convictions. Your tone is bold, opinionated, and compelling. You take clear positions, challenge conventional wisdom, and back your arguments with evidence. You never sit on the fence.`,
  educational: `You write like a master teacher breaking down a complex topic. Your tone is patient, structured, and clear. You build from first principles, use analogies generously, and anticipate confusion. You never assume prior knowledge.`,
  narrative: `You write like a storyteller weaving a compelling narrative. Your tone is vivid, engaging, and personal. You open with scenes, use concrete details, and build momentum through anecdotes. You never sound like a report.`,
  technical: `You write like a senior engineer documenting architecture decisions. Your tone is precise, specification-grade, and assumed-competence. You use exact terminology, cite benchmarks, and explain tradeoffs. You never dumb things down.`,
};

const TONE_DRAFT_PROMPTS: Record<WritingTone, string> = {
  professional: `Write with the authority of a senior industry analyst. Use specific data points. Be direct and confident. No hedging language.`,
  conversational: `Write like you're explaining this to a friend. Use contractions. Keep it natural. Ask the occasional rhetorical question. No jargon.`,
  persuasive: `Take a strong position. Use compelling arguments. Challenge conventional thinking. Back claims with evidence. Be bold.`,
  educational: `Start from first principles. Use analogies. Build up gradually. Anticipate and address confusion. Be patient and thorough.`,
  narrative: `Open with a scene or anecdote. Use vivid details. Build narrative momentum. Make it personal and engaging.`,
  technical: `Be precise and specific. Use exact terminology. Cite benchmarks and tradeoffs. Assume technical competence. No fluff.`,
};

export function getToneInstruction(tone: WritingTone): string {
  return TONE_SYSTEM_INSTRUCTIONS[tone];
}

export function getToneDraftPrompt(tone: WritingTone): string {
  return TONE_DRAFT_PROMPTS[tone];
}

export function stripAIPatterns(text: string): string {
  let result = text;
  for (const [pattern, replacement] of HUMAN_ALTERNATIVES) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

export function getAIDetectionScore(text: string): { score: number; flags: string[] } {
  const flags: string[] = [];
  let matches = 0;

  for (const pattern of AI_PATTERNS) {
    const found = text.match(pattern);
    if (found) {
      matches += found.length;
      flags.push(found[0].trim());
    }
  }

  const sentences = text.split(/[.!?]+/).filter(Boolean);
  const sentenceLengths = sentences.map(s => s.split(/\s+/).filter(Boolean).length);

  const avgLength = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length;
  const variance = sentenceLengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / sentenceLengths.length;

  if (variance < 15) flags.push('Low sentence length variance (robotic rhythm)');

  const startsWithTransition = sentences.filter(s =>
    /\b(however|therefore|furthermore|moreover|consequently|additionally|nevertheless)\b/i.test(s.trim())
  ).length;
  if (startsWithTransition > sentences.length * 0.15) {
    flags.push('Excessive AI-style transitions at sentence starts');
  }

  const repeatedStructures = countRepeatedSentenceStarts(sentences);
  if (repeatedStructures > sentences.length * 0.25) {
    flags.push('Repetitive sentence structure patterns');
  }

  const totalPatterns = matches + Math.max(0, Math.round((avgLength / avgLength) - 2));
  const rawScore = Math.max(0, 100 - totalPatterns * 8 - Math.max(0, (30 - variance) / 2));
  const score = Math.min(100, Math.max(1, Math.round(rawScore)));

  return { score, flags };
}

function countRepeatedSentenceStarts(sentences: string[]): number {
  const starts = sentences.map(s => {
    const words = s.trim().split(/\s+/);
    return words.length > 0 ? words[0].toLowerCase().replace(/[^a-z]/g, '') : '';
  }).filter(Boolean);

  const freq: Record<string, number> = {};
  for (const start of starts) {
    freq[start] = (freq[start] || 0) + 1;
  }

  const repeatedCount = Object.values(freq).filter(c => c > 2).reduce((a, c) => a + c, 0);
  return repeatedCount;
}

export function injectHumanVariation(text: string): string {
  const paragraphs = text.split(/\n\s*\n/);

  const result = paragraphs.map((p, i) => {
    if (!p.trim() || p.trim().startsWith('|') || p.trim().startsWith('```') || p.trim().startsWith('>')) return p;

    const sentences = p.split(/(?<=[.!?])\s+/);

    if (sentences.length >= 3 && i % 4 === 0) {
      const idx = Math.floor(Math.random() * (sentences.length - 1));
      sentences[idx] = sentences[idx].trimEnd() + ' ' + TRANSITIONS_HUMAN[Math.floor(Math.random() * TRANSITIONS_HUMAN.length)];
    }

    if (sentences.length >= 2 && i % 7 === 0) {
      const idx = Math.floor(Math.random() * sentences.length);
      const lastChar = sentences[idx].trimEnd().slice(-1);
      if (lastChar === '.' || lastChar === '!') {
        sentences[idx] = sentences[idx].trimEnd() + ' ' + (lastChar === '.' ? 'Go figure.' : 'Ironic, right?');
      }
    }

    return sentences.join(' ');
  });

  return result.join('\n\n');
}

export function humanizeForSEO(text: string, tone: WritingTone = 'professional'): string {
  let result = stripAIPatterns(text);
  result = injectHumanVariation(result);
  return result;
}

export function getToneAPIInstruction(tone: WritingTone): { system: string; user: string } {
  return {
    system: TONE_SYSTEM_INSTRUCTIONS[tone],
    user: TONE_DRAFT_PROMPTS[tone],
  };
}
