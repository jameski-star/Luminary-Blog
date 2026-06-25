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

export type NavPage = 'home' | 'blog' | 'post' | 'editor' | 'autopost' | 'login' | 'signup' | 'profile' | 'dashboard' | 'admin' | 'privacy' | 'terms' | 'cookies';
