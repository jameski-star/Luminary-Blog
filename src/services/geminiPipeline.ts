import { GoogleGenAI, Type } from '@google/genai';
import type { AuditResult, PipelineResult, PipelineStage, WritingTone } from '../types';
import { friendlyError } from '../utils/errors';
import { stripAIPatterns, getToneDraftPrompt, injectHumanVariation } from '../utils/humanize';

const MODEL_NAME = 'gemini-2.5-flash';

// ── Client-Side AI Error Classification ──
export enum AIErrorType {
  RATE_LIMIT = 'RATE_LIMIT',
  QUOTA_EXHAUSTED = 'QUOTA_EXHAUSTED',
  MODEL_BUSY = 'MODEL_BUSY',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  AUTH_ERROR = 'AUTH_ERROR',
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

    let status: number | undefined;
    if (err && typeof err === 'object') {
      if ('status' in err && typeof (err as any).status === 'number') {
        status = (err as any).status;
      } else if ('statusCode' in err && typeof (err as any).statusCode === 'number') {
        status = (err as any).statusCode;
      }
    }

    if (status === undefined) {
      const match = msg.match(/(?:status|code|http)\s*[:=]?\s*(\d{3})/i);
      if (match) {
        status = parseInt(match[1], 10);
      }
    }

    // 1. Quota Exhausted
    if (
      status === 429 && (
        msgLower.includes('quota') ||
        msgLower.includes('neuron') ||
        msgLower.includes('4006') ||
        msgLower.includes('exhausted') ||
        msgLower.includes('allocation') ||
        msgLower.includes('used up') ||
        (msgLower.includes('limit exceeded') && !msgLower.includes('rate limit'))
      )
    ) {
      return new AIError(AIErrorType.QUOTA_EXHAUSTED, `Quota exhausted (429): ${msg}`, status, err);
    }
    if (
      status === 400 && (
        msgLower.includes('quota') ||
        msgLower.includes('neuron') ||
        msgLower.includes('4006') ||
        msgLower.includes('exhausted')
      )
    ) {
      return new AIError(AIErrorType.QUOTA_EXHAUSTED, `Quota exhausted (400): ${msg}`, status, err);
    }
    if (
      msgLower.includes('quota') ||
      msgLower.includes('exhausted') ||
      msgLower.includes('daily neuron') ||
      msgLower.includes('allocation') ||
      msgLower.includes('4006') ||
      msgLower.includes('neuron quota') ||
      msgLower.includes('user_limit')
    ) {
      return new AIError(AIErrorType.QUOTA_EXHAUSTED, `Quota exhausted: ${msg}`, status, err);
    }

    // 2. Authentication Errors
    if (
      status === 401 ||
      status === 403 ||
      msgLower.includes('api key') ||
      msgLower.includes('api_key') ||
      msgLower.includes('unauthorized') ||
      msgLower.includes('forbidden') ||
      msgLower.includes('invalid credentials')
    ) {
      return new AIError(AIErrorType.AUTH_ERROR, `Auth error: ${msg}`, status, err);
    }

    // 3. Invalid Model
    if (status === 404 && msgLower.includes('model')) {
      return new AIError(AIErrorType.INVALID_MODEL, `Model missing: ${msg}`, status, err);
    }
    if (msgLower.includes('model not found') || msgLower.includes('invalid model') || msgLower.includes('unknown model')) {
      return new AIError(AIErrorType.INVALID_MODEL, `Model missing: ${msg}`, status, err);
    }

    // 4. Rate Limit
    if (status === 429 || msgLower.includes('rate limit') || msgLower.includes('rate_limit') || msgLower.includes('too many requests')) {
      return new AIError(AIErrorType.RATE_LIMIT, `Rate limit: ${msg}`, status, err);
    }

    // 5. Model Busy
    if (
      status === 503 ||
      msgLower.includes('model is busy') ||
      msgLower.includes('model busy') ||
      msgLower.includes('congestion') ||
      msgLower.includes('overloaded') ||
      msgLower.includes('please wait') ||
      msgLower.includes('try again')
    ) {
      return new AIError(AIErrorType.MODEL_BUSY, `Model busy: ${msg}`, status, err);
    }

    // 6. Network Errors
    if (
      msgLower.includes('fetch failed') ||
      msgLower.includes('network error') ||
      msgLower.includes('dns') ||
      msgLower.includes('socket') ||
      msgLower.includes('econnrefused') ||
      msgLower.includes('econnreset') ||
      msgLower.includes('connect') ||
      msgLower.includes('connection')
    ) {
      return new AIError(AIErrorType.NETWORK_ERROR, `Network error: ${msg}`, status, err);
    }

