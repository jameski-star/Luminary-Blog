export function isQuotaError(err: unknown): boolean {
  const msg = err instanceof Error ? (err.message || '') : String(err);
  const msgLower = msg.toLowerCase();
  return msgLower.includes('quota') || msgLower.includes('please wait') || msgLower.includes('retry after');
}

export function isCongestionError(err: unknown): boolean {
  const msg = err instanceof Error ? (err.message || '') : String(err);
  const msgLower = msg.toLowerCase();
  return msgLower.includes('429') || msgLower.includes('too many requests') || msgLower.includes('resource exhausted')
    || msgLower.includes('rate_limit') || msgLower.includes('congestion') || msgLower.includes('overloaded')
    || msgLower.includes('unavailable') || msgLower.includes('quota') || msgLower.includes('limit')
    || msgLower.includes('try again') || msgLower.includes('model.*busy') || msgLower.includes('please wait')
    || msgLower.includes('retry after');
}

export function friendlyError(err: unknown): string {
  const msg = err instanceof Error ? (err.message || '') : String(err);

  if (isQuotaError(err)) return 'The AI model is busy right now — please try again in about 5 minutes.';
  if (isCongestionError(err)) return 'The AI model is temporarily unavailable. The pipeline will keep retrying automatically.';

  if (/api.?key/i.test(msg) && /invalid|incorrect|not found|bad/i.test(msg)) return 'Invalid API key. Check your Gemini API key and try again.';
  if (/api.?key/i.test(msg) && /missing|required/i.test(msg)) return 'Gemini API key is required. Add your key to continue.';

  return 'Something went wrong. Please try again.';
}
