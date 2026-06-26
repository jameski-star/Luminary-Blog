const SERPER_URL = 'https://google.serper.dev/search';

interface SerperOrganicResult {
  title: string;
  link: string;
  snippet: string;
  position: number;
}

interface SerperPeopleAlsoAsk {
  question: string;
  snippet: string;
  link: string;
}

interface SerperRelatedSearch {
  query: string;
}

interface SerperResponse {
  searchParameters: { q: string; gl: string; hl: string };
  organic: SerperOrganicResult[];
  peopleAlsoAsk?: SerperPeopleAlsoAsk[];
  relatedSearches?: SerperRelatedSearch[];
  knowledgeGraph?: {
    title: string;
    type: string;
    description: string;
    attributes: Record<string, string>;
  };
}

export interface KeywordResearch {
  topic: string;
  keywords: string[];
  peopleAlsoAsk: { question: string; snippet: string }[];
  relatedSearches: string[];
  topRankingTitles: string[];
  topRankingSnippets: string[];
  missingKeywords: string[];
}

export interface CompetitorAnalysis {
  url: string;
  title: string;
  snippet: string;
  position: number;
}

export interface ContentOptimization {
  titleScore: number;
  contentScore: number;
  titleSuggestions: string[];
  contentSuggestions: string[];
  missingKeywords: string[];
  readabilityScore: number;
}

