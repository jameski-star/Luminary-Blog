import { GoogleGenAI, Type } from '@google/genai';
import { config } from '../config.js';

const MODEL_NAME = 'gemini-2.5-flash';

// ── AI Error Classification System ──
export enum AIErrorType {
  RATE_LIMIT = 'RATE_LIMIT',
  QUOTA_EXHAUSTED = 'QUOTA_EXHAUSTED',
  TEMPORARY_BUSY = 'TEMPORARY_BUSY',
  AUTH_ERROR = 'AUTH_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  INVALID_MODEL = 'INVALID_MODEL',
  INVALID_REQUEST = 'INVALID_REQUEST',
  SERVER_ERROR = 'SERVER_ERROR',
  UNKNOWN = 'UNKNOWN',
}

export class AIError extends Error {
  type: AIErrorType;
  status?: number;
  originalError?: any;

  constructor(type: AIErrorType, message: string, status?: number, originalError?: any) {
    super(message);
    this.name = 'AIError';
    this.type = type;
    this.status = status;
    this.originalError = originalError;
  }
}

export class AIErrorClassifier {
  static classify(err: unknown): AIError {
    if (err instanceof AIError) return err;

    const msg = err instanceof Error ? (err.message || '') : String(err);
    const msgLower = msg.toLowerCase();

    // 1. Network Errors
    if (
      msgLower.includes('fetch failed') ||
      msgLower.includes('network error') ||
      msgLower.includes('timeout') ||
      msgLower.includes('deadline') ||
      msgLower.includes('connection') ||
      msgLower.includes('connect') ||
      msgLower.includes('econnrefused') ||
      msgLower.includes('econnreset') ||
      msgLower.includes('dns') ||
      msgLower.includes('socket')
    ) {
      return new AIError(AIErrorType.NETWORK_ERROR, `Network connection issue: ${msg}`, undefined, err);
    }

    // 2. Cloudflare API specific failures
    const cfMatch = msg.match(/Cloudflare AI failed \((\d+)\): (.*)/i);
    if (cfMatch) {
      const status = parseInt(cfMatch[1], 10);
      const body = cfMatch[2];
      const bodyLower = body.toLowerCase();

      if (status === 401 || status === 403) {
        return new AIError(AIErrorType.AUTH_ERROR, `Cloudflare authentication failed (${status}): ${body}`, status, err);
      }
      if (status === 429) {
        if (bodyLower.includes('allocation') || bodyLower.includes('neuron') || bodyLower.includes('4006') || bodyLower.includes('quota') || bodyLower.includes('used up')) {
          return new AIError(AIErrorType.QUOTA_EXHAUSTED, `Cloudflare quota exhausted (429): ${body}`, status, err);
        }
        return new AIError(AIErrorType.RATE_LIMIT, `Cloudflare rate limit: ${body}`, status, err);
      }
      if (status >= 500) {
        return new AIError(AIErrorType.SERVER_ERROR, `Cloudflare server error (${status}): ${body}`, status, err);
      }
      if (status === 400) {
        if (bodyLower.includes('allocation') || bodyLower.includes('neuron') || bodyLower.includes('4006') || bodyLower.includes('quota') || bodyLower.includes('used up')) {
          return new AIError(AIErrorType.QUOTA_EXHAUSTED, `Cloudflare quota exhausted (400): ${body}`, status, err);
        }
        return new AIError(AIErrorType.INVALID_REQUEST, `Cloudflare bad request: ${body}`, status, err);
      }
    }

    // 3. Generic HTTP Status Code Match
    const statusMatch = msg.match(/(?:status|code|http)\s*[:=]?\s*(\d{3})/i);
    if (statusMatch) {
      const status = parseInt(statusMatch[1], 10);
      if (status === 401 || status === 403) {
        return new AIError(AIErrorType.AUTH_ERROR, `Auth error (${status}): ${msg}`, status, err);
      }
      if (status === 429) {
        if (msgLower.includes('quota') || msgLower.includes('exhausted') || msgLower.includes('limit') || msgLower.includes('allocation') || msgLower.includes('neuron') || msgLower.includes('4006')) {
          return new AIError(AIErrorType.QUOTA_EXHAUSTED, `Quota exhausted (${status}): ${msg}`, status, err);
        }
        return new AIError(AIErrorType.RATE_LIMIT, `Rate limit exceeded (${status}): ${msg}`, status, err);
      }
      if (status === 404) {
        if (msgLower.includes('model')) {
          return new AIError(AIErrorType.INVALID_MODEL, `Model not found (${status}): ${msg}`, status, err);
        }
        return new AIError(AIErrorType.INVALID_REQUEST, `Endpoint not found (${status}): ${msg}`, status, err);
      }
      if (status === 400) {
        if (msgLower.includes('quota') || msgLower.includes('exhausted') || msgLower.includes('limit') || msgLower.includes('allocation') || msgLower.includes('neuron') || msgLower.includes('4006')) {
          return new AIError(AIErrorType.QUOTA_EXHAUSTED, `Quota exhausted (400): ${msg}`, status, err);
        }
        return new AIError(AIErrorType.INVALID_REQUEST, `Bad request (${status}): ${msg}`, status, err);
      }
      if (status >= 500) {
        return new AIError(AIErrorType.SERVER_ERROR, `Server error (${status}): ${msg}`, status, err);
      }
    }

    // 4. String Content Fallbacks
    if (msgLower.includes('api key') || msgLower.includes('api_key_invalid') || msgLower.includes('unauthorized') || msgLower.includes('forbidden') || msgLower.includes('invalid credentials')) {
      return new AIError(AIErrorType.AUTH_ERROR, `Authentication failure: ${msg}`, undefined, err);
    }
    if (msgLower.includes('quota') || msgLower.includes('exhausted') || msgLower.includes('limit exceeded') || msgLower.includes('used up') || msgLower.includes('allocation') || msgLower.includes('4006') || msgLower.includes('user_limit')) {
      return new AIError(AIErrorType.QUOTA_EXHAUSTED, `Quota exhausted: ${msg}`, undefined, err);
    }
    if (msgLower.includes('rate limit') || msgLower.includes('rate_limit') || msgLower.includes('too many requests') || msgLower.includes('429')) {
      return new AIError(AIErrorType.RATE_LIMIT, `Rate limit: ${msg}`, 429, err);
    }
    if (msgLower.includes('model is busy') || msgLower.includes('model busy') || msgLower.includes('congestion') || msgLower.includes('overloaded') || msgLower.includes('please wait') || msgLower.includes('try again')) {
      return new AIError(AIErrorType.TEMPORARY_BUSY, `Model busy: ${msg}`, undefined, err);
    }
    if (msgLower.includes('safety') || msgLower.includes('blocked') || msgLower.includes('permission') || msgLower.includes('access') || msgLower.includes('malformed')) {
      return new AIError(AIErrorType.INVALID_REQUEST, `Invalid request or safety block: ${msg}`, undefined, err);
    }
    if (msgLower.includes('model not found') || msgLower.includes('invalid model') || msgLower.includes('unknown model')) {
      return new AIError(AIErrorType.INVALID_MODEL, `Model missing: ${msg}`, undefined, err);
    }
    if (msgLower.includes('500') || msgLower.includes('502') || msgLower.includes('503') || msgLower.includes('504') || msgLower.includes('unavailable') || msgLower.includes('internal error')) {
      return new AIError(AIErrorType.SERVER_ERROR, `Server error: ${msg}`, undefined, err);
    }

    return new AIError(AIErrorType.UNKNOWN, `Unknown AI error: ${msg}`, undefined, err);
  }
}

