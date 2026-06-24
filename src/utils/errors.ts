const congestionPatterns = [
  /429/i, /too many requests/i, /resource exhausted/i,
  /rate_limit/i, /congestion/i, /overloaded/i, /unavailable/i,
  /quota/i, /limit/i, /try again/i, /model.*busy/i,
];

export function friendlyError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);

  for (const p of congestionPatterns) {
    if (p.test(msg)) return 'The AI model is busy right now — please try again in about 5 minutes.';
  }

  if (/api.?key/i.test(msg) && /invalid|incorrect|not found|bad/i.test(msg)) return 'Invalid API key. Check your Gemini API key and try again.';
  if (/api.?key/i.test(msg) && /missing|required/i.test(msg)) return 'Gemini API key is required. Add your key to continue.';

  return 'Something went wrong. Please try again.';
}