async function search(query: string, apiKey: string): Promise<SerperResponse> {
  const res = await fetch(SERPER_URL, {
    method: 'POST',
    headers: {
      'X-API-KEY': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ q: query, gl: 'us', hl: 'en', num: 10 }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Serper API error (${res.status}): ${text}`);
  }

  return res.json();
}

export async function researchKeywords(topic: string, apiKey: string): Promise<KeywordResearch> {
  const data = await search(topic, apiKey);
  const keywords = new Set<string>();

  const topicWords = topic.toLowerCase().split(/\s+/).filter(w => w.length > 2);

  const seen = new Set<string>();
  const allTexts: string[] = [];

  if (data.organic) {
    for (const r of data.organic) {
      allTexts.push(r.title, r.snippet);
    }
  }
  if (data.peopleAlsoAsk) {
    for (const q of data.peopleAlsoAsk) {
      allTexts.push(q.question, q.snippet);
    }
  }
  if (data.relatedSearches) {
    for (const r of data.relatedSearches) {
      allTexts.push(r.query);
    }
  }

  const wordFreq = new Map<string, number>();
  for (const text of allTexts) {
    const words = text.toLowerCase().split(/[\s,;.()]+/).filter(w => w.length > 3);
    for (const word of words) {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    }
  }

  const sorted = [...wordFreq.entries()]
    .filter(([w]) => !topicWords.includes(w))
    .sort((a, b) => b[1] - a[1]);

  for (const [word] of sorted.slice(0, 20)) {
    if (!seen.has(word)) {
      keywords.add(word);
      seen.add(word);
    }
  }

  const bigrams = new Set<string>();
  for (let i = 0; i < sorted.length - 1; i++) {
    const phrase = `${sorted[i][0]} ${sorted[i + 1][0]}`;
    if (phrase.length > 6) bigrams.add(phrase);
  }

  const allKeywords = [
    ...keywords,
    ...[...bigrams].slice(0, 5),
  ].slice(0, 15);

  return {
    topic,
    keywords: allKeywords,
    peopleAlsoAsk: (data.peopleAlsoAsk || []).map(q => ({
      question: q.question,
      snippet: q.snippet,
    })),
    relatedSearches: (data.relatedSearches || []).map(r => r.query),
    topRankingTitles: (data.organic || []).map(r => r.title),
    topRankingSnippets: (data.organic || []).map(r => r.snippet),
    missingKeywords: extractMissingKeywords(topic, allKeywords, data),
  };
}

export async function analyzeCompetitors(keyword: string, apiKey: string): Promise<CompetitorAnalysis[]> {
  const data = await search(keyword, apiKey);
  return (data.organic || []).map(r => ({
    url: r.link,
    title: r.title,
    snippet: r.snippet,
    position: r.position,
  }));
}

export async function optimizeContent(
  title: string,
  content: string,
  targetKeywords: string[],
  apiKey: string
): Promise<ContentOptimization> {
  const topic = title || content.slice(0, 100);
  const data = await search(topic, apiKey);

  const titleWords = title.toLowerCase().split(/\s+/);
  const contentLower = content.toLowerCase();
  const wordCount = content.split(/\s+/).length;

  const topTitles = (data.organic || []).map(r => r.title);

  let titleScore = 0;
  if (title.length >= 30 && title.length <= 60) titleScore += 30;
  else if (title.length > 20 && title.length < 80) titleScore += 15;
  if (targetKeywords.some(kw => title.toLowerCase().includes(kw.toLowerCase()))) titleScore += 30;
  if (titleWords.length >= 4 && titleWords.length <= 10) titleScore += 20;
  const titleWordFreq: Record<string, number> = {};
  for (const t of topTitles) {
    for (const w of t.toLowerCase().split(/\s+/)) {
      if (w.length > 3) titleWordFreq[w] = (titleWordFreq[w] || 0) + 1;
    }
  }
  const commonWords = Object.entries(titleWordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(e => e[0]);
  if (commonWords.some(w => title.toLowerCase().includes(w))) titleScore += 20;

  titleScore = Math.min(100, titleScore);

  let contentScore = 0;
  if (wordCount >= 1500) contentScore += 25;
  else if (wordCount >= 800) contentScore += 15;
  else contentScore += 5;

  if (targetKeywords.length > 0) {
    const matched = targetKeywords.filter(kw => contentLower.includes(kw.toLowerCase())).length;
    contentScore += Math.min(25, (matched / targetKeywords.length) * 25);
  }

  const headings = content.match(/#{2,3}\s+.+/g) || [];
  if (headings.length >= 3) contentScore += 15;
  else if (headings.length >= 1) contentScore += 5;

  const lists = content.match(/^[\s]*[-*+]\s/gm) || [];
  if (lists.length >= 2) contentScore += 10;

  if ((data.organic || []).length > 0) {
    const topSnippets = data.organic!.slice(0, 3).map(r => r.snippet.toLowerCase());
    const overlap = topSnippets.filter(s =>
      contentLower.split(/\s+/).some(w => w.length > 4 && s.includes(w))
    ).length;
    contentScore += Math.min(15, overlap * 5);
  }

  contentScore = Math.min(100, contentScore);

  const titleSuggestions: string[] = [];
  if (title.length < 30) titleSuggestions.push('Title is too short (aim for 30–60 characters)');
  if (title.length > 60) titleSuggestions.push('Title is too long (aim for 30–60 characters)');
  if (!targetKeywords.some(kw => title.toLowerCase().includes(kw.toLowerCase()))) {
    titleSuggestions.push('Include a primary keyword in the title');
  }
  if (topTitles.length > 0 && !topTitles.some(t => t.toLowerCase().includes(title.toLowerCase().split(/\s+/).slice(0, 3).join(' ')))) {
    titleSuggestions.push('Consider matching search intent — top results focus on: "' + topTitles[0] + '"');
  }

  const contentSuggestions: string[] = [];
  if (wordCount < 800) contentSuggestions.push('Aim for at least 800 words (ideally 1500+) for better ranking');
  if (headings.length < 3) contentSuggestions.push('Add more H2/H3 subheadings to improve structure and readability');
  if (lists.length < 2) contentSuggestions.push('Include bulleted or numbered lists to improve scannability');
  const missingKws = targetKeywords.filter(kw => !contentLower.includes(kw.toLowerCase()));
  if (missingKws.length > 0) {
    contentSuggestions.push('Missing target keyword' + (missingKws.length > 1 ? 's' : '') + ': ' + missingKws.join(', '));
  }
  if ((data.peopleAlsoAsk || []).length > 0) {
    contentSuggestions.push('Answer common questions: ' + data.peopleAlsoAsk!.slice(0, 3).map(q => q.question).join(', '));
  }

  const readabilityScore = Math.min(100, Math.round(
    (wordCount > 0 ? Math.min(100, (wordCount / 2000) * 50) : 0) +
    (headings.length >= 3 ? 20 : headings.length * 5) +
    (lists.length >= 2 ? 15 : lists.length * 5) +
    (contentLower.split(/[.!?]+/).filter(s => s.trim().split(/\s+/).length <= 25).length > 5 ? 15 : 5)
  ));

  return {
    titleScore,
    contentScore,
    titleSuggestions,
    contentSuggestions,
    missingKeywords: missingKeywords(title, targetKeywords, data),
    readabilityScore,
  };
}

function extractMissingKeywords(topic: string, keywords: string[], data: SerperResponse): string[] {
  const missing: string[] = [];
  const topicLower = topic.toLowerCase();

  if (data.peopleAlsoAsk) {
    for (const q of data.peopleAlsoAsk) {
      const words = q.question.toLowerCase().split(/\s+/).filter(w => w.length > 4);
      for (const w of words) {
        if (!topicLower.includes(w) && !keywords.some(k => k.includes(w))) {
          missing.push(w);
        }
      }
    }
  }

  if (data.relatedSearches) {
    for (const r of data.relatedSearches) {
      const words = r.query.toLowerCase().split(/\s+/).filter(w => w.length > 4);
      for (const w of words) {
        if (!topicLower.includes(w) && !keywords.some(k => k.includes(w)) && !missing.includes(w)) {
          missing.push(w);
        }
        if (missing.length >= 5) break;
      }
    }
  }

  return [...new Set(missing)].slice(0, 8);
}

function missingKeywords(title: string, keywords: string[], data: SerperResponse): string[] {
  const titleLower = title.toLowerCase();
  const contentKeywords = keywords.map(k => k.toLowerCase());
  const missing: string[] = [];

  if (data.organic) {
    for (const r of data.organic.slice(0, 5)) {
      const words = r.title.toLowerCase().split(/\s+/).filter(w => w.length > 4);
      for (const w of words) {
        if (!titleLower.includes(w) && !contentKeywords.some(k => k.includes(w))) {
          missing.push(w);
        }
      }
    }
  }

  return [...new Set(missing)].slice(0, 5);
}
