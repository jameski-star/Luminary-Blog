import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import SEO from '../components/SEO';
import { Modal, useConfirm } from '../components/Modal';
import { getStoredUsers } from '../store/appStore';
import { api, isApiMode } from '../services/api';
import {
  Shield, Users, FileText, Eye,
  Trash2, Send, Ban, User as UserIcon,
  Crown, CheckCircle, XCircle, AlertTriangle, TrendingUp
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { BlogPost, User as UserType } from '../types';
import EditorialIntelligenceReport from '../components/EditorialIntelligenceReport';

type AdminTab = 'review' | 'pending' | 'posts' | 'users';

export default function AdminPage() {
  const { user: currentUser, posts: contextPosts, updatePost, deletePost, setCurrentPage, setSelectedPostId } = useApp();
  const [users, setUsers] = useState<UserType[]>([]);
  const [adminPosts, setAdminPosts] = useState<BlogPost[]>([]);
  const [activeTab, setActiveTab] = useState<AdminTab>('pending');
  const [sortBy, setSortBy] = useState<'views' | 'likes' | 'date'>('date');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [promoteTarget, setPromoteTarget] = useState<UserType | null>(null);
  const { confirm, ConfirmDialog } = useConfirm();
  const [selectedReviewPost, setSelectedReviewPost] = useState<BlogPost | null>(null);
  const [auditLoading, setAuditLoading] = useState(false);

  const handleAdminMaintenanceCheck = async () => {
    if (!selectedReviewPost || !isApiMode()) return;
    setAuditLoading(true);
    try {
      const res = await api.posts.maintenance(selectedReviewPost.id);
      if (res.post) {
        setSelectedReviewPost(res.post as BlogPost);
        setAdminPosts(prev => prev.map(p => p.id === res.post.id ? (res.post as BlogPost) : p));
      }
    } catch (err) {
      console.error('Admin maintenance check error:', err);
    } finally {
      setAuditLoading(false);
    }
  };

  const refreshPosts = useCallback(() => {
    if (isApiMode()) {
      api.admin.posts({ status: 'all' })
        .then(res => setAdminPosts(res.posts as BlogPost[]))
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (isApiMode()) {
      api.admin.users().then(res => setUsers(res.users)).catch(() => {});
      refreshPosts();
    } else {
      setUsers(getStoredUsers());
    }
  }, []);

  const posts = isApiMode() ? adminPosts : contextPosts;

  const totalPosts = posts.length;
  const totalPublished = posts.filter(p => p.status === 'published').length;
  const totalInReview = posts.filter(p => p.status === 'review' || p.status === 'quarantined').length;
  const totalPending = posts.filter(p => p.status === 'published' && p.isApproved !== true).length;
  const totalViews = posts.reduce((s, p) => s + p.views, 0);
  const totalUsers = users.length;

  const reviewPosts = posts
    .filter(p => p.status === 'review' || p.status === 'quarantined')
    .sort((a, b) => {
      if (a.status === 'quarantined' && b.status !== 'quarantined') return -1;
      if (a.status !== 'quarantined' && b.status === 'quarantined') return 1;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });

  const pendingPosts = posts
    .filter(p => p.status === 'published' && p.isApproved !== true)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  const filteredPosts = posts
    .filter(p => statusFilter === 'all' || p.status === statusFilter)
    .sort((a, b) => {
      if (sortBy === 'views') return b.views - a.views;
      if (sortBy === 'likes') return b.likes - a.likes;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center pt-16">
        <div className="text-center max-w-md mx-auto px-4">
          <Shield size={48} className="text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-primary mb-3">Access Denied</h2>
          <p className="text-secondary mb-6">Only administrators can access this panel.</p>
          <button onClick={() => setCurrentPage('dashboard')} className="bg-accent text-canvas font-semibold px-6 py-3 rounded-xl">Go to Dashboard</button>
        </div>
      </div>
    );
  }

  const approvePost = async (id: string) => {
    if (isApiMode()) {
      try {
        const res = await api.admin.approve(id);
        setAdminPosts(prev => prev.map(p => p.id === id ? res.post as BlogPost : p));
      } catch (err) {
        console.error('Approve failed:', err);
      }
    } else {
      updatePost(id, { isApproved: true });
    }
  };

  const publishPost = async (id: string) => {
    if (isApiMode()) {
      try {
        const res = await api.admin.setStatus(id, 'published');
        setAdminPosts(prev => prev.map(p => p.id === id ? res.post as BlogPost : p));
      } catch (err) {
        console.error('Admin publish failed:', err);
      }
    } else {
      updatePost(id, { status: 'published', publishedAt: new Date().toISOString(), isApproved: true });
    }
  };

  const setPostStatus = async (id: string, status: BlogPost['status']) => {
    if (isApiMode()) {
      try {
        const res = await api.admin.setStatus(id, status);
        setAdminPosts(prev => prev.map(p => p.id === id ? res.post as BlogPost : p));
      } catch (err) {
        console.error('Admin setStatus failed:', err);
      }
    } else {
      updatePost(id, { status, ...(status === 'published' ? { isApproved: true } : {}) });
    }
  };

  const deletePostById = async (id: string, title: string) => {
    const ok = await confirm('Delete Post', `Permanently delete "${title}"? This cannot be undone.`, 'Delete', true);
    if (!ok) return;
    if (isApiMode()) {
      try {
        await api.admin.deletePost(id);
        setAdminPosts(prev => prev.filter(p => p.id !== id));
      } catch (err) {
        console.error('Admin delete failed:', err);
      }
    } else {
      deletePost(id);
    }
  };

  const banUser = async (targetId: string) => {
    try {
      if (isApiMode()) {
        await api.admin.banUser(targetId);
      }
      if (!isApiMode()) {
        const allUsers = getStoredUsers();
        const updated = allUsers.map(u => u.id === targetId ? { ...u, banned: true } : u);
        localStorage.setItem('luminary_users', JSON.stringify(updated));
      }
      setUsers(prev => prev.map(u => u.id === targetId ? { ...u, banned: true } : u));
    } catch (err) {
      console.error('Ban failed:', err);
    }
  };

  const unbanUser = async (targetId: string) => {
    try {
      if (isApiMode()) {
        await api.admin.unbanUser(targetId);
      }
      if (!isApiMode()) {
        const allUsers = getStoredUsers();
        const updated = allUsers.map(u => u.id === targetId ? { ...u, banned: false } : u);
        localStorage.setItem('luminary_users', JSON.stringify(updated));
      }
      setUsers(prev => prev.map(u => u.id === targetId ? { ...u, banned: false } : u));
    } catch (err) {
      console.error('Unban failed:', err);
    }
  };

  const getUserName = (id: string) => users.find(u => u.id === id)?.name || 'Unknown';

  return (
    <div className="min-h-screen bg-canvas pt-16">
      <SEO title="Admin Panel" description="Platform administration and content management." noindex />
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-accent/15 flex items-center justify-center">
              <Shield size={18} className="text-accent" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-primary">Admin Panel</h1>
              <p className="text-xs text-secondary">Manage posts, users, and platform content</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          <div className="stat-hero rounded-xl p-4">
            <FileText size={14} className="stat-icon mb-2" />
            <p className="text-2xl font-bold stat-value tabular-nums">{totalPosts}</p>
            <p className="text-xs text-secondary mt-0.5">Total Posts</p>
          </div>
          <StatCard icon={<TrendingUp size={14} />} label="Published" value={totalPublished} />
          <StatCard icon={<AlertTriangle size={14} />} label="In Review" value={totalInReview} />
          <StatCard icon={<Users size={14} />} label="Users" value={totalUsers} />
          <StatCard icon={<Eye size={14} />} label="Total Views" value={totalViews.toLocaleString()} />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 bg-surface p-1 rounded-lg border border-border w-fit">
          {([
            { key: 'pending' as const, label: 'Pending Approval', count: totalPending, icon: CheckCircle },
            { key: 'review' as const, label: 'Review Queue', count: totalInReview, icon: AlertTriangle },
            { key: 'posts' as const, label: 'Posts', count: totalPosts, icon: FileText },
            { key: 'users' as const, label: 'Users', count: totalUsers, icon: Users },
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
              <tab.icon size={14} />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.key === 'pending' ? 'Pending' : tab.key === 'review' ? 'Review' : tab.key === 'posts' ? 'Posts' : 'Users'}</span>
              <span className={`tabular-nums text-[11px] px-1.5 py-0.5 rounded-full ${
                activeTab === tab.key ? 'bg-black/20 text-[#0F0E0D]' : 'bg-raised text-secondary'
              }`}>{tab.count}</span>
            </button>
          ))}
        </div>

        {/* ── Review Queue Tab ── */}
        {activeTab === 'review' && (
          <div className="bg-surface rounded-xl border border-border overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-amber-500/5">
              <AlertTriangle size={14} className="text-amber-400 shrink-0" />
              <p className="text-xs text-amber-400">Posts flagged for review. Approve to publish, reject to disapprove.</p>
            </div>
            {reviewPosts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <CheckCircle size={32} className="text-emerald-400 mb-3" />
                <h3 className="text-sm font-semibold text-primary mb-1">All clear</h3>
                <p className="text-xs text-secondary">No posts currently pending review.</p>
              </div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: 20 }}></th>
                    <th>Title</th>
                    <th>Author</th>
                    <th style={{ width: 80 }}>Audit</th>
                    <th style={{ width: 140 }}>Submitted</th>
                    <th style={{ width: 200 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {reviewPosts.map(post => (
                    <tr key={post.id}>
                      <td>
                        <span className={`status-dot ${post.status === 'quarantined' ? 'status-dot--quarantined' : 'status-dot--review'}`} />
                      </td>
                      <td className="max-w-[240px] truncate font-medium">{post.title}</td>
                      <td className="text-secondary">{getUserName(post.authorId)}</td>
                      <td>
                        {post.auditScore !== undefined ? (
                          <span className={`tabular-nums font-medium ${
                            post.auditScore < 50 ? 'text-red-400' : 'text-amber-400'
                          }`}>{post.auditScore}</span>
                        ) : (
                          <span className="text-muted">&mdash;</span>
                        )}
                      </td>
                      <td className="text-secondary text-xs">
                        {formatDistanceToNow(new Date(post.publishedAt), { addSuffix: true })}
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setSelectedReviewPost(post)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-md bg-accent/15 text-accent border border-accent/25 hover:bg-accent/25 transition-all min-h-11"
                          >
                            <Shield size={12} />
                            Audit
                          </button>
                          <button
                                                        onClick={() => publishPost(post.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all min-h-11"
                          >
                            <CheckCircle size={12} />
                            Approve
                          </button>
                          <button
                            onClick={() => setPostStatus(post.id, 'disapproved')}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-surface text-secondary hover:text-primary border border-border hover:border-primary/30 transition-all min-h-11"
                          >
                            <XCircle size={12} />
                            Reject
                          </button>
                          <button
                            onClick={() => deletePostById(post.id, post.title)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md text-secondary hover:text-red-400 hover:bg-red-500/10 transition-all min-h-11 min-w-11"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── Pending Approval Tab ── */
}
        {activeTab === 'pending' && (
          <div className="bg-surface rounded-xl border border-border overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-accent/5">
              <CheckCircle size={14} className="text-accent shrink-0" />
              <p className="text-xs text-accent">Posts published without passing AI audit need admin approval before appearing publicly.</p>
            </div>
            {pendingPosts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <CheckCircle size={32} className="text-emerald-400 mb-3" />
                <h3 className="text-sm font-semibold text-primary mb-1">All approved</h3>
                <p className="text-xs text-secondary">No posts currently pending approval.</p>
              </div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: 20 }}></th>
                    <th>Title</th>
                    <th>Author</th>
                    <th style={{ width: 80 }}>Audit</th>
                    <th style={{ width: 140 }}>Submitted</th>
                    <th style={{ width: 200 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {pendingPosts.map(post => (
                    <tr key={post.id}>
                      <td><span className="status-dot status-dot--review" /></td>
                      <td className="max-w-[240px] truncate font-medium">{post.title}</td>
                      <td className="text-secondary">{getUserName(post.authorId)}</td>
                      <td>
                        {post.auditScore !== undefined ? (
                          <span className={`tabular-nums font-medium ${
                            post.auditScore < 65 ? 'text-red-400' : 'text-emerald-400'
                          }`}>{post.auditScore}</span>
                        ) : (
                          <span className="text-muted">&mdash;</span>
                        )}
                      </td>
                      <td className="text-secondary text-xs">
                        {formatDistanceToNow(new Date(post.publishedAt), { addSuffix: true })}
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => approvePost(post.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all min-h-11"
                          >
                            <CheckCircle size={12} />
                            Approve
                          </button>
                          <button
                            onClick={() => setPostStatus(post.id, 'disapproved')}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-surface text-secondary hover:text-primary border border-border hover:border-primary/30 transition-all min-h-11"
                          >
                            <XCircle size={12} />
                            Reject
                          </button>
                          <button
                            onClick={() => deletePostById(post.id, post.title)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md text-secondary hover:text-red-400 hover:bg-red-500/10 transition-all min-h-11 min-w-11"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── Posts Tab ── */}
        {activeTab === 'posts' && (
          <>
            {/* Filter bar */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex gap-1 bg-surface p-0.5 rounded-md border border-border">
                {['all', 'published', 'draft', 'review', 'quarantined'].map(s => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-all min-h-11 ${
                      statusFilter === s
                        ? 'bg-accent text-[#0F0E0D] shadow-sm'
                        : 'text-secondary hover:text-primary hover:bg-raised'
                    }`}
                  >
                    {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-secondary ml-auto">
                <span className="text-muted">Sort:</span>
                {(['date', 'views', 'likes'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setSortBy(s)}
                    className={`px-2 py-0.5 rounded transition-all min-h-11 ${
                      sortBy === s ? 'bg-raised text-primary font-medium' : 'hover:text-primary'
                    }`}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Posts table */}
            <div className="bg-surface rounded-xl border border-border overflow-hidden">
              {filteredPosts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <FileText size={32} className="text-secondary mb-3" />
                  <h3 className="text-sm font-semibold text-primary mb-1">No posts found</h3>
                  <p className="text-xs text-secondary">No posts match the current filter.</p>
                </div>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th style={{ width: 20 }}></th>
                      <th>Title</th>
                      <th>Author</th>
                      <th style={{ width: 80 }} className="tabular-nums">Views</th>
                      <th style={{ width: 80 }} className="tabular-nums">Likes</th>
                      <th style={{ width: 80 }}>Status</th>
                      <th style={{ width: 120 }}>Date</th>
                      <th style={{ width: 140 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPosts.map(post => (
                      <tr key={post.id}>
                        <td>
                          <span className={`status-dot status-dot--${post.status === 'review' || post.status === 'quarantined' ? post.status === 'quarantined' ? 'quarantined' : 'review' : post.status === 'disapproved' ? 'disapproved' : post.status}`} />
                        </td>
                        <td className="max-w-[200px] truncate">
                          <button
                            onClick={() => { setSelectedPostId(post.id); setCurrentPage('post'); }}
                            className="font-medium hover:text-accent transition-colors text-left min-h-11"
                          >
                            {post.title}
                          </button>
                        </td>
                        <td className="text-secondary text-xs">{getUserName(post.authorId)}</td>
                        <td className="tabular-nums text-secondary text-xs">{post.views.toLocaleString()}</td>
                        <td className="tabular-nums text-secondary text-xs">{post.likes}</td>
                        <td>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${
                            post.status === 'published' ? 'bg-emerald-500/10 text-emerald-400'
                            : post.status === 'draft' ? 'bg-secondary/10 text-secondary'
                            : post.status === 'review' ? 'bg-amber-500/10 text-amber-400'
                            : post.status === 'quarantined' ? 'bg-red-500/10 text-red-400'
                            : 'bg-red-500/10 text-red-400'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              post.status === 'published' ? 'bg-emerald-400'
                              : post.status === 'draft' ? 'bg-secondary'
                              : post.status === 'review' ? 'bg-amber-400'
                              : 'bg-red-400'
                            }`} />
                            {post.status === 'review' ? 'Review' : post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                          </span>
                        </td>
                        <td className="text-secondary text-xs tabular-nums">
                          {formatDistanceToNow(new Date(post.publishedAt), { addSuffix: true })}
                        </td>
                        <td>
                          <div className="flex items-center gap-1">
                            {post.status !== 'published' && (
                              <button
                                onClick={() => publishPost(post.id)}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all min-h-11"
                              >
                                <Send size={12} />
                                <span className="hidden sm:inline">Publish</span>
                              </button>
                            )}
                            <div className="relative group">
                              <button className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-surface text-secondary hover:text-primary border border-border hover:border-primary/30 transition-all min-h-11">
                                <Ban size={12} />
                                <span className="hidden sm:inline">Status</span>
                              </button>
                              <div className="absolute right-0 top-full mt-1 w-28 rounded-lg border border-border bg-surface shadow-lg overflow-hidden z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all origin-top-right">
                                {(['published', 'draft', 'review', 'quarantined'] as const).map(s => (
                                  <button
                                    key={s}
                                    onClick={() => setPostStatus(post.id, s)}
                                    className={`w-full text-left px-3 py-1.5 text-xs transition-colors hover:bg-raised min-h-11 ${
                                      post.status === s ? 'text-accent font-medium' : 'text-secondary'
                                    }`}
                                  >
                                    {s.charAt(0).toUpperCase() + s.slice(1)}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <button
                              onClick={() => deletePostById(post.id, post.title)}
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
              )}
            </div>
          </>
        )}

        {/* ── Users Tab ── */}
        {activeTab === 'users' && (
          <div className="bg-surface rounded-xl border border-border overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-amber-500/5">
              <Crown size={14} className="text-amber-400 shrink-0" />
              <p className="text-xs text-amber-400">
                <strong>Admin Recovery:</strong> Sign up a new account, then promote it here using "Make Admin".
              </p>
            </div>
            {users.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Users size={32} className="text-secondary mb-3" />
                <h3 className="text-sm font-semibold text-primary mb-1">No users yet</h3>
                <p className="text-xs text-secondary">Users will appear here once they sign up.</p>
              </div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: 24 }}></th>
                    <th>User</th>
                    <th>Role</th>
                    <th style={{ width: 80 }} className="tabular-nums">Posts</th>
                    <th style={{ width: 120 }}>Joined</th>
                    <th style={{ width: 180 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div className="w-7 h-7 rounded-full bg-accent/15 flex items-center justify-center text-xs font-bold text-accent tabular-nums">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                      </td>
                      <td>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-primary flex items-center gap-1.5">
                            {u.name}
                            {u.id === currentUser.id && (
                              <span className="text-[10px] text-accent bg-accent/10 px-1.5 py-0.5 rounded font-medium">You</span>
                            )}
                          </span>
                          <span className="text-xs text-secondary truncate max-w-[200px]">{u.email}</span>
                        </div>
                      </td>
                      <td>
                        {u.role === 'admin' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-accent/10 text-accent">
                            <Crown size={10} />
                            Admin
                          </span>
                        ) : u.banned ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-red-500/10 text-red-400">
                            <Ban size={10} />
                            Banned
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-secondary/10 text-secondary">
                            <UserIcon size={10} />
                            User
                          </span>
                        )}
                      </td>
                      <td className="tabular-nums text-secondary text-xs">
                        {u.postsCount}
                      </td>
                      <td className="text-secondary text-xs tabular-nums">
                        {formatDistanceToNow(new Date(u.joinedAt), { addSuffix: true })}
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          {u.banned ? (
                            <button
                              onClick={() => unbanUser(u.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all min-h-11"
                            >
                              <CheckCircle size={12} />
                              Unban
                            </button>
                          ) : u.id !== currentUser.id && (
                            <button
                              onClick={() => banUser(u.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all min-h-11"
                            >
                              <Ban size={12} />
                              Ban
                            </button>
                          )}
                          {u.role !== 'admin' && !u.banned && (
                            <button
                              onClick={() => setPromoteTarget(u)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-accent/10 text-accent hover:bg-accent/20 transition-all min-h-11"
                            >
                              <Crown size={12} />
                              Make Admin
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Promote Modal */}
        <Modal
          open={!!promoteTarget}
          onClose={() => setPromoteTarget(null)}
          title="Promote to Admin"
          actions={
            <>
              <button
                onClick={() => setPromoteTarget(null)}
                className="px-4 py-2 text-sm text-secondary hover:text-primary border border-border rounded-xl hover:bg-raised transition-colors min-h-11"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!promoteTarget) return;
                  try {
                    if (isApiMode()) {
                      await api.admin.promoteUser(promoteTarget.id);
                    }
                    if (!isApiMode()) {
                      const allUsers = getStoredUsers();
                      const updated = allUsers.map(u => u.id === promoteTarget.id ? { ...u, role: 'admin' as const } : u);
                      localStorage.setItem('luminary_users', JSON.stringify(updated));
                    }
                    setUsers(prev => prev.map(u => u.id === promoteTarget.id ? { ...u, role: 'admin' as const } : u));
                    setPromoteTarget(null);
                  } catch (err) {
                    console.error('Promote failed:', err);
                  }
                }}
                className="px-4 py-2 text-sm bg-accent/15 text-accent border border-accent/30 font-semibold rounded-xl hover:bg-accent/25 transition-colors min-h-11"
              >
                <Crown size={14} className="inline mr-1.5" />
                Make Admin
              </button>
            </>
          }
        >
          <p className="text-sm text-secondary">
            Promote <strong className="text-primary">{promoteTarget?.name}</strong> ({promoteTarget?.email}) to administrator?
            They will gain full access to the admin panel.
          </p>
        </Modal>

        {/* Editorial Audit Modal */}
        <Modal
          open={!!selectedReviewPost}
          onClose={() => setSelectedReviewPost(null)}
          title={`Editorial Intelligence Audit — ${selectedReviewPost?.title}`}
          size="large"
        >
          {selectedReviewPost && (
            <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
              <div className="p-4 rounded-xl border border-border bg-surface text-xs leading-relaxed max-h-36 overflow-y-auto mb-2 font-mono whitespace-pre-wrap">
                <strong className="text-primary block mb-1">Article Content Draft Preview:</strong>
                {selectedReviewPost.content}
              </div>
              {selectedReviewPost.editorialIntelligence ? (
                <EditorialIntelligenceReport 
                  report={selectedReviewPost.editorialIntelligence} 
                  onRefreshMaintenance={handleAdminMaintenanceCheck}
                  maintenanceLoading={auditLoading}
                />
              ) : (
                <div className="p-6 bg-raised rounded-2xl text-center text-xs text-secondary border border-border">
                  No detailed 20-stage report available yet. Base authenticity score: {selectedReviewPost.auditScore}/100.
                </div>
              )}
            </div>
          )}
        </Modal>
        <ConfirmDialog />
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: {
  icon: React.ReactNode; label: string; value: string | number;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="text-secondary mb-2">{icon}</div>
      <p className="text-xl font-bold text-primary tabular-nums">{value}</p>
      <p className="text-xs text-secondary mt-0.5">{label}</p>
    </div>
  );
}
