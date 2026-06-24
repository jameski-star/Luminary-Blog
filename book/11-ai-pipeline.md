# Chapter 11 — The AI Pipeline

This project integrates Google's Gemini API for three tasks: drafting articles, auditing content, and polishing prose.

## Getting a Gemini API key

1. Go to https://aistudio.google.com/apikey
2. Click "Create API Key"
3. Copy the key — it looks like `AIzaSy...`

You'll need this when running the AutoPost pipeline.

## The 3-stage pipeline

```
User input: topic + keywords
          │
          ▼
Stage 1: Draft      → Gemini writes a complete article
          │
          ▼
Stage 2: Audit      → Gemini scores the draft (1-100)
          │
          ├── score < 65 → QUARANTINED → admin review
          │
          └── score ≥ 65 → continues
                            │
                            ▼
                    Stage 3: Polish → Gemini fixes issues
                                        │
                                        ▼
                              READY TO PUBLISH
```

## Stage 1 — Drafting

```typescript
// src/services/geminiPipeline.ts
async function draftArticleContent(
  ai: GoogleGenerativeAI,
  topic: string,
  keywords: string[]
): Promise<string> {
  const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `Write a comprehensive, well-researched blog article about:
  Topic: ${topic}
  Target keywords: ${keywords.join(', ')}

  Requirements:
  - Use markdown formatting
  - Include H2 and H3 headings
  - Include a compelling introduction and conclusion
  - Use an authoritative but accessible tone
  - Minimum 800 words`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}
```

## Stage 2 — Authenticity Audit

This is the most interesting part. The AI audits its **own** output:

```typescript
async function runAuthenticityCheck(
  ai: GoogleGenerativeAI,
  draft: string
): Promise<AuditResult> {
  const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `Analyze this draft blog post for quality and authenticity.
  Score from 1-100 where:
  - 90-100: Excellent, ready to publish
  - 75-89: Good, minor improvements needed
  - 65-74: Adequate, needs work
  - Below 65: Significant issues — route to manual review

  Check for:
  1. Statistical claims that appear fabricated
  2. Logical leaps or unsupported generalizations
  3. Hallucinated names/sources
  4. Robotic sentence patterns
  5. Contradicting established consensus
  6. Missing nuance or oversimplification

  Return JSON exactly like:
  { "score": 85, "vulnerabilities": [...], "suggestions": [...] }`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const clean = text.replace(/```json?/g, '').replace(/```/g, '').trim();
  return JSON.parse(clean);
}
```

## Stage 3 — Polishing

```typescript
async function optimizeAndPolish(
  ai: GoogleGenerativeAI,
  draft: string,
  audit: AuditResult
): Promise<string> {
  const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `Rewrite this draft to address these issues:
  ${audit.vulnerabilities.map(v => `- ${v}`).join('\n')}
  And implement these suggestions:
  ${audit.suggestions.map(s => `- ${s}`).join('\n')}

  Keep the same information but make it more human, varied sentence structure,
  and remove anything that sounds like AI boilerplate.

  Draft: ${draft}`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}
```

## Retry logic (handling congestion)

Gemini can return 429 (Too Many Requests) when busy. The pipeline retries automatically:

```typescript
// src/services/geminiPipeline.ts
const MAX_RETRIES = 5;
const INITIAL_DELAY = 2000;  // 2 seconds

function isCongestionError(msg: string): boolean {
  return msg.includes('429') || msg.includes('too many requests')
    || msg.includes('resource exhausted') || msg.includes('rate_limit')
    || msg.includes('congestion') || msg.includes('overloaded');
}

async function withRetry<T>(
  fn: () => Promise<T>,
  onRetry: (attempt: number, delay: number) => void
): Promise<T> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!isCongestionError(msg) || attempt === MAX_RETRIES) throw err;

      const delay = INITIAL_DELAY * Math.pow(2, attempt - 1);  // exponential backoff
      onRetry(attempt, delay);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new Error('Max retries exceeded');
}
```

The delay doubles each time: 2s, 4s, 8s, 16s, 32s.

## Server-side pipeline

The same pipeline also runs on the server via an API endpoint:

```typescript
// server/src/routes/gemini.ts
router.post('/pipeline', requireAuth, async (req, res) => {
  const { topic, keywords } = req.body;

  const result = await executeAutopostPipeline(topic, keywords, geminiKey);
  res.json({ result });
});

router.post('/audit', requireAuth, async (req, res) => {
  const { content } = req.body;
  const result = await runAuthenticityCheck(content, geminiKey);
  res.json({ result });
});
```

This lets the frontend offload the work to the server when deployed.

## The user experience

While the pipeline runs, the user sees progress updates:

```tsx
// AutoPostPage.tsx — stage display
{stages.map(stage => (
  <div key={stage.id} className="flex items-center gap-3 p-3 rounded-xl bg-raised">
    <div className={`w-2 h-2 rounded-full ${
      stage.status === 'running' ? 'bg-primary animate-pulse'
      : stage.status === 'complete' ? 'bg-emerald-400'
      : 'bg-muted'
    }`} />
    <span className="text-sm text-primary">{stage.label}</span>
    {stage.message && (
      <span className="text-xs text-secondary ml-auto">{stage.message}</span>
    )}
  </div>
))}
```

## User-friendly errors

If the API is congested, the user sees a friendly message instead of a raw error:

```typescript
// src/utils/errors.ts
export function friendlyError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);

  if (/429|too many requests|congestion|overloaded/.test(msg)) {
    return 'The AI model is busy right now — please try again in about 5 minutes.';
  }
  if (/api.?key/i.test(msg) && /invalid|incorrect/.test(msg)) {
    return 'Invalid API key. Check your Gemini API key and try again.';
  }
  return 'Something went wrong. Please try again.';
}
```

## Rogue content detection (client-side)

The `detectRogueContent` function runs on both manual and AI-generated content as a final safety check:

```typescript
// src/utils/contentDetection.ts
export function detectRogueContent(text: string) {
  if (text.trim().split(/\s+/).length < 10)
    return { isRogue: true, reason: 'Content too short' };

  const charRatio = text.replace(/\s/g, '').length / text.length;
  if (charRatio > 0.95)
    return { isRogue: true, reason: 'Possible gibberish' };

  const uniqueChars = new Set(text.toLowerCase().replace(/\s/g, '')).size;
  if (uniqueChars < 5 && text.replace(/\s/g, '').length > 20)
    return { isRogue: true, reason: 'Keyboard spam detected' };

  return { isRogue: false };
}
```

When triggered, the post is saved with `status: 'review'` and appears in the admin review queue.

## Your practice

Call the Gemini API directly from Node.js:

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

const ai = new GoogleGenerativeAI('YOUR_API_KEY');
const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });

async function ask(prompt: string) {
  const result = await model.generateContent(prompt);
  console.log(result.response.text());
}

await ask('Explain React hooks in 3 sentences.');
```

In [Chapter 12](12-deploy.md), you'll deploy everything to Render.
