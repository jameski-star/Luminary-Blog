import { useState } from 'react';
import { useApp } from '../context/AppContext';
import SEO from '../components/SEO';
import { executeAutopostPipeline } from '../services/geminiPipeline';
import { api, isApiMode } from '../services/api';
import type { PipelineStage, PipelineResult } from '../types';
import { generateSlug, calcReadTime } from '../store/appStore';
import { detectRogueContent } from '../utils/contentDetection';
import { friendlyError } from '../utils/errors';
import type { BlogPost } from '../types';
import {
  Zap, Key, X, CheckCircle, AlertTriangle, Clock, Plus,
  Eye, Save, Send, ChevronDown, ChevronUp, Info
} from 'lucide-react';
import { marked } from 'marked';

export default function AutoPostPage() {
  const { user, geminiKey, setGeminiKey, addPost, setCurrentPage, setSelectedPostId } = useApp();

  // Key management
  const [keyInput, setKeyInput] = useState(geminiKey);
  const [keyVisible, setKeyVisible] = useState(false);
  const [keySaved, setKeySaved] = useState(!!geminiKey);

  // Pipeline inputs
  const [topic, setTopic] = useState('');
  const [keywordInput, setKeywordInput] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);

  // Pipeline state
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<(PipelineResult & { excerpt?: string; tags?: string[] }) | null>(null);
  const [error, setError] = useState('');

  // Preview
  const [previewOpen, setPreviewOpen] = useState(false);
  const [outlineOpen, setOutlineOpen] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);

  // Rogue detection on AI-generated content
  const rogueWarning = result && !running ? detectRogueContent(result.content) : null;

  if (!user) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center pt-16 px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-primary mb-3">Sign in required</h2>
          <p className="text-secondary mb-6">You need an account to use AutoPost AI.</p>
          <button onClick={() => setCurrentPage('login')} className="bg-primary text-canvas font-semibold px-6 py-3 rounded-xl hover:bg-white transition-colors">
            Sign In
          </button>
        </div>
      </div>
    );
  }

  const saveKey = () => {
    if (!keyInput.trim()) return;
    setGeminiKey(keyInput.trim());
    setKeySaved(true);
  };

  const addKeyword = () => {
    const kw = keywordInput.trim();
    if (kw && !keywords.includes(kw) && keywords.length < 8) {
      setKeywords([...keywords, kw]);
      setKeywordInput('');
    }
  };

  const removeKeyword = (kw: string) => setKeywords(keywords.filter(k => k !== kw));

  const runPipeline = async () => {
    if (!isApiMode() && !geminiKey) { setError('Please save your Gemini API key first.'); return; }
    if (!topic.trim()) { setError('Please enter a topic.'); return; }
    if (keywords.length === 0) { setError('Add at least one target keyword.'); return; }

    setError('');
    setResult(null);
    setRunning(true);
    setStages([
      { name: 'Drafting Deep-Dive Content', status: 'pending' },
      { name: 'Authenticity & Fact-Check Audit', status: 'pending' },
      { name: 'Polishing for Human Cadence', status: 'pending' },
    ]);

    try {
      let pipelineResult;

      if (isApiMode()) {
        setStages([
          { name: 'Drafting Deep-Dive Content', status: 'running' },
          { name: 'Authenticity & Fact-Check Audit', status: 'pending' },
          { name: 'Polishing for Human Cadence', status: 'pending' },
        ]);
        pipelineResult = await api.gemini.pipeline({ topic: topic.trim(), keywords });
        setStages([
          { name: 'Drafting Deep-Dive Content', status: 'done' },
          { name: 'Authenticity & Fact-Check Audit', status: 'done' },
          { name: 'Polishing for Human Cadence', status: 'done' },
        ]);
      } else {
        pipelineResult = await executeAutopostPipeline(
          topic.trim(),
          keywords,
          geminiKey,
          (updatedStages) => setStages(updatedStages)
        );
      }

      setResult(pipelineResult as PipelineResult & { excerpt?: string; tags?: string[] });
    } catch (err: unknown) {
      setError(friendlyError(err));
    } finally {
      setRunning(false);
    }
  };

  const publishPost = () => {
    if (!result || result.status !== 'ready_to_publish') return;

    const slug = generateSlug(result.title);
    const now = new Date().toISOString();
    const r = result as PipelineResult & { excerpt?: string; tags?: string[] };

    const rogue = detectRogueContent(r.content);
    const effectiveStatus = rogue.isRogue ? 'review' : 'published';

    const isApproved = effectiveStatus === 'published' && !rogue.isRogue && (result.audit?.score || 0) >= 65;

    const post: BlogPost = {
      id: `post_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      title: result.title,
      slug,
      excerpt: r.excerpt || result.content.slice(0, 160).replace(/[#*]/g, '').trim(),
      content: result.content,
      tags: r.tags || keywords.slice(0, 4),
      keywords: keywords,
      authorId: user.id,
      authorName: user.name,
      publishedAt: now,
      modifiedAt: now,
      status: effectiveStatus,
      readTime: calcReadTime(result.content),
      views: 0,
      likes: 0,
      auditScore: result.audit?.score,
      wordCount: result.content.split(/\s+/).length,
      isApproved,
    };

    addPost(post);
    setSelectedPostId(post.id);
    setCurrentPage(rogue.isRogue ? 'dashboard' : 'post');
  };

  const saveDraft = () => {
    if (!result) return;
    const slug = generateSlug(result.title);
    const now = new Date().toISOString();
    const r = result as PipelineResult & { excerpt?: string; tags?: string[] };

    const rogue = detectRogueContent(r.content);
    const effectiveStatus = result.status === 'quarantined' || rogue.isRogue ? 'review' : 'draft';

    const post: BlogPost = {
      id: `post_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      title: result.title,
      slug,
      excerpt: r.excerpt || result.content.slice(0, 160).replace(/[#*]/g, '').trim(),
      content: result.content,
      tags: r.tags || keywords.slice(0, 4),
      keywords: keywords,
      authorId: user.id,
      authorName: user.name,
      publishedAt: now,
      modifiedAt: now,
      status: effectiveStatus,
      readTime: calcReadTime(result.content),
      views: 0,
      likes: 0,
      auditScore: result.audit?.score,
      wordCount: result.content.split(/\s+/).length,
    };

    addPost(post);
    setCurrentPage('dashboard');
  };

  return (
    <div className="min-h-screen bg-canvas pt-20">
      <SEO title="AutoPost AI" description="Generate articles with the 3-stage Gemini AI pipeline." noindex />
      <div className="max-w-4xl mx-auto px-4 py-6 md:py-10">

        {/* Header */}
        <div className="mb-6 md:mb-10">
          <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
            <div className="w-8 md:w-10 h-8 md:h-10 rounded-lg md:rounded-xl bg-raised border border-muted flex items-center justify-center">
              <Zap size={16} className="text-primary" />
            </div>
            <div>
              <h1 className="font-heading text-xl md:text-3xl font-bold text-primary">AutoPost AI</h1>
              <p className="text-[10px] md:text-sm text-secondary">3-Stage Gemini Validation Pipeline</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1.5 md:gap-3 mt-3 md:mt-6">
            {['Stage 1: Deep Draft', 'Stage 2: Fact-Check', 'Stage 3: Polish'].map((s, i) => (
              <div key={i} className="text-center rounded-lg md:rounded-xl border border-border bg-surface p-1.5 md:p-3">
                <p className="text-[8px] md:text-xs text-secondary">{s}</p>
              </div>
            ))}
          </div>
        </div>

        {/* API Key Section — only shown in local mode (no backend); server has its own key */}
        {!isApiMode() && (
          <div className="rounded-xl md:rounded-2xl border border-border bg-surface p-3 md:p-6 mb-4 md:mb-6">
            <h2 className="text-xs md:text-sm font-semibold text-primary mb-0.5 md:mb-1 flex items-center gap-1 md:gap-2">
              <Key size={12} className="text-secondary" />
              Gemini API Key
            </h2>
            <p className="text-[10px] md:text-xs text-secondary mb-3 md:mb-4">
              Get your free key at <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">aistudio.google.com</a>.
            </p>

            <div className="flex gap-2 md:gap-3">
              <div className="relative flex-1">
                <input
                  type={keyVisible ? 'text' : 'password'}
                  value={keyInput}
                  onChange={e => { setKeyInput(e.target.value); setKeySaved(false); }}
                  placeholder="AIza..."
                  className="w-full bg-canvas border border-border rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-3 text-primary text-[10px] md:text-sm outline-none focus:border-primary/60 transition-colors pr-8 md:pr-10 font-mono placeholder-secondary/50"
                />
                <button
                  type="button"
                  onClick={() => setKeyVisible(!keyVisible)}
                  className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-primary"
                >
                  <Eye size={12} />
                </button>
              </div>
              <button
                onClick={saveKey}
                className={`px-3 md:px-5 py-2 md:py-3 rounded-lg md:rounded-xl text-[10px] md:text-sm font-medium transition-all whitespace-nowrap ${keySaved ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-primary text-canvas hover:bg-white'}`}
              >
                {keySaved ? <><CheckCircle size={12} className="inline mr-1" />Saved</> : 'Save Key'}
              </button>
            </div>
          </div>
        )}

        {/* Pipeline Inputs */}
        <div className="rounded-xl md:rounded-2xl border border-border bg-surface p-3 md:p-6 mb-4 md:mb-6">
          <h2 className="text-xs md:text-sm font-semibold text-primary mb-3 md:mb-5">Article Configuration</h2>

          {/* Topic */}
          <div className="mb-3 md:mb-5">
            <label className="block text-[10px] md:text-xs font-medium text-secondary mb-1 md:mb-2 uppercase tracking-wider">
              Article Topic / Title
            </label>
            <input
              type="text"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="e.g. Why Monolithic Architectures Are Returning to Enterprise Tech"
              className="w-full bg-canvas border border-border rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-3 text-primary text-[10px] md:text-sm outline-none focus:border-primary/60 transition-colors placeholder-secondary/50"
            />
          </div>

          {/* Keywords */}
          <div>
              <label className="block text-[10px] md:text-xs font-medium text-secondary mb-1 md:mb-2 uppercase tracking-wider">
                Target Keywords ({keywords.length}/8)
              </label>
            <div className="flex gap-1.5 md:gap-2 mb-2 md:mb-3">
              <input
                type="text"
                value={keywordInput}
                onChange={e => setKeywordInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addKeyword(); } }}
                placeholder="Add keyword and press Enter…"
                className="flex-1 bg-canvas border border-border rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-2.5 text-primary text-[10px] md:text-sm outline-none focus:border-primary/60 transition-colors placeholder-secondary/50"
              />
              <button
                onClick={addKeyword}
                className="px-3 md:px-4 py-2 md:py-2.5 bg-raised hover:bg-muted rounded-lg md:rounded-xl text-primary transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>
            {keywords.length > 0 && (
              <div className="flex flex-wrap gap-1.5 md:gap-2">
                {keywords.map(kw => (
                  <span key={kw} className="flex items-center gap-1 md:gap-1.5 text-[10px] md:text-xs px-1.5 md:px-3 py-0.5 md:py-1.5 rounded-full bg-raised text-secondary">
                    {kw}
                    <button onClick={() => removeKeyword(kw)} className="hover:text-red-400 transition-colors">
                      <X size={8} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="mt-3 md:mt-5 flex items-start gap-1.5 md:gap-2.5 bg-canvas rounded-lg md:rounded-xl p-2.5 md:p-4 border border-border">
            <Info size={12} className="text-secondary mt-0.5 shrink-0" />
            <p className="text-[10px] md:text-xs text-secondary leading-relaxed">
              The pipeline will run 3 sequential Gemini API calls. Average time: 2–5 minutes depending on article length. Content scoring below 65/100 is quarantined and routed to your draft queue instead of being published.
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 md:gap-3 p-3 md:p-4 rounded-xl md:rounded-2xl border border-border bg-surface mb-4 md:mb-6 text-[10px] md:text-sm">
            <AlertTriangle size={13} className="text-amber-400 shrink-0 mt-0.5" />
            <p className="text-secondary">{error}</p>
          </div>
        )}

        {/* Run Button */}
        {!running && !result && (
          <button
            onClick={runPipeline}
            disabled={(!isApiMode() && !geminiKey) || !topic || keywords.length === 0}
            className="w-full flex items-center justify-center gap-2 md:gap-3 bg-primary hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed text-canvas font-bold py-3 md:py-4 rounded-xl md:rounded-2xl transition-all duration-200 text-xs md:text-base"
          >
            <Zap size={16} />
            Execute AutoPost Pipeline
          </button>
        )}

        {/* Pipeline Progress */}
        {(running || stages.length > 0) && (
          <div className="rounded-xl md:rounded-2xl border border-border bg-surface p-3 md:p-6 mb-4 md:mb-6">
            <h2 className="text-xs md:text-sm font-semibold text-primary mb-3 md:mb-5 flex items-center gap-1 md:gap-2">
              {running ? (
                <><div className="w-2.5 md:w-3 h-2.5 md:h-3 rounded-full bg-primary animate-pulse" />Generating{running && stages.some(s => s.message?.includes('retrying')) ? ' (retrying…)' : '…'}</>
              ) : stages.some(s => s.status === 'error') ? (
                <><AlertTriangle size={12} className="text-red-400" />Pipeline Failed</>
              ) : (
                <><CheckCircle size={12} className="text-emerald-400" />Pipeline Complete</>
              )}
            </h2>

            <div className="space-y-2 md:space-y-3">
              {stages.map((stage, i) => (
                <div key={i} className="flex items-center gap-2 md:gap-4">
                  <div className={`w-6 md:w-8 h-6 md:h-8 rounded-full flex items-center justify-center text-[10px] md:text-sm transition-all shrink-0 ${
                    stage.status === 'done' ? 'bg-emerald-500/20 text-emerald-400'
                    : stage.status === 'running' ? 'bg-primary/20 text-primary'
                    : stage.status === 'error' ? 'bg-red-500/20 text-red-400'
                    : 'bg-raised text-secondary'
                  }`}>
                    {stage.status === 'done' ? '✓'
                     : stage.status === 'running' ? <Clock size={12} className="animate-spin" />
                     : stage.status === 'error' ? '✗'
                     : i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[10px] md:text-sm font-medium truncate ${
                      stage.status === 'done' ? 'text-primary'
                      : stage.status === 'running' ? 'text-primary'
                      : stage.status === 'error' ? 'text-red-400'
                      : 'text-secondary'
                    }`}>{stage.name}</p>
                    {stage.message && (
                      <p className="text-[9px] md:text-xs text-secondary mt-0.5 truncate">{stage.message}</p>
                    )}
                  </div>
                  {stage.status === 'running' && (
                    <div className="flex gap-0.5 md:gap-1">
                      {[0, 1, 2].map(i => (
                        <div key={i} className="w-1 md:w-1.5 h-1 md:h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Result Panel */}
        {result && !running && (
          <div className="space-y-3 md:space-y-4">
            {/* Status Banner */}
            <div className={`rounded-xl md:rounded-2xl border p-3 md:p-5 ${
              result.status === 'ready_to_publish' && !rogueWarning?.isRogue
                ? 'border-emerald-500/30 bg-emerald-500/10'
                : 'border-muted bg-surface'
            }`}>
              <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
                {result.status === 'ready_to_publish' && !rogueWarning?.isRogue
                  ? <CheckCircle size={16} className="text-emerald-400 shrink-0" />
                  : <AlertTriangle size={16} className="text-amber-400 shrink-0" />
                }
                <h3 className={`text-xs md:text-lg font-semibold ${result.status === 'ready_to_publish' && !rogueWarning?.isRogue ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {result.status === 'ready_to_publish' && !rogueWarning?.isRogue ? 'Ready to Publish' : 'Routed to Review Queue'}
                </h3>
                {result.audit && (
                  <span className={`ml-auto text-[10px] md:text-sm font-bold px-1.5 md:px-3 py-0.5 md:py-1 rounded-full whitespace-nowrap ${
                    result.audit.score >= 90 ? 'bg-emerald-500/20 text-emerald-400'
                    : result.audit.score >= 75 ? 'bg-primary/10 text-primary'
                    : 'bg-red-500/20 text-red-400'
                  }`}>
                    {result.audit.score}/100
                  </span>
                )}
              </div>
              {result.reason && (
                <p className="text-[10px] md:text-sm text-secondary">{result.reason}</p>
              )}
            </div>

            {/* Rogue Content Warning */}
            {rogueWarning?.isRogue && (
              <div className="rounded-xl md:rounded-2xl border border-red-500/30 bg-red-500/10 p-3 md:p-4 flex items-start gap-2 md:gap-3">
                <AlertTriangle size={15} className="text-red-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-[10px] md:text-sm font-semibold text-red-400 mb-0.5">Rogue content detected</p>
                  <p className="text-[9px] md:text-xs text-red-400/80">{rogueWarning.reason}</p>
                  <p className="text-[9px] md:text-xs text-red-400/60 mt-0.5 md:mt-1">This post will be routed to the admin review queue.</p>
                </div>
              </div>
            )}

            {/* Audit Results */}
            {result.audit && (
              <div className="rounded-xl md:rounded-2xl border border-border bg-surface overflow-hidden">
                <button
                  onClick={() => setAuditOpen(!auditOpen)}
                  className="w-full flex items-center justify-between p-3 md:p-5 text-left hover:bg-raised/30 transition-colors"
                >
                  <span className="text-[10px] md:text-sm font-semibold text-primary">
                    Audit — {result.audit.vulnerabilities.length} issues
                  </span>
                  {auditOpen ? <ChevronUp size={13} className="text-secondary shrink-0" /> : <ChevronDown size={13} className="text-secondary shrink-0" />}
                </button>
                {auditOpen && (
                  <div className="px-3 md:px-5 pb-3 md:pb-5 space-y-3 md:space-y-4 border-t border-border">
                    {result.audit.vulnerabilities.length > 0 && (
                      <div>
                        <p className="text-[10px] md:text-xs font-semibold text-red-400 mb-1.5 md:mb-2 uppercase tracking-wider mt-3 md:mt-4">Flagged Issues</p>
                        <ul className="space-y-1 md:space-y-2">
                          {result.audit.vulnerabilities.map((v, i) => (
                            <li key={i} className="text-[9px] md:text-xs text-secondary bg-red-950/20 border border-red-900/30 rounded-lg p-2 md:p-3">
                              {v}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {result.audit.suggestions.length > 0 && (
                      <div>
                        <p className="text-[10px] md:text-xs font-semibold text-emerald-400 mb-1.5 md:mb-2 uppercase tracking-wider">Applied Suggestions</p>
                        <ul className="space-y-1 md:space-y-2">
                          {result.audit.suggestions.map((s, i) => (
                            <li key={i} className="text-[9px] md:text-xs text-secondary bg-emerald-950/20 border border-emerald-900/30 rounded-lg p-2 md:p-3">
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Outline */}
            {result.outline && (
              <div className="rounded-xl md:rounded-2xl border border-border bg-surface overflow-hidden">
                <button
                  onClick={() => setOutlineOpen(!outlineOpen)}
                  className="w-full flex items-center justify-between p-3 md:p-5 text-left hover:bg-raised/30 transition-colors"
                >
                  <span className="text-[10px] md:text-sm font-semibold text-primary">Article Outline</span>
                  {outlineOpen ? <ChevronUp size={13} className="text-secondary shrink-0" /> : <ChevronDown size={13} className="text-secondary shrink-0" />}
                </button>
                {outlineOpen && (
                  <div className="px-3 md:px-5 pb-3 md:pb-5 border-t border-border">
                    <pre className="text-[10px] md:text-xs text-secondary whitespace-pre-wrap leading-relaxed mt-3 md:mt-4 font-sans">
                      {result.outline}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* Article Preview */}
            <div className="rounded-xl md:rounded-2xl border border-border bg-surface overflow-hidden">
              <button
                onClick={() => setPreviewOpen(!previewOpen)}
                className="w-full flex items-center justify-between p-3 md:p-5 text-left hover:bg-raised/30 transition-colors"
              >
                <span className="text-[10px] md:text-sm font-semibold text-primary">
                  Preview — {result.content.split(/\s+/).length.toLocaleString()} words
                </span>
                {previewOpen ? <ChevronUp size={13} className="text-secondary shrink-0" /> : <ChevronDown size={13} className="text-secondary shrink-0" />}
              </button>
              {previewOpen && (
                <div className="px-3 md:px-5 pb-3 md:pb-5 border-t border-border">
                  <div
                    className="prose-premium prose-premium-mobile mt-3 md:mt-5"
                    dangerouslySetInnerHTML={{ __html: marked.parse(result.content, { async: false }) as string }}
                  />
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
              {result.status === 'ready_to_publish' && (
                <button
                  onClick={publishPost}
                  className="flex-1 flex items-center justify-center gap-1.5 md:gap-2 bg-primary hover:bg-white text-canvas font-bold py-3 md:py-4 rounded-xl md:rounded-2xl transition-all duration-200 text-xs md:text-base"
                >
                  <Send size={15} />
                  Publish Now
                </button>
              )}
              <button
                onClick={saveDraft}
                className="flex-1 flex items-center justify-center gap-1.5 md:gap-2 bg-surface border border-border hover:border-primary/50 text-primary font-semibold py-3 md:py-4 rounded-xl md:rounded-2xl transition-all duration-200 text-xs md:text-base"
              >
                <Save size={15} />
                Save as {result.status === 'quarantined' ? 'Review Draft' : 'Draft'}
              </button>
              <button
                onClick={() => { setResult(null); setStages([]); }}
                className="flex items-center justify-center gap-1.5 md:gap-2 bg-surface border border-border hover:border-red-400/50 text-secondary hover:text-red-400 px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl transition-all duration-200 text-xs md:text-base"
              >
                <X size={15} />
                Reset
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
