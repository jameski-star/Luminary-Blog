import { GoogleGenAI, Type } from '@google/genai';
import type { AuditResult, PipelineResult, PipelineStage } from '../types';
import { friendlyError, isQuotaError, isCongestionError } from '../utils/errors';

const MODEL_NAME = 'gemini-2.5-flash';

function isTransientError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
  return msg.includes('429') || msg.includes('too many requests') || msg.includes('resource exhausted')
    || msg.includes('rate_limit') || msg.includes('congestion') || msg.includes('overloaded')
    || msg.includes('unavailable') || msg.includes('quota') || msg.includes('limit')
    || msg.includes('try again') || msg.includes('please wait') || msg.includes('retry after')
    || msg.includes('deadline') || msg.includes('timeout') || msg.includes('500')
    || msg.includes('502') || msg.includes('503') || msg.includes('service unavailable')
    || msg.includes('internal server') || msg.includes('connection');
}

function isQuotaError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
  return msg.includes('quota') || msg.includes('please wait') || msg.includes('retry after');
}

async function withRetry<T>(fn: () => Promise<T>, onRetry?: (attempt: number, delay: number, message: string) => void): Promise<T> {
  const maxAttempts = 20;
  let lastError: unknown;
  let sameKeyStrikes = 0;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const isQuota = isQuotaError(err);
      const isTransient = isTransientError(err);

      if (!isTransient) {
        const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
        if (msg.includes('api key') || msg.includes('not found') || msg.includes('safety')
            || msg.includes('permission') || msg.includes('access')) {
          throw err;
        }
      }

      let delay: number;
      let message: string;

      if (isQuota) {
        sameKeyStrikes++;
        delay = sameKeyStrikes > 2 ? 120000 + Math.random() * 30000 : 60000 + Math.random() * 10000;
        message = `Quota hit — waiting ${(delay / 1000).toFixed(0)}s (attempt ${attempt + 1})…`;
      } else if (isTransient) {
        delay = 10000 + Math.random() * 5000;
        message = `Model busy — retrying in ${(delay / 1000).toFixed(0)}s (attempt ${attempt + 1})…`;
      } else {
        delay = 5000 + Math.random() * 3000;
        message = `Retrying in ${(delay / 1000).toFixed(0)}s (attempt ${attempt + 1})…`;
      }

      onRetry?.(attempt + 1, Math.round(delay), message);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

function createAI(apiKey: string) {
  return new GoogleGenAI({ apiKey });
}

async function draftArticleContent(
  ai: GoogleGenAI,
  topic: string,
  keywords: string[]
): Promise<string> {
  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: `Write a comprehensive, exhaustive long-form essay on this topic:

Topic: "${topic}"
Target Keywords to distribute organically (do not force or stuff): ${keywords.join(', ')}

CRITICAL WRITING INSTRUCTIONS:
- Write with extreme depth and specificity. No fluff, no meta-commentary, no introductory filler phrases.
- DO NOT use these banned phrases: "In today's digital landscape", "delve", "testament", "crucial", "paramount", "multifaceted", "tapestry", "in conclusion", "furthermore", "in today's fast-paced world", "it is worth noting", "it goes without saying"
- Every claim must be backed by concrete logic, named examples, or verifiable patterns — not vague generalities
- Vary sentence lengths aggressively. Follow a complex, technical sentence with a three-word punch. Like this.
- Use em-dashes for asides — the way a real writer would
- Start some sentences with "And" or "But" — it is not wrong, it is human
- Include specific numbers, percentages, and named case studies where appropriate
- Format in standard Markdown: ## headings, **bold** for key terms, bullet lists, blockquotes for notable quotes
- Write like a senior expert speaking to a respected peer over coffee — confident, slightly opinionated, allergic to corporate fluff
- Minimum 1,500 words. Aim for 2,000-2,500 words for maximum depth.`,
    config: {
      systemInstruction: `You are an elite subject-matter expert, technical journalist, and former editor at a major technology publication. Your writing is authoritative, precise, and direct. You prioritize verified data, logical mechanics, and actionable insights. You have a distinctive voice — thoughtful, occasionally dry in its wit, never condescending. You write for readers who are intelligent and time-poor, and who will immediately close a tab at the first sign of padding or cliché.`,
      temperature: 0.75,
    },
  });
  return response.text ?? '';
}

