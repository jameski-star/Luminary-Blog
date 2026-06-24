import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import SEO from '../components/SEO';
import { getStoredUsers } from '../store/appStore';
import { api, isApiMode } from '../services/api';
import {
  Shield, Users, FileText, Eye, Heart, TrendingUp,
  Trash2, Send, Clock, AlertTriangle, Ban, User as UserIcon,
  ArrowUpDown
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { BlogPost, User as UserType } from '../types';

type AdminTab = 'posts' | 'users';

export default function AdminPage() {
  const { user: currentUser, posts, updatePost, deletePost, setCurrentPage, setSelectedPostId } = useApp();
  const [users, setUsers] = useState<UserType[]>([]);

  useEffect(() => {
    if (isApiMode()) {
      api.admin.users().then(res => setUsers(res.users)).catch(() => {});
    } else {
      setUsers(getStoredUsers());
    }
  }, []);

  const user = currentUser;

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center pt-16">
        <div className="text-center max-w-md mx-auto px-4">
          <Shield size={48} className="text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-primary mb-3">Access Denied</h2>
          <p className="text-secondary mb-6">Only administrators can access this panel.</p>
          <button onClick={() => setCurrentPage('dashboard')} className="bg-primary text-canvas font-semibold px-6 py-3 rounded-xl">Go to Dashboard</button>
        </div>
      </div>
    );
  }

  const [activeTab, setActiveTab] = useState<AdminTab>('posts');
  const [sortBy, setSortBy] = useState<'views' | 'likes' | 'date'>('date');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const totalPosts = posts.length;
  const totalPublished = posts.filter(p => p.status === 'published').length;
  const totalDrafts = posts.filter(p => p.status === 'draft').length;
  const totalInReview = posts.filter(p => p.status === 'review' || p.status === 'quarantined').length;
  const totalViews = posts.reduce((s, p) => s + p.views, 0);
  const totalLikes = posts.reduce((s, p) => s + p.likes, 0);
  const totalUsers = users.length;

  const filteredPosts = posts
    .filter(p => statusFilter === 'all' || p.status === statusFilter)
    .sort((a, b) => {
      if (sortBy === 'views') return b.views - a.views;
      if (sortBy === 'likes') return b.likes - a.likes;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });

  const confirmDelete = (id: string, title: string) => {
    if (window.confirm(`Delete "${title}"? This cannot be undone.`)) {
      deletePost(id);
    }
  };

  const publishPost = (id: string) => {
    updatePost(id, { status: 'published', publishedAt: new Date().toISOString() });
  };

  const setPostStatus = (id: string, status: BlogPost['status']) => {
    updatePost(id, { status });
  };

  return (
    <div className="min-h-screen bg-canvas pt-20">
      <SEO title="Admin Panel" description="Platform administration and content management." noindex />
      <div className="max-w-6xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <h1 className="font-heading text-4xl font-bold text-primary mb-2 flex items-center gap-3">
              <Shield size={28} className="text-amber-400" />
              Admin Panel
            </h1>
            <p className="text-secondary">
              Manage all posts, users, and platform content from one place
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <StatCard icon={<FileText size={18} />} label="Total Posts" value={totalPosts} />
          <StatCard icon={<TrendingUp size={18} />} label="Published" value={totalPublished} highlighted />
          <StatCard icon={<Eye size={18} />} label="Total Views" value={totalViews.toLocaleString()} />
          <StatCard icon={<Heart size={18} />} label="Total Likes" value={totalLikes.toLocaleString()} />
          <StatCard icon={<FileText size={18} />} label="Drafts" value={totalDrafts} />
          <StatCard icon={<AlertTriangle size={18} />} label="In Review" value={totalInReview} />
          <StatCard icon={<Users size={18} />} label="Total Users" value={totalUsers} />
          <StatCard icon={<TrendingUp size={18} />} label="Avg. Views/Post" value={totalPosts > 0 ? Math.round(totalViews / totalPosts).toLocaleString() : '0'} />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-surface p-1 rounded-2xl border border-border w-fit">
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'posts'
                ? 'bg-primary text-canvas'
                : 'text-secondary hover:text-primary'
            }`}
          >
            <FileText size={15} />
            Posts
            <span className={`text-xs rounded-full px-2 py-0.5 ${
              activeTab === 'posts' ? 'bg-canvas/20 text-canvas' : 'bg-raised text-secondary'
            }`}>{totalPosts}</span>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'users'
                ? 'bg-primary text-canvas'
                : 'text-secondary hover:text-primary'
            }`}
          >
            <Users size={15} />
            Users
            <span className={`text-xs rounded-full px-2 py-0.5 ${
              activeTab === 'users' ? 'bg-canvas/20 text-canvas' : 'bg-raised text-secondary'
            }`}>{totalUsers}</span>
          </button>
        </div>

        {/* Posts Tab */}
        {activeTab === 'posts' && (
          <>
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <div className="flex gap-1 bg-surface p-1 rounded-xl border border-border">
                {['all', 'published', 'draft', 'review', 'quarantined'].map(s => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      statusFilter === s
                        ? 'bg-primary text-canvas'
                        : 'text-secondary hover:text-primary'
                    }`}
                  >
                    {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 text-xs text-secondary">
                <ArrowUpDown size={12} />
                <span className="text-secondary">Sort:</span>
                {(['date', 'views', 'likes'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setSortBy(s)}
                    className={`px-2 py-1 rounded-md transition-all ${
                      sortBy === s ? 'bg-raised text-primary font-medium' : 'hover:text-primary'
                    }`}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Posts Table */}
            {filteredPosts.length === 0 ? (
              <div className="text-center py-20 rounded-3xl border border-border bg-surface">
                <FileText size={32} className="text-secondary mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-primary mb-2">No posts found</h3>
                <p className="text-secondary text-sm">No posts match the current filter.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredPosts.map(post => (
                  <AdminPostRow
                    key={post.id}
                    post={post}
                    authorName={users.find(u => u.id === post.authorId)?.name || post.authorName}
                    onOpen={() => { setSelectedPostId(post.id); setCurrentPage('post'); }}
                    onPublish={() => publishPost(post.id)}
                    onDelete={() => confirmDelete(post.id, post.title)}
                    onStatusChange={(status) => setPostStatus(post.id, status)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <>
            {users.length === 0 ? (
              <div className="text-center py-20 rounded-3xl border border-border bg-surface">
                <Users size={32} className="text-secondary mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-primary mb-2">No users yet</h3>
                <p className="text-secondary text-sm">Users will appear here once they sign up.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {users.map(u => (
                  <AdminUserRow key={u.id} user={u} postsCount={posts.filter(p => p.authorId === u.id).length} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, highlighted }: {
  icon: React.ReactNode; label: string; value: string | number; highlighted?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className={`mb-3 ${highlighted ? 'text-primary' : 'text-secondary'}`}>{icon}</div>
      <p className="text-2xl font-bold text-primary mb-1">{value}</p>
      <p className="text-xs text-secondary">{label}</p>
    </div>
  );
}

function AdminPostRow({ post, authorName, onOpen, onPublish, onDelete, onStatusChange }: {
  post: BlogPost;
  authorName: string;
  onOpen: () => void;
  onPublish: () => void;
  onDelete: () => void;
  onStatusChange: (status: BlogPost['status']) => void;
}) {
  const statusColors: Record<string, string> = {
    published: 'bg-emerald-500/10 text-emerald-400',
    draft: 'bg-secondary/10 text-secondary',
    review: 'bg-amber-500/10 text-amber-400',
    quarantined: 'bg-red-500/10 text-red-400',
  };

  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden hover:border-primary/20 transition-all group">
      <div className="flex items-center gap-4 p-4">
        <div className={`w-2 h-2 rounded-full shrink-0 ${
          post.status === 'published' ? 'bg-emerald-400'
          : post.status === 'draft' ? 'bg-secondary'
          : post.status === 'review' ? 'bg-amber-400'
          : 'bg-red-400'
        }`} />

        <button onClick={onOpen} className="flex-1 text-left min-w-0">
          <h3 className="text-sm font-semibold text-primary group-hover:text-primary/80 transition-colors truncate mb-1">
            {post.title}
          </h3>
          <div className="flex flex-wrap items-center gap-3 text-xs text-secondary">
            <span className={`px-2 py-0.5 rounded-full text-xs ${statusColors[post.status] || ''}`}>
              {post.status === 'review' ? 'In Review' : post.status.charAt(0).toUpperCase() + post.status.slice(1)}
            </span>
            <span className="flex items-center gap-1"><UserIcon size={10} /> {authorName}</span>
            <span className="flex items-center gap-1"><Clock size={10} /> {post.readTime}m read</span>
            <span className="flex items-center gap-1"><Eye size={10} /> {post.views.toLocaleString()}</span>
            <span className="flex items-center gap-1"><Heart size={10} /> {post.likes}</span>
            {post.auditScore !== undefined && (
              <span className="flex items-center gap-1">
                <TrendingUp size={10} />
                Score: {post.auditScore}/100
              </span>
            )}
            <span>{formatDistanceToNow(new Date(post.publishedAt), { addSuffix: true })}</span>
          </div>
        </button>

        <div className="flex items-center gap-2 shrink-0">
          {post.status !== 'published' && (
            <button
              onClick={onPublish}
              className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors px-3 py-1.5 rounded-lg border border-emerald-500/30 hover:border-emerald-400/50"
            >
              <Send size={12} />
              Publish
            </button>
          )}
          <div className="relative group/status">
            <button className="flex items-center gap-1 text-xs text-secondary hover:text-primary transition-colors px-2 py-1.5 rounded-lg border border-border hover:border-primary/30">
              <Ban size={12} />
              Status
            </button>
            <div className="absolute right-0 top-8 w-36 rounded-xl border border-border bg-surface shadow-2xl overflow-hidden z-50 opacity-0 invisible group-hover/status:opacity-100 group-hover/status:visible transition-all">
              {(['published', 'draft', 'review', 'quarantined'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => onStatusChange(s)}
                  className={`w-full text-left px-3 py-2 text-xs transition-colors hover:bg-raised ${
                    post.status === s ? 'text-primary font-medium' : 'text-secondary'
                  }`}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={onDelete}
            className="text-secondary hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-950/30"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminUserRow({ user, postsCount }: { user: UserType; postsCount: number }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 hover:border-primary/20 transition-all">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary shrink-0">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-primary">{user.name}</span>
            {user.role === 'admin' && (
              <span className="text-xs bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full font-medium">Admin</span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-secondary mt-0.5">
            <span>{user.email}</span>
            <span className="flex items-center gap-1"><FileText size={10} /> {postsCount} posts</span>
            <span>Joined {formatDistanceToNow(new Date(user.joinedAt), { addSuffix: true })}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