// ── AI Provider Interface ──
export interface AIProviderInstance {
  id: string;
  name: string;
  type: 'gemini' | 'openai' | 'claude' | 'openrouter' | 'cloudflare' | 'local';
  key: string;
  extraConfig?: {
    accountId?: string;
  };
  status: 'Healthy' | 'Busy' | 'Rate Limited' | 'Quota Exhausted' | 'Disabled' | 'Offline' | 'Temporary Failure' | 'Permanent Failure';
  cooldownUntil: number;
  failureCount: number;
  circuitState: 'CLOSED' | 'OPEN' | 'HALF-OPEN';
  lastFailureTime: number;
}

// ── Provider Registry and Health System ──
export class AIProviderManager {
  private providers: AIProviderInstance[] = [];

  constructor() {
    this.refreshProviders();
  }

  public refreshProviders(
    primaryKey = config.geminiApiKey,
    key2 = config.geminiApiKey2,
    key3 = config.geminiApiKey3,
    cloudflareToken = config.cloudflareApiToken,
    cloudflareAccountId = config.cloudflareAccountId
  ) {
    const newProviders: AIProviderInstance[] = [];

    // 1. Gemini keys
    if (primaryKey) {
      this.ensureProvider(newProviders, 'gemini-1', 'Gemini API (Key 1)', 'gemini', primaryKey);
    }
    if (key2) {
      this.ensureProvider(newProviders, 'gemini-2', 'Gemini API (Key 2)', 'gemini', key2);
    }
    if (key3) {
      this.ensureProvider(newProviders, 'gemini-3', 'Gemini API (Key 3)', 'gemini', key3);
    }

    // 2. OpenAI
    const openAiKey = config.openaiApiKey || process.env.OPENAI_API_KEY;
    if (openAiKey) {
      this.ensureProvider(newProviders, 'openai', 'OpenAI API', 'openai', openAiKey);
    }

    // 3. Claude
    const claudeKey = config.anthropicApiKey || process.env.ANTHROPIC_API_KEY;
    if (claudeKey) {
      this.ensureProvider(newProviders, 'claude', 'Anthropic Claude API', 'claude', claudeKey);
    }

    // 4. OpenRouter
    const openRouterKey = config.openRouterApiKey || process.env.OPENROUTER_API_KEY;
    if (openRouterKey) {
      this.ensureProvider(newProviders, 'openrouter', 'OpenRouter API', 'openrouter', openRouterKey);
    }

    // 5. Cloudflare
    if (cloudflareToken) {
      this.ensureProvider(newProviders, 'cloudflare', 'Cloudflare Workers AI', 'cloudflare', cloudflareToken, { accountId: cloudflareAccountId });
    }

    // 6. Local Model
    const localUrl = config.localModelUrl || process.env.LOCAL_MODEL_URL || 'http://localhost:11434';
    this.ensureProvider(newProviders, 'local', 'Local Model (Ollama)', 'local', 'local-no-key', { accountId: localUrl });

    // Sync state
    for (const np of newProviders) {
      const existing = this.providers.find(p => p.id === np.id && p.key === np.key);
      if (existing) {
        np.status = existing.status;
        np.cooldownUntil = existing.cooldownUntil;
        np.failureCount = existing.failureCount;
        np.circuitState = existing.circuitState;
        np.lastFailureTime = existing.lastFailureTime;
      }
    }

    this.providers = newProviders;
  }

  private ensureProvider(
    list: AIProviderInstance[],
    id: string,
    name: string,
    type: AIProviderInstance['type'],
    key: string,
    extraConfig?: any
  ) {
    list.push({
      id,
      name,
      type,
      key,
      extraConfig,
      status: 'Healthy',
      cooldownUntil: 0,
      failureCount: 0,
      circuitState: 'CLOSED',
      lastFailureTime: 0
    });
  }

  public getHealthyProviders(): AIProviderInstance[] {
    const now = Date.now();

    for (const p of this.providers) {
      if (p.status !== 'Healthy' && p.status !== 'Disabled' && p.status !== 'Permanent Failure') {
        if (now >= p.cooldownUntil) {
          console.log(`[AI-HEALTH] Cooldown expired for provider: ${p.name}. Resetting status to Healthy.`);
          p.status = 'Healthy';
          if (p.circuitState === 'OPEN') {
            p.circuitState = 'HALF-OPEN';
          }
        }
      }
    }

    // Fallback priority: Gemini -> OpenAI -> Claude -> OpenRouter -> Cloudflare -> Local
    const priorityOrder: AIProviderInstance['type'][] = ['gemini', 'openai', 'claude', 'openrouter', 'cloudflare', 'local'];

    const sorted = [...this.providers].sort((a, b) => {
      const indexA = priorityOrder.indexOf(a.type);
      const indexB = priorityOrder.indexOf(b.type);
      return indexA - indexB;
    });

    return sorted.filter(p => {
      if (p.status === 'Disabled' || p.status === 'Permanent Failure' || p.status === 'Quota Exhausted') {
        return false;
      }
      if (p.circuitState === 'OPEN') {
        return false;
      }
      return true;
    });
  }

