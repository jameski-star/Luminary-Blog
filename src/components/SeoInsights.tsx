import { useState, useEffect } from 'react';
import { api, isApiMode } from '../services/api';
import type { KeywordResearch, ContentOptimization, CompetitorAnalysis } from '../types';
import {
  Search, TrendingUp, BarChart3, Target,
  Lightbulb, CheckCircle, AlertTriangle, ChevronDown, ChevronUp,
  Loader2, Sparkles
} from 'lucide-react';

interface SeoInsightsProps {
  topic?: string;
  keywords?: string[];
  content?: string;
  title?: string;
}

export default function SeoInsights({ topic, keywords = [], content, title }: SeoInsightsProps) {
  const [keywordResearch, setKeywordResearch] = useState<KeywordResearch | null>(null);
  const [contentOpt, setContentOpt] = useState<ContentOptimization | null>(null);
  const [competitors, setCompetitors] = useState<CompetitorAnalysis[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const searchTopic = topic || title || '';

  useEffect(() => {
    if (!searchTopic || !isApiMode()) return;
    const timer = setTimeout(() => runSeoAnalysis(), 800);
    return () => clearTimeout(timer);
  }, [searchTopic]);

  const runSeoAnalysis = async () => {
    if (!searchTopic || !isApiMode()) return;
    setLoading(true);
    setError('');
    try {
      const [kwResult, optResult, compResult] = await Promise.all([
        api.seo.keywords({ topic: searchTopic }),
        content
          ? api.seo.optimize({ title: searchTopic, content, keywords })
          : Promise.resolve(null),
        keywords.length > 0
          ? api.seo.competitors({ keyword: keywords[0] })
          : Promise.resolve(null),
      ]);
      setKeywordResearch(kwResult);
      if (optResult) setContentOpt(optResult);
      if (compResult) setCompetitors(compResult.competitors);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'SEO analysis failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isApiMode()) {
    return (
      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="flex items-center gap-2 text-secondary text-xs">
          <Sparkles size={14} />
          <span>SEO insights require API mode</span>
        </div>
      </div>
    );
  }

  if (!searchTopic) {
    return (
      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="flex items-center gap-2 text-secondary text-xs">
          <Search size={14} />
          <span>Enter a topic to get SEO insights</span>
        </div>
      </div>
    );
  }

  const toggle = (key: string) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="space-y-3">
      {/* Trigger re-analysis */}
      {!loading && !keywordResearch && !error && (
        <button
          onClick={runSeoAnalysis}
          className="w-full flex items-center justify-center gap-2 text-xs font-medium bg-primary/10 hover:bg-primary/20 text-primary py-2.5 rounded-xl transition-colors"
        >
          <Sparkles size={14} />
          Analyze SEO
        </button>
      )}

      {loading && (
        <div className="rounded-xl border border-border bg-surface p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-xs text-secondary">
            <Loader2 size={14} className="animate-spin" />
            Running SEO analysis…
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3">
          <div className="flex items-start gap-2 text-xs text-red-400">
            <AlertTriangle size={12} className="mt-0.5 shrink-0" />
            {error}
          </div>
        </div>
      )}

      {/* Keyword Research */}
      {keywordResearch && (
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <button
            onClick={() => toggle('keywords')}
            className="w-full flex items-center justify-between p-3 text-left hover:bg-raised/30 transition-colors"
          >
            <span className="flex items-center gap-2 text-xs font-semibold text-primary">
              <TrendingUp size={13} />
              Keyword Research
            </span>
            {expanded.keywords ? <ChevronUp size={13} className="text-secondary" /> : <ChevronDown size={13} className="text-secondary" />}
          </button>
          {expanded.keywords && (
            <div className="px-3 pb-3 border-t border-border space-y-3">
              {keywordResearch.keywords.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-secondary uppercase tracking-wider mt-2 mb-1.5">Suggested Keywords</p>
                  <div className="flex flex-wrap gap-1">
                    {keywordResearch.keywords.map(kw => (
                      <span key={kw} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">{kw}</span>
                    ))}
                  </div>
                </div>
              )}
              {keywordResearch.relatedSearches.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-secondary uppercase tracking-wider mb-1.5">Related Searches</p>
                  <div className="space-y-1">
                    {keywordResearch.relatedSearches.map((s, i) => (
                      <p key={i} className="text-[10px] text-secondary">• {s}</p>
                    ))}
                  </div>
                </div>
              )}
              {keywordResearch.peopleAlsoAsk.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-secondary uppercase tracking-wider mb-1.5">People Also Ask</p>
                  <div className="space-y-1">
                    {keywordResearch.peopleAlsoAsk.slice(0, 4).map((q, i) => (
                      <div key={i} className="text-[10px] text-secondary p-1.5 rounded-lg bg-raised">
                        <p className="font-medium text-primary mb-0.5">{q.question}</p>
                        <p className="line-clamp-2">{q.snippet}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Content Optimization */}
      {contentOpt && (
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <button
            onClick={() => toggle('optimize')}
            className="w-full flex items-center justify-between p-3 text-left hover:bg-raised/30 transition-colors"
          >
            <span className="flex items-center gap-2 text-xs font-semibold text-primary">
              <BarChart3 size={13} />
              Content Optimization
            </span>
            {expanded.optimize ? <ChevronUp size={13} className="text-secondary" /> : <ChevronDown size={13} className="text-secondary" />}
          </button>
          {expanded.optimize && (
            <div className="px-3 pb-3 border-t border-border space-y-3">
              <div className="flex gap-3 mt-2">
                <div className="flex-1 text-center p-2 rounded-lg bg-raised">
                  <p className="text-lg font-bold text-primary">{contentOpt.titleScore}/100</p>
                  <p className="text-[9px] text-secondary">Title</p>
                </div>
                <div className="flex-1 text-center p-2 rounded-lg bg-raised">
                  <p className="text-lg font-bold text-primary">{contentOpt.contentScore}/100</p>
                  <p className="text-[9px] text-secondary">Content</p>
                </div>
                <div className="flex-1 text-center p-2 rounded-lg bg-raised">
                  <p className="text-lg font-bold text-primary">{contentOpt.readabilityScore}/100</p>
                  <p className="text-[9px] text-secondary">Readability</p>
                </div>
              </div>

              {contentOpt.titleSuggestions.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider mb-1">Title Suggestions</p>
                  <ul className="space-y-0.5">
                    {contentOpt.titleSuggestions.map((s, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-[10px] text-secondary">
                        <Lightbulb size={10} className="text-amber-400 mt-0.5 shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {contentOpt.contentSuggestions.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider mb-1">Content Suggestions</p>
                  <ul className="space-y-0.5">
                    {contentOpt.contentSuggestions.map((s, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-[10px] text-secondary">
                        <Lightbulb size={10} className="text-amber-400 mt-0.5 shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {contentOpt.titleScore >= 80 && contentOpt.contentScore >= 80 && (
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-400">
                  <CheckCircle size={10} />
                  Well-optimized for search
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Competitor Analysis */}
      {competitors.length > 0 && (
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <button
            onClick={() => toggle('competitors')}
            className="w-full flex items-center justify-between p-3 text-left hover:bg-raised/30 transition-colors"
          >
            <span className="flex items-center gap-2 text-xs font-semibold text-primary">
              <Target size={13} />
              Top Ranking Pages
            </span>
            {expanded.competitors ? <ChevronUp size={13} className="text-secondary" /> : <ChevronDown size={13} className="text-secondary" />}
          </button>
          {expanded.competitors && (
            <div className="px-3 pb-3 border-t border-border space-y-2">
              {competitors.slice(0, 5).map((c, i) => (
                <div key={i} className="p-2 rounded-lg bg-raised">
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] font-bold text-secondary mt-0.5 shrink-0">#{c.position}</span>
                    <div className="min-w-0">
                      <p className="text-[10px] font-medium text-primary truncate">{c.title}</p>
                      <p className="text-[9px] text-secondary line-clamp-2 mt-0.5">{c.snippet}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
