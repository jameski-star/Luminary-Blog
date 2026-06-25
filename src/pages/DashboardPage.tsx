import { useState } from 'react';
import { useApp } from '../context/AppContext';
import SEO from '../components/SEO';
import { useConfirm } from '../components/Modal';
import {
  PenLine, Zap, Eye, Heart, Clock, TrendingUp,
  Trash2, Send, BookOpen, LayoutDashboard, AlertTriangle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { BlogPost } from '../types';

export default function DashboardPage() {
  const { user, posts, updatePost, deletePost, setCurrentPage, setSelectedPostId } = useApp();
  const { confirm, ConfirmDialog } = useConfirm();
  const [activeTab, setActiveTab] = useState<'published' | 'drafts' | 'review'>('published');

  if (!user) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center pt-16">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-primary mb-3">Sign in to view dashboard</h2>
          <button onClick={() => setCurrentPage('login')} className="bg-primary text-canvas font-semibold px-6 py-3 rounded-xl">Sign In</button>
        </div>
      </div>
    );
  }

  const myPosts = posts.filter(p => p.authorId === user.id);
  const published = myPosts.filter(p => p.status === 'published');
  const drafts = myPosts.filter(p => p.status === 'draft');
  const review = myPosts.filter(p => p.status === 'review' || p.status === 'quarantined');

  const totalViews = published.reduce((s, p) => s + p.views, 0);
  const totalLikes = published.reduce((s, p) => s + p.likes, 0);
  const avgScore = published.length > 0
    ? Math.round(published.reduce((s, p) => s + (p.auditScore || 0), 0) / published.length)
    : 0;

  const openPost = (post: BlogPost) => {
    setSelectedPostId(post.id);
    setCurrentPage('post');
  };

  const publishDraft = async (id: string) => {
    const ok = await confirm('Publish Post', 'Are you sure you want to publish this post? It will be visible to everyone.', 'Publish');
    if (!ok) return;
    updatePost(id, { status: 'published', publishedAt: new Date().toISOString(), isApproved: true });
  };

  const confirmDelete = async (id: string, title: string) => {
    const ok = await confirm('Delete Post', `Are you sure you want to delete "${title}"? This cannot be undone.`, 'Delete', true);
    if (!ok) return;
    deletePost(id);
  };

  const currentList = activeTab === 'published' ? published : activeTab === 'drafts' ? drafts : review;

  return (
    <div className="min-h-screen bg-canvas pt-20">
      <SEO title="Dashboard" description="Manage your posts and view analytics." noindex />
      <div className="max-w-5xl mx-auto px-4 py-6 md:py-10">

        {/* Header */}
        <div className="flex items-start justify-between mb-6 md:mb-10 gap-3">
          <div className="min-w-0">
            <h1 className="font-heading text-2xl md:text-4xl font-bold text-primary mb-1 md:mb-2 flex items-center gap-2 md:gap-3">
              <LayoutDashboard size={20} className="text-secondary shrink-0" />
              <span className="truncate">Dashboard</span>
            </h1>
            <p className="text-xs md:text-sm text-secondary truncate">Welcome back, <span className="text-primary font-medium">{user.name}</span></p>
          </div>
          <div className="flex gap-1.5 md:gap-3 shrink-0">
            <button
              onClick={() => setCurrentPage('editor')}
              className="flex items-center gap-1 md:gap-2 text-[10px] md:text-sm border border-border hover:border-primary/40 text-secondary hover:text-primary px-2 md:px-4 py-1.5 md:py-2.5 rounded-xl transition-all"
            >
              <PenLine size={12} />
              <span className="hidden md:inline">Write</span>
            </button>
            <button
              onClick={() => setCurrentPage('autopost')}
              className="flex items-center gap-1 md:gap-2 text-[10px] md:text-sm bg-primary hover:bg-white text-canvas font-semibold px-2 md:px-4 py-1.5 md:py-2.5 rounded-xl transition-all"
            >
              <Zap size={12} />
              <span className="hidden md:inline">AutoPost AI</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-6 md:mb-10">
          <StatCard icon={<BookOpen size={14} />} label="Published" value={published.length} />
          <StatCard icon={<Eye size={14} />} label="Total Views" value={totalViews.toLocaleString()} />
          <StatCard icon={<Heart size={14} />} label="Total Likes" value={totalLikes.toLocaleString()} />
          <StatCard icon={<TrendingUp size={14} />} label="Avg. Score" value={avgScore > 0 ? `${avgScore}/100` : '—'} highlighted />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 md:mb-6 bg-surface p-1 rounded-xl md:rounded-2xl border border-border w-fit overflow-x-auto">
          {[
            { key: 'published', label: 'Published', count: published.length },
            { key: 'drafts', label: 'Drafts', count: drafts.length },
            { key: 'review', label: 'Review Queue', count: review.length },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`flex items-center gap-1 md:gap-2 px-2.5 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[10px] md:text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-primary text-canvas'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`text-[9px] md:text-xs rounded-full px-1.5 md:px-2 py-0.5 ${
                  activeTab === tab.key ? 'bg-canvas/20 text-canvas' : 'bg-raised text-secondary'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Post List */}
        {currentList.length === 0 ? (
          <div className="text-center py-20 rounded-3xl border border-border bg-surface">
            <h3 className="text-lg font-semibold text-primary mb-2">
              {activeTab === 'published' ? 'No published posts yet'
                : activeTab === 'drafts' ? 'No drafts saved'
                : 'Review queue is empty'}
            </h3>
            <p className="text-secondary mb-6 text-sm">
              {activeTab === 'review' ? 'Posts that fail the authenticity gate appear here.' : 'Start writing or use AutoPost AI to generate content.'}
            </p>
            {activeTab !== 'review' && (
              <button
                onClick={() => setCurrentPage(activeTab === 'published' ? 'autopost' : 'editor')}
                className="bg-primary text-canvas font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-white transition-colors"
              >
                {activeTab === 'published' ? 'AutoPost AI →' : 'Open Editor →'}
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {currentList.map(post => (
              <DashboardRow
                key={post.id}
                post={post}
                onOpen={() => openPost(post)}
                onPublish={() => publishDraft(post.id)}
                onDelete={() => confirmDelete(post.id, post.title)}
              />
            ))}
          </div>
        )}
      </div>
      <ConfirmDialog />
    </div>
  );
}

function StatCard({ icon, label, value, highlighted }: { icon: React.ReactNode; label: string; value: string | number; highlighted?: boolean }) {
  return (
    <div className="rounded-xl md:rounded-2xl border border-border bg-surface p-3 md:p-5">
      <div className={`mb-1 md:mb-3 ${highlighted ? 'text-primary' : 'text-secondary'}`}>{icon}</div>
      <p className="text-base md:text-2xl font-bold text-primary mb-0.5 md:mb-1">{value}</p>
      <p className="text-[10px] md:text-xs text-secondary">{label}</p>
    </div>
  );
}

function DashboardRow({ post, onOpen, onPublish, onDelete }: {
  post: BlogPost;
  onOpen: () => void;
  onPublish: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="rounded-xl md:rounded-2xl border border-border bg-surface overflow-hidden hover:border-primary/20 transition-all group">
      <div className="flex items-center gap-2 md:gap-4 p-3 md:p-5">
        {/* Status indicator */}
        <div className={`w-1.5 md:w-2 h-1.5 md:h-2 rounded-full shrink-0 ${
          post.status === 'published' ? 'bg-emerald-400'
           : post.status === 'draft' ? 'bg-secondary'
          : 'bg-red-400'
        }`} />

        {/* Content */}
        <button onClick={onOpen} className="flex-1 text-left min-w-0">
          <h3 className="text-xs md:text-sm font-semibold text-primary group-hover:text-primary/80 transition-colors truncate mb-0.5 md:mb-1">
            {post.title}
          </h3>
          <div className="flex flex-wrap items-center gap-1.5 md:gap-3 text-[10px] md:text-xs text-secondary">
            <span className={`px-1.5 md:px-2 py-0.5 rounded-full text-[9px] md:text-xs ${
              post.status === 'published' ? 'bg-emerald-500/10 text-emerald-400'
              : post.status === 'draft' ? 'bg-secondary/10 text-secondary'
              : 'bg-red-500/10 text-red-400'
            }`}>
              {post.status === 'review' ? 'In Review' : post.status.charAt(0).toUpperCase() + post.status.slice(1)}
            </span>
            {(post.status === 'review') && (
              <span className="flex items-center gap-0.5 md:gap-1 text-secondary">
                <AlertTriangle size={8} />
                Score: {post.auditScore}/100
              </span>
            )}
            <span className="flex items-center gap-0.5 md:gap-1"><Clock size={8} /> {post.readTime}m</span>
            {post.status === 'published' && (
              <>
                <span className="flex items-center gap-0.5 md:gap-1"><Eye size={8} /> {post.views.toLocaleString()}</span>
                <span className="flex items-center gap-0.5 md:gap-1"><Heart size={8} /> {post.likes}</span>
              </>
            )}
            <span className="hidden md:inline">{formatDistanceToNow(new Date(post.publishedAt), { addSuffix: true })}</span>
          </div>
        </button>

        {/* Actions */}
        <div className="flex items-center gap-1 md:gap-2 shrink-0">
          {(post.status === 'draft' || post.status === 'review') && (
            <button
              onClick={onPublish}
              className="flex items-center gap-1 md:gap-1.5 text-[10px] md:text-xs text-emerald-400 hover:text-emerald-300 transition-colors px-1.5 md:px-3 py-1 md:py-1.5 rounded-lg border border-emerald-500/30 hover:border-emerald-400/50"
            >
              <Send size={10} />
              <span className="hidden md:inline">Publish</span>
            </button>
          )}
          <button
            onClick={onDelete}
            className="text-secondary hover:text-red-400 transition-colors p-1 md:p-1.5 rounded-lg hover:bg-red-950/30"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
