import type { User, BlogPost } from '../types';

// ──────────────────────────────────────────────
// Local-storage helpers (simulate a DB)
// ──────────────────────────────────────────────
const STORAGE_KEYS = {
  USERS: 'luminary_users',
  POSTS: 'luminary_posts',
  CURRENT_USER: 'luminary_current_user',
  GEMINI_KEY: 'luminary_gemini_key',
};

export function getStoredUsers(): User[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
  } catch { return []; }
}

function migrateUser(user: User): User {
  if (!user.role) user.role = 'user';
  return user;
}

export function migrateStoredData() {
  const users = getStoredUsers().map(migrateUser);
  saveUsers(users);
  const current = getCurrentUser();
  if (current) {
    setCurrentUser(migrateUser(current));
  }
}

export function saveUsers(users: User[]) {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
}

export function getStoredPosts(): BlogPost[] {
  try {
    const posts = JSON.parse(localStorage.getItem(STORAGE_KEYS.POSTS) || '[]');
    return posts;
  } catch { return []; }
}

export function savePosts(posts: BlogPost[]) {
  localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
}

export function getCurrentUser(): User | null {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || 'null');
  } catch { return null; }
}

export function setCurrentUser(user: User | null) {
  if (user) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }
}

export function getGeminiKey(): string {
  return localStorage.getItem(STORAGE_KEYS.GEMINI_KEY) || '';
}

export function saveGeminiKey(key: string) {
  localStorage.setItem(STORAGE_KEYS.GEMINI_KEY, key);
}

// ──────────────────────────────────────────────
// Word Indexer — indexes every word in a post
// ──────────────────────────────────────────────
export function buildWordIndex(content: string): Record<string, number[]> {
  const paragraphs = content.split('\n').filter(Boolean);
  const index: Record<string, number[]> = {};

  paragraphs.forEach((para, idx) => {
    const words = para
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2);

    words.forEach(word => {
      if (!index[word]) index[word] = [];
      if (!index[word].includes(idx)) index[word].push(idx);
    });
  });

  return index;
}

// ──────────────────────────────────────────────
// Slug generator
// ──────────────────────────────────────────────
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .slice(0, 80);
}

// ──────────────────────────────────────────────
// Read time calculator
// ──────────────────────────────────────────────
export function calcReadTime(content: string): number {
  const words = content.split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 238));
}

