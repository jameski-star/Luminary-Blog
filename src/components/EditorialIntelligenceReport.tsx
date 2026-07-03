import { useState } from 'react';
import {
  TrendingUp, AlertTriangle, CheckCircle, Compass, Users, Network,
  Database, Shield, AlertCircle, FileCheck, CheckSquare, Code,
  BookOpen, Eye, HelpCircle, Activity, ArrowRight, ExternalLink,
  ChevronDown, ChevronUp, Sparkles, Scale, Info
} from 'lucide-react';

interface EditorialIntelligenceReportProps {
  report: any;
  onRefreshMaintenance?: () => void;
  maintenanceLoading?: boolean;
}

type TabType = 'planning' | 'intent' | 'graph' | 'factcheck' | 'style' | 'seo' | 'gate';

export default function EditorialIntelligenceReport({
  report,
  onRefreshMaintenance,
  maintenanceLoading = false
}: EditorialIntelligenceReportProps) {
  const [activeTab, setActiveTab] = useState<TabType>('gate');
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  if (!report) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-6 text-center">
        <p className="text-sm text-secondary">No editorial intelligence report available for this article.</p>
      </div>
    );
  }

  const {
    opportunity = {},
    duplicates = {},
    intentExpansion = {},
    audienceModeling = {},
    topicGraph = {},
    entityIntelligence = {},
    evidenceClassification = [],
    citationConfidence = {},
    factValidation = {},
    originalContributions = {},
    technicalAccuracy = {},
    editorialStyle = {},
    accessibility = {},
    mediaRecommendations = [],
    seoIntelligence = {},
    aeoIntelligence = {},
    userValueAnalysis = {},
    trustReview = {},
    publishGate = {},
    maintenance = {}
  } = report;

  const toggleSection = (sec: string) => {
    setExpandedSection(prev => (prev === sec ? null : sec));
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (score >= 70) return 'text-accent bg-accent/10 border-accent/20';
    return 'text-red-400 bg-red-500/10 border-red-500/20';
  };

  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden shadow-xl">
      {/* Header Banner */}
      <div className="bg-raised p-6 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">Autonomous Editor-in-Chief</span>
          </div>
          <h3 className="font-heading text-lg md:text-xl font-bold text-primary">Editorial Intelligence Audit</h3>
          <p className="text-xs text-secondary mt-1">20-stage real-time content accuracy and authority evaluation.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex flex-col items-center px-4 py-2 rounded-xl border ${getScoreColor(publishGate.score || 0)}`}>
            <span className="text-2xl font-black tracking-tight tabular-nums">{publishGate.score || 0}</span>
            <span className="text-[9px] font-semibold uppercase tracking-wider opacity-85">Gate Score</span>
          </div>
          <div className={`px-3 py-1.5 rounded-lg border text-xs font-semibold ${
            publishGate.passed
              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25'
              : 'bg-amber-500/15 text-amber-400 border-amber-500/25'
          }`}>
            {publishGate.passed ? 'Gate Passed' : 'Gate Blocked'}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-1 bg-surface border-b border-border p-2 overflow-x-auto scrollbar-none">
        {([
          { id: 'gate' as const, label: 'Gate & Maintenance', icon: Shield },
          { id: 'planning' as const, label: 'Discovery & Duplicates', icon: Compass },
          { id: 'intent' as const, label: 'Intent & Audience', icon: Users },
          { id: 'graph' as const, label: 'Graph & Entities', icon: Network },
          { id: 'factcheck' as const, label: 'Facts & Citations', icon: Database },
          { id: 'style' as const, label: 'Style & Accessibility', icon: FileCheck },
          { id: 'seo' as const, label: 'SEO & Answer Engine', icon: TrendingUp }
        ]).map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap min-h-11 ${
                activeTab === t.id
                  ? 'bg-primary text-canvas shadow-sm font-semibold'
                  : 'text-secondary hover:text-primary hover:bg-raised'
              }`}
            >
              <Icon size={14} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="p-6 bg-canvas/45">
        
        {/* GATE & MAINTENANCE */}
        {activeTab === 'gate' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-border bg-surface p-5">
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <Shield size={14} className="text-secondary" />
                  Stage 19: Publish Gate Status
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm py-1 border-b border-border/40">
                    <span className="text-secondary">Overall Verification Status</span>
                    <span className={`font-semibold ${publishGate.passed ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {publishGate.passed ? 'VERIFIED' : 'ATTENTION REQUIRED'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm py-1 border-b border-border/40">
                    <span className="text-secondary">Security & Trust Review</span>
                    <span className={`font-semibold ${trustReview.passedTrust ? 'text-emerald-400' : 'text-red-400'}`}>
                      {trustReview.passedTrust ? 'PASS' : 'FLAGGED'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm py-1">
                    <span className="text-secondary">Technical Accuracy Check</span>
                    <span className={`font-semibold ${technicalAccuracy.codeSyntaxValid ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {technicalAccuracy.codeSyntaxValid ? 'SYNTAX OK' : 'WARNING'}
                    </span>
                  </div>
                </div>

                {publishGate.failedChecks && publishGate.failedChecks.length > 0 && (
                  <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                    <p className="font-semibold mb-1">Failed Gate Conditions:</p>
                    <ul className="list-disc pl-4 space-y-1">
                      {publishGate.failedChecks.map((c: string, idx: number) => <li key={idx}>{c}</li>)}
                    </ul>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-border bg-surface p-5">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <Activity size={14} className="text-secondary" />
                    Stage 20: Continuous Maintenance
                  </h4>
                  {onRefreshMaintenance && (
                    <button
                      onClick={onRefreshMaintenance}
                      disabled={maintenanceLoading}
                      className="text-[10px] font-semibold px-2 py-1 rounded border border-border hover:border-primary bg-raised transition-all disabled:opacity-55"
                    >
                      {maintenanceLoading ? 'Auditing...' : 'Run Audit'}
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm py-1 border-b border-border/40">
                    <span className="text-secondary">Link Integrity Status</span>
                    <span className={`font-semibold ${maintenance.brokenLinksCount === 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {maintenance.brokenLinksCount === 0 ? '0 Broken Links' : `${maintenance.brokenLinksCount} Broken Links`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm py-1 border-b border-border/40">
                    <span className="text-secondary">Topic Search Visibility</span>
                    <span className="font-semibold text-primary">{maintenance.rankingTrend || 'Stable / Unranked'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm py-1">
                    <span className="text-secondary">Content Freshness Status</span>
                    <span className={`font-semibold ${maintenance.refreshNeeded ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {maintenance.refreshNeeded ? 'Refresh Recommended' : 'Up to Date'}
                    </span>
                  </div>
                </div>

                {maintenance.newVersionsAvailable && maintenance.newVersionsAvailable.length > 0 && (
                  <div className="mt-4 p-3 rounded-lg bg-accent/10 border border-accent/20 text-xs text-accent">
                    <p className="font-semibold mb-1">New Software / API Versions Detected:</p>
                    <ul className="list-disc pl-4 space-y-0.5">
                      {maintenance.newVersionsAvailable.map((v: string, idx: number) => <li key={idx}>{v}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Stage 18: Trust Review detail */}
            <div className="rounded-xl border border-border bg-surface p-5">
              <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <Shield size={14} className="text-secondary" />
                Stage 18: Trust Review Audit
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: 'Invented Sources Check', val: !trustReview.sourcesInvented },
                  { label: 'Fabricated Statistics Check', val: !trustReview.statsInvented },
                  { label: 'Invented Quotations Check', val: !trustReview.quotesInvented },
                  { label: 'Fake Features Check', val: !trustReview.productFeaturesInvented },
                  { label: 'Honest Certainty check', val: !trustReview.certaintyOverstated },
                  { label: 'Evidence Alignment check', val: !trustReview.misrepresentsEvidence }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2.5 rounded-lg bg-raised/50 border border-border/30">
                    {item.val ? (
                      <CheckCircle size={14} className="text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle size={14} className="text-red-400 shrink-0" />
                    )}
                    <span className="text-xs text-secondary leading-tight">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* DISCOVERY & DUPLICATES */}
        {activeTab === 'planning' && (
          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-surface p-5">
              <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <Compass size={14} className="text-secondary" />
                Stage 1: Knowledge Opportunity Discovery
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="p-3 bg-raised/50 rounded-xl text-center border border-border/30">
                  <span className="text-2xl font-bold text-primary">{opportunity.opportunityScore || 0}</span>
                  <p className="text-[10px] text-secondary mt-1 uppercase tracking-wider">Opportunity Score</p>
                </div>
                <div className="p-3 bg-raised/50 rounded-xl text-center border border-border/30">
                  <span className="text-2xl font-bold text-primary">{opportunity.freshnessScore || 0}</span>
                  <p className="text-[10px] text-secondary mt-1 uppercase tracking-wider">Freshness Score</p>
                </div>
                <div className="p-3 bg-raised/50 rounded-xl text-center border border-border/30">
                  <span className="text-2xl font-bold text-primary">{opportunity.authorityFit || 0}</span>
                  <p className="text-[10px] text-secondary mt-1 uppercase tracking-wider">Authority Fit</p>
                </div>
              </div>
              
              <div className="grid sm:grid-cols-3 gap-4 mt-5 pt-4 border-t border-border/40 text-xs">
                <div>
                  <span className="text-secondary uppercase tracking-wider text-[10px]">Search Intent</span>
                  <p className="font-semibold text-primary mt-0.5">{opportunity.searchIntent || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-secondary uppercase tracking-wider text-[10px]">Predicted Longevity</span>
                  <p className="font-semibold text-primary mt-0.5">{opportunity.predictedLongevity || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-secondary uppercase tracking-wider text-[10px]">Estimated Maintenance</span>
                  <p className="font-semibold text-primary mt-0.5">{opportunity.estimatedMaintenanceCost || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-surface p-5">
              <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <Scale size={14} className="text-secondary" />
                Stage 2: Duplicate & Cannibalization Detection
              </h4>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-secondary">Keyword Cannibalization Risk:</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    duplicates.cannibalizationRisk === 'high' ? 'bg-red-500/15 text-red-400'
                    : duplicates.cannibalizationRisk === 'medium' ? 'bg-amber-500/15 text-amber-400'
                    : 'bg-emerald-500/15 text-emerald-400'
                  }`}>{duplicates.cannibalizationRisk || 'low'}</span>
                </div>

                <div>
                  <span className="block text-xs font-semibold text-primary mb-1">Topic Overlap Analysis:</span>
                  {duplicates.overlappingTopics && duplicates.overlappingTopics.length > 0 ? (
                    <ul className="space-y-1.5 text-xs text-secondary pl-3 border-l-2 border-border/80">
                      {duplicates.overlappingTopics.map((topic: string, idx: number) => (
                        <li key={idx} className="flex items-center gap-1">
                          <AlertTriangle size={12} className="text-amber-400" />
                          <span>{topic}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-secondary bg-emerald-500/5 p-2 border border-emerald-500/15 rounded text-emerald-400 flex items-center gap-1">
                      <CheckCircle size={12} /> Unique topic. No duplicate publications or overlaps detected.
                    </p>
                  )}
                </div>

                <div className="p-3 bg-raised rounded-lg text-xs border border-border/60">
                  <span className="font-semibold text-primary block mb-1">Editor recommendation:</span>
                  <p className="text-secondary">{duplicates.recommendation || 'Safe to publish as new article.'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* INTENT & AUDIENCE */}
        {activeTab === 'intent' && (
          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-surface p-5">
              <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <Compass size={14} className="text-secondary" />
                Stage 3: Intent Expansion
              </h4>
              <div className="space-y-4">
                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-raised/50 border border-border/30 text-xs">
                    <span className="text-secondary font-semibold uppercase tracking-wider text-[9px]">Primary Intent</span>
                    <p className="font-semibold text-primary mt-1">{intentExpansion.primaryIntent || 'N/A'}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-raised/50 border border-border/30 text-xs">
                    <span className="text-secondary font-semibold uppercase tracking-wider text-[9px]">Secondary Intent</span>
                    <p className="font-semibold text-primary mt-1">{intentExpansion.secondaryIntent || 'N/A'}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-raised/50 border border-border/30 text-xs">
                    <span className="text-secondary font-semibold uppercase tracking-wider text-[9px]">Hidden/Implicit Intent</span>
                    <p className="font-semibold text-primary mt-1">{intentExpansion.hiddenIntent || 'N/A'}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 pt-3 border-t border-border/40 text-xs">
                  <div>
                    <span className="font-bold text-primary block mb-1.5">Follow-up Search Queries:</span>
                    <ul className="list-disc pl-4 space-y-1 text-secondary">
                      {intentExpansion.followUpQuestions?.map((q: string, idx: number) => <li key={idx}>{q}</li>)}
                    </ul>
                  </div>
                  <div>
                    <span className="font-bold text-primary block mb-1.5">Adjacent Learning Topics:</span>
                    <ul className="list-disc pl-4 space-y-1 text-secondary">
                      {intentExpansion.adjacentLearningTopics?.map((t: string, idx: number) => <li key={idx}>{t}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-surface p-5">
              <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <Users size={14} className="text-secondary" />
                Stage 4: Audience Adaptation Models
              </h4>
              <div className="space-y-4">
                {[
                  { title: 'Beginner Readers', summary: audienceModeling.beginnerSummary },
                  { title: 'Technical Experts / Devs', summary: audienceModeling.developerSummary || audienceModeling.expertSummary },
                  { title: 'Decision Makers / Business Owners', summary: audienceModeling.businessOwnerSummary }
                ].map((aud, idx) => (
                  <div key={idx} className="p-3 bg-raised/40 border border-border/30 rounded-lg text-xs">
                    <span className="font-bold text-primary block mb-1">{aud.title}</span>
                    <p className="text-secondary leading-relaxed">{aud.summary || 'Summary not generated.'}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TOPIC GRAPH & ENTITIES */}
        {activeTab === 'graph' && (
          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-surface p-5">
              <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <Network size={14} className="text-secondary" />
                Stage 5: Topic Graph Relations & Timeline
              </h4>
              <div className="grid md:grid-cols-2 gap-5">
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="font-bold text-primary block mb-1">Parent Topics (General):</span>
                    <div className="flex flex-wrap gap-1">
                      {topicGraph.parentTopics?.map((t: string) => <span key={t} className="px-2 py-0.5 rounded bg-raised border border-border/40 text-secondary">{t}</span>)}
                    </div>
                  </div>
                  <div>
                    <span className="font-bold text-primary block mb-1">Prerequisites:</span>
                    <div className="flex flex-wrap gap-1">
                      {topicGraph.prerequisites?.map((t: string) => <span key={t} className="px-2 py-0.5 rounded bg-raised border border-border/40 text-secondary">{t}</span>)}
                    </div>
                  </div>
                  <div>
                    <span className="font-bold text-primary block mb-1">Advanced Subtopics:</span>
                    <div className="flex flex-wrap gap-1">
                      {topicGraph.advancedTopics?.map((t: string) => <span key={t} className="px-2 py-0.5 rounded bg-raised border border-border/40 text-secondary">{t}</span>)}
                    </div>
                  </div>
                  <div>
                    <span className="font-bold text-primary block mb-1">Alternative Concepts:</span>
                    <div className="flex flex-wrap gap-1">
                      {topicGraph.alternativeConcepts?.map((t: string) => <span key={t} className="px-2 py-0.5 rounded bg-raised border border-border/40 text-secondary">{t}</span>)}
                    </div>
                  </div>
                </div>

                <div className="border-l border-border/50 pl-5">
                  <span className="font-bold text-primary block text-xs mb-3">Historical Timeline / Milestones:</span>
                  {topicGraph.timeline && topicGraph.timeline.length > 0 ? (
                    <div className="space-y-3 relative before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-[1px] before:bg-border/60">
                      {topicGraph.timeline.map((item: any, idx: number) => (
                        <div key={idx} className="relative pl-5 text-xs">
                          <span className="absolute left-[3px] top-[5px] w-2 h-2 rounded-full bg-primary" />
                          <span className="text-[10px] font-mono text-secondary">{item.date}</span>
                          <p className="font-medium text-primary mt-0.5">{item.event}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-secondary">No timeline milestones extracted.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-surface p-5">
              <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <Database size={14} className="text-secondary" />
                Stage 6: Entity Intelligence (Cross-Article Connections)
              </h4>
              <div className="space-y-4 text-xs">
                {[
                  { label: 'Companies', items: entityIntelligence.companies },
                  { label: 'Technologies & Frameworks', items: entityIntelligence.technologies },
                  { label: 'Protocols & Standards', items: (entityIntelligence.protocols || []).concat(entityIntelligence.standards || []) },
                  { label: 'People / Contributors', items: entityIntelligence.people }
                ].map((ent, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-2 py-2 border-b border-border/40 last:border-0">
                    <span className="w-40 font-semibold text-secondary">{ent.label}:</span>
                    <div className="flex flex-wrap gap-1">
                      {ent.items && ent.items.length > 0 ? (
                        ent.items.map((item: string, i: number) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-primary/10 text-primary font-medium">{item}</span>
                        ))
                      ) : (
                        <span className="text-secondary/60">None extracted</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* FACTS & CITATIONS */}
        {activeTab === 'factcheck' && (
          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-surface p-5">
              <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Database size={14} className="text-secondary" />
                Stage 7: Evidence Classification Audit
              </h4>
              <p className="text-[10px] text-secondary mb-4">Verification of statement types extracted directly from content.</p>
              
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-border/60 text-secondary">
                      <th className="pb-2 font-semibold">Key Claim / Statement</th>
                      <th className="pb-2 font-semibold w-36">Classification</th>
                      <th className="pb-2 font-semibold w-24 text-center">Confidence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {evidenceClassification && evidenceClassification.length > 0 ? (
                      evidenceClassification.map((item: any, idx: number) => (
                        <tr key={idx} className="hover:bg-raised/20">
                          <td className="py-2.5 text-primary pr-3 leading-relaxed italic">"{item.statement}"</td>
                          <td className="py-2.5">
                            <span className="px-2 py-0.5 rounded bg-raised text-[10px] font-medium border border-border/40 text-secondary">{item.classification}</span>
                          </td>
                          <td className="py-2.5 text-center">
                            <span className={`font-mono font-bold ${
                              item.sourceConfidence >= 8 ? 'text-emerald-400'
                              : item.sourceConfidence >= 5 ? 'text-accent'
                              : 'text-red-400'
                            }`}>{item.sourceConfidence || 0}/10</span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="py-4 text-center text-secondary">No statements analyzed.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-border bg-surface p-5">
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <Shield size={14} className="text-secondary" />
                  Stage 8: Citation Confidence
                </h4>
                <div className="space-y-4 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-secondary">Citation Quality Index:</span>
                    <span className="font-bold text-primary">{citationConfidence.score || 0}/100</span>
                  </div>

                  <div>
                    <span className="font-semibold text-primary block mb-1">Authoritative References Verified:</span>
                    {citationConfidence.preferredSourcesUsed && citationConfidence.preferredSourcesUsed.length > 0 ? (
                      <ul className="list-disc pl-4 space-y-1 text-secondary">
                        {citationConfidence.preferredSourcesUsed.map((src: string, idx: number) => (
                          <li key={idx} className="text-emerald-400/90">{src}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-secondary/60">No official documentations/sources referenced.</p>
                    )}
                  </div>

                  {citationConfidence.reviewNeededClaims && citationConfidence.reviewNeededClaims.length > 0 && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 text-[11px] rounded-lg text-red-400">
                      <p className="font-bold flex items-center gap-1 mb-1">
                        <AlertTriangle size={12} /> Flagged Claims For Manual Fact Check:
                      </p>
                      <ul className="list-disc pl-4 space-y-0.5">
                        {citationConfidence.reviewNeededClaims.map((claim: string, idx: number) => (
                          <li key={idx}>{claim}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-surface p-5">
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <FileCheck size={14} className="text-secondary" />
                  Stage 9: Multi-Layer Fact Validation
                </h4>
                <div className="space-y-3">
                  {factValidation.validatedElements && factValidation.validatedElements.length > 0 ? (
                    factValidation.validatedElements.map((elem: any, idx: number) => (
                      <div key={idx} className="flex items-start gap-2.5 p-2 rounded-lg bg-raised/40 border border-border/30 text-xs">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-bold shrink-0 ${
                          elem.status === 'valid' ? 'bg-emerald-500/15 text-emerald-400'
                          : elem.status === 'warning' ? 'bg-amber-500/15 text-amber-400'
                          : 'bg-red-500/15 text-red-400'
                        }`}>{elem.status}</span>
                        <div className="min-w-0">
                          <p className="font-semibold text-primary">{elem.item} <span className="font-normal text-secondary opacity-60">({elem.type})</span></p>
                          <p className="text-secondary/80 mt-0.5 text-[11px]">{elem.note}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-secondary">No fact validation metrics found.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STYLE & ACCESSIBILITY */}
        {activeTab === 'style' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-border bg-surface p-5">
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <BookOpen size={14} className="text-secondary" />
                  Stage 12: Editorial Style Metrics
                </h4>
                <div className="space-y-3 text-xs">
                  {[
                    { label: 'Voice & Prose Match', val: editorialStyle.voiceScore },
                    { label: 'Tone Consistency', val: editorialStyle.toneScore },
                    { label: 'Grammar & Syntax Integrity', val: editorialStyle.grammarScore },
                    { label: 'Readability Score', val: editorialStyle.readabilityScore }
                  ].map((style, idx) => (
                    <div key={idx} className="flex items-center justify-between py-1 border-b border-border/30 last:border-0">
                      <span className="text-secondary">{style.label}:</span>
                      <span className="font-bold text-primary font-mono">{style.val || 0}/100</span>
                    </div>
                  ))}
                  <div className="pt-2 flex items-center gap-2">
                    <CheckSquare size={13} className={editorialStyle.repetitiveSentenceStructuresAvoided ? "text-emerald-400" : "text-amber-400"} />
                    <span className="text-secondary">Repetitive Sentence structures avoided: {editorialStyle.repetitiveSentenceStructuresAvoided ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-surface p-5">
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <CheckSquare size={14} className="text-secondary" />
                  Stage 13: Accessibility Review
                </h4>
                <div className="space-y-3 text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={14} className={accessibility.headingOrderCorrect ? "text-emerald-400" : "text-amber-400"} />
                    <span className="text-secondary">Logical heading hierarchy order</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle size={14} className={accessibility.altTextProvided ? "text-emerald-400" : "text-amber-400"} />
                    <span className="text-secondary">Alt attributes verified for images</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle size={14} className={accessibility.tableAccessibilityPassed ? "text-emerald-400" : "text-amber-400"} />
                    <span className="text-secondary">Table captions & structures correct</span>
                  </div>
                  <div className="pt-1.5 flex items-center gap-1">
                    <span className="text-secondary">Reading Level Index:</span>
                    <span className="font-semibold text-primary">{accessibility.readingLevel || 'Professional'}</span>
                  </div>
                  {accessibility.details && (
                    <p className="text-[11px] text-secondary/75 leading-relaxed bg-raised p-2 rounded border border-border/30 mt-2">{accessibility.details}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-border bg-surface p-5">
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <Code size={14} className="text-secondary" />
                  Stage 11: Technical Accuracy Audit
                </h4>
                <div className="space-y-3 text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={14} className={technicalAccuracy.codeSyntaxValid ? "text-emerald-400" : "text-red-400"} />
                    <span className="text-secondary">Code syntax / formatting checker: {technicalAccuracy.codeSyntaxValid ? 'Valid' : 'Errors Detected'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle size={14} className={technicalAccuracy.cliCommandsVerified ? "text-emerald-400" : "text-amber-400"} />
                    <span className="text-secondary">CLI commands pattern validation: {technicalAccuracy.cliCommandsVerified ? 'Valid' : 'Unverified'}</span>
                  </div>

                  {technicalAccuracy.deprecatedApproaches && technicalAccuracy.deprecatedApproaches.length > 0 ? (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-[11px] rounded-lg text-amber-400">
                      <p className="font-bold flex items-center gap-1 mb-1">
                        <AlertTriangle size={12} /> Deprecated approaches / libraries flagged:
                      </p>
                      <ul className="list-disc pl-4 space-y-0.5">
                        {technicalAccuracy.deprecatedApproaches.map((ap: string, idx: number) => <li key={idx}>{ap}</li>)}
                      </ul>
                    </div>
                  ) : (
                    <p className="text-emerald-400/90 flex items-center gap-1"><CheckCircle size={12} /> No deprecated methods detected.</p>
                  )}

                  {technicalAccuracy.details && (
                    <p className="text-[11px] text-secondary mt-1 leading-relaxed bg-raised p-2 rounded">{technicalAccuracy.details}</p>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-surface p-5">
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <Activity size={14} className="text-secondary" />
                  Stage 14: Media & Visual Recommendations
                </h4>
                <div className="space-y-3">
                  {mediaRecommendations && mediaRecommendations.length > 0 ? (
                    mediaRecommendations.map((rec: any, idx: number) => (
                      <div key={idx} className="p-3 bg-raised/40 border border-border/30 rounded-lg text-xs">
                        <p className="font-bold text-primary flex items-center gap-1">
                          <Sparkles size={11} className="text-accent" />
                          {rec.diagramType} Recommendation
                        </p>
                        <p className="text-secondary leading-relaxed mt-1">{rec.description}</p>
                        {rec.elements && rec.elements.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {rec.elements.map((el: string, i: number) => (
                              <span key={i} className="px-1.5 py-0.5 text-[9px] rounded bg-primary/10 border border-primary/20 text-primary">{el}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-secondary">No media recommendations generated.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SEO & AEO */}
        {activeTab === 'seo' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-border bg-surface p-5">
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <TrendingUp size={14} className="text-secondary" />
                  Stage 15: SEO Intelligence Audit
                </h4>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between py-1 border-b border-border/30">
                    <span className="text-secondary">Topical Authority weight:</span>
                    <span className="font-bold text-primary">{seoIntelligence.topicalAuthorityScore || 0}/100</span>
                  </div>
                  <div className="py-1 border-b border-border/30">
                    <span className="text-secondary block">Snippet Optimization Potential:</span>
                    <span className="font-semibold text-primary mt-0.5 block">{seoIntelligence.snippetPotential || 'Moderate'}</span>
                  </div>
                  <div className="py-1 border-b border-border/30">
                    <span className="text-secondary block">Suggested Meta Description:</span>
                    <p className="text-secondary leading-normal mt-0.5 italic">"{seoIntelligence.metaDescription || 'No description suggested.'}"</p>
                  </div>

                  <div>
                    <span className="font-bold text-primary block mb-1">Recommended Internal Links:</span>
                    {seoIntelligence.internalLinkingSuggestions && seoIntelligence.internalLinkingSuggestions.length > 0 ? (
                      <ul className="list-disc pl-4 space-y-1 text-secondary">
                        {seoIntelligence.internalLinkingSuggestions.map((link: string, idx: number) => <li key={idx} className="text-primary">{link}</li>)}
                      </ul>
                    ) : (
                      <p className="text-secondary/60">No internal links recommended.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-surface p-5">
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <Activity size={14} className="text-secondary" />
                  Stage 16: AEO (Answer Engine Optimization)
                </h4>
                <div className="space-y-4 text-xs">
                  <div className="p-3 bg-raised/60 border border-border/30 rounded-lg">
                    <span className="font-bold text-primary block mb-1">Direct Answer Block (Snippet):</span>
                    <p className="text-secondary italic leading-relaxed">"{aeoIntelligence.directAnswerBlock || 'Not generated.'}"</p>
                  </div>

                  <div>
                    <span className="font-bold text-primary block mb-1.5">Optimized FAQ Blocks:</span>
                    {aeoIntelligence.faqList && aeoIntelligence.faqList.length > 0 ? (
                      <div className="space-y-2">
                        {aeoIntelligence.faqList.slice(0, 3).map((faq: any, idx: number) => (
                          <div key={idx} className="p-2 bg-canvas/30 rounded border border-border/20">
                            <p className="font-semibold text-primary">Q: {faq.question}</p>
                            <p className="text-secondary mt-0.5 text-[11px]">A: {faq.answer}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-secondary/60">No FAQ block generated.</p>
                    )}
                  </div>

                  <div>
                    <span className="font-bold text-primary block mb-1">Entity Summary:</span>
                    <p className="text-secondary leading-normal">{aeoIntelligence.entitySummary || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-border bg-surface p-5">
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <HelpCircle size={14} className="text-secondary" />
                  Stage 17: User Value Analysis
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {[
                    { label: 'What is it?', score: userValueAnalysis.whatIsItScore },
                    { label: 'Why it matters', score: userValueAnalysis.whyItMattersScore },
                    { label: 'How it works', score: userValueAnalysis.howItWorksScore },
                    { label: 'When to use it', score: userValueAnalysis.whenToUseScore },
                    { label: 'When to avoid it', score: userValueAnalysis.whenToAvoidScore },
                    { label: 'Alternatives covered', score: userValueAnalysis.alternativesScore },
                    { label: 'Limitations listed', score: userValueAnalysis.limitationsScore },
                    { label: 'Common mistakes', score: userValueAnalysis.commonMistakesScore }
                  ].map((val, idx) => (
                    <div key={idx} className="flex flex-col p-2.5 rounded-lg bg-raised/50 border border-border/30">
                      <span className="text-secondary text-[10px] uppercase tracking-wider">{val.label}</span>
                      <div className="flex items-center gap-1.5 mt-1">
                        <div className="flex-1 bg-border/40 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-primary h-full rounded-full" style={{ width: `${(val.score || 0) * 10}%` }} />
                        </div>
                        <span className="font-mono font-bold text-primary text-xs shrink-0">{val.score || 0}/10</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-surface p-5">
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <CheckSquare size={14} className="text-secondary" />
                  Stage 10: Original Contribution Elements
                </h4>
                <div className="space-y-3 text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={14} className={originalContributions.hasMatrix ? "text-emerald-400" : "text-secondary"} />
                    <span className="text-secondary">Decision / Strategy Matrix included</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle size={14} className={originalContributions.hasComparisonTable ? "text-emerald-400" : "text-secondary"} />
                    <span className="text-secondary">Side-by-side comparison tables</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle size={14} className={originalContributions.hasTroubleshootingTree ? "text-emerald-400" : "text-secondary"} />
                    <span className="text-secondary">Troubleshooting flow trees</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle size={14} className={originalContributions.hasChecklist ? "text-emerald-400" : "text-secondary"} />
                    <span className="text-secondary">Implementation checklists / guides</span>
                  </div>
                  <div className="pt-2 border-t border-border/40">
                    <span className="font-semibold text-primary block mb-1">Original Content Summary:</span>
                    <p className="text-secondary leading-relaxed">{originalContributions.contributionSummary || 'No summary available.'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