async function runAuthenticityCheck(
  ai: GoogleGenAI,
  draft: string
): Promise<AuditResult> {
  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: `Analyze the following article draft for authenticity, factual vulnerabilities, logical errors, and AI-generated writing patterns:

---
${draft.slice(0, 8000)}
---

Evaluate rigorously for:
1. Absolute statistical claims that appear fabricated or unverifiable
2. Logical leaps or unsupported generalizations
3. Hallucinated product names, company names, or study attributions
4. Robotic sentence patterns, repetitive transitions, or AI clichés
5. Claims that contradict established expert consensus
6. Missing nuance or oversimplification of complex topics`,
    config: {
      systemInstruction: `You are a cynical, meticulous fact-checker and senior editor for a major scientific and technology publication. Your job is to find every weak argument, every logical leap, every unverified absolute statistic, and every statement that sounds like it was generated by an AI without genuine knowledge. You are known for your zero-tolerance policy toward vague generalities and fabricated data. You are not trying to rewrite the article — only to identify every specific flaw so another editor can fix them.`,
      temperature: 0.1,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          passedCheck: {
            type: Type.BOOLEAN,
            description: 'True if the article contains no flagrant logical errors, unverified absolute statistics, or hallucinated references.',
          },
          score: {
            type: Type.INTEGER,
            description: 'Overall authenticity and quality score from 1 to 100. 90+ is ready to publish. 75-89 needs minor polish. Below 75 needs significant rework.',
          },
          vulnerabilities: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Specific sentences or phrases that contain absolute claims, logical weaknesses, or potential hallucinations. Quote directly from the text.',
          },
          suggestions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Specific, actionable adjustments to make the content completely factual and robust. One suggestion per vulnerability.',
          },
        },
        required: ['passedCheck', 'score', 'vulnerabilities', 'suggestions'],
      },
    },
  });

  try {
    return JSON.parse(response.text ?? '{}') as AuditResult;
  } catch {
    return {
      passedCheck: false,
      score: 60,
      vulnerabilities: ['Could not parse audit response.'],
      suggestions: ['Manual review recommended.'],
    };
  }
}

async function optimizeAndPolish(
  ai: GoogleGenAI,
  draft: string,
  auditResults: AuditResult
): Promise<string> {
  const suggestionsText = auditResults.suggestions.length > 0
    ? `Address these specific issues:\n${auditResults.suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}`
    : 'Refine for maximum clarity and human cadence.';

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: `Revise and polish this article to eliminate all AI-generated writing patterns and fix any factual vulnerabilities.

${suggestionsText}

ORIGINAL DRAFT:
${draft}

REVISION MANDATE:
1. Vary sentence lengths aggressively — mix 40-word compound sentences with three-word punches
2. Remove ALL banned words: delve, testament, digital landscape, paramount, crucial, multifaceted, tapestry, in conclusion, furthermore, it is worth noting
3. Replace vague statistics with hedged, honest language: instead of "studies show 80% of companies...", write "most engineering teams that have measured this..."
4. Inject micro-imperfections: conversational asides, the occasional em-dash thought, sentences that start with And or But
5. Every paragraph should advance the reader's understanding — delete anything that merely restates what was just said
6. Maintain all Markdown formatting (##, ###, **bold**, lists, blockquotes)
7. Preserve all specific examples, named companies, and concrete data points — only improve the framing
8. The final article should read like it was written by a human expert who has genuine opinions on this topic`,
    config: {
      systemInstruction: `You are a master copyeditor and essayist who specializes in humanizing and elevating technical prose. You have an exceptional ear for rhythm and cadence. You strip away corporate jargon, eliminate robotic sentence structures, and inject clarity, personality, and precision into every paragraph. Your edited work consistently passes AI-detection systems not by gaming them, but because the underlying prose is genuinely human in its construction — varied, opinionated, and specific. You never make the content shorter; you make every word earn its place.`,
      temperature: 0.55,
    },
  });
  return response.text ?? draft;
}