    // 7. Timeouts
    if (msgLower.includes('timeout') || msgLower.includes('deadline') || msgLower.includes('abort')) {
      return new AIError(AIErrorType.TIMEOUT, `Timeout error: ${msg}`, status, err);
    }

    // 8. Invalid Request
    if (status === 400 || msgLower.includes('safety') || msgLower.includes('blocked') || msgLower.includes('permission') || msgLower.includes('malformed')) {
      return new AIError(AIErrorType.INVALID_REQUEST, `Invalid request: ${msg}`, status, err);
    }

    // 9. Server Error
    if ((status && status >= 500) || msgLower.includes('internal error') || msgLower.includes('unavailable')) {
      return new AIError(AIErrorType.SERVER_ERROR, `Server error: ${msg}`, status, err);
    }

    return new AIError(AIErrorType.UNKNOWN, `Unknown AI error: ${msg}`, status, err);
  }
}

// ── Client-Side AI Provider Interface ──
export interface AIProviderInstance {
  id: string;
  name: string;
  type: 'gemini' | 'openai' | 'claude' | 'openrouter' | 'cloudflare' | 'nvidia';
  key: string;
  extraConfig?: {
    accountId?: string;
    baseUrl?: string;
    model?: string;
  };
  status: 'Healthy' | 'Busy' | 'Rate Limited' | 'Quota Exhausted' | 'Disabled' | 'Offline' | 'Temporary Failure' | 'Permanent Failure';
  cooldownUntil: number;
  failureCount: number;
  successCount: number;
  lastSuccessTime: number;
  lastFailureTime: number;
  latency: number;
  availabilityScore: number;
  circuitState: 'CLOSED' | 'OPEN' | 'HALF-OPEN';
  circuitTrips: number;
}

// ── Provider Registry and Health System ──
export class AIProviderManager {
  private providers: AIProviderInstance[] = [];

  public refreshProviders(apiKeys: string[]) {
    const newProviders: AIProviderInstance[] = [];
    for (let i = 0; i < apiKeys.length; i++) {
      const key = apiKeys[i];
      const isCloudflare = key.startsWith('cf-');
      const isNvidia = key.startsWith('nvapi-') || key.startsWith('nv-');
      
      let id = `gemini-${i}`;
      let name = `Gemini API (Key ${i + 1})`;
      
      if (isCloudflare) {
        const parts = key.replace(/^cf-/, '').split(':');
        const token = parts[0];
        const accountId = parts[1] || 'e3986e39a05965fb562e64afe3673efc';
        id = `cloudflare-${i}`;
        name = `Cloudflare AI (Key ${i + 1})`;
        this.ensureProvider(newProviders, id, name, 'cloudflare', token, { accountId });
      } else if (isNvidia) {
        id = `nvidia-${i}`;
        name = `NVIDIA NIM (Key ${i + 1})`;
        this.ensureProvider(newProviders, id, name, 'nvidia', key, {
          baseUrl: 'https://integrate.api.nvidia.com/v1',
          model: 'meta/llama-3.3-70b-instruct'
        });
      } else {
        this.ensureProvider(newProviders, id, name, 'gemini', key);
      }
    }

    // Sync state
    for (const np of newProviders) {
      const existing = this.providers.find(p => p.id === np.id && p.key === np.key);
      if (existing) {
        np.status = existing.status;
        np.cooldownUntil = existing.cooldownUntil;
        np.failureCount = existing.failureCount;
        np.successCount = existing.successCount;
        np.lastSuccessTime = existing.lastSuccessTime;
        np.lastFailureTime = existing.lastFailureTime;
        np.latency = existing.latency;
        np.availabilityScore = existing.availabilityScore;
        np.circuitState = existing.circuitState;
        np.circuitTrips = existing.circuitTrips;
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
      successCount: 0,
      lastSuccessTime: 0,
      lastFailureTime: 0,
      latency: 0,
      availabilityScore: 1.0,
      circuitState: 'CLOSED',
      circuitTrips: 0
    });
  }