  public markFailure(provider: AIProviderInstance, error: AIError) {
    const now = Date.now();
    provider.lastFailureTime = now;

    switch (error.type) {
      case AIErrorType.AUTH_ERROR:
        provider.status = 'Permanent Failure';
        provider.circuitState = 'OPEN';
        provider.cooldownUntil = now + 24 * 60 * 60 * 1000; // 24h
        console.warn(`[AI-HEALTH] Provider ${provider.name} set to Permanent Failure (Auth Error).`);
        break;

      case AIErrorType.QUOTA_EXHAUSTED:
        provider.status = 'Quota Exhausted';
        provider.circuitState = 'OPEN';
        provider.cooldownUntil = now + 60 * 60 * 1000; // 1 hour cooldown
        console.warn(`[AI-HEALTH] Provider ${provider.name} set to Quota Exhausted. Cooldown for 1h.`);
        break;

      case AIErrorType.RATE_LIMIT:
        provider.status = 'Rate Limited';
        provider.cooldownUntil = now + 30 * 1000; // 30s
        console.warn(`[AI-HEALTH] Provider ${provider.name} rate limited. Cooldown for 30s.`);
        break;

      case AIErrorType.TEMPORARY_BUSY:
        provider.status = 'Busy';
        provider.cooldownUntil = now + 15 * 1000; // 15s
        console.warn(`[AI-HEALTH] Provider ${provider.name} is busy. Cooldown for 15s.`);
        break;

      case AIErrorType.INVALID_MODEL:
      case AIErrorType.INVALID_REQUEST:
        // request specific, no provider penalty
        break;

      default: // NETWORK_ERROR, SERVER_ERROR, UNKNOWN
        provider.failureCount++;
        provider.status = 'Temporary Failure';
        if (provider.failureCount >= 3) {
          provider.circuitState = 'OPEN';
          provider.status = 'Offline';
          provider.cooldownUntil = now + 60 * 1000; // 60s
          console.error(`[AI-HEALTH] Provider ${provider.name} failed 3+ times. Circuit OPEN. Marked Offline.`);
        } else {
          provider.cooldownUntil = now + 5 * 1000; // 5s wait
        }
        break;
    }
  }

  public markSuccess(provider: AIProviderInstance) {
    provider.status = 'Healthy';
    provider.failureCount = 0;
    provider.circuitState = 'CLOSED';
    provider.cooldownUntil = 0;
  }
}

export const providerManager = new AIProviderManager();

function isRetryable(err: AIError): boolean {
  return (
    err.type === AIErrorType.RATE_LIMIT ||
    err.type === AIErrorType.TEMPORARY_BUSY ||
    err.type === AIErrorType.SERVER_ERROR ||
    err.type === AIErrorType.NETWORK_ERROR
  );
}

function createAI(apiKey: string) {
  return new GoogleGenAI({ apiKey });
}

