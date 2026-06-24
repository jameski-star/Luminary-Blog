export interface PostTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  title: string;
  content: string;
  tags: string[];
  excerpt: string;
}

const templates: PostTemplate[] = [
  {
    id: 'how-to-guide',
    name: 'How-To Guide',
    description: 'Step-by-step tutorial that teaches the reader a specific skill or process.',
    category: 'Educational',
    icon: '📖',
    title: 'How to [Achieve X]: A Complete Guide for Beginners',
    content: `## Introduction

Every expert was once a beginner. If you are reading this, you already know you need to solve [problem X]. This guide will walk you through every step — no prior knowledge required.

By the end, you will understand not just the *how* but the *why* behind each step.

## What You Will Need

Before we start, gather these:

- **Item or tool A** — this handles the foundation
- **Item or tool B** — optional but recommended for best results
- **About 30 minutes** of focused time

## Step 1: Understanding the Basics

Start by [first actionable step]. Most people skip this because it seems obvious, but getting it right determines everything that follows.

> *"The beginning is the most important part of the work."* — Plato

Take five minutes to [specific foundational task]. You will thank yourself later.

## Step 2: The Core Process

Now that the foundation is set, we move to the meat of the process.

**[Action A]:** Do this first. Pay attention to [specific detail]. If you hit [common problem], here is the fix: [solution].

**[Action B]:** Building on the previous step, [next action]. This is where most people make the mistake of [common error]. Instead, [better approach].

## Step 3: Optimization

Once the basic version works, here is how to make it excellent:

1. **Refine** — Look at [specific metric]. Can you improve it by 20%?
2. **Automate** — Which parts of this process repeat? Set up [tool] to handle them.
3. **Scale** — Now that it works for one, how does it work for ten?

## Common Pitfalls

- **Pitfall 1:** [Description]. Fix: [solution].
- **Pitfall 2:** [Description]. Fix: [solution].
- **Pitfall 3:** [Description]. Fix: [solution].

## Conclusion

You now have a working [outcome]. The hard part is done. From here, it is about iteration and refinement.

The next step is up to you. Start applying what you have learned, and come back to this guide whenever you need a refresher.`,
    tags: ['Tutorial', 'Beginner-Friendly', 'How-To'],
    excerpt: 'A complete step-by-step guide that walks readers through achieving a specific outcome, from setup to mastery.',
  },
  {
    id: 'listicle',
    name: 'Listicle',
    description: 'Curated list of top items, tools, or strategies with detailed reasoning for each.',
    category: 'Engagement',
    icon: '📋',
    title: '10 [Topic] Tools That Will Transform Your Workflow in 2026',
    content: `## Introduction

Finding the right [tool/resource/strategy] for [task] can feel overwhelming. There are dozens of options, each promising to be the best.

I have tested and used every entry on this list personally. These are not theoretical recommendations — they are the ones that survived actual daily use.

## 1. [Name of First Item]

**Best for:** [specific use case]

[2-3 sentences about what it does and why it stands out.]

**Key feature:** [one standout capability]
**Price:** [free/paid/price range]

**Why it made the list:** [1-2 sentences explaining the specific value it provides.]

## 2. [Name of Second Item]

**Best for:** [specific use case]

[2-3 sentences about what it does and why it stands out.]

**Key feature:** [one standout capability]
**Price:** [free/paid/price range]

**Why it made the list:** [1-2 sentences explaining the specific value it provides.]

## 3. [Name of Third Item]

...

## Comparison Table

| Tool | Best For | Price | Key Limitation |
|------|----------|-------|----------------|
| [Tool 1] | [Use case] | [Price] | [Limitation] |
| [Tool 2] | [Use case] | [Price] | [Limitation] |
| [Tool 3] | [Use case] | [Price] | [Limitation] |

## Which One Should You Choose?

- **If you are a beginner:** Start with [Tool X]. It has the gentlest learning curve.
- **If you need maximum power:** Go with [Tool Y]. It does everything.
- **If budget is a concern:** [Tool Z] offers 80% of the features for free.

## Conclusion

The best tool is the one you actually use. Pick one from this list, commit to it for two weeks, and evaluate honestly after.`,
    tags: ['List', 'Top Picks', 'Reviews'],
    excerpt: 'Curated list of top-tier tools, strategies, or resources with detailed analysis and comparison.',
  },
  {
    id: 'industry-analysis',
    name: 'Industry Analysis',
    description: 'Deep dive into market trends, competitive landscape, and future predictions.',
    category: 'Professional',
    icon: '📊',
    title: 'The State of [Industry] in 2026: Trends, Challenges, and Opportunities',
    content: `## Executive Summary

The [industry] landscape is shifting faster than most professionals realize. Three converging forces — [trend A], [trend B], and [trend C] — are reshaping how companies operate, compete, and deliver value.

This analysis breaks down what is happening, why it matters, and what you should do about it.

## The Big Picture

Over the past 12 months, the [industry] sector has seen:

- **[Statistic 1]%** growth in [metric], driven by [cause]
- **[Statistic 2]** major acquisitions, signaling consolidation
- A **[X]% shift** toward [new approach or technology]

These numbers tell a story, but the real insight is in the details beneath them.

## Trend 1: [Major Trend A]

[Description of the trend — what it is, why it is happening, who is driving it.]

**Key players:** [Company A], [Company B], [Company C]
**Market size:** $[X] billion (projected $[Y] billion by 2028)

**Implications:**
- Companies that adopt early gain a [X]-month advantage over competitors
- The cost of ignoring this trend is [specific risk]
- Regulation is likely to catch up within [timeframe]

## Trend 2: [Major Trend B]

...

## The Challenges Ahead

Despite the opportunity, several obstacles remain:

1. **Talent shortage** — [Description of the problem and its impact]
2. **Integration complexity** — [Why this is hard and what it costs]
3. **Regulatory uncertainty** — [How this creates risk]

## Recommendations

Based on this analysis, leaders should:

1. **Invest in [area X] now** — the window of opportunity closes in [timeframe]
2. **Build partnerships** with [type of company] to offset [specific weakness]
3. **Prepare for regulation** by [specific action]

## Looking Forward

By 2027, the companies that thrive will be those that [key insight]. The rest will be playing catch-up.`,
    tags: ['Industry Trends', 'Analysis', 'Strategy'],
    excerpt: 'In-depth market analysis covering current trends, challenges, competitive landscape, and strategic recommendations.',
  },
  {
    id: 'case-study',
    name: 'Case Study',
    description: 'Real-world example showing how a problem was solved with measurable results.',
    category: 'Social Proof',
    icon: '📈',
    title: 'How [Company/Person] Achieved [Result] Using [Method/Strategy]',
    content: `## The Challenge

[Company/Person] was facing [specific problem]. This was causing:

- **[Problem 1]:** [Specific impact, ideally with numbers]
- **[Problem 2]:** [Specific impact]
- **[Problem 3]:** [Specific impact]

The team had tried [previous approach] but it fell short because [reason].

## The Approach

Instead of [conventional solution], they chose to [key strategic decision]. This was unconventional because [why it was unexpected].

**The strategy had three pillars:**

1. **[Pillar A]** — [Brief description of what this involved]
2. **[Pillar B]** — [Brief description]
3. **[Pillar C]** — [Brief description]

## The Implementation

### Phase 1: Planning (Weeks 1-2)
[What happened during this phase, key decisions made, team involved.]

### Phase 2: Execution (Weeks 3-6)
[How it was built, challenges encountered, how they were overcome.]

### Phase 3: Optimization (Weeks 7-8)
[What was learned, what was adjusted, the iteration process.]

## The Results

The numbers speak for themselves:

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| [Metric A] | [X] | [Y] | **[+Z]%** |
| [Metric B] | [X] | [Y] | **[+Z]%** |
| [Metric C] | $[X] | $[Y] | **[+Z]%** |

Beyond the metrics, [qualitative outcome — e.g., team morale, customer satisfaction, etc.].

## Key Takeaways

1. **[Lesson 1]** — [Explanation]
2. **[Lesson 2]** — [Explanation]
3. **[Lesson 3]** — [Explanation]

## Ready to Try It?

The same approach can work for [similar situation]. Start with [first step] and measure [key metric] from day one.`,
    tags: ['Case Study', 'Results', 'Real-World'],
    excerpt: 'Detailed real-world example with measurable outcomes, methodology breakdown, and actionable takeaways.',
  },
  {
    id: 'opinion',
    name: 'Opinion / Hot Take',
    description: 'Bold, argument-driven piece that takes a clear stance on a controversial topic.',
    category: 'Thought Leadership',
    icon: '💡',
    title: 'Why [Common Belief] Is Wrong and What to Do Instead',
    content: `## The Conventional Wisdom

Ask any [professional in field] about [topic], and you will hear the same thing: [commonly held belief]. It has become accepted wisdom, repeated so often that nobody questions it.

But here is the problem: **it is wrong.**

## Where the Consensus Gets It Wrong

The standard approach fails for three reasons:

**1. It assumes [incorrect assumption].** In reality, [what actually happens]. The numbers prove it — [statistic or example].

**2. It ignores [critical factor].** Every discussion of [topic] mentions [factor X] but completely ignores [factor Y], which matters more.

**3. It prioritizes [wrong goal] over [right goal].** The conventional approach optimizes for [metric that looks good on paper] rather than [metric that actually matters in practice].

## A Better Way

Let me propose an alternative — one backed by [evidence type].

### Principle 1: [Principle A]
Instead of [conventional approach], [new approach]. Here is why this works: [explanation].

### Principle 2: [Principle B]
[Description of the principle with supporting logic or evidence.]

### Principle 3: [Principle C]
[Description of the principle with supporting logic or evidence.]

## A Real Example

[Case study or anecdote illustrating how the alternative approach works in practice.]

## Addressing the Counterarguments

**"But what about [objection 1]?"**
Fair question. Here is why it does not apply in this case: [response].

**"Doesn't [authority figure] recommend the opposite?"**
Yes, and here is why they are wrong about this specific point: [response].

## The Bottom Line

The safe choice is to keep doing what everyone else is doing. The smart choice is to question whether there is a better way.

I have seen [new approach] work when [conventional approach] failed. The evidence is clear. Now it is your turn to decide.`,
    tags: ['Opinion', 'Thought Leadership', 'Debate'],
    excerpt: 'A bold, argument-driven piece that challenges conventional wisdom with reasoned counterpoints and evidence.',
  },
  {
    id: 'product-review',
    name: 'Product Review',
    description: 'Honest, detailed assessment of a product or service with pros, cons, and verdict.',
    category: 'Reviews',
    icon: '⭐',
    title: '[Product Name] Review: Is It Worth Your Money in 2026?',
    content: `## Verdict at a Glance

**Rating:** [X]/5
**Best for:** [target user]
**Price:** $[amount]
**Alternative if it does not fit:** [competitor name]

If you are short on time: [one-sentence verdict with specific recommendation].

## What Is [Product Name]?

[2-3 sentences describing the product, what it does, and who it is for.]

## What I Tested

I used [Product Name] for [duration] in [context/scenario]. My setup: [relevant details about environment or use case].

## The Good

### ✅ [Strength 1]
[Detailed explanation with specific examples of what worked well.]

### ✅ [Strength 2]
[Detailed explanation.]

### ✅ [Strength 3]
[Detailed explanation.]

## The Bad

### ❌ [Weakness 1]
[Hones explanation of what falls short and in what circumstances.]

### ❌ [Weakness 2]
[Detailed explanation.]

## Comparison to Competitors

| Feature | [Product] | [Competitor A] | [Competitor B] |
|---------|-----------|----------------|----------------|
| [Feature 1] | ✅ | ✅ | ❌ |
| [Feature 2] | ✅ | ❌ | ✅ |
| [Feature 3] | ❌ | ✅ | ✅ |
| Price | $[X] | $[Y] | $[Z] |

## Who Should Buy It

- **Yes, if:** [specific use case or type of user]
- **No, if:** [specific use case or type of user]

## Final Verdict

[Product Name] excels at [key strength] but falls short at [key weakness]. For [target user], it is [recommendation]. For [other user], consider [alternative].

**Final score:** [X]/5 — [one-line summary of recommendation].`,
    tags: ['Review', 'Product', 'Comparison'],
    excerpt: 'Honest, in-depth product review with pros/cons, comparison table, and clear verdict for different user types.',
  },
  {
    id: 'thought-leadership',
    name: 'Thought Leadership',
    description: 'Visionary piece that establishes authority and presents a unique perspective on the future.',
    category: 'Authority',
    icon: '🌟',
    title: 'The Future of [Topic]: [Number] Predictions for the Next [Timeframe]',
    content: `## Why This Matters Now

We are at an inflection point in [industry/field]. The decisions made in the next [timeframe] will determine the trajectory of [broader impact].

Having spent [X years] in this space and watched [key developments], here is what I believe is coming — and what you should do about it.

## Prediction 1: [Prediction Title]

**Timeline:** [When this will happen]

**What is changing:** [Description of the shift or trend.]

**Why it matters:** [Impact on professionals, companies, or consumers.]

**What to do now:** [Actionable advice.]

**Signs it is already happening:** [Evidence — specific companies, data points, or announcements.]

## Prediction 2: [Prediction Title]

**Timeline:** [When this will happen]

**What is changing:** [Description of the shift or trend.]

**Why it matters:** [Impact.]

**What to do now:** [Actionable advice.]

**Signs it is already happening:** [Evidence.]

## Prediction 3: [Prediction Title]

...

## The Common Thread

Each of these predictions points to a single underlying shift: [thesis statement about the unifying trend].

This means [broader implication] — and those who prepare will have a [specific advantage].

## How to Prepare

1. **Build capability in [area X]** — [reason and method]
2. **Watch [key indicator]** — [what to monitor and why]
3. **Connect with [people/communities]** — [who is shaping this and how to engage]

## A Final Thought

The future is not something that happens to you. It is something you prepare for, shape, and — if you are bold enough — create.

The predictions above are my best assessment based on [evidence base]. I will be revisiting them in [timeframe] to see how close we got.`,
    tags: ['Future Trends', 'Thought Leadership', 'Predictions'],
    excerpt: 'Visionary piece with specific predictions, timelines, evidence, and actionable advice for staying ahead of the curve.',
  },
  {
    id: 'ultimate-guide',
    name: 'Ultimate Guide',
    description: 'Comprehensive, long-form resource covering every aspect of a topic from A to Z.',
    category: 'Educational',
    icon: '📚',
    title: 'The Ultimate Guide to [Topic]: Everything You Need to Know in 2026',
    content: `## Introduction

[Topic] is one of those subjects that seems simple on the surface but reveals layers of complexity the deeper you go. This guide exists to cover every layer — from absolute fundamentals to advanced techniques that most professionals never master.

**What this guide covers:**
- Chapter 1: The fundamentals (start here if you are new)
- Chapter 2: Intermediate concepts
- Chapter 3: Advanced strategies
- Chapter 4: Tools and resources
- Chapter 5: Common mistakes and how to avoid them
- Chapter 6: Next steps

## Chapter 1: The Fundamentals

### What Is [Core Concept]?

[Clear, accessible explanation of the core concept.]

### Why It Matters

[Explanation of importance with specific examples of impact.]

### The Key Principles

1. **[Principle 1]** — [Description]
2. **[Principle 2]** — [Description]
3. **[Principle 3]** — [Description]

## Chapter 2: Intermediate Concepts

### [Intermediate Topic A]

[Explanation with practical examples.]

### [Intermediate Topic B]

[Explanation with practical examples.]

## Chapter 3: Advanced Strategies

### [Advanced Technique A]

[In-depth explanation for experienced practitioners.]

### [Advanced Technique B]

[In-depth explanation.]

## Chapter 4: Essential Tools and Resources

| Resource | Purpose | Best For |
|----------|---------|----------|
| [Tool A] | [Purpose] | [User type] |
| [Tool B] | [Purpose] | [User type] |
| [Resource C] | [Purpose] | [User type] |

## Chapter 5: Common Mistakes

1. **[Mistake 1]** — [Why it happens and how to avoid it]
2. **[Mistake 2]** — [Why it happens and how to avoid it]
3. **[Mistake 3]** — [Why it happens and how to avoid it]

## Chapter 6: Your Learning Path

- **Week 1-2:** Master the fundamentals
- **Week 3-4:** Build your first [project/practice exercise]
- **Month 2:** Dive into intermediate concepts
- **Month 3:** Start applying advanced techniques

## Conclusion

You now have everything you need to go from complete beginner to competent practitioner in [topic]. Bookmark this guide — it will be here whenever you need to reference a specific concept.`,
    tags: ['Comprehensive Guide', 'Beginner to Advanced', 'Reference'],
    excerpt: 'The definitive resource covering a topic from absolute fundamentals through advanced techniques, with tools, pitfalls, and a learning path.',
  },
];

export function getTemplates(): PostTemplate[] {
  return templates;
}

export function getTemplateById(id: string): PostTemplate | undefined {
  return templates.find(t => t.id === id);
}

export function getTemplateCategories(): string[] {
  return [...new Set(templates.map(t => t.category))];
}