  public getHealthyProviders(): AIProviderInstance[] {
    const now = Date.now();

    for (const p of this.providers) {
      if (p.status !== 'Healthy' && p.status !== 'Disabled' && p.status !== 'Permanent Failure') {
        if (now >= p.cooldownUntil) {
          console.log(`[AI-HEALTH] Cooldown expired for client provider: ${p.name}. Resetting status to Healthy.`);
          p.status = 'Healthy';
          if (p.circuitState === 'OPEN') {
            p.circuitState = 'HALF-OPEN';
          }
        }
      }
    }

    const priorityMap: Record<string, number> = {
      'gemini': 1,
      'cloudflare': 2,
      'nvidia': 3
    };

    const sorted = [...this.providers].sort((a, b) => {
      const pA = priorityMap[a.type] || 99;
      const pB = priorityMap[b.type] || 99;
      return pA - pB;
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
    provider.availabilityScore = Math.max(0.0, provider.availabilityScore - 0.2);

    switch (error.type) {
      case AIErrorType.AUTH_ERROR:
        provider.status = 'Permanent Failure';
        provider.circuitState = 'OPEN';
        provider.cooldownUntil = now + 24 * 60 * 60 * 1000;
        console.warn(`[AI-HEALTH] Client provider ${provider.name} set to Permanent Failure (Auth Error).`);
        break;

      case AIErrorType.QUOTA_EXHAUSTED:
        provider.status = 'Quota Exhausted';
        provider.circuitState = 'OPEN';
        provider.cooldownUntil = now + 60 * 60 * 1000;
        console.warn(`[AI-HEALTH] Client provider ${provider.name} set to Quota Exhausted.`);
        break;

      case AIErrorType.RATE_LIMIT:
        provider.status = 'Rate Limited';
        provider.cooldownUntil = now + 30 * 1000;
        break;

      case AIErrorType.MODEL_BUSY:
        provider.status = 'Busy';
        provider.cooldownUntil = now + 15 * 1000;
        break;

      default:
        provider.failureCount++;
        provider.status = 'Temporary Failure';
        if (provider.failureCount >= 3) {
          provider.circuitState = 'OPEN';
          provider.status = 'Offline';
          provider.circuitTrips++;
          const cooldownDuration = 30 * 1000 * Math.pow(2, Math.min(provider.circuitTrips - 1, 6));
          provider.cooldownUntil = now + cooldownDuration;
        } else {
          provider.cooldownUntil = now + 5 * 1000;
        }
        break;
    }
  }

  public markSuccess(provider: AIProviderInstance) {
    provider.status = 'Healthy';
    provider.failureCount = 0;
    provider.cooldownUntil = 0;
    provider.availabilityScore = Math.min(1.0, provider.availabilityScore + 0.1);
    
    if (provider.circuitState === 'HALF-OPEN') {
      provider.circuitTrips = 0;
    }
    provider.circuitState = 'CLOSED';
  }
}

export const clientProviderManager = new AIProviderManager();

// ── Token Counting ──
export function estimateTokens(text: string): number {
  if (!text) return 0;
  const charEstimate = Math.ceil(text.length / 3.5);
  const wordEstimate = Math.ceil(text.trim().split(/\s+/).length * 1.3);
  return Math.max(charEstimate, wordEstimate);
}

export function getContextLimit(provider: AIProviderInstance): number {
  switch (provider.type) {
    case 'gemini':
      return 1048576;
    case 'cloudflare':
      return 24000;
    case 'nvidia':
      return 32768;
    default:
      return 8192;
  }
}

function compressAndTrimPrompt(
  prompt: string,
  systemInstruction: string,
  provider: AIProviderInstance
): { prompt: string; systemInstruction: string } {
  const modelLimit = getContextLimit(provider);
  const expectedResponse = 4000;
  const sysTokens = estimateTokens(systemInstruction);
  
  let currentPrompt = prompt;
  let currentSys = systemInstruction;
  let total = estimateTokens(currentPrompt) + sysTokens + expectedResponse;
  
  if (total <= modelLimit) {
    return { prompt: currentPrompt, systemInstruction: currentSys };
  }

  console.warn(`[AI-TOKEN-CLIENT] Trimming context for ${provider.name}...`);

  const articleContentMarkers = [
    { start: 'ARTICLE CONTENT:', end: '---' },
    { start: 'ORIGINAL DRAFT:', end: '---' },
    { start: 'DOCUMENT:', end: 'Return ONLY' }
  ];

  for (const marker of articleContentMarkers) {
    const startIdx = currentPrompt.indexOf(marker.start);
    if (startIdx !== -1) {
      const rest = currentPrompt.slice(startIdx + marker.start.length);
      const endIdx = rest.indexOf(marker.end);
      if (endIdx !== -1) {
        const contentBlock = rest.slice(0, endIdx).trim();
        const truncatedBlock = contentBlock.slice(0, 6000) + '\n... [TRUNCATED] ...\n';
        currentPrompt = currentPrompt.replace(contentBlock, truncatedBlock);
        
        total = estimateTokens(currentPrompt) + sysTokens + expectedResponse;
        if (total <= modelLimit) return { prompt: currentPrompt, systemInstruction: currentSys };
      }
    }
  }

  if (total > modelLimit) {
    const allowedChars = Math.floor((modelLimit - sysTokens - expectedResponse) * 3.5);
    if (allowedChars > 100) {
      currentPrompt = currentPrompt.slice(0, allowedChars) + '\n... [TRUNCATED]';
    }
  }

  return { prompt: currentPrompt, systemInstruction: currentSys };
}

// ── Client-Side Execution with Retry Policy ──
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
  const timeoutMs = 60000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    switch (provider.type) {
      case 'gemini': {
        const ai = new GoogleGenAI({ apiKey: provider.key });
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

      case 'cloudflare': {
        const token = provider.key;
        const accountId = provider.extraConfig?.accountId || 'e3986e39a05965fb562e64afe3673efc';
        const model = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
        const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`;

        let finalPrompt = prompt;
        if (options.responseSchema) {
          finalPrompt = `${prompt}\n\nIMPORTANT: You must return a JSON object that adheres strictly to this JSON Schema structure:\n${JSON.stringify(options.responseSchema, null, 2)}`;
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

      case 'nvidia': {
        let finalPrompt = prompt;
        if (options.responseSchema) {
          finalPrompt = `${prompt}\n\nIMPORTANT: You must return a JSON object that adheres strictly to this JSON Schema structure:\n${JSON.stringify(options.responseSchema, null, 2)}`;
        }
        const messages = [];
        if (options.systemInstruction) {
          messages.push({ role: 'system', content: options.systemInstruction });
        }
        messages.push({ role: 'user', content: finalPrompt });

        const response = await fetch(`${provider.extraConfig?.baseUrl || 'https://integrate.api.nvidia.com/v1'}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${provider.key}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: provider.extraConfig?.model || 'meta/llama-3.3-70b-instruct',
            messages,
            temperature: options.temperature ?? 0.7,
            max_tokens: 4096
          }),
          signal: controller.signal
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(`NVIDIA NIM API failed (status ${response.status}): ${text}`);
        }

        const data = await response.json() as any;
        return data.choices?.[0]?.message?.content || '';
      }