// ── Unified API Request Executor ──
async function executeProviderRequest(
  provider: AIProviderInstance,
  prompt: string,
  options: {
    systemInstruction?: string;
    temperature?: number;
    responseMimeType?: string;
    responseSchema?: any;
  }
): Promise<string> {
  const timeoutMs = 60000; // 60s timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    switch (provider.type) {
      case 'gemini': {
        const ai = createAI(provider.key);
        const requestPromise = ai.models.generateContent({
          model: MODEL_NAME,
          contents: prompt,
          config: {
            systemInstruction: options.systemInstruction,
            temperature: options.temperature,
            responseMimeType: options.responseMimeType,
            responseSchema: options.responseSchema
          }
        });

        const timeoutPromise = new Promise<never>((_, reject) => {
          controller.signal.addEventListener('abort', () => reject(new Error('Gemini API call timed out')));
        });

        const response = await Promise.race([requestPromise, timeoutPromise]);
        return response.text ?? '';
      }

      case 'openai': {
        let finalPrompt = prompt;
        if (options.responseSchema) {
          finalPrompt = `${prompt}\n\nIMPORTANT: You must return a JSON object that adheres strictly to this JSON Schema structure:\n${JSON.stringify(options.responseSchema, null, 2)}`;
        }
        const messages = [];
        if (options.systemInstruction) {
          messages.push({ role: 'system', content: options.systemInstruction });
        }
        messages.push({ role: 'user', content: finalPrompt });

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${provider.key}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages,
            temperature: options.temperature ?? 0.7,
            response_format: options.responseMimeType === 'application/json' ? { type: 'json_object' } : undefined
          }),
          signal: controller.signal
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(`OpenAI API failed (status ${response.status}): ${text}`);
        }

        const data = await response.json() as any;
        return data.choices?.[0]?.message?.content || '';
      }

      case 'claude': {
        let finalPrompt = prompt;
        if (options.responseSchema) {
          finalPrompt = `${prompt}\n\nIMPORTANT: You must return a JSON object that adheres strictly to this JSON Schema structure:\n${JSON.stringify(options.responseSchema, null, 2)}`;
        }
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': provider.key,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'claude-3-5-haiku-20241022',
            max_tokens: 4000,
            system: options.systemInstruction,
            messages: [{ role: 'user', content: finalPrompt }],
            temperature: options.temperature ?? 0.7
          }),
          signal: controller.signal
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Claude API failed (status ${response.status}): ${text}`);
        }

        const data = await response.json() as any;
        return data.content?.[0]?.text || '';
      }

      case 'openrouter': {
        let finalPrompt = prompt;
        if (options.responseSchema) {
          finalPrompt = `${prompt}\n\nIMPORTANT: You must return a JSON object that adheres strictly to this JSON Schema structure:\n${JSON.stringify(options.responseSchema, null, 2)}`;
        }
        const messages = [];
        if (options.systemInstruction) {
          messages.push({ role: 'system', content: options.systemInstruction });
        }
        messages.push({ role: 'user', content: finalPrompt });

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${provider.key}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://luminary.blog',
            'X-Title': 'Luminary'
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages,
            temperature: options.temperature ?? 0.7
          }),
          signal: controller.signal
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(`OpenRouter API failed (status ${response.status}): ${text}`);
        }

        const data = await response.json() as any;
        return data.choices?.[0]?.message?.content || '';
      }

      case 'cloudflare': {
        const token = provider.key;
        const accountId = provider.extraConfig?.accountId || config.cloudflareAccountId;
        const model = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
        const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`;

        let finalPrompt = prompt;
        if (options.responseSchema) {
          finalPrompt = `${prompt}\n\nIMPORTANT: You must return a JSON object that adheres strictly to this JSON Schema structure. Return ONLY valid JSON, do not include any markdown wrappers or introductory conversational filler:\n${JSON.stringify(options.responseSchema, null, 2)}`;
        }

        const messages = [];
        if (options.systemInstruction) {
          messages.push({ role: 'system', content: options.systemInstruction });
        }
        messages.push({ role: 'user', content: finalPrompt });

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messages,
            temperature: options.temperature ?? 0.6
          }),
          signal: controller.signal
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Cloudflare AI failed (${response.status}): ${errorText}`);
        }

        const resJson = await response.json() as any;
        if (!resJson.success) {
          throw new Error(`Cloudflare AI returned success=false: ${JSON.stringify(resJson.errors)}`);
        }

        return resJson.result?.response || '';
      }

      case 'local': {
        const baseUrl = provider.extraConfig?.accountId || 'http://localhost:11434';
        const messages = [];
        if (options.systemInstruction) {
          messages.push({ role: 'system', content: options.systemInstruction });
        }
        messages.push({ role: 'user', content: prompt });

        const response = await fetch(`${baseUrl}/api/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'llama3',
            messages,
            options: {
              temperature: options.temperature ?? 0.7
            },
            stream: false
          }),
          signal: controller.signal
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Local model API failed (status ${response.status}): ${text}`);
        }

        const data = await response.json() as any;
        return data.message?.content || '';
      }

      default:
        throw new Error(`Unsupported provider type: ${provider.type}`);
    }
  } finally {
    clearTimeout(timeoutId);
  }
}

// ── Resilient Fallback Request Orchestrator ──
export async function generateTextWithFallback(
  prompt: string,
  options: {
    systemInstruction?: string;
    temperature?: number;
    responseMimeType?: string;
    responseSchema?: any;
  } = {}
): Promise<string> {
  const maxAttempts = 3;
  let lastError: any = new Error('No AI providers available');

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const healthyProviders = providerManager.getHealthyProviders();
    if (healthyProviders.length === 0) {
      console.error('[AI-PROVIDER] No healthy AI providers available in registry.');
      throw new Error('All AI providers are currently exhausted or unavailable.');
    }

    for (const provider of healthyProviders) {
      console.log(`[AI-PROVIDER] Attempting request on provider: ${provider.name} (Attempt ${attempt + 1})`);

      try {
        const text = await executeProviderRequest(provider, prompt, options);
        providerManager.markSuccess(provider);
        return text;
      } catch (err: unknown) {
        const aiError = AIErrorClassifier.classify(err);
        providerManager.markFailure(provider, aiError);
        lastError = aiError;

        // Structured Logs
        console.log(`[AI-LOG] Provider: ${provider.name} | Status: ${provider.status} | Retry: ${isRetryable(aiError) ? 'Yes' : 'No'} | Fallback: Yes | Reason: ${aiError.message}`);

        if (aiError.type === AIErrorType.INVALID_MODEL || aiError.type === AIErrorType.INVALID_REQUEST) {
          // Immediately propagate client/schema errors
          throw aiError;
        }

        // Switch to the next provider immediately
        continue;
      }
    }

    // Wait and back off before next global retry loop
    const waitDelay = 1000 * Math.pow(2, attempt);
    console.warn(`[AI-PROVIDER] All providers failed in attempt ${attempt + 1}. Backing off for ${waitDelay}ms…`);
    await new Promise(resolve => setTimeout(resolve, waitDelay));
  }

  throw lastError;
}

function maskKey(key: string): string {
  if (!key) return 'EMPTY_KEY';
  if (key.length <= 12) return '***...***';
  return `${key.slice(0, 8)}...${key.slice(-4)}`;
}

function cleanJsonResponse(text: string): string {
  const cleaned = text.trim();
  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');
  let startIdx = -1;
  let endIdx = -1;

  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    startIdx = firstBrace;
    endIdx = cleaned.lastIndexOf('}');
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
    endIdx = cleaned.lastIndexOf(']');
  }

  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    return cleaned.slice(startIdx, endIdx + 1);
  }

  return cleaned;
}

async function generateText(
  key: string,
  prompt: string,
  options: {
    systemInstruction?: string;
    temperature?: number;
    responseMimeType?: string;
    responseSchema?: any;
  }
): Promise<string> {
  // Retain signature for compatibility but route through healthy fallback providers
  if (key && key !== 'CLOUDFLARE_FALLBACK' && !key.startsWith('cf-')) {
    providerManager.refreshProviders(key);
  } else if (key === 'CLOUDFLARE_FALLBACK' || key.startsWith('cf-')) {
    const cfToken = key === 'CLOUDFLARE_FALLBACK' ? config.cloudflareApiToken : key.replace(/^cf-/, '');
    providerManager.refreshProviders(undefined, undefined, undefined, cfToken);
  }
  return generateTextWithFallback(prompt, options);
}

async function draftArticleContent(
  key: string,
  topic: string,
  keywords: string[]
): Promise<string> {
  return generateText(
    key,
    `Write a comprehensive, authoritative, elite long-form article on this topic:

Topic: "${topic}"
Target Keywords to distribute organically (do not force or stuff): ${keywords.join(', ')}