// ──────────────────────────────────────────────
// Auth helpers
// ──────────────────────────────────────────────
export function signUp(name: string, email: string, password: string): { success: boolean; error?: string; user?: User } {
  const users = getStoredUsers();
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    return { success: false, error: 'Email already registered.' };
  }
  if (password.length < 8) {
    return { success: false, error: 'Password must be at least 8 characters.' };
  }
  // Store hashed password (simple base64 for demo; in production use bcrypt)
  const isFirstUser = users.length === 0;
  const user: User = {
    id: `user_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    email,
    name,
    joinedAt: new Date().toISOString(),
    postsCount: 0,
    bio: '',
    role: isFirstUser ? 'admin' : 'user',
  };
  // Store credentials separately
  const creds = JSON.parse(localStorage.getItem('luminary_creds') || '{}');
  creds[email.toLowerCase()] = btoa(password);
  localStorage.setItem('luminary_creds', JSON.stringify(creds));
  users.push(user);
  saveUsers(users);
  setCurrentUser(user);
  return { success: true, user };
}

export function signIn(email: string, password: string): { success: boolean; error?: string; user?: User } {
  const users = getStoredUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) return { success: false, error: 'No account found with that email.' };

  const creds = JSON.parse(localStorage.getItem('luminary_creds') || '{}');
  if (creds[email.toLowerCase()] !== btoa(password)) {
    return { success: false, error: 'Incorrect password.' };
  }
  setCurrentUser(user);
  return { success: true, user };
}

export function signOut() {
  setCurrentUser(null);
}

// ──────────────────────────────────────────────
// Seed demo posts if none exist
// ──────────────────────────────────────────────
const DEMO_POSTS: BlogPost[] = [
  {
    id: 'demo_1',
    title: 'Why Monolithic Architectures Are Quietly Returning to Enterprise Tech',
    slug: 'monolithic-architectures-returning-enterprise-tech',
    excerpt: 'A decade after microservices became the default enterprise answer, engineering teams are quietly porting workloads back to monoliths. Here is the data-driven case for why.',
    content: `## The Pendulum Swings Back

For most of the 2010s, microservices were the architectural religion of enterprise software. Decompose everything. Deploy independently. Scale horizontally. The pitch was compelling — and for companies at Google or Netflix scale, it delivered.

But scale is the operative word. Most companies are not Google.

## The Hidden Tax of Distributed Systems

Every service boundary you draw is a contract. Contracts require versioning, backward compatibility, and — critically — a team to own them. When you have 400 microservices and 200 engineers, the math breaks.

The operational overhead compounds silently. Network latency between services adds up. Distributed tracing becomes a full-time discipline. On-call rotations expand because failure modes multiply. Infrastructure bills reflect every hop, every retry, every health check running at idle.

**The real question engineers stopped asking: what problem are we actually solving?**

## What the Data Shows

Shopify's 2023 engineering retrospective is the clearest industry signal. After migrating to a modular monolith — a single deployable with strict internal module boundaries — they reported:

- 40% reduction in P99 latency across checkout flows
- Simplified on-call rotations (one runbook, not forty)
- 30% faster feature deployment for core commerce paths

Stack Overflow runs one of the highest-traffic sites on the internet on a monolith. Amazon's infamous "two-pizza team" rule was originally about *bounded contexts*, not about separate deployment units.

## The Modular Monolith: The Pragmatic Middle Ground

The answer most mature teams are landing on is not a pure monolith versus pure microservices binary. It is a **modular monolith** — a single deployable artifact with enforced internal module isolation.

You get the deployment simplicity of a monolith with the codebase discipline of microservices. Internal modules cannot reach across boundaries without going through explicit interfaces. The compiler enforces your architecture, not Kubernetes.

When a specific module genuinely needs independent scaling — say, your video transcoding pipeline — you extract it. Not by default. By necessity.

## When Microservices Still Win

None of this means microservices are wrong. They remain the correct answer when:

- Teams are genuinely independent with separate release cadences
- A component has radically different scaling characteristics
- You need language-level isolation for a specific processing job
- Regulatory requirements demand hard data boundaries

The mistake was not the pattern. The mistake was applying it universally, without counting the cost.

## The Architectural Lesson

Software architecture has always cycled. Mainframes gave way to client-server. Client-server gave way to service-oriented architecture. SOA became microservices. Now the pendulum swings toward consolidation again.

The engineers who will build the best systems in the next decade are not the ones who are loyal to a pattern. They are the ones who can accurately measure the cost of complexity against the genuine benefits it provides.

Start with a monolith. Earn your microservices.`,
    tags: ['Software Architecture', 'Engineering', 'Cloud Computing'],
    keywords: ['monolithic vs microservices', 'software design patterns', 'cloud infrastructure costs', 'modular monolith'],
    authorId: 'demo_author',
    authorName: 'Luminary Editorial',
    publishedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    modifiedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    status: 'published',
    readTime: 7,
    views: 2847,
    likes: 341,
    auditScore: 92,
    wordCount: 520,
  },
  {
    id: 'demo_2',
    title: 'The Real Cost of Technical Debt: A CFO-Level Analysis',
    slug: 'real-cost-technical-debt-cfo-analysis',
    excerpt: 'Technical debt is not an engineering abstraction. It has a precise dollar cost, a compounding interest rate, and a maturity date. Here is how to calculate it.',
    content: `## Technical Debt Is a Balance Sheet Problem

Engineering managers have spent decades trying to get non-technical executives to care about technical debt by using technical metaphors. It has not worked. The CFO does not understand why refactoring a legacy authentication module matters.

Change the vocabulary. Debt accrues interest. Technical debt accrues *velocity drag*.

## Measuring the Interest Rate

The interest rate on technical debt is measurable. It is expressed as the percentage of each sprint consumed by work that exists solely because of prior architectural shortcuts.

Run this calculation with your team:

1. Audit the last six sprints.
2. Categorize each ticket: net-new feature, bug fix caused by legacy code, or rework of existing functionality.
3. Calculate the ratio of rework-to-new work.

Most teams discover 35-50% of engineering capacity is consumed by the interest payments on past decisions. At a fully-loaded engineering cost of $200k per engineer per year, a 10-person team burning 40% on debt service loses **$800,000 annually** to interest.

## The Compounding Mechanism

Simple interest would be manageable. Technical debt compounds.

Every new feature built on top of fragile infrastructure inherits that fragility. A poorly designed database schema does not just slow down one query — it constrains every feature that touches that table, forever, until the schema is fixed. New engineers onboard into a codebase that resists understanding, extending their time-to-productivity from weeks to months.

The compound rate accelerates as the codebase ages and the engineers who understood the original decisions leave.

## When to Pay Down Debt

The answer is not "always" and it is not "never." It is a capital allocation decision.

**Pay down debt aggressively when:**
- Engineering velocity has dropped more than 30% year-over-year without headcount changes
- A new strategic initiative is blocked by infrastructure limitations
- The next funding round will require a technical due diligence review

**Defer debt when:**
- You are pre-product-market-fit and the business model is still being validated
- The affected system has a clear deprecation timeline under 18 months
- The cost of migration exceeds 2 years of interest payments

## The Refactoring Investment Thesis

Reframe the conversation. A refactoring project is not a cost center. It is a yield-generating investment.

If a $300,000 refactoring effort recovers 30% of engineering velocity for a 10-person team, the annual return is $600,000. The payback period is six months. The IRR is 200%.

No CFO will refuse that investment once the math is on the table. The mistake engineers make is presenting refactoring as a technical necessity rather than a financial opportunity.`,
    tags: ['Engineering Management', 'Business', 'Finance'],
    keywords: ['technical debt cost', 'engineering velocity', 'software ROI', 'refactoring investment'],
    authorId: 'demo_author',
    authorName: 'Luminary Editorial',
    publishedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    modifiedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    status: 'published',
    readTime: 6,
    views: 5120,
    likes: 687,
    auditScore: 95,
    wordCount: 480,
  },
  {
    id: 'demo_3',
    title: 'Rethinking Remote Work: What Three Years of Data Actually Tells Us',
    slug: 'rethinking-remote-work-three-years-data',
    excerpt: 'The remote work debate has been dominated by anecdote. The longitudinal productivity studies are finally in — and they complicate both sides of the argument.',
    content: `## The Anecdote Wars Are Over

Since 2020, remote work has been argued using personal testimony and cherry-picked studies. CEOs cite in-office collaboration magic. Remote advocates cite zero-commute productivity gains. Both camps are right about something. Both camps are wrong about the generalizations they draw.

The longitudinal data — studies tracking the same workers over three-plus years — tells a more nuanced story.

## What the Long-Run Data Shows

Stanford economist Nicholas Bloom's ongoing remote work research (tracking over 10,000 knowledge workers) surfaces a finding that scrambles both narratives: **output quality and output quantity diverge.**

Remote workers produce *more* in terms of raw task completion. But the quality distribution widens. The top performers in remote environments outperform their in-office counterparts significantly. The bottom quartile underperforms at a higher rate.

Remote work is not a uniform productivity multiplier. It is a performance amplifier — it makes good performers better and struggling performers worse.

## The Collaboration Cost Is Real, But Specific

The anti-remote camp's strongest argument is collaboration degradation. But the data localizes this cost precisely: **it affects complex, novel problem-solving disproportionately.**

Routine execution work — writing code to a specification, processing a defined workflow, drafting from a brief — shows no collaboration penalty remotely. Cross-functional innovation work — the kind that requires serendipitous information collisions, rapid whiteboard iteration, reading non-verbal cues — shows measurable degradation after 18 months of full remote.

The implication is not "return to office." It is "return to office for the right work."

## The Hybrid Calculus

The companies with the highest reported productivity outcomes in 2024 are running a specific model: **2 days in-office, anchored to team days.**

The key word is anchored. Hybrid fails when each person chooses their own days and the office becomes an expensive, half-empty desk farm. It works when entire teams are present simultaneously, generating the collision density that makes in-person time valuable.

Microsoft's internal Viva data across 600 organizations shows that teams with synchronized in-office days report 23% higher satisfaction and 18% higher self-reported collaboration effectiveness than teams with individual flexibility.

## What Leaders Keep Getting Wrong

The return-to-office mandates that have generated the most backlash share a common feature: they are blanket policies applied uniformly to roles with wildly different collaboration needs.

A software engineer deep in a three-month feature build and an account manager who closes deals through relationship density do not have the same office requirements. Treating them identically is not fairness — it is laziness.

The leaders who will retain top talent while maintaining output are the ones who can articulate *why* a specific role benefits from specific in-person touchpoints — and who can answer that question without resorting to "culture" as a non-answer.`,
    tags: ['Future of Work', 'Management', 'Productivity'],
    keywords: ['remote work productivity data', 'hybrid work model', 'return to office', 'knowledge worker performance'],
    authorId: 'demo_author',
    authorName: 'Luminary Editorial',
    publishedAt: new Date(Date.now() - 86400000 * 14).toISOString(),
    modifiedAt: new Date(Date.now() - 86400000 * 14).toISOString(),
    status: 'published',
    readTime: 8,
    views: 9342,
    likes: 1204,
    auditScore: 91,
    wordCount: 560,
  }
];

export function initializeDemoPosts() {
  const existing = getStoredPosts();
  if (existing.length === 0) {
    const withIndex = DEMO_POSTS.map(p => ({
      ...p,
      wordIndex: buildWordIndex(p.content),
    }));
    savePosts(withIndex);
  }
}
