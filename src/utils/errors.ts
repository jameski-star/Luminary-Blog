export function isQuotaError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
  return msg.includes('quota') || msg.includes('please wait') || msg.includes('retry after');
}

export function isCongestionError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
  return msg.includes('429') || msg.includes('too many requests') || msg.includes('resource exhausted')
    || msg.includes('rate_limit') || msg.includes('congestion') || msg.includes('overloaded')
    || msg.includes('unavailable') || msg.includes('quota') || msg.includes('limit')
    || msg.includes('try again') || msg.includes('model.*busy') || msg.includes('please wait')
    || msg.includes('retry after');
}

export function friendlyError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);

  if (isQuotaError(err)) return 'The AI model is busy right now — please try again in about 5 minutes.';
  if (isCongestionError(err)) return 'The AI model is temporarily unavailable. The pipeline will keep retrying automatically.';

  if (/api.?key/i.test(msg) && /invalid|incorrect|not found|bad/i.test(msg)) return 'Invalid API key. Check your Gemini API key and try again.';
  if (/api.?key/i.test(msg) && /missing|required/i.test(msg)) return 'Gemini API key is required. Add your key to continue.';

  return 'Something went wrong. Please try again.';
}