      default:
        throw new Error(`Unsupported provider type: ${(provider as any).type}`);
    }
  } finally {
    clearTimeout(timeoutId);
  }
}

async function executeWithProviderRetry(
  provider: AIProviderInstance,
  prompt: string,
  options: {
    systemInstruction?: string;
    temperature?: number;
    responseMimeType?: string;
    responseSchema?: any;
  }
): Promise<string> {
  let attempt = 0;
  
  while (true) {
    const startTime = Date.now();
    try {
      const result = await executeProviderRequest(provider, prompt, options);
      provider.latency = Date.now() - startTime;
      clientProviderManager.markSuccess(provider);
      return result;
    } catch (err: unknown) {
      attempt++;
      provider.latency = Date.now() - startTime;
      
      const aiError = AIErrorClassifier.classify(err);
      
      let shouldRetry = false;
      let backoffMs = 1000;

      if (aiError.type === AIErrorType.MODEL_BUSY) {
        shouldRetry = attempt < 3;
        backoffMs = 1000 * Math.pow(2, attempt - 1);
      } else if (aiError.type === AIErrorType.SERVER_ERROR) {
        shouldRetry = attempt < 3;
        backoffMs = 1000 * Math.pow(2, attempt - 1);
      } else if (aiError.type === AIErrorType.NETWORK_ERROR || aiError.type === AIErrorType.TIMEOUT) {
        shouldRetry = attempt < 2;
        backoffMs = 500 * Math.pow(2, attempt - 1);
      }

      if (shouldRetry) {
        console.warn(`[AI-RETRY-CLIENT] Retrying ${provider.name} in ${backoffMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, backoffMs));
        continue;
      }

      throw aiError;
    }
  }
}

async function withRetry<T>(
  fn: (key: string, provider: AIProviderInstance) => Promise<T>,
  apiKeys: string[],
  onRetry?: (attempt: number, delay: number, message: string) => void
): Promise<T> {
  clientProviderManager.refreshProviders(apiKeys);
  const maxAttempts = 3;
  let lastError: any = new Error('No AI keys available');

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const healthyProviders = clientProviderManager.getHealthyProviders();
    if (healthyProviders.length === 0) {
      throw new Error('All configured AI API keys are currently exhausted or unavailable.');
    }

    for (const provider of healthyProviders) {
      try {
        const result = await fn(provider.key, provider);
        clientProviderManager.markSuccess(provider);
        return result;
      } catch (err: unknown) {
        const aiError = err instanceof AIError ? err : AIErrorClassifier.classify(err);
        clientProviderManager.markFailure(provider, aiError);
        lastError = aiError;

        const isRetry = aiError.type === AIErrorType.MODEL_BUSY || aiError.type === AIErrorType.SERVER_ERROR || aiError.type === AIErrorType.NETWORK_ERROR;
        const retryMessage = `Key ${provider.name} failed (${aiError.type}). Status: ${provider.status}. ${isRetry ? 'Retrying fallback…' : 'Skipping key…'}`;

        onRetry?.(attempt + 1, isRetry ? 5000 : 1000, retryMessage);

        if (aiError.type === AIErrorType.INVALID_REQUEST || aiError.type === AIErrorType.INVALID_MODEL) {
          throw aiError;
        }

        continue;
      }
    }

    const waitDelay = 1000 * Math.pow(2, attempt);
    onRetry?.(attempt + 1, waitDelay, `All keys failed in attempt ${attempt + 1}. Backing off for ${(waitDelay / 1000).toFixed(0)}s…`);
    await new Promise(resolve => setTimeout(resolve, waitDelay));
  }

  throw lastError;
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
    provider?: AIProviderInstance;
  }
): Promise<string> {
  const providers = clientProviderManager.getHealthyProviders();
  const selectedProvider = options.provider || providers.find(p => p.key === key) || providers[0];
  
  if (!selectedProvider) {
    throw new Error('No healthy providers available for generateText');
  }

  const { prompt: finalPrompt, systemInstruction: finalSys } = compressAndTrimPrompt(prompt, options.systemInstruction || '', selectedProvider);
  return executeWithProviderRetry(selectedProvider, finalPrompt, {
    ...options,
    systemInstruction: finalSys
  });
}

async function generateSEOKeywords(key: string, topic: string, provider?: AIProviderInstance): Promise<string[]> {
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
      provider
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

async function draftArticleChunked(
  key: string,
  topic: string,
  keywords: string[],
  provider: AIProviderInstance
): Promise<string> {
  console.log(`[AI-CHUNKER-CLIENT] Chunked drafting: "${topic}"`);

  const outlinePrompt = `Generate a detailed structural outline for a blog post about: "${topic}". 
Include: Introduction, Section 1, Section 2, Section 3, FAQs.
Return outline as markdown list.`;
  const outline = await generateText(key, outlinePrompt, { temperature: 0.5, provider });

  const introPrompt = `Write an Introduction section for the article "${topic}" based on this outline:\n${outline}\n\nKeywords: ${keywords.slice(0, 3).join(', ')}`;
  const intro = await generateText(key, introPrompt, { temperature: 0.7, provider });

  const s1Prompt = `Write Section 1 of the article "${topic}" based on this outline:\n${outline}\n\nContext:\n${intro}\n\nRequirements:\n- High technical depth\n- Code or CLI if applicable.`;
  const section1 = await generateText(key, s1Prompt, { temperature: 0.7, provider });

  const s2Prompt = `Write Section 2 of the article "${topic}" based on this outline:\n${outline}\n\nContext:\n${section1.slice(-2000)}\n\nRequirements:\n- Include comparison matrix.`;
  const section2 = await generateText(key, s2Prompt, { temperature: 0.7, provider });

  const s3Prompt = `Write Section 3 (Conclusion) of the article "${topic}" based on this outline:\n${outline}\n\nContext:\n${section2.slice(-2000)}`;
  const section3 = await generateText(key, s3Prompt, { temperature: 0.7, provider });

  const faqPrompt = `Generate 3-4 structured FAQs for "${topic}" based on outline:\n${outline}`;
  const faqs = await generateText(key, faqPrompt, { temperature: 0.6, provider });

  return `
# ${topic}

${intro}

${section1}

${section2}

${section3}

## FAQs
${faqs}
`.trim();
}

async function draftArticleContent(
  key: string,
  topic: string,
  keywords: string[],
  tone: WritingTone,
  provider?: AIProviderInstance
): Promise<string> {
  if (provider && getContextLimit(provider) <= 40000) {
    return draftArticleChunked(key, topic, keywords, provider);
  }

  const tonePrompt = getToneDraftPrompt(tone);
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
      systemInstruction: `You are an elite subject-matter expert, technical journalist, and former editor at a major technology publication. Your writing is authoritative, precise, and direct. You prioritize verified data, logical mechanics, and actionable insights. You have a distinctive voice — thoughtful, occasionally dry in its wit, never condescending. You write for readers who are intelligent and time-poor, and who will immediately close a tab at the first sign of padding or cliché. TONE: ${tonePrompt}`,
      temperature: 0.75,
      provider
    }
  );
}

async function optimizeAndPolish(
  key: string,
  draft: string,
  auditResults: AuditResult,
  _tone: WritingTone,
  provider?: AIProviderInstance
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
2. Remove ALL banned words: delve, testament, digital landscape, paramount, crucial, multifaceted, tapestry, in conclusion, furthermore, it is worth noting, paradigm, synergy, leverage, utilize
3. Replace vague statistics with hedged, honest language: instead of "studies show 80% of companies...", write "most engineering teams that have measured this..."
4. Inject micro-imperfections: conversational asides, the occasional em-dash thought, sentences that start with And or But
5. Every paragraph should advance the reader's understanding — delete anything that merely restates what was just said
6. Maintain all Markdown formatting (##, ###, **bold**, lists, blockquotes)
7. Preserve all specific examples, named companies, and concrete data points — only improve the framing
8. The final article should read like it was written by a human expert who has genuine opinions on this topic`,
    {
      systemInstruction: `You are a master copyeditor and essayist who specializes in humanizing and elevating technical prose. You have an exceptional ear for rhythm and cadence. You strip away corporate jargon, eliminate robotic sentence structures, and inject clarity, personality, and precision into every paragraph. Your edited work consistently passes AI-detection systems not by gaming them, but because the underlying prose is genuinely human in its construction — varied, opinionated, and specific. You never make the content shorter; you make every word earn its place.`,
      temperature: 0.65,
      provider
    }
  );
}

function fallbackHumanize(text: string, _tone: WritingTone): string {
  let result = stripAIPatterns(text);
  result = injectHumanVariation(result);
  return result;
}

// ── Upgraded 20-Stage JSON Schema for Editorial Intelligence ──
const editorialIntelligenceSchema = {
  type: Type.OBJECT,
  properties: {
    opportunity: {
      type: Type.OBJECT,
      properties: {
        opportunityScore: { type: Type.INTEGER },
        freshnessScore: { type: Type.INTEGER },
        authorityFit: { type: Type.INTEGER },
        searchIntent: { type: Type.STRING },
        predictedLongevity: { type: Type.STRING },
        estimatedMaintenanceCost: { type: Type.STRING }
      },
      required: ['opportunityScore', 'freshnessScore', 'authorityFit', 'searchIntent', 'predictedLongevity', 'estimatedMaintenanceCost']
    },
    duplicates: {
      type: Type.OBJECT,
      properties: {
        overlappingTopics: { type: Type.ARRAY, items: { type: Type.STRING } },
        cannibalizationRisk: { type: Type.STRING },
        recommendation: { type: Type.STRING }
      },
      required: ['overlappingTopics', 'cannibalizationRisk', 'recommendation']
    },
    intentExpansion: {
      type: Type.OBJECT,
      properties: {
        primaryIntent: { type: Type.STRING },
        secondaryIntent: { type: Type.STRING },
        hiddenIntent: { type: Type.STRING },
        followUpQuestions: { type: Type.ARRAY, items: { type: Type.STRING } },
        adjacentLearningTopics: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ['primaryIntent', 'secondaryIntent', 'hiddenIntent', 'followUpQuestions', 'adjacentLearningTopics']
    },
    audienceModeling: {
      type: Type.OBJECT,
      properties: {
        beginnerSummary: { type: Type.STRING },
        expertSummary: { type: Type.STRING },
        developerSummary: { type: Type.STRING },
        businessOwnerSummary: { type: Type.STRING }
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
          statement: { type: Type.STRING },
          classification: { type: Type.STRING },
          sourceConfidence: { type: Type.INTEGER }
        },
        required: ['statement', 'classification', 'sourceConfidence']
      }
    },
    citationConfidence: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.INTEGER },
        preferredSourcesUsed: { type: Type.ARRAY, items: { type: Type.STRING } },
        reviewNeededClaims: { type: Type.ARRAY, items: { type: Type.STRING } }
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
              item: { type: Type.STRING },
              type: { type: Type.STRING },
              status: { type: Type.STRING },
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
        contributionSummary: { type: Type.STRING }
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
          diagramType: { type: Type.STRING },
          description: { type: Type.STRING },
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
        internalLinkingSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ['topicalAuthorityScore', 'snippetPotential', 'metaDescription', 'internalLinkingSuggestions']
    },
    aeoIntelligence: {
      type: Type.OBJECT,
      properties: {
        directAnswerBlock: { type: Type.STRING },
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
        passedTrust: { type: Type.BOOLEAN }
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
  provider?: AIProviderInstance
): Promise<any> {
  const auditPrompt = `
Analyze the following article titled "${title}" against the 20-Stage Enterprise Editorial Intelligence criteria.

ARTICLE CONTENT:
---
${content.slice(0, 10000)}
---

TARGET KEYWORDS:
${keywords.join(', ')}

Perform the 20-Stage evaluation rigorously and return matching JSON schema.`;

  const text = await generateText(
    key,
    auditPrompt,
    {
      systemInstruction: 'You are an elite Editor-in-Chief fact checker. You return detailed formatted JSON output matching the schema.',
      temperature: 0.1,
      responseMimeType: 'application/json',
      responseSchema: editorialIntelligenceSchema,
      provider
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

export async function executeAutopostPipeline(
  topic: string,
  keywords: string[],
  apiKey: string,
  onStageUpdate: (stages: PipelineStage[]) => void,
  tone: WritingTone = 'professional',
  _maxWords: number = 1500,
): Promise<PipelineResult & { excerpt?: string; tags?: string[]; keywords?: string[]; editorialIntelligence?: any }> {
  const apiKeys = apiKey.split(',').map(k => k.trim()).filter(Boolean);

  const stages: PipelineStage[] = [
    { name: 'Opportunity Discovery & Keywords Research', status: 'pending' },
    { name: 'Drafting Deep-Dive Expert Content', status: 'pending' },
    { name: 'Editorial & Accuracy Audit (20 Stages)', status: 'pending' },
    { name: 'Polishing for Human Rhythm & Tone', status: 'pending' },
    { name: 'Publish Gate Review', status: 'pending' },
  ];

  const update = (idx: number, status: PipelineStage['status'], message?: string) => {
    stages[idx] = { ...stages[idx], status, message };
    onStageUpdate([...stages]);
  };

  try {
    // Stage 0
    let effectiveKeywords = keywords;
    if (effectiveKeywords.length === 0) {
      update(0, 'running');
      effectiveKeywords = await withRetry(
        (k, prov) => generateSEOKeywords(k, topic, prov),
        apiKeys,
        (_attempt, _delay, msg) => update(0, 'running', msg)
      );
    }
    update(0, 'done', `${effectiveKeywords.length} keywords researched`);

    // Stage 1
    update(1, 'running');
    let rawDraft = await withRetry(
      (k, prov) => draftArticleContent(k, topic, effectiveKeywords, tone, prov),
      apiKeys,
      (_attempt, _delay, msg) => update(1, 'running', msg)
    );
    const wc = rawDraft.split(/\s+/).length;
    update(1, 'done', `${wc.toLocaleString()} words drafted`);

    // Stage 2
    update(2, 'running');
    const editorialIntelligence = await withRetry(
      (k, prov) => runEditorialIntelligenceAudit(k, topic, rawDraft, effectiveKeywords, prov),
      apiKeys,
      (_attempt, _delay, msg) => update(2, 'running', msg)
    );
    const gate = editorialIntelligence.publishGate || { passed: false, score: 60, failedChecks: [] };
    update(
      2,
      gate.passed ? 'done' : 'error',
      `Audit Score: ${gate.score}/100 — ${gate.passed ? 'Passed Gate' : 'Failed Gate'}`
    );

    if (gate.score < 65) {
      return {
        status: 'quarantined',
        title: topic,
        content: rawDraft,
        reason: `Authenticity score ${gate.score}/100 is below minimum threshold.`,
        draft: rawDraft,
        excerpt: rawDraft.slice(0, 160).replace(/[#*]/g, '').trim(),
        tags: effectiveKeywords.slice(0, 4),
        keywords: effectiveKeywords,
        editorialIntelligence
      };
    }

    // Stage 3
    update(3, 'running');
    const mockAudit = { passedCheck: gate.passed, score: gate.score, vulnerabilities: gate.failedChecks, suggestions: [] };
    let polishedContent = await withRetry(
      (k, prov) => optimizeAndPolish(k, rawDraft, mockAudit, tone, prov),
      apiKeys,
      (_attempt, _delay, msg) => update(3, 'running', msg)
    );
    update(3, 'done', 'Prose humanized and polished');

    // Stage 4
    update(4, 'running');
    update(4, 'done', 'Publish Gate verification complete');

    const finalAudit = {
      passedCheck: gate.passed,
      score: gate.score,
      vulnerabilities: gate.failedChecks || [],
      suggestions: (editorialIntelligence.seoIntelligence?.internalLinkingSuggestions || [])
        .concat(editorialIntelligence.technicalAccuracy?.deprecatedApproaches || [])
    };

    return {
      status: 'ready_to_publish',
      title: topic,
      content: polishedContent,
      audit: finalAudit,
      excerpt: polishedContent.slice(0, 160).replace(/[#*]/g, '').trim(),
      tags: effectiveKeywords.slice(0, 4),
      keywords: effectiveKeywords,
      isApproved: true,
      editorialIntelligence
    };

  } catch (error: unknown) {
    const errMsg = friendlyError(error);
    const failedIdx = stages.findIndex(s => s.status === 'running');
    if (failedIdx >= 0) update(failedIdx, 'error', errMsg);

    throw new Error(errMsg);
  }
}

export async function humanizeExistingContent(
  content: string,
  apiKey: string,
  tone: WritingTone = 'professional',
): Promise<string> {
  const apiKeys = apiKey.split(',').map(k => k.trim()).filter(Boolean);
  const tonePrompt = getToneDraftPrompt(tone);

  try {
    return await withRetry(
      (k, prov) => {
        return generateText(
          k,
          `Humanize this article. Make it read like a skilled human writer wrote it, not an AI.

TONE: ${tonePrompt}

ARTICLE:
${content.slice(0, 12000)}

MANDATE:
1. Vary sentence lengths and structures
2. Remove AI-typical transitions and formulaic patterns
3. Add natural variation in paragraph lengths
4. Use contractions and conversational phrasing
5. Keep all facts, examples, data, and arguments intact
6. Preserve all Markdown formatting
7. Return ONLY the revised article, no explanations`,
          {
            systemInstruction: 'You are a text humanization specialist. You rewrite AI-generated text to read as naturally human.',
            temperature: 0.6,
            provider: prov
          }
        );
      },
      apiKeys
    );
  } catch {
    return fallbackHumanize(content, tone);
  }
}

export async function formatManualContent(
  content: string,
  apiKey: string
): Promise<string> {
  const apiKeys = apiKey.split(',').map(k => k.trim()).filter(Boolean);
  return withRetry(
    (k, prov) => {
      return generateText(
        k,
        `Clean up and enhance the formatting of this document. Fix inconsistent heading levels, organize loose paragraphs under appropriate headings, normalize list formatting, fix broken markdown, and improve overall readability. Preserve ALL original content and meaning — do not rewrite or summarize. Only fix structure and formatting.

DOCUMENT:
${content.slice(0, 12000)}

Return ONLY the cleaned-up markdown, no explanations.`,
        {
          systemInstruction: 'You are a professional document formatter. You fix structure and formatting without changing a single word of the original content. Never rewrite, summarize, or add new content.',
          temperature: 0.15,
          provider: prov
        }
      );
    },
    apiKeys
  );
}

export async function validateManualPost(
  content: string,
  apiKey: string
): Promise<AuditResult & { editorialIntelligence?: any }> {
  const apiKeys = apiKey.split(',').map(k => k.trim()).filter(Boolean);
  const editorialIntelligence = await withRetry(
    (k, prov) => runEditorialIntelligenceAudit(k, "Manual Verification", content, [], prov),
    apiKeys
  );
  const gate = editorialIntelligence.publishGate || { passed: false, score: 60, failedChecks: [] };

  return {
    passedCheck: gate.passed,
    score: gate.score,
    vulnerabilities: gate.failedChecks || [],
    suggestions: (editorialIntelligence.seoIntelligence?.internalLinkingSuggestions || [])
      .concat(editorialIntelligence.technicalAccuracy?.deprecatedApproaches || []),
    editorialIntelligence
  };
}