async function generateSEOKeywords(ai: GoogleGenAI, topic: string): Promise<string[]> {
  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: `Generate 6-8 high-value SEO keywords for a blog article about this topic:

Topic: "${topic}"

Requirements:
- Each keyword should be a phrase that real people search for (2-4 words each)
- Include a mix of head terms and long-tail keywords
- Focus on commercial and informational intent
- Return ONLY a JSON array of strings, no other text or formatting`,
    config: {
      systemInstruction: 'You are an SEO strategist. Return only valid JSON.',
      temperature: 0.3,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          keywords: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
      },
    },
  });
  const text = response.text ?? '{"keywords":[]}';
  try {
    const parsed = JSON.parse(text);
    return (parsed.keywords || []).slice(0, 8);
  } catch {
    return [];
  }
}

export async function executeAutopostPipeline(
  topic: string,
  keywords: string[],
  apiKey: string,
  onStageUpdate: (stages: PipelineStage[]) => void
): Promise<PipelineResult & { excerpt?: string; tags?: string[]; keywords?: string[] }> {
  const ai = createAI(apiKey);

  const stages: PipelineStage[] = [
    { name: 'Generating SEO keywords', status: 'pending' },
    { name: 'Drafting Deep-Dive Content', status: 'pending' },
    { name: 'Authenticity & Fact-Check Audit', status: 'pending' },
    { name: 'Polishing for Human Cadence', status: 'pending' },
  ];

  const update = (idx: number, status: PipelineStage['status'], message?: string) => {
    stages[idx] = { ...stages[idx], status, message };
    onStageUpdate([...stages]);
  };

  try {
    // Stage 0 — auto-generate keywords
    let effectiveKeywords = keywords;
    if (effectiveKeywords.length === 0) {
      update(0, 'running');
      effectiveKeywords = await withRetry(
        () => generateSEOKeywords(ai, topic),
        (_attempt, _delay, msg) => update(0, 'running', msg)
      );
    }
    update(0, 'done', `${effectiveKeywords.length} keywords generated`);

    // Stage 1
    update(1, 'running');
    const rawDraft = await withRetry(
      () => draftArticleContent(ai, topic, effectiveKeywords),
      (_attempt, _delay, msg) => update(1, 'running', msg)
    );
    update(1, 'done', `${rawDraft.split(/\s+/).length.toLocaleString()} words drafted`);

    // Stage 2
    update(2, 'running');
    const auditResults = await withRetry(
      () => runAuthenticityCheck(ai, rawDraft),
      (_attempt, _delay, msg) => update(2, 'running', msg)
    );
    update(
      2,
      auditResults.score >= 75 ? 'done' : 'error',
      `Score: ${auditResults.score}/100 — ${auditResults.vulnerabilities.length} issues flagged`
    );

    if (auditResults.score < 65) {
      return {
        status: 'quarantined',
        title: topic,
        content: rawDraft,
        audit: auditResults,
        reason: `Authenticity score ${auditResults.score}/100 is below the 65-point minimum threshold. Routed to manual review.`,
        draft: rawDraft,
        excerpt: rawDraft.slice(0, 160).replace(/[#*]/g, '').trim(),
        tags: effectiveKeywords.slice(0, 4),
        keywords: effectiveKeywords,
      };
    }

    // Stage 3
    update(3, 'running');
    const polishedContent = await withRetry(
      () => optimizeAndPolish(ai, rawDraft, auditResults),
      (_attempt, _delay, msg) => update(3, 'running', msg)
    );
    update(3, 'done', 'Prose humanized and polished');

    return {
      status: 'ready_to_publish',
      title: topic,
      content: polishedContent,
      audit: auditResults,
      excerpt: polishedContent.slice(0, 160).replace(/[#*]/g, '').trim(),
      tags: effectiveKeywords.slice(0, 4),
      keywords: effectiveKeywords,
      isApproved: true,
    };

  } catch (error: unknown) {
    const errMsg = friendlyError(error);
    const failedIdx = stages.findIndex(s => s.status === 'running');
    if (failedIdx >= 0) update(failedIdx, 'error', errMsg);

    throw new Error(errMsg);
  }
}

export async function validateManualPost(
  content: string,
  apiKey: string
): Promise<AuditResult> {
  const ai = createAI(apiKey);
  return runAuthenticityCheck(ai, content);
}
