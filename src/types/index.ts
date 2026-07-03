export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  bio?: string;
  joinedAt: string;
  postsCount: number;
  role: 'user' | 'admin';
  verified?: boolean;
  banned?: boolean;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string; // Markdown
  htmlContent?: string; // Parsed HTML
  coverImage?: string;
  tags: string[];
  keywords: string[];
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  publishedAt: string;
  modifiedAt: string;
  status: 'draft' | 'quarantined' | 'published' | 'review' | 'disapproved';
  readTime: number; // minutes
  views: number;
  likes: number;
  auditScore?: number;
  wordCount: number;
  wordIndex?: Record<string, number[]>; // word -> array of paragraph indices
  isApproved?: boolean;
  editorialIntelligence?: any;
}

export interface AuditResult {
  passedCheck: boolean;
  score: number;
  vulnerabilities: string[];
  suggestions: string[];
}

export interface PipelineResult {
  status: 'ready_to_publish' | 'quarantined' | 'error';
  title: string;
  content: string;
  outline?: string;
  audit?: AuditResult;
  reason?: string;
  draft?: string;
  isApproved?: boolean;
  keywords?: string[];
  editorialIntelligence?: any;
}

export interface PipelineStage {
  name: string;
  status: 'pending' | 'running' | 'done' | 'error';
  message?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

export type WritingTone = 'professional' | 'conversational' | 'persuasive' | 'educational' | 'narrative' | 'technical';

export const TONE_LABELS: Record<WritingTone, { label: string; description: string; icon: string }> = {
  professional: { label: 'Professional', description: 'Authoritative, polished, data-driven', icon: 'shield' },
  conversational: { label: 'Conversational', description: 'Friendly, accessible, natural flow', icon: 'message-circle' },
  persuasive: { label: 'Persuasive', description: 'Opinionated, compelling, conviction-driven', icon: 'zap' },
  educational: { label: 'Educational', description: 'Explanatory, patient, builds from first principles', icon: 'book-open' },
  narrative: { label: 'Narrative', description: 'Story-driven, vivid, engaging anecdotes', icon: 'feather' },
  technical: { label: 'Technical', description: 'Precise, specification-grade, deep-dive', icon: 'code' },
};

export type NavPage = 'home' | 'blog' | 'post' | 'editor' | 'autopost' | 'login' | 'signup' | 'profile' | 'dashboard' | 'admin' | 'privacy' | 'terms' | 'cookies';

export interface KeywordResearch {
  topic: string;
  keywords: string[];
  peopleAlsoAsk: { question: string; snippet: string }[];
  relatedSearches: string[];
  topRankingTitles: string[];
  topRankingSnippets: string[];
  missingKeywords: string[];
}

export interface CompetitorAnalysis {
  url: string;
  title: string;
  snippet: string;
  position: number;
}

export interface ContentOptimization {
  titleScore: number;
  contentScore: number;
  titleSuggestions: string[];
  contentSuggestions: string[];
  missingKeywords: string[];
  readabilityScore: number;
}
