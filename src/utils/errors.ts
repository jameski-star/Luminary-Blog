function getErrorMessage(err: unknown): string {
  let msg = err instanceof Error ? (err.message || '') : String(err || '');
  if (msg.trim().startsWith('{') && msg.trim().endsWith('}')) {
    try {
      const parsed = JSON.parse(msg);
      if (parsed.error && typeof parsed.error.message === 'string') {
        return parsed.error.message;
      } else if (typeof parsed.message === 'string') {
        return parsed.message;
      }
    } catch {}
  }
  return msg;
}

export function isQuotaError(err: unknown): boolean {
  const msgLower = getErrorMessage(err).toLowerCase();
  return msgLower.includes('quota') || msgLower.includes('please wait') || msgLower.includes('retry after') || msgLower.includes('resource_exhausted') || msgLower.includes('exhausted');
}

export function isCongestionError(err: unknown): boolean {
  const msgLower = getErrorMessage(err).toLowerCase();
  return msgLower.includes('429') || msgLower.includes('too many requests') || msgLower.includes('resource exhausted')
    || msgLower.includes('rate_limit') || msgLower.includes('congestion') || msgLower.includes('overloaded')
    || msgLower.includes('unavailable') || msgLower.includes('quota') || msgLower.includes('limit')
    || msgLower.includes('try again') || msgLower.includes('model.*busy') || msgLower.includes('please wait')
    || msgLower.includes('retry after');
}

export function friendlyError(err: unknown): string {
  const msg = getErrorMessage(err);
  const msgLower = msg.toLowerCase();

  if (isQuotaError(err) || msgLower.includes('quota') || msgLower.includes('exhausted') || msgLower.includes('resource_exhausted')) {
    return 'The AI model free tier quota was exceeded. Please try again in a few minutes or provide another key.';
  }
  if (isCongestionError(err) || msgLower.includes('busy') || msgLower.includes('overloaded')) {
    return 'The AI model is busy right now — please try again in about 5 minutes.';
  }

  if (/api.?key/i.test(msgLower) && /invalid|incorrect|not found|bad/i.test(msgLower)) {
    return 'Invalid API key. Check your Gemini API key and try again.';
  }
  if (/api.?key/i.test(msgLower) && /missing|required/i.test(msgLower)) {
    return 'Gemini API key is required. Add your key to continue.';
  }

  return msg || 'Something went wrong. Please try again.';
}
