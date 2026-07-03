import { GoogleGenAI, Type } from '@google/genai';

const MODEL_NAME = 'gemini-2.5-flash';
const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY = 2000;

let keyIndex = 0;
const keyLastUsed: number[] = [];

function isQuotaError(err: unknown): boolean {
  const msg = err instanceof Error ? (err.message || '') : String(err);
  const msgLower = msg.toLowerCase();
  return msgLower.includes('quota') || msgLower.includes('please wait') || msgLower.includes('retry after');
}

function isTransientError(err: unknown): boolean {
  const msg = err instanceof Error ? (err.message || '') : String(err);
  const msgLower = msg.toLowerCase();
  return msgLower.includes('429') || msgLower.includes('too many requests') || msgLower.includes('resource exhausted')
    || msgLower.includes('rate_limit') || msgLower.includes('congestion') || msgLower.includes('overloaded')
    || msgLower.includes('unavailable') || msgLower.includes('quota') || msgLower.includes('limit')
    || msgLower.includes('try again') || msgLower.includes('please wait') || msgLower.includes('retry after')
    || msgLower.includes('deadline') || msgLower.includes('timeout') || msgLower.includes('500')
    || msgLower.includes('502') || msgLower.includes('503') || msgLower.includes('service unavailable')
    || msgLower.includes('internal server') || msgLower.includes('connection');
}

async function withRetry<T>(fn: (key: string) => Promise<T>, apiKeys: string[]): Promise<T> {
  const maxAttempts = Math.max(25, apiKeys.length * 6);
  const MIN_KEY_INTERVAL = 2000;
  let lastError: unknown;
  const keysTriedInThisRequest = new Set<number>();

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const keyIdx = keyIndex % apiKeys.length;
    const key = apiKeys[keyIdx];

    // Enforce minimum cooldown only if we are retrying a key we already tried in this request
    const now = Date.now();
    const lastTs = keyLastUsed[keyIdx] ?? 0;
    const elapsed = now - lastTs;
    if (elapsed < MIN_KEY_INTERVAL && keysTriedInThisRequest.has(keyIdx)) {
      const wait = MIN_KEY_INTERVAL - elapsed;
      console.log(`Key ${keyIdx + 1} used ${(elapsed / 1000).toFixed(0)}s ago — waiting ${(wait / 1000).toFixed(0)}s before reuse (attempt ${attempt + 1})`);
      await new Promise(resolve => setTimeout(resolve, wait));
    }

    keysTriedInThisRequest.add(keyIdx);
    keyLastUsed[keyIdx] = Date.now();

    try {
      return await fn(key);
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? (err.message || '') : String(err);
      const msgLower = msg.toLowerCase();
      const isQuota = isQuotaError(err);
      const isTransient = isTransientError(err);

      // Non-recoverable errors for a single key (e.g. invalid API key) should rotate if other keys are available
      if (msgLower.includes('api key') || msgLower.includes('not found') || msgLower.includes('safety')
          || msgLower.includes('permission') || msgLower.includes('access')) {
        if (apiKeys.length > 1 && attempt < maxAttempts - 1) {
          console.warn(`Key ${keyIdx + 1} encountered error: ${msgLower}. Rotating to next key...`);
          keyIndex = (keyIndex + 1) % apiKeys.length;
          continue;
        }
        throw err;
      }

      let delay = 15000;

      if (isQuota) {
        // Quota exceeded: move to next key
        console.log(`Quota exceeded on key ${keyIdx + 1} — moving to the next key`);
        keyIndex = (keyIndex + 1) % apiKeys.length;
        delay = 1000; // Small delay before trying next key
      } else if (isTransient) {
        // Model is busy: retry after 15s using same key
        console.log(`Model is busy on key ${keyIdx + 1} — retrying after 15s`);
        delay = 15000;
      } else {
        // Other errors: retry after 15s using same key
        console.log(`Error on key ${keyIdx + 1}: ${msgLower} — retrying after 15s`);
        delay = 15000;
      }

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
    contents: `Write a comprehensive, authoritative, elite long-form article on this topic:

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
): Promise<{ passedCheck: boolean; score: number; vulnerabilities: string[]; suggestions: string[] }> {
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
    return JSON.parse(response.text ?? '{}');
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
  auditResults: { suggestions: string[] }
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

function availableKeys(primaryKey: string, key2: string, key3: string): string[] {
  const keys = [primaryKey];
  if (key2) keys.push(key2);
  if (key3) keys.push(key3);
  return keys;
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
  ai: GoogleGenAI,
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

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: auditPrompt,
    config: {
      systemInstruction: 'You are an elite autonomous Editor-in-Chief, SEO strategist, technical reviewer, and fact checker. You review articles with extreme rigor and return detailed, formatted JSON output.',
      temperature: 0.1,
      responseMimeType: 'application/json',
      responseSchema: editorialIntelligenceSchema
    }
  });

  try {
    return JSON.parse(response.text ?? '{}');
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
  const apiKeys = availableKeys(primaryKey, key2, key3);

  try {
    let effectiveKeywords = keywords;
    if (effectiveKeywords.length === 0) {
      effectiveKeywords = await withRetry(
        (k) => generateSEOKeywords(createAI(k), topic),
        apiKeys
      );
    }
    const rawDraft = await withRetry(
      (k) => draftArticleContent(createAI(k), topic, effectiveKeywords),
      apiKeys
    );

    // Polish the drafted article to enhance readability and ensure human voice
    const mockAudit = { suggestions: ['Enhance code examples and readability.'] };
    const polishedContent = await withRetry(
      (k) => optimizeAndPolish(createAI(k), rawDraft, mockAudit),
      apiKeys
    );

    // Run the 20-Stage Editorial Intelligence Audit
    const editorialIntelligence = await withRetry(
      (k) => runEditorialIntelligenceAudit(createAI(k), topic, polishedContent, effectiveKeywords, existingArticles),
      apiKeys
    );

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
  key3 = ''
): Promise<string> {
  const apiKeys = availableKeys(primaryKey, key2, key3);
  return withRetry(
    (k) => {
      const ai = createAI(k);
      return ai.models.generateContent({
        model: MODEL_NAME,
        contents: `Clean up and enhance the formatting of this document. Fix inconsistent heading levels, organize loose paragraphs under appropriate headings, normalize list formatting, fix broken markdown, and improve overall readability. Preserve ALL original content and meaning — do not rewrite or summarize. Only fix structure and formatting.

DOCUMENT:
${content.slice(0, 12000)}

Return ONLY the cleaned-up markdown, no explanations.`,
        config: {
          systemInstruction: 'You are a professional document formatter. You fix structure and formatting without changing a single word of the original content. Never rewrite, summarize, or add new content.',
          temperature: 0.15,
        },
      });
    },
    apiKeys
  ).then(r => r.text ?? content);
}

export async function validateContent(
  content: string,
  primaryKey: string,
  key2 = '',
  key3 = '',
  existingArticles: any[] = []
): Promise<{ passedCheck: boolean; score: number; vulnerabilities: string[]; suggestions: string[]; editorialIntelligence?: any }> {
  const apiKeys = availableKeys(primaryKey, key2, key3);

  // Run the 20-Stage Editorial Intelligence Audit on manual content
  const editorialIntelligence = await withRetry(
    (k) => runEditorialIntelligenceAudit(createAI(k), "Manual Article Validation", content, [], existingArticles),
    apiKeys
  );

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
