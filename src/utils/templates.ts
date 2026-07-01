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
  // ── Editorial / Magazine ──
  {
    id: 'nyt-magazine-feature',
    name: 'NYT Magazine Feature',
    description: 'Long-form narrative feature with drop caps, pull quotes, and section breaks. The Sunday-morning read.',
    category: 'Editorial',
    icon: '📰',
    title: 'The [Subject] That Is Changing Everything We Know About [Topic]',
    content: `The first time [protagonist] encountered [phenomenon], it was [specific memorable detail]. That moment — ordinary in every other respect — would set off a chain of events that [broader significance].

This is not a story about [conventional framing]. It is about something stranger, and more revealing, about the way [broader theme] actually works.

## The Backstory

[2-3 paragraphs of narrative setup, establishing context, place, and stakes.]

> *"The most interesting thing about [subject] is not what everyone talks about. It is what nobody notices."*
> — [Source]

[Continue narrative with specific details, scenes, and characters.]

## The Turning Point

Something shifted in [timeframe]. [Specific event or discovery] changed the calculus.

[Detailed scene or moment of change.]

The implications were immediate. [Specific outcome.]

## What This Means

| Factor | Conventional View | What Is Actually Happening |
|--------|-------------------|---------------------------|
| [Factor A] | [Common belief] | [Reality] |
| [Factor B] | [Common belief] | [Reality] |
| [Factor C] | [Common belief] | [Reality] |

The numbers tell a story the headlines miss. [Data point 1]. [Data point 2]. Taken together, they suggest [insight].

## The Human Element

Beyond the data, there are people whose lives are being reshaped by this shift.

[Character profile 1 — 2-3 paragraphs with quotes and scene.]

[Character profile 2 — 2-3 paragraphs.]

## Looking Ahead

What comes next is uncertain, but the trajectory is clear. [Prediction or projection grounded in reporting.]

As [notable figure] put it: *"[Quote that captures the essence of the piece]."*

If they are right — and the evidence suggests they are — then [closing thought that resonates].`,
    tags: ['Feature', 'Long-Form', 'Narrative', 'Magazine'],
    excerpt: 'A richly reported narrative feature with scenes, characters, data, and a compelling central argument.',
  },
  {
    id: 'economist-briefing',
    name: 'The Economist Briefing',
    description: 'Deep-dive analysis with structured sections, data tables, and policy implications. Authoritative and measured.',
    category: 'Editorial',
    icon: '📊',
    title: 'The [Topic] Conundrum: What [Country/Industry] Gets Wrong About [Issue]',
    content: `## The argument in brief

[3-4 sentence summary of the core thesis. No jargon. No hedging.]

[The Economist style: direct, analytical, slightly dry, deeply informed.]

## The scale of the problem

| Metric | [Year-2] | [Year-1] | [Current] | Trend |
|--------|----------|----------|-----------|-------|
| [Indicator A] | [X] | [Y] | [Z] | ▲/▼ |
| [Indicator B] | [X] | [Y] | [Z] | ▲/▼ |
| [Indicator C] | $[X] | $[Y] | $[Z] | ▲/▼ |

On the surface, these numbers suggest [apparent conclusion]. A closer look reveals [deeper truth].

## Why the conventional approach fails

The standard response to [issue] involves three assumptions:

**Assumption one:** [Description]. The evidence: [counter-evidence].

**Assumption two:** [Description]. The evidence: [counter-evidence].

**Assumption three:** [Description]. The evidence: [counter-evidence].

Each of these is not just wrong — they are wrong in ways that make the problem worse.

## A different path

The countries/companies that are succeeding at [issue] share three characteristics:

1. **They prioritise [X] over [Y].** [Explanation with example.]
2. **They measure [metric] instead of [vanity metric].** [Explanation.]
3. **They accept [short-term cost] for [long-term gain].** [Explanation.]

> *"[Quote from a credible source that encapsulates the alternative approach.]"*

## The political economy

None of this is purely technical. [Issue] is tangled up in [political/economic factors].

[Analysis of the political landscape, stakeholders, and incentives.]

The result is [current stalemate or situation].

## What should happen

- **Short term (next 12 months):** [Specific recommendation]
- **Medium term (1-5 years):** [Specific recommendation]
- **Long term (5+ years):** [Specific recommendation]

Each of these is politically difficult but technically straightforward. The obstacle is not knowledge — it is will.

## The bottom line

[Issue] will not be solved by [magical thinking]. It will be solved by [hard, specific work]. The blueprint exists. What is missing is [key missing ingredient].`,
    tags: ['Analysis', 'Policy', 'Data-Driven', 'Economist Style'],
    excerpt: 'Data-rich policy analysis with structured argument, evidence tables, and actionable recommendations across three time horizons.',
  },
  {
    id: 'profile-interview',
    name: 'Profile / Q&A',
    description: 'In-depth personal profile with interview excerpts, biographical narrative, and character texture.',
    category: 'Editorial',
    icon: '🎙️',
    title: 'The Mind of [Name]: [Occupation] on [Topic], [Topic], and the Future of [Field]',
    content: `## The room

[B]The first impression of [Name] is not what you expect.[/B] Instead of [stereotype], you find [specific detail]. The office/studio/home is [description that reveals character]. A [specific object] sits on the [location], a reminder of [meaningful backstory].

[Name], [age], is [occupation/role] — which is a polite way of saying [what they actually do]. Over the course of [timeframe], they have [key achievement], [key achievement], and [key achievement].

We sat down in [location] to discuss [topic], [topic], and what they think most people get wrong about [field].

## The conversation

**On how they started:**

> *"[Quote that reveals origin story and motivation.]"*

[Context and analysis of the quote.]

**On the biggest misconception about their work:**

> *"[Quote that challenges conventional wisdom.]"*

[Context.]

**On failure:**

> *"[Quote that reveals vulnerability or lesson learned.]"*

[Context.]

**On what they learned from [pivotal moment]:**

> *"[Quote.]"*

[Context.]

## The method

| Aspect | Approach |
|--------|----------|
| Morning routine | [Detail] |
| Decision framework | [Detail] |
| Information diet | [Detail] |
| How they hire | [Detail] |
| What they read | [Detail] |

## The unguarded moment

It comes near the end of our conversation. [Name] pauses, looks away, and says something that reveals the person behind the public image.

> *"[Quote that is personal, unexpected, or vulnerable.]"*

This is the part that will not make the headline. It is also the part that matters most.

## What is next

[Name] is working on [upcoming project]. If it works, it will [impact]. If it fails, [consequences].

Either way, [Name] will keep going. Because that is what [occupation] do.`,
    tags: ['Profile', 'Interview', 'Q&A', 'People'],
    excerpt: 'An intimate profile woven with interview excerpts, biographical detail, and the texture of a remarkable career.',
  },
  {
    id: 'op-ed',
    name: 'Op-Ed / Argument',
    description: 'A clear, forceful argument with a bold thesis and rigorous supporting logic.',
    category: 'Editorial',
    icon: '⚡',
    title: 'I Spent [X Years] in [Industry]. Here Is Why [Common Belief] Is Wrong.',
    content: `## The thesis

[B]There is a problem with how we talk about [topic], and it starts with a single assumption that nearly everyone gets wrong.[/B]

[2-3 sentences establishing the author's credibility and why they are qualified to make this argument.]

## What everyone else is saying

The conventional wisdom on [topic] goes like this:

*"[Brief summary of the dominant narrative.]"*

It sounds reasonable. It gets repeated by [authority figures/institutions]. It has become the default position in every [relevant forum].

It is also, in crucial respects, wrong.

## Where the consensus breaks down

The standard account fails on three points:

**First, it assumes [incorrect premise].** [2-3 sentences of counter-evidence.]

**Second, it ignores [critical factor].** [2-3 sentences explaining what is missing and why it matters.]

**Third, it draws the wrong conclusion from [data/event].** [2-3 sentences of re-interpretation.]

> *"A lie can travel halfway around the world while the truth is still putting on its shoes."*

## What the evidence actually shows

Let us look at what we know, setting aside what we assume.

| Claim | Common Belief | Evidence |
|-------|---------------|----------|
| [Claim A] | [Belief] | [Evidence] |
| [Claim B] | [Belief] | [Evidence] |
| [Claim C] | [Belief] | [Evidence] |

The pattern is unmistakable. When you actually examine the data, [alternative conclusion] emerges.

## A better framework

Instead of [prevailing framework], we should think about [topic] differently:

1. **Start with [different premise].** [Explanation.]
2. **Measure [different metric].** [Explanation.]
3. **Ask [different question].** [Explanation.]

This framework explains [phenomenon A], [phenomenon B], and [phenomenon C] — which the old framework could not.

## What this means for you

If you work in [field], this shift has practical implications:

- **If you are a [role]:** [Specific implication.]
- **If you are a [role]:** [Specific implication.]
- **If you are a [role]:** [Specific implication.]

## The last word

Changing how we think about [topic] is uncomfortable. It means admitting that [uncomfortable truth]. But the alternative — continuing to operate on a flawed understanding — is worse.

The evidence is in front of us. The question is whether we are willing to see it.`,
    tags: ['Opinion', 'Op-Ed', 'Argument', 'Thought Leadership'],
    excerpt: 'A forceful, evidence-driven argument that challenges a widely held belief with data, logic, and practical alternatives.',
  },
  {
    id: 'sunday-read',
    name: 'Sunday Read / Narrative',
    description: 'Meditative long-form narrative that unfolds slowly, rich with scene and detail.',
    category: 'Editorial',
    icon: '☕',
    title: 'The Last Days of [Place/Thing]: A Dispatch from [Location]',
    content: `[Location] is not the kind of place you find by accident. You have to want to get there — or be desperate enough that the usual options have closed.

The road winds past [landmark], then [landmark], until the asphalt gives way to gravel, and the gravel gives way to dirt. At the end, there is [specific place].

[Name] has been coming here for [number] years. They remember when [description of past]. Now, [description of present].

## Morning

The day begins at [time], when [sensory detail — light, sound, smell]. [Name] moves through their routine with the precision of someone who has done it ten thousand times.

[Specific detail of morning routine, with dialogue or observation.]

> *"You know what I miss?"* [Name] says, not waiting for an answer. *"[Quote that reveals character and theme.]"*

## Midday

By noon, [specific development]. The light shifts, and with it, the mood.

[Scene with descriptive detail, dialogue, and reflection.]

The numbers tell part of the story:

| Then | Now |
|------|-----|
| [Detail] | [Detail] |
| [Detail] | [Detail] |
| [Detail] | [Detail] |

But numbers never tell the whole story.

## Afternoon

[Specific encounter or event that reveals the central tension of the piece.]

[Name] talks about [topic] with [emotion]. *"[Quote.]"*

This is the heart of it. Everything else — the politics, the economics, the headlines — is noise.

## Evening

As the light fades, [closing scene that resonates with the opening].

[Name] locks up, checks [specific thing] one last time, and walks away. Tomorrow will be the same. Or it will be different. That is the thing about [place/thing]: you never quite know which.

On the drive back, [reflective closing observation]. The road disappears in the rearview mirror.`,
    tags: ['Narrative', 'Long-Form', 'Scene', 'Dispatch'],
    excerpt: 'A meditative, scene-rich narrative dispatch that unfolds over a single day in a remarkable place.',
  },
  {
    id: 'explainer',
    name: 'The Explainer',
    description: 'Clear, jargon-free explanation of a complex topic. Assume the reader knows nothing.',
    category: 'Educational',
    icon: '💡',
    title: '[Topic], Explained: What It Is, Why It Matters, and What Comes Next',
    content: `## What is [topic]?

In the simplest terms: [one-sentence definition that a 12-year-old could understand].

More precisely, it is [slightly more technical definition]. But the core idea is surprisingly simple once you strip away the jargon.

## Why now?

[Topic] has been around for [timeframe], but three things have changed recently:

1. **[Development A]** — [What happened and why it matters.]
2. **[Development B]** — [What happened and why it matters.]
3. **[Development C]** — [What happened and why it matters.]

These converging forces have pushed [topic] from [previous status] to [current status].

## How it works

If you were to explain [topic] on a napkin, it would look like this:

**Step 1:** [Core mechanism — one sentence.]

**Step 2:** [Core mechanism.]

**Step 3:** [Core mechanism.]

That is the basic version. The actual implementation is more complex, but the underlying logic is the same.

## What people get wrong

| Common Misconception | What Is Actually True |
|---------------------|----------------------|
| [Misconception A] | [Truth] |
| [Misconception B] | [Truth] |
| [Misconception C] | [Truth] |

The confusion is understandable. [Topic] involves [complex factor], and the terminology is [problematic]. But the fundamentals are accessible to anyone willing to spend 15 minutes with the material.

## Why it matters (to you)

**If you are a consumer:** [Specific implication.]

**If you are a professional in [field]:** [Specific implication.]

**If you are a policymaker:** [Specific implication.]

## What is next

Over the next [timeframe], expect to see:

- **[Prediction A]** — [Reasoning.]
- **[Prediction B]** — [Reasoning.]
- **[Prediction C]** — [Reasoning.]

## The bottom line

[Topic] is not as complicated as it seems. The basics can be understood in an afternoon. The nuances take longer, but you do not need the nuances to understand what is happening and why it matters.

[One-sentence closing that gives the reader confidence they now understand the topic.]`,
    tags: ['Explainer', 'Beginner-Friendly', 'Educational'],
    excerpt: 'A clear, jargon-free breakdown of a complex topic, from first principles to future implications.',
  },
  {
    id: 'culture-review',
    name: 'Culture Review',
    description: 'Critical review of a book, film, album, exhibition, or cultural phenomenon.',
    category: 'Reviews',
    icon: '🎭',
    title: 'In [Work Title], [Creator] Confronts [Theme] With [Approach]',
    content: `## The context

[Creator] has spent their career exploring [thematic territory]. Their latest work — [type of work], titled "[Title]" — arrives at a moment when [cultural context].

The timing feels intentional. [Explanation of why this work matters now.]

## What it is

[2-3 paragraphs describing the work without spoilers — plot, form, style, ambition.]

The opening [scene/chapter/movement] establishes [tone and approach]. From there, the work [structural description].

## What works

### ✅ [Strength 1]
[B]What stands out immediately is [specific element].[/B] [Detailed analysis with specific examples.]

### ✅ [Strength 2]
[Detailed analysis.]

### ✅ [Strength 3]
[Detailed analysis.]

## What does not

### ❌ [Weakness 1]
[Honest critique with specific evidence.]

### ❌ [Weakness 2]
[Honest critique.]

## The critical comparison

| Aspect | This Work | [Previous Work by Creator] | [Peer's Comparable Work] |
|--------|-----------|---------------------------|--------------------------|
| Ambition | [Rating/Note] | [Rating/Note] | [Rating/Note] |
| Execution | [Rating/Note] | [Rating/Note] | [Rating/Note] |
| Emotional Impact | [Rating/Note] | [Rating/Note] | [Rating/Note] |
| **Overall** | **[Score]** | **[Score]** | **[Score]** |

## Who it is for

- **See it if you like:** [Comparable works or artists.]
- **Skip it if:** [Honest gatekeeping.]
- **Best enjoyed:** [Context — alone, with friends, late at night, etc.]

## The verdict

[Title] is [overall assessment]. It [succeeds/fails] at [key ambition], but [redeeming quality]. For fans of [creator], it is [recommendation]. For newcomers, [recommendation].

**[Rating system — stars/grade/score]**

*[Title] is [available/releasing] on [platform/date].*`,
    tags: ['Review', 'Culture', 'Arts', 'Criticism'],
    excerpt: 'A rigorous critical review with specific analysis, comparison table, and clear recommendations for different audiences.',
  },
  {
    id: 'data-story',
    name: 'Data Story / Visual Essay',
    description: 'A story told through data points, charts, and evidence, with minimal prose.',
    category: 'Editorial',
    icon: '📈',
    title: 'What the Numbers Tell Us About [Topic]: [Number] Charts That Change Everything',
    content: `## The headline

The story of [topic] in [year] can be told through [number] key data points. Each one challenges a common belief.

## Chart 1: The big picture

| Year | [Metric A] | [Metric B] | [Metric C] |
|------|-----------|-----------|-----------|
| [Y-4] | [X] | [X] | [X] |
| [Y-3] | [X] | [X] | [X] |
| [Y-2] | [X] | [X] | [X] |
| [Y-1] | [X] | [X] | [X] |
| [Current] | [X] | [X] | [X] |

**What to look for:** [Key insight from the data.]

**Why it matters:** [Implication.]

## Chart 2: The breakdown

| Segment | Share (%) | Change (YoY) |
|---------|-----------|--------------|
| [Segment A] | [X]% | [+/- X]% |
| [Segment B] | [X]% | [+/- X]% |
| [Segment C] | [X]% | [+/- X]% |
| [Segment D] | [X]% | [+/- X]% |

**What to look for:** [Key insight.]

**Why it matters:** [Implication.]

## Chart 3: The comparison

[Topic] is often compared to [related topic]. The data reveals a more nuanced picture:

> *"On [metric], [topic] outperforms [related] by [X]%. But on [metric], the gap reverses."*

## Chart 4: The trend that matters most

If you look at only one chart, make it this one. [Description of the most important data point.]

[Data table or description of the key trend.]

**The takeaway:** [One-sentence summary of the most important insight.]

## What the numbers do not show

Data has blind spots. [Context that the numbers miss.]

## The bottom line

| Claim | Supported by data? | Evidence |
|-------|-------------------|----------|
| [Claim A] | ✅/❌ | [Brief evidence] |
| [Claim B] | ✅/❌ | [Brief evidence] |
| [Claim C] | ✅/❌ | [Brief evidence] |

The numbers do not lie — but they do not speak for themselves either. The story they tell is [summary insight].`,
    tags: ['Data', 'Visual', 'Analysis', 'Charts'],
    excerpt: 'A story driven by data tables and evidence, challenging common beliefs with hard numbers and clear takeaways.',
  },
  {
    id: 'first-person',
    name: 'First Person / Memoir',
    description: 'Personal narrative with emotional arc, reflective insight, and universal resonance.',
    category: 'Personal',
    icon: '✍️',
    title: 'The Year I Stopped [Doing X] and Started [Doing Y]',
    content: `I did not plan to [life-changing decision]. It happened the way most important things do: gradually, then suddenly.

The catalyst was [specific moment]. Unremarkable in isolation. But something about it — the [specific sensory detail], the [specific feeling] — cracked something open.

## Before

For [timeframe], I had been [old pattern]. It worked, in the sense that [superficial success]. But beneath the surface, [underlying problem].

> *"I kept waiting for someone to tell me to stop. No one did. So I kept going."*

[Specific anecdote illustrating the old pattern and its costs.]

## The crack

[Specific event that forced change.]

I remember [sensory detail of that moment]. The way [detail]. The feeling of [emotion].

This is the part of the story where, in a conventional narrative, the protagonist has a moment of clarity and everything changes. Real life does not work that way.

## The unraveling

What actually happened was messier. [Description of the uncertain period — false starts, setbacks, doubts.]

- **[Month 1-3]:** [What happened.]
- **[Month 4-6]:** [What happened.]
- **[Month 7-9]:** [What happened.]

There was no single breakthrough. Just a thousand small decisions, each one nudging the trajectory.

## The arrival

At some point — I cannot pinpoint exactly when — the new pattern became the default. [Description of the new state.]

The surprising thing was not how different everything looked. It was how natural it felt.

## What I learned

1. **[Lesson 1]** — [Specific insight, not platitude.]
2. **[Lesson 2]** — [Specific insight.]
3. **[Lesson 3]** — [Specific insight.]

## After

I still [old behavior sometimes]. But now I notice when I am doing it. And that changes everything.

Last week, [specific moment that showed how far I have come]. I did not celebrate. I just noticed. And kept going.

That, I have learned, is how real change happens. Not in a blaze of transformation, but in the quiet accumulation of small, intentional choices.`,
    tags: ['Personal', 'Memoir', 'Narrative', 'Reflection'],
    excerpt: 'A deeply personal narrative about change, with honest reflection on the messiness of real transformation.',
  },
  {
    id: 'investigation',
    name: 'Investigation / Report',
    description: 'Evidence-driven investigative piece with source attribution, timeline, and findings.',
    category: 'Professional',
    icon: '🔍',
    title: 'Inside the [Industry/Organization]: [Revelation] That [Stakeholders] Did Not Want You to See',
    content: `## Key findings

- **[Finding 1]:** [One-sentence summary of evidence.]
- **[Finding 2]:** [One-sentence summary.]
- **[Finding 3]:** [One-sentence summary.]

This investigation is based on [source count] interviews, [document count] internal documents, and [timeframe] of reporting.

## Methodology

[How the investigation was conducted — sources, documents, data analysis, verification process.]

## The evidence

### Document 1: [Title/Description]

[Summary of what the document reveals, with relevant quotes or data.]

### Document 2: [Title/Description]

[Summary.]

### Interview: [Source Description]

> *"[Quote from source that reveals key information]"*
> — [Source attribution]

## Timeline of events

| Date | Event | Evidence |
|------|-------|----------|
| [Date] | [Event] | [Source] |
| [Date] | [Event] | [Source] |
| [Date] | [Event] | [Source] |
| [Date] | [Event] | [Source] |

## The response

[Name of subject] was contacted for comment. Their response: [quote or summary of response].

[Analysis of the response — what it addresses, what it avoids.]

## Implications

- **[Impact A]:** [Description.]
- **[Impact B]:** [Description.]
- **[Impact C]:** [Description.]

## What happens next

[Future developments — regulatory, legal, industry repercussions.]

## Methodology and disclosures

[Transparency about reporting process, conflicts of interest, corrections policy.]

*This article has been fact-checked and reviewed by [editor/lawyer]. [Date of last update.]*`,
    tags: ['Investigation', 'Reporting', 'Evidence', 'Accountability'],
    excerpt: 'A rigorously sourced investigative report with documentary evidence, interviews, timeline, and clear findings.',
  },
  {
    id: 'column',
    name: 'Column / Regular Feature',
    description: 'A recurring personal column with a distinctive voice, sharp opinions, and conversational intimacy.',
    category: 'Editorial',
    icon: '📝',
    title: '[Column Name]: [This Week\'s Hook or Observation]',
    content: `Something happened this week that I cannot stop thinking about.

It was not the big story — the one every news alert was screaming about. It was the small one. The detail that everyone else walked past.

[Specific scene or anecdote from the week.]

## What it made me think about

That detail, tiny as it was, connects to something larger. [Broader observation or argument.]

Here is the thing about [topic]: [Insight that challenges or reframes.]

## A brief digression

This reminds me of [personal anecdote, historical parallel, or cultural reference].

[2-3 paragraphs of the digression, which is not a digression at all — it is the point.]

## Back to the main thread

Where were we? Right — [topic].

The thing that frustrates me about the coverage of [topic] is [specific frustration]. Everyone is focused on [surface-level aspect], while [deeper aspect] goes entirely unmentioned.

## The part nobody will say out loud

[Uncomfortable or contrarian take.]

I know this is not a popular position. But someone has to say it, and it might as well be me.

## A closing thought

[Personal, slightly vulnerable reflection that ties back to the opening anecdote.]

That is it for this week. See you next [day].

*[Sign-off — personal, warm, consistent with the column's voice.]*`,
    tags: ['Column', 'Personal', 'Opinion', 'Weekly'],
    excerpt: 'A sharp, conversational column that connects a small observation to a larger argument, with digressions and personality.',
  },
  {
    id: 'letters',
    name: 'Letters / Reader Forum',
    description: 'Curated reader responses with editorial framing and author replies.',
    category: 'Engagement',
    icon: '💬',
    title: 'Readers Respond: [Topic That Provoked Discussion]',
    content: `*Last week, we published [article title], in which the author argued that [thesis]. Readers responded with [number] letters — the most we have received on any topic this [month/quarter]. Below is a selection, edited for length and clarity.*

## The case for

**Letter 1: [Subject line]**

> *"[Reader quote making a supporting argument or adding nuance.]"*
>
> — [Name], [Location]

**Author responds:** *"[Brief response from original author.]"*

**Letter 2: [Subject line]**

> *"[Reader quote.]"*
>
> — [Name], [Location]

**Author responds:** *"[Brief response.]"*

## The case against

**Letter 3: [Subject line]**

> *"[Reader quote making a counter-argument.]"*
>
> — [Name], [Location]

**Author responds:** *"[Brief response — should engage seriously with the critique.]"*

**Letter 4: [Subject line]**

> *"[Reader quote.]"*
>
> — [Name], [Location]

**Author responds:** *"[Brief response.]"*

## The nuance

**Letter 5: [Subject line]**

> *"[Reader quote that adds complexity or a perspective the article missed.]"*
>
> — [Name], [Location]

**Author responds:** *"[Brief response — ideally acknowledging the point.]"*

## The editor's note

*[Reflection on the conversation — what the response reveals about the moment we are in.]*

*We welcome letters at [email]. Submissions may be edited for length and clarity.*`,
    tags: ['Letters', 'Community', 'Discussion', 'Dialogue'],
    excerpt: 'A curated selection of reader responses to a controversial piece, with author replies and editorial framing.',
  },
  {
    id: 'year-in-review',
    name: 'Year in Review',
    description: 'Retrospective analysis of the past year with categories, winners/losers, and looking ahead.',
    category: 'Editorial',
    icon: '📅',
    title: '[Year] in Review: The Stories That Defined [Industry/World]',
    content: `## The year in one sentence

[Year] was the year [one-sentence summary of the defining characteristic].

## The big story

No single event shaped the year more than [defining event].

[2-3 paragraphs of analysis — what happened, why it happened, what it meant.]

## By the numbers

| Metric | [Previous Year] | [This Year] | Change |
|--------|----------------|-------------|--------|
| [Metric A] | [X] | [Y] | +/- [Z]% |
| [Metric B] | [X] | [Y] | +/- [Z]% |
| [Metric C] | $[X] | $[Y] | +/- [Z]% |

## The winners

- **[Entity A]:** [Why they had a good year.]
- **[Entity B]:** [Why they had a good year.]
- **[Entity C]:** [Why they had a good year.]

## The losers

- **[Entity A]:** [Why they had a bad year.]
- **[Entity B]:** [Why they had a bad year.]
- **[Entity C]:** [Why they had a bad year.]

## The trend that matters

[Beneath the headlines, the most important development was [quiet but significant trend].]

[Analysis of the trend and its implications.]

## Moments we will remember

1. **[Moment 1]** — [Why it mattered.]
2. **[Moment 2]** — [Why it mattered.]
3. **[Moment 3]** — [Why it mattered.]
4. **[Moment 4]** — [Why it mattered.]
5. **[Moment 5]** — [Why it mattered.]

## Looking ahead to [Next Year]

- **[Prediction 1]:** [Reasoning.]
- **[Prediction 2]:** [Reasoning.]
- **[Prediction 3]:** [Reasoning.]

## Final reflection

[Closing thought that captures the mood and meaning of the year.]`,
    tags: ['Review', 'Year-End', 'Retrospective', 'Trends'],
    excerpt: 'A comprehensive year-end retrospective with data, winners and losers, memorable moments, and predictions.',
  },
  {
    id: 'debate',
    name: 'Debate / Point-Counterpoint',
    description: 'Two opposing views on a contentious topic, presented side by side with a moderator frame.',
    category: 'Engagement',
    icon: '⚖️',
    title: 'The Great Debate: Is [Topic] [Framing A] or [Framing B]?',
    content: `## The question

[B]Is [topic] [side A's framing], or is it [side B's framing]?[/B]

We asked two experts with opposing views to make their case.

---

## YES: [Side A's Position]

**By [Name], [Title/Affiliation]**

[2-3 paragraphs of the argument for Side A.]

> *"[Strong quote that encapsulates Side A's position.]"*

### The evidence

1. **[Point A1]:** [Evidence and reasoning.]
2. **[Point A2]:** [Evidence and reasoning.]
3. **[Point A3]:** [Evidence and reasoning.]

### The rebuttal to Side B

The other side will argue [anticipate counter-argument]. Here is why that misses the point: [rebuttal].

---

## NO: [Side B's Position]

**By [Name], [Title/Affiliation]**

[2-3 paragraphs of the argument for Side B.]

> *"[Strong quote that encapsulates Side B's position.]"*

### The evidence

1. **[Point B1]:** [Evidence and reasoning.]
2. **[Point B2]:** [Evidence and reasoning.]
3. **[Point B3]:** [Evidence and reasoning.]

### The rebuttal to Side A

The other side claims [anticipate counter-argument]. But [rebuttal].

---

## The moderator's take

Both sides make valid points. Where they converge is [area of agreement]. Where they diverge is [key disagreement].

The evidence leans [direction], but the uncertainty is genuine.

## Where the reader can go deeper

- **[Resource A]** — [Description]
- **[Resource B]** — [Description]
- **[Resource C]** — [Description]

---

*This debate was conducted independently. The views expressed are those of the individual contributors and do not necessarily reflect the position of our publication.*`,
    tags: ['Debate', 'Point-Counterpoint', 'Diverse Views'],
    excerpt: 'Two opposing perspectives on a contentious issue, with structured arguments, rebuttals, and a moderator analysis.',
  },
  {
    id: 'photo-essay',
    name: 'Photo Essay',
    description: 'Image-led story with captions and minimal text. Each image advances the narrative.',
    category: 'Editorial',
    icon: '📷',
    title: '[Place/Subject] in [Number] Frames: A Visual Journey Through [Topic]',
    content: `*Words by [Name] · Photographs by [Name]*

[Introductory paragraph setting the scene — where, when, why.]

---

## Frame 1: [Title/Caption]

*[Caption describing the image — what is happening, who is in it, why it matters.]*

[Optional 1-2 paragraph context for this image.]

---

## Frame 2: [Title/Caption]

*[Caption describing the image.]*

[Optional context.]

---

## Frame 3: [Title/Caption]

*[Caption describing the image.]*

[Optional context.]

---

## Frame 4: [Title/Caption]

*[Caption describing the image.]*

[Optional context.]

---

## Frame 5: [Title/Caption]

*[Caption describing the image.]*

[Optional context.]

---

## Frame 6: [Title/Caption]

*[Caption describing the image.]*

[Optional context.]

---

## The story behind the story

[Closing note about the making of the essay — what the photographer experienced, what the camera did not capture.]

*All photographs © [Year] [Photographer Name].*`,
    tags: ['Photo Essay', 'Visual', 'Photography', 'Images'],
    excerpt: 'An image-led narrative where each photograph advances the story, supported by captions and minimal text.',
  },
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
- **If budget is a concern:** [Tool Z] offers 80% of the features for free.`,
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

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| [Metric A] | [X] | [Y] | **[+Z]%** |
| [Metric B] | [X] | [Y] | **[+Z]%** |
| [Metric C] | $[X] | $[Y] | **[+Z]%** |

Beyond the metrics, [qualitative outcome].

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
[Honest explanation of what falls short and in what circumstances.]

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