MANDATORY ORIGINAL CONTRIBUTION SECTIONS & STRUCTURES:
1. Include an "Implementation Matrix" or "Decision Tree comparison table" comparing alternative options.
2. Include a structured "Troubleshooting Guide / Checklist" for common issues.
3. Include specific CLI commands, verified code syntax (like Javascript, bash, JSON, or YAML), or API endpoints, highlighting performance/security implications.
4. Include a "Direct Answer Block" answering the primary question "What is it and why does it matter?" in a single highlighted blockquote.
5. Identify and warn against "Common Misconceptions" or deprecated approaches.

CRITICAL WRITING INSTRUCTIONS:
- Write with extreme depth, accuracy, and specificity. No fluff, no meta-commentary, no introductory filler phrases.
- DO NOT use these banned phrases: "In today's digital landscape", "delve", "testament", "crucial", "paramount", "multifaceted", "tapestry", "in conclusion", "furthermore", "in today's fast-paced world", "it is worth noting", "it goes without saying"
- Every claim must be backed by concrete logic, named examples, or verifiable patterns — not vague generalities
- Vary sentence lengths aggressively. Follow a complex, technical sentence with a three-word punch. Like this.
- Use em-dashes for asides — the way a real writer would
- Start some sentences with "And" or "But" — it is not wrong, it is human
- Include specific numbers, percentages, and named case studies where appropriate
- Format in standard Markdown: ## headings, ### subheadings, **bold** for key terms, bullet lists, blockquotes for notable quotes
- Write like a senior expert speaking to a respected peer over coffee — confident, slightly opinionated, allergic to corporate fluff
- Minimum 1,500 words. Aim for 2,000-2,500 words for maximum depth.`,
    {
      systemInstruction: `You are an elite subject-matter expert, technical journalist, and former editor at a major technology publication. Your writing is authoritative, precise, and direct. You prioritize verified data, logical mechanics, and actionable insights. You have a distinctive voice — thoughtful, occasionally dry in its wit, never condescending. You write for readers who are intelligent and time-poor, and who will immediately close a tab at the first sign of padding or cliché.`,
      temperature: 0.75,
    }
  );
}

async function runAuthenticityCheck(
  key: string,
  draft: string
): Promise<{ passedCheck: boolean; score: number; vulnerabilities: string[]; suggestions: string[] }> {
  const text = await generateText(
    key,
    `Analyze the following article draft for authenticity, factual vulnerabilities, logical errors, and AI-generated writing patterns:

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
    {
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
    }
  );
  const cleaned = cleanJsonResponse(text);
  try {
    return JSON.parse(cleaned);
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
  key: string,
  draft: string,
  auditResults: { suggestions: string[] }
): Promise<string> {
  const suggestionsText = auditResults.suggestions.length > 0
    ? `Address these specific issues:\n${auditResults.suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}`
    : 'Refine for maximum clarity and human cadence.';

  return generateText(
    key,
    `Revise and polish this article to eliminate all AI-generated writing patterns and fix any factual vulnerabilities.

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
    {
      systemInstruction: `You are a master copyeditor and essayist who specializes in humanizing and elevating technical prose. You have an exceptional ear for rhythm and cadence. You strip away corporate jargon, eliminate robotic sentence structures, and inject clarity, personality, and precision into every paragraph. Your edited work consistently passes AI-detection systems not by gaming them, but because the underlying prose is genuinely human in its construction — varied, opinionated, and specific. You never make the content shorter; you make every word earn its place.`,
      temperature: 0.55,
    }
  );
}

function availableKeys(primaryKey: string, key2: string, key3: string, cloudflareToken = ''): string[] {
  const keys = [primaryKey];
  if (key2) keys.push(key2);
  if (key3) keys.push(key3);
  if (cloudflareToken) keys.push('CLOUDFLARE_FALLBACK');
  return keys;
}

async function generateSEOKeywords(key: string, topic: string): Promise<string[]> {
  const text = await generateText(
    key,
    `Generate 6-8 high-value SEO keywords for a blog article about this topic:

Topic: "${topic}"

Requirements:
- Each keyword should be a phrase that real people search for (2-4 words each)
- Include a mix of head terms and long-tail keywords
- Focus on commercial and informational intent
- Return ONLY a JSON array of strings, no other text or formatting`,
    {
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
    }
  );
  const cleaned = cleanJsonResponse(text);
  try {
    const parsed = JSON.parse(cleaned);
    return (parsed.keywords || []).slice(0, 8);
  } catch {
    return [];
  }
}

// ── Upgraded 20-Stage JSON Schema for Editorial Intelligence ──
const editorialIntelligenceSchema = {
  type: Type.OBJECT,
  properties: {
    opportunity: {
      type: Type.OBJECT,
      properties: {
        opportunityScore: { type: Type.INTEGER, description: 'Publishing opportunity value (1-100) based on trend/emerging interest' },
        freshnessScore: { type: Type.INTEGER, description: 'Freshness of knowledge/news (1-100)' },
        authorityFit: { type: Type.INTEGER, description: 'Topic fit with a premium technical blog (1-100)' },
        searchIntent: { type: Type.STRING, description: 'Intent category: Informational, Navigational, Commercial, or Transactional' },
        predictedLongevity: { type: Type.STRING, description: 'Lifecycle: Evergreen, Seasonal, Short-term (under 6 months), or Rapidly decaying' },
        estimatedMaintenanceCost: { type: Type.STRING, description: 'Maintenance tier: Low (evergreen/static), Medium (periodic api/deps updates), High (frequent software/command changes)' }
      },
      required: ['opportunityScore', 'freshnessScore', 'authorityFit', 'searchIntent', 'predictedLongevity', 'estimatedMaintenanceCost']
    },
    duplicates: {
      type: Type.OBJECT,
      properties: {
        overlappingTopics: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Existing article titles/slugs that cover similar ground' },
        cannibalizationRisk: { type: Type.STRING, description: 'Risk of keyword/topic overlap: Low, Medium, or High' },
        recommendation: { type: Type.STRING, description: 'Publishing recommendation, e.g. "Create new article" or "Merge with existing post X"' }
      },
      required: ['overlappingTopics', 'cannibalizationRisk', 'recommendation']
    },
    intentExpansion: {
      type: Type.OBJECT,
      properties: {
        primaryIntent: { type: Type.STRING },
        secondaryIntent: { type: Type.STRING },
        hiddenIntent: { type: Type.STRING, description: 'Implicit background questions the user has but did not explicitly search' },
        followUpQuestions: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Likely next queries user will search' },
        adjacentLearningTopics: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ['primaryIntent', 'secondaryIntent', 'hiddenIntent', 'followUpQuestions', 'adjacentLearningTopics']
    },
    audienceModeling: {
      type: Type.OBJECT,
      properties: {
        beginnerSummary: { type: Type.STRING, description: 'How to explain this topic to a beginner in 2 sentences' },
        expertSummary: { type: Type.STRING, description: 'Executive/advanced summary for experts' },
        developerSummary: { type: Type.STRING, description: 'Actionable developer/engineer perspective' },
        businessOwnerSummary: { type: Type.STRING, description: 'Strategic perspective for business owners' }
      },
      required: ['beginnerSummary', 'expertSummary', 'developerSummary', 'businessOwnerSummary']
    },
    topicGraph: {
      type: Type.OBJECT,
      properties: {
        parentTopics: { type: Type.ARRAY, items: { type: Type.STRING } },
        childTopics: { type: Type.ARRAY, items: { type: Type.STRING } },
        siblingTopics: { type: Type.ARRAY, items: { type: Type.STRING } },
        prerequisites: { type: Type.ARRAY, items: { type: Type.STRING } },
        advancedTopics: { type: Type.ARRAY, items: { type: Type.STRING } },
        alternativeConcepts: { type: Type.ARRAY, items: { type: Type.STRING } },
        relatedStandards: { type: Type.ARRAY, items: { type: Type.STRING } },
        timeline: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              event: { type: Type.STRING },
              date: { type: Type.STRING }
            },
            required: ['event', 'date']
          }
        }
      },
      required: ['parentTopics', 'childTopics', 'siblingTopics', 'prerequisites', 'advancedTopics', 'alternativeConcepts', 'relatedStandards', 'timeline']
    },
    entityIntelligence: {
      type: Type.OBJECT,
      properties: {
        people: { type: Type.ARRAY, items: { type: Type.STRING } },
        companies: { type: Type.ARRAY, items: { type: Type.STRING } },
        technologies: { type: Type.ARRAY, items: { type: Type.STRING } },
        protocols: { type: Type.ARRAY, items: { type: Type.STRING } },
        standards: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ['people', 'companies', 'technologies', 'protocols', 'standards']
    },
    evidenceClassification: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          statement: { type: Type.STRING, description: 'A direct claim/quote from the text' },
          classification: { type: Type.STRING, description: 'Verified fact, Official documentation, Industry consensus, Research finding, Opinion, Prediction, Historical fact, Example, or Hypothesis' },
          sourceConfidence: { type: Type.INTEGER, description: 'Confidence of statement verification source (1-10)' }
        },
        required: ['statement', 'classification', 'sourceConfidence']
      }
    },
    citationConfidence: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.INTEGER, description: 'Overall citation quality (1-100)' },
        preferredSourcesUsed: { type: Type.ARRAY, items: { type: Type.STRING } },
        reviewNeededClaims: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Unverified or uncertain claims flag' }
      },
      required: ['score', 'preferredSourcesUsed', 'reviewNeededClaims']
    },
    factValidation: {
      type: Type.OBJECT,
      properties: {
        validatedElements: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              item: { type: Type.STRING, description: 'Name, date, command, benchmark, pricing, or version' },
              type: { type: Type.STRING, description: 'Category: Date, Version, Price, Command, URL, Unit, Statistics' },
              status: { type: Type.STRING, description: 'Status: valid, warning, or unverified' },
              note: { type: Type.STRING }
            },
            required: ['item', 'type', 'status', 'note']
          }
        }
      },
      required: ['validatedElements']
    },
    originalContributions: {
      type: Type.OBJECT,
      properties: {
        hasMatrix: { type: Type.BOOLEAN },
        hasComparisonTable: { type: Type.BOOLEAN },
        hasTroubleshootingTree: { type: Type.BOOLEAN },
        hasChecklist: { type: Type.BOOLEAN },
        contributionSummary: { type: Type.STRING, description: 'What unique original resources/visuals does the text provide' }
      },
      required: ['hasMatrix', 'hasComparisonTable', 'hasTroubleshootingTree', 'hasChecklist', 'contributionSummary']
    },
    technicalAccuracy: {
      type: Type.OBJECT,
      properties: {
        codeSyntaxValid: { type: Type.BOOLEAN },
        cliCommandsVerified: { type: Type.BOOLEAN },
        deprecatedApproaches: { type: Type.ARRAY, items: { type: Type.STRING } },
        details: { type: Type.STRING }
      },
      required: ['codeSyntaxValid', 'cliCommandsVerified', 'deprecatedApproaches', 'details']
    },
    editorialStyle: {
      type: Type.OBJECT,
      properties: {
        voiceScore: { type: Type.INTEGER },
        grammarScore: { type: Type.INTEGER },
        readabilityScore: { type: Type.INTEGER },
        toneScore: { type: Type.INTEGER },
        repetitiveSentenceStructuresAvoided: { type: Type.BOOLEAN }
      },
      required: ['voiceScore', 'grammarScore', 'readabilityScore', 'toneScore', 'repetitiveSentenceStructuresAvoided']
    },
    accessibility: {
      type: Type.OBJECT,
      properties: {
        headingOrderCorrect: { type: Type.BOOLEAN },
        altTextProvided: { type: Type.BOOLEAN },
        tableAccessibilityPassed: { type: Type.BOOLEAN },
        readingLevel: { type: Type.STRING },
        details: { type: Type.STRING }
      },
      required: ['headingOrderCorrect', 'altTextProvided', 'tableAccessibilityPassed', 'readingLevel', 'details']
    },
    mediaRecommendations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          diagramType: { type: Type.STRING, description: 'Flowchart, Architecture, Sequence, Decision Tree, etc.' },
          description: { type: Type.STRING, description: 'Detailed instruction of what this visual should depict' },
          elements: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ['diagramType', 'description', 'elements']
      }
    },
    seoIntelligence: {
      type: Type.OBJECT,
      properties: {
        topicalAuthorityScore: { type: Type.INTEGER },
        snippetPotential: { type: Type.STRING },
        metaDescription: { type: Type.STRING },
        internalLinkingSuggestions: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'List of recommended internal articles to link to, with anchor text' }
      },
      required: ['topicalAuthorityScore', 'snippetPotential', 'metaDescription', 'internalLinkingSuggestions']
    },
    aeoIntelligence: {
      type: Type.OBJECT,
      properties: {
        directAnswerBlock: { type: Type.STRING, description: 'A direct 1-sentence answer for Google Snippet/AEO' },
        faqList: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              answer: { type: Type.STRING }
            },
            required: ['question', 'answer']
          }
        },
        entitySummary: { type: Type.STRING }
      },
      required: ['directAnswerBlock', 'faqList', 'entitySummary']
    },
    userValueAnalysis: {
      type: Type.OBJECT,
      properties: {
        whatIsItScore: { type: Type.INTEGER },
        whyItMattersScore: { type: Type.INTEGER },
        howItWorksScore: { type: Type.INTEGER },
        whenToUseScore: { type: Type.INTEGER },
        whenToAvoidScore: { type: Type.INTEGER },
        alternativesScore: { type: Type.INTEGER },
        limitationsScore: { type: Type.INTEGER },
        commonMistakesScore: { type: Type.INTEGER }
      },
      required: ['whatIsItScore', 'whyItMattersScore', 'howItWorksScore', 'whenToUseScore', 'whenToAvoidScore', 'alternativesScore', 'limitationsScore', 'commonMistakesScore']
    },
    trustReview: {
      type: Type.OBJECT,
      properties: {
        sourcesInvented: { type: Type.BOOLEAN },
        statsInvented: { type: Type.BOOLEAN },
        quotesInvented: { type: Type.BOOLEAN },
        productFeaturesInvented: { type: Type.BOOLEAN },
        certaintyOverstated: { type: Type.BOOLEAN },
        misrepresentsEvidence: { type: Type.BOOLEAN },
        passedTrust: { type: Type.BOOLEAN, description: 'Must be true only if none of the indicators are flagged' }
      },
      required: ['sourcesInvented', 'statsInvented', 'quotesInvented', 'productFeaturesInvented', 'certaintyOverstated', 'misrepresentsEvidence', 'passedTrust']
    },
    publishGate: {
      type: Type.OBJECT,
      properties: {
        passed: { type: Type.BOOLEAN },
        score: { type: Type.INTEGER },
        failedChecks: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ['passed', 'score', 'failedChecks']
    },
    maintenance: {
      type: Type.OBJECT,
      properties: {
        brokenLinksCount: { type: Type.INTEGER },
        rankingTrend: { type: Type.STRING },
        newVersionsAvailable: { type: Type.ARRAY, items: { type: Type.STRING } },
        refreshNeeded: { type: Type.BOOLEAN }
      },
      required: ['brokenLinksCount', 'rankingTrend', 'newVersionsAvailable', 'refreshNeeded']
    }
  },
  required: [
    'opportunity', 'duplicates', 'intentExpansion', 'audienceModeling',
    'topicGraph', 'entityIntelligence', 'evidenceClassification',
    'citationConfidence', 'factValidation', 'originalContributions',
    'technicalAccuracy', 'editorialStyle', 'accessibility',
    'mediaRecommendations', 'seoIntelligence', 'aeoIntelligence',
    'userValueAnalysis', 'trustReview', 'publishGate', 'maintenance'
  ]
};

async function runEditorialIntelligenceAudit(
  key: string,
  title: string,
  content: string,
  keywords: string[],
  existingArticles: { title: string; slug: string; tags: string[] }[] = []
): Promise<any> {
  const auditPrompt = `
Analyze the following article titled "${title}" against the 20-Stage Enterprise Editorial Intelligence criteria.

ARTICLE CONTENT:
---
${content.slice(0, 10000)}
---

EXISTING ARTICLES in database (use for Stage 2 Duplicate Detection, Stage 5 Topic Graph connection, and Stage 15 Internal Linking):
${JSON.stringify(existingArticles.slice(0, 15))}

TARGET KEYWORDS:
${keywords.join(', ')}

Perform the following 20-Stage evaluation rigorously:
1. Knowledge Opportunity Discovery: Assess the topic's trendiness, freshness, and authority fit. Estimate maintenance cost based on technology decay rate.
2. Duplicate Detection: Check if topic overlaps with existing articles. Assess cannibalization risk. Suggest merges if needed.
3. Intent Expansion: Assess primary, secondary, and hidden user intent, follow-up queries, and learning topics.
4. Audience Modeling: Generate adapted summaries of the content for Beginners, Experts, Developers, and Business Owners.
5. Topic Graph Construction: Map parent, child, sibling topics, prerequisites, alternative concepts, and historical timeline events.
6. Entity Intelligence: Identify and extract people, companies, technologies, protocols, and standards mentioned.
7. Evidence Classification: Identify 4-7 key statements and classify them as fact, documentation, consensus, opinion, prediction, hypothesis, etc.
8. Citation Confidence: Assign citation score, verify preferred sources used, flag claims needing manual review.
9. Fact Validation: Audit dates, statistics, versions, prices, CLI commands, URLs, and code snippets for errors.
10. Original Contribution: Verify if article includes unique values (decision matrices, troubleshooting trees, checklists, comparison tables).
11. Technical Accuracy: Verify code syntax, CLI commands, configuration blocks, and flag deprecated methods/APIs.
12. Editorial Style: Rate readability, grammar, tone, voice, and sentence variation.
13. Accessibility Review: Check heading order, alt text availability, table structure, reading level, and descriptive captions.
14. Media Intelligence: Suggest 2-3 specific diagrams/charts (e.g. Mermaid flowchart, database schema) explaining concepts.
15. SEO Intelligence: Assess depth, heading quality, snippet potential, metadata, and suggest links to existing articles.
16. AEO Intelligence: Draft a direct Google Answer box sentence, FAQ list, and entity summary blocks.
17. User Value Analysis: Grade how well the article covers: What, Why, How, When, Alternatives, Limitations, Common Mistakes.
18. Trust Review: Flag any fabricated stats, quotes, sources, or overstated certainty.
19. Publish Gate: Gate is passed ONLY if trustReview.passedTrust is true, technicalAccuracy.codeSyntaxValid is true, and overall score is >= 70.
20. Continuous Maintenance: Monitor for broken links, identify potentially outdated tool versions, and flag if refresh is needed.

Return your response matching the requested JSON schema. Be highly critical and factual.`;

  const text = await generateText(
    key,
    auditPrompt,
    {
      systemInstruction: 'You are an elite autonomous Editor-in-Chief, SEO strategist, technical reviewer, and fact checker. You review articles with extreme rigor and return detailed, formatted JSON output.',
      temperature: 0.1,
      responseMimeType: 'application/json',
      responseSchema: editorialIntelligenceSchema
    }
  );
  const cleaned = cleanJsonResponse(text);
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('Failed to parse 20-Stage audit response:', err);
    throw new Error('Audit analysis failed to return valid structure.');
  }
}

export async function executePipeline(
  topic: string,
  keywords: string[],
  primaryKey: string,
  key2 = '',
  key3 = '',
  cloudflareToken = '',
  existingArticles: { title: string; slug: string; tags: string[] }[] = []
): Promise<{
  status: 'ready_to_publish' | 'quarantined' | 'error';
  title: string;
  content: string;
  audit?: { passedCheck: boolean; score: number; vulnerabilities: string[]; suggestions: string[] };
  reason?: string;
  excerpt?: string;
  tags?: string[];
  keywords?: string[];
  isApproved?: boolean;
  editorialIntelligence?: any;
}> {
  // Sync the provider manager with the latest API keys
  providerManager.refreshProviders(primaryKey, key2, key3, cloudflareToken);

  try {
    let effectiveKeywords = keywords;
    if (effectiveKeywords.length === 0) {
      effectiveKeywords = await generateSEOKeywords(primaryKey, topic);
    }
    const rawDraft = await draftArticleContent(primaryKey, topic, effectiveKeywords);

    // Polish the drafted article to enhance readability and ensure human voice
    const mockAudit = { suggestions: ['Enhance code examples and readability.'] };
    const polishedContent = await optimizeAndPolish(primaryKey, rawDraft, mockAudit);

    // Run the 20-Stage Editorial Intelligence Audit
    const editorialIntelligence = await runEditorialIntelligenceAudit(primaryKey, topic, polishedContent, effectiveKeywords, existingArticles);

    const gate = editorialIntelligence.publishGate || { passed: false, score: 60, failedChecks: ['Audit failed to run'] };

    const auditResults = {
      passedCheck: gate.passed,
      score: gate.score,
      vulnerabilities: gate.failedChecks || [],
      suggestions: (editorialIntelligence.seoIntelligence?.internalLinkingSuggestions || [])
        .concat(editorialIntelligence.technicalAccuracy?.deprecatedApproaches || [])
    };

    if (gate.score < 65 || !gate.passed) {
      return {
        status: 'quarantined',
        title: topic,
        content: polishedContent,
        audit: auditResults,
        reason: `Publish Gate validation failed (Score: ${gate.score}/100). Failed criteria: ${(gate.failedChecks || []).join(', ')}`,
        excerpt: polishedContent.slice(0, 160).replace(/[#*]/g, '').trim(),
        tags: effectiveKeywords.slice(0, 4),
        keywords: effectiveKeywords,
        editorialIntelligence
      };
    }

    return {
      status: 'ready_to_publish',
      title: topic,
      content: polishedContent,
      audit: auditResults,
      excerpt: polishedContent.slice(0, 160).replace(/[#*]/g, '').trim(),
      tags: effectiveKeywords.slice(0, 4),
      keywords: effectiveKeywords,
      isApproved: true,
      editorialIntelligence
    };
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    return {
      status: 'error',
      title: topic,
      content: '',
      reason: errMsg,
    };
  }
}

export async function formatContent(
  content: string,
  primaryKey: string,
  key2 = '',
  key3 = '',
  cloudflareToken = ''
): Promise<string> {
  providerManager.refreshProviders(primaryKey, key2, key3, cloudflareToken);
  return generateText(
    primaryKey,
    `Clean up and enhance the formatting of this document. Fix inconsistent heading levels, organize loose paragraphs under appropriate headings, normalize list formatting, fix broken markdown, and improve overall readability. Preserve ALL original content and meaning — do not rewrite or summarize. Only fix structure and formatting.

DOCUMENT:
${content.slice(0, 12000)}

Return ONLY the cleaned-up markdown, no explanations.`,
    {
      systemInstruction: 'You are a professional document formatter. You fix structure and formatting without changing a single word of the original content. Never rewrite, summarize, or add new content.',
      temperature: 0.15,
    }
  );
}

export async function validateContent(
  content: string,
  primaryKey: string,
  key2 = '',
  key3 = '',
  cloudflareToken = '',
  existingArticles: any[] = []
): Promise<{ passedCheck: boolean; score: number; vulnerabilities: string[]; suggestions: string[]; editorialIntelligence?: any }> {
  providerManager.refreshProviders(primaryKey, key2, key3, cloudflareToken);

  // Run the 20-Stage Editorial Intelligence Audit on manual content
  const editorialIntelligence = await runEditorialIntelligenceAudit(primaryKey, "Manual Article Validation", content, [], existingArticles);

  const gate = editorialIntelligence.publishGate || { passed: false, score: 60, failedChecks: ['Audit failed to run'] };

  return {
    passedCheck: gate.passed,
    score: gate.score,
    vulnerabilities: gate.failedChecks || [],
    suggestions: (editorialIntelligence.seoIntelligence?.internalLinkingSuggestions || [])
      .concat(editorialIntelligence.technicalAccuracy?.deprecatedApproaches || []),
    editorialIntelligence
  };
}
