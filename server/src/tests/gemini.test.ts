import {
  AIErrorClassifier,
  AIErrorType,
  providerManager,
  estimateTokens,
  getContextLimit,
  compressAndTrimPrompt,
  aiMetrics,
  AIProviderInstance
} from '../services/gemini.js';

// Simple Assertion Helper
function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

async function runTests() {
  console.log('🧪 Starting AI Infrastructure Test Suite...\n');

  // ==========================================
  // Test 1: Error Classification
  // ==========================================
  console.log('--- Test 1: Error Classifier ---');
  
  const rateLimitErr = AIErrorClassifier.classify(new Error('API rate limit exceeded (status 429)'));
  assert(rateLimitErr.type === AIErrorType.RATE_LIMIT, 'Classified rate limit correctly');

  const quotaErr1 = AIErrorClassifier.classify(new Error('Cloudflare AI failed (429): Daily neuron quota exceeded'));
  assert(quotaErr1.type === AIErrorType.QUOTA_EXHAUSTED, 'Classified Cloudflare 429 neuron quota correctly');

  const quotaErr2 = AIErrorClassifier.classify(new Error('Cloudflare AI failed (400): Code 4006 - daily neuron allocation exceeded'));
  assert(quotaErr2.type === AIErrorType.QUOTA_EXHAUSTED, 'Classified Cloudflare 400 neuron quota correctly');

  const modelBusyErr = AIErrorClassifier.classify(new Error('Gemini API 503 Model is busy / overloaded'));
  assert(modelBusyErr.type === AIErrorType.MODEL_BUSY, 'Classified 503 Model Busy correctly');

  const networkErr = AIErrorClassifier.classify(new Error('Fetch failed: econnrefused connection refused'));
  assert(networkErr.type === AIErrorType.NETWORK_ERROR, 'Classified connection refused as NETWORK_ERROR');

  const authErr = AIErrorClassifier.classify(new Error('Auth error (401): Invalid API key provided'));
  assert(authErr.type === AIErrorType.AUTH_ERROR, 'Classified 401 as AUTH_ERROR');

  const invalidReqErr = AIErrorClassifier.classify(new Error('Bad request (400): safety blocked request content'));
  assert(invalidReqErr.type === AIErrorType.INVALID_REQUEST, 'Classified safety block/400 as INVALID_REQUEST');


  // ==========================================
  // Test 2: Token Estimator
  // ==========================================
  console.log('\n--- Test 2: Token Estimator ---');
  
  const shortText = 'This is a sample sentence for token counting.';
  const tokens = estimateTokens(shortText);
  // 45 chars -> ~12-15 tokens
  assert(tokens > 10 && tokens < 20, `Token estimation for short text is within bounds: ${tokens}`);

  const emptyTokens = estimateTokens('');
  assert(emptyTokens === 0, 'Empty string returns 0 tokens');


  // ==========================================
  // Test 3: Prompt Compressor and Trimming
  // ==========================================
  console.log('\n--- Test 3: Prompt Compressor and Trimming ---');
  
  const mockProvider: AIProviderInstance = {
    id: 'cloudflare',
    name: 'Cloudflare Workers AI',
    type: 'cloudflare',
    key: 'cf-mock-token',
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
  };

  // Cloudflare limit is 24,000 tokens
  // Let's build a huge prompt (e.g. 100,000 characters ~ 28,000 tokens)
  const hugeDraft = 'A'.repeat(100000);
  const prompt = `Perform the audit.\nORIGINAL DRAFT:\n${hugeDraft}\n---`;
  const systemInstruction = 'You are a facts checker.';

  const trimmed = compressAndTrimPrompt(prompt, systemInstruction, mockProvider);
  const totalTokens = estimateTokens(trimmed.prompt) + estimateTokens(trimmed.systemInstruction) + 4000;
  
  assert(totalTokens <= getContextLimit(mockProvider), `Trimmed prompt fits within context budget (${totalTokens} <= 24000)`);
  assert(trimmed.prompt.includes('[TRUNCATED DUE TO MODEL CONTEXT LIMITS]'), 'Prompt contains truncation warning message');


  // ==========================================
  // Test 4: Provider Registry and Health States
  // ==========================================
  console.log('\n--- Test 4: Provider Manager & Health State ---');
  
  // Register mock keys
  providerManager.refreshProviders(
    'gemini-key-1',
    'gemini-key-2',
    'gemini-key-3',
    'cf-token',
    'cf-account-id',
    'nv-nim-key'
  );

  const healthy = providerManager.getHealthyProviders();
  assert(healthy.length >= 5, `Registered healthy providers successfully (found ${healthy.length})`);
  assert(healthy[0].id === 'gemini-1', 'Gemini Key 1 is highest priority');
  assert(healthy[1].id === 'gemini-2', 'Gemini Key 2 is second priority');
  assert(healthy[2].id === 'gemini-3', 'Gemini Key 3 is third priority');
  assert(healthy[3].id === 'cloudflare', 'Cloudflare is fourth priority');
  assert(healthy[4].id === 'nvidia', 'NVIDIA NIM is fifth priority');


  // ==========================================
  // Test 5: Circuit Breaker State Machine
  // ==========================================
  console.log('\n--- Test 5: Circuit Breaker State Machine ---');
  
  const g1 = healthy[0];
  // Simulate 3 temporary failures (e.g. NETWORK_ERROR)
  providerManager.markFailure(g1, AIErrorClassifier.classify(new Error('Network error ECONNRESET')));
  assert(g1.status === 'Temporary Failure' && g1.circuitState === 'CLOSED', '1st failure sets Temporary Failure, circuit CLOSED');

  providerManager.markFailure(g1, AIErrorClassifier.classify(new Error('Network error ECONNRESET')));
  providerManager.markFailure(g1, AIErrorClassifier.classify(new Error('Network error ECONNRESET')));
  
  assert(g1.status === 'Offline' && g1.circuitState === 'OPEN', '3rd failure trips circuit breaker to OPEN, status Offline');
  assert(g1.cooldownUntil > Date.now(), 'Cooldown timer is active');

  // Verify that getHealthyProviders filters out the tripped provider
  const filteredHealthy = providerManager.getHealthyProviders();
  assert(!filteredHealthy.find(p => p.id === 'gemini-1'), 'Tripped provider is excluded from healthy list');

  // Simulate cooldown expiration
  g1.cooldownUntil = Date.now() - 1000;
  const healthRecheck = providerManager.getHealthyProviders();
  assert(g1.circuitState === 'HALF-OPEN', 'Expired cooldown transitions circuit state to HALF-OPEN on healthy poll');

  // Simulate success on HALF-OPEN
  providerManager.markSuccess(g1);
  assert(g1.circuitState === 'CLOSED' && g1.status === 'Healthy' && g1.failureCount === 0, 'Successful request resets circuit to CLOSED and status Healthy');


  // ==========================================
  // Test 6: Quota Exhaustion Immediate switch
  // ==========================================
  console.log('\n--- Test 6: Quota Exhaustion Switch ---');
  
  const g2 = healthy.find(p => p.id === 'gemini-2')!;
  providerManager.markFailure(g2, AIErrorClassifier.classify(new Error('API key daily quota exceeded')));
  assert(g2.status === 'Quota Exhausted' && g2.circuitState === 'OPEN', 'Quota exhaustion immediately transitions to OPEN/Quota Exhausted without 3 failures');


  // ==========================================
  // Test 7: Uptime & Metrics Tracking
  // ==========================================
  console.log('\n--- Test 7: Uptime & Metrics Tracking ---');
  
  assert(aiMetrics.circuitBreakerEvents.length > 0, 'Logged circuit breaker state transitions in metrics');

  console.log('\n✨ ALL TESTS PASSED SUCCESSFULLY! The AI Infrastructure is production-ready. ✨');
  process.exit(0);
}

runTests().catch(err => {
  console.error('❌ Test runner encountered error:', err);
  process.exit(1);
});
