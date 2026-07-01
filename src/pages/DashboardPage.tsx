import { useState } from 'react';
import { useApp } from '../context/AppContext';
import SEO from '../components/SEO';
import { useConfirm } from '../components/Modal';
import {
  PenLine, Zap, Eye, Heart, TrendingUp,
  Trash2, Send, BookOpen, LayoutDashboard, Clock
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { BlogPost } from '../types';

type DashTab = 'published' | 'drafts' | 'review' | 'disapproved';

export default function DashboardPage() {
  const { user, posts, updatePost, deletePost, setCurrentPage, setSelectedPostId } = useApp();
  const { confirm, ConfirmDialog } = useConfirm();
  const [activeTab, setActiveTab] = useState<DashTab>('published');

  if (!user) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center pt-16">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-primary mb-3">Sign in to view dashboard</h2>
          <button onClick={() => setCurrentPage('login')} className="bg-accent text-canvas font-semibold px-6 py-3 rounded-xl">Sign In</button>
        </div>
      </div>
    );
  }

  const myPosts = posts.filter(p => p.authorId === user.id);
  const published = myPosts.filter(p => p.status === 'published');
  const drafts = myPosts.filter(p => p.status === 'draft');
  const review = myPosts.filter(p => p.status === 'review' || p.status === 'quarantined');
  const disapproved = myPosts.filter(p => p.status === 'disapproved');

  const totalViews = published.reduce((s, p) => s + p.views, 0);
  const totalLikes = published.reduce((s, p) => s + p.likes, 0);
  const avgScore = published.length > 0
    ? Math.round(published.reduce((s, p) => s + (p.auditScore || 0), 0) / published.length)
    : 0;

  const currentList = activeTab === 'published' ? published : activeTab === 'drafts' ? drafts : activeTab === 'review' ? review : disapproved;

  const openPost = (post: BlogPost) => {
    setSelectedPostId(post.id);
    setCurrentPage('post');
  };

  const submitForReview = async (id: string) => {
    const ok = await confirm('Submit for Review', 'This post will be sent to the admin for review.', 'Submit');
    if (!ok) return;
    updatePost(id, { status: 'review' });
  };

  const confirmDelete = async (id: string, title: string) => {
    const ok = await confirm('Delete Post', `Are you sure you want to delete "${title}"? This cannot be undone.`, 'Delete', true);
    if (!ok) return;
    deletePost(id);
  };

  return (
    <div className="min-h-screen bg-canvas pt-16">
      <SEO title="Dashboard" description="Manage your posts and view analytics." noindex />
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-accent/15 flex items-center justify-center">
              <LayoutDashboard size={18} className="text-accent" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-primary">Dashboard</h1>
              <p className="text-xs text-secondary">Welcome back, <span className="text-primary font-medium">{user.name}</span></p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage('editor')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-surface text-secondary hover:text-primary border border-border hover:border-primary/30 transition-all min-h-11"
            >
              <PenLine size={14} />
              <span className="hidden sm:inline">Write</span>
            </button>
            <button
              onClick={() => setCurrentPage('autopost')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-accent text-[#0F0E0D] hover:bg-accent/90 shadow-sm transition-all min-h-11"
            >
              <Zap size={14} />
              <span className="hidden sm:inline">AutoPost AI</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div className="rounded-xl border border-border bg-surface p-4">
            <div className="text-secondary mb-2"><BookOpen size={14} /></div>
            <p className="text-xl font-bold text-primary tabular-nums">{published.length}</p>
            <p className="text-xs text-secondary mt-0.5">Published</p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-4">
            <div className="text-secondary mb-2"><Eye size={14} /></div>
            <p className="text-xl font-bold text-primary tabular-nums">{totalViews.toLocaleString()}</p>
            <p className="text-xs text-secondary mt-0.5">Total Views</p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-4">
            <div className="text-secondary mb-2"><Heart size={14} /></div>
            <p className="text-xl font-bold text-primary tabular-nums">{totalLikes.toLocaleString()}</p>
            <p className="text-xs text-secondary mt-0.5">Total Likes</p>
          </div>
          <div className="stat-hero rounded-xl p-4">
            <TrendingUp size={14} className="stat-icon mb-2" />
            <p className="text-xl font-bold stat-value tabular-nums">{avgScore > 0 ? `${avgScore}` : '\u2014'}</p>
            <p className="text-xs text-secondary mt-0.5">Avg. Audit Score</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 bg-surface p-1 rounded-lg border border-border w-fit">
          {([
            { key: 'published' as const, label: 'Published', count: published.length },
            { key: 'drafts' as const, label: 'Drafts', count: drafts.length },
            { key: 'review' as const, label: 'In Review', count: review.length },
            { key: 'disapproved' as const, label: 'Disapproved', count: disapproved.length },
          ]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap min-h-11 ${
                activeTab === tab.key
                  ? 'bg-accent text-[#0F0E0D] shadow-sm'
                  : 'text-secondary hover:text-primary hover:bg-raised'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`tabular-nums text-[11px] px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.key ? 'bg-black/20 text-[#0F0E0D]' : 'bg-raised text-secondary'
                }`}>{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Post list */}
        {currentList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 rounded-xl border border-border bg-surface text-center">
            <h3 className="text-sm font-semibold text-primary mb-1">
              {activeTab === 'published' ? 'No published posts yet'
                : activeTab === 'drafts' ? 'No drafts saved'
                : activeTab === 'review' ? 'Review queue is empty'
                : 'No disapproved posts'}
            </h3>
            <p className="text-xs text-secondary mb-4 max-w-sm">
              {activeTab === 'review' ? 'Posts submitted for admin review appear here.'
                : activeTab === 'disapproved' ? 'Posts rejected by the admin appear here.'
                : 'Start writing or use AutoPost AI to generate content.'}
            </p>
            {activeTab !== 'review' && activeTab !== 'disapproved' && (
              <button
                onClick={() => setCurrentPage(activeTab === 'published' ? 'autopost' : 'editor')}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-md bg-accent text-[#0F0E0D] hover:bg-accent/90 shadow-sm transition-all min-h-11"
              >
                {activeTab === 'published' ? <Zap size={14} /> : <PenLine size={14} />}
                {activeTab === 'published' ? 'AutoPost AI' : 'Open Editor'}
              </button>
            )}
          </div>
        ) : (
          <div className="bg-surface rounded-xl border border-border overflow-hidden">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 20 }}></th>
                  <th>Title</th>
                  <th style={{ width: 100 }}>Read</th>
                  <th style={{ width: 140 }}>Date</th>
                  <th style={{ width: 160 }}></th>
                </tr>
              </thead>
              <tbody>
                {currentList.map(post => (
                  <tr key={post.id}>
                    <td>
                      <span className={`status-dot ${
                        post.status === 'published' ? 'status-dot--published'
                        : post.status === 'disapproved' ? 'status-dot--disapproved'
                        : post.status === 'review' || post.status === 'quarantined' ? 'status-dot--review'
                        : 'status-dot--draft'
                      }`} />
                    </td>
                    <td className="max-w-[300px]">
                      <button
                        onClick={() => openPost(post)}
                        className="font-medium hover:text-accent transition-colors text-left text-sm"
                      >
                        {post.title}
                      </button>
                      <div className="flex items-center gap-2 text-xs text-secondary mt-0.5">
                        {post.status === 'review' && (
                          <span className="text-amber-400">Score: {post.auditScore}/100</span>
                        )}
                        {post.status === 'published' && (
                          <>
                            <span className="tabular-nums">{post.views.toLocaleString()} views</span>
                            <span className="tabular-nums">{post.likes} likes</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="text-secondary text-xs tabular-nums">{post.readTime}m</td>
                    <td className="text-secondary text-xs tabular-nums">
                      {formatDistanceToNow(new Date(post.publishedAt), { addSuffix: true })}
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        {(post.status === 'draft' || post.status === 'disapproved') && (
                          <button
                            onClick={() => submitForReview(post.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-all min-h-11"
                          >
                            <Send size={12} />
                            <span className="hidden sm:inline">{post.status === 'disapproved' ? 'Resubmit' : 'Submit'}</span>
                          </button>
                        )}
                        <button
                          onClick={() => openPost(post)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-surface text-secondary hover:text-primary border border-border hover:border-primary/30 transition-all min-h-11"
                        >
                          <Eye size={12} />
                          <span className="hidden sm:inline">View</span>
                        </button>
                        <button
                          onClick={() => confirmDelete(post.id, post.title)}
                          className="p-1.5 text-secondary hover:text-red-400 hover:bg-red-500/10 rounded-md transition-all min-h-11 min-w-11"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <ConfirmDialog />
      </div>
    </div>
  );
}
