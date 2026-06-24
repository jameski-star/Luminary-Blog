import { useState } from 'react';
import { useApp } from '../context/AppContext';
import SEO, { CollectionPageSchema } from '../components/SEO';
import { Clock, Eye, Heart, Search, Filter, TrendingUp, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { BlogPost } from '../types';

export default function BlogListPage() {
  const { posts, setCurrentPage, setSelectedPostId, likePost, searchQuery, setSearchQuery, searchResults } = useApp();
  const [activeTag, setActiveTag] = useState('All');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'quality'>('recent');

  const published = posts.filter(p => p.status === 'published');

  const displayPosts = searchQuery ? searchResults : published;

  const filtered = activeTag === 'All'
    ? displayPosts
    : displayPosts.filter(p => p.tags.some(t => t === activeTag));

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'popular') return b.views - a.views;
    if (sortBy === 'quality') return (b.auditScore || 0) - (a.auditScore || 0);
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });

  const openPost = (post: BlogPost) => {
    setSelectedPostId(post.id);
    setCurrentPage('post');
  };

  const uniqueTags = Array.from(new Set(published.flatMap(p => p.tags)));
  const displayTags = ['All', ...uniqueTags.slice(0, 8)];

  const totalPublished = published.length;

  return (
    <div className="min-h-screen bg-canvas pt-20">
      <SEO
        title="Blog Archive"
        description={`Browse ${totalPublished} verified articles. Every one fact-checked. Every word indexed.`}
        canonical="https://luminary.blog/blog"
      />
      <CollectionPageSchema totalPosts={totalPublished} />
      {/* Header */}
      <div className="border-b border-border px-4 py-10">
        <div className="max-w-5xl mx-auto">
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-primary mb-3">
            The Archive
          </h1>
          <p className="text-secondary text-lg mb-6">
            {published.length} articles. Every one verified. Every word indexed.
          </p>

          {/* Search */}
          <div className="flex items-center gap-2 max-w-lg rounded-2xl border border-border bg-surface px-4 py-3 focus-within:border-primary/50 transition-colors">
            <Search size={16} className="text-secondary" />
            <input
              type="text"
              placeholder="Search any word across all articles…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-transparent text-primary text-sm outline-none w-full placeholder-secondary"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-secondary hover:text-primary text-xs">
                Clear
              </button>
            )}
          </div>

          {searchQuery && (
            <p className="text-sm text-secondary mt-2">
              {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{searchQuery}"
            </p>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex flex-wrap gap-2">
            {displayTags.map(tag => (
              <button
                key={tag}
                onClick={() => setActiveTag(tag)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  activeTag === tag
                    ? 'bg-primary text-canvas'
                    : 'border border-border text-secondary hover:border-primary/40 hover:text-primary'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Filter size={14} className="text-secondary" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as typeof sortBy)}
              className="bg-surface border border-border text-secondary text-xs rounded-lg px-3 py-1.5 outline-none focus:border-primary/50"
            >
              <option value="recent">Most Recent</option>
              <option value="popular">Most Read</option>
              <option value="quality">Highest Quality</option>
            </select>
          </div>
        </div>

        {/* Posts */}
        {sorted.length === 0 ? (
          <div className="text-center py-24">
            <h3 className="text-xl font-semibold text-primary mb-2">No articles found</h3>
            <p className="text-secondary">
              {searchQuery ? `No results for "${searchQuery}"` : 'No posts in this category yet.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sorted.map((post, idx) => (
              <BlogRow key={post.id} post={post} rank={idx + 1} onClick={() => openPost(post)} onLike={() => likePost(post.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BlogRow({ post, rank, onClick, onLike }: {
  post: BlogPost; rank: number; onClick: () => void; onLike: () => void;
}) {
  return (
    <div className="group rounded-2xl border border-border bg-surface overflow-hidden hover:border-primary/30 transition-all duration-300">
      <div className="flex items-stretch">
        {/* Rank */}
        <div className="hidden sm:flex items-center justify-center w-16 border-r border-border shrink-0">
          <span className="text-2xl font-bold text-raised group-hover:text-muted transition-colors">
            {String(rank).padStart(2, '0')}
          </span>
        </div>

        {/* Content */}
        <button onClick={onClick} className="flex-1 text-left p-6">
          <div className="flex flex-wrap gap-2 mb-3">
            {post.tags.slice(0, 2).map(tag => (
              <span key={tag} className="text-xs px-2.5 py-0.5 rounded-full bg-raised text-secondary">
                {tag}
              </span>
            ))}
            {post.auditScore && post.auditScore >= 90 && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-muted flex items-center gap-1">
                <Zap size={10} /> Verified {post.auditScore}/100
              </span>
            )}
            {post.status === 'draft' && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-muted text-secondary">
                Draft
              </span>
            )}
          </div>

          <h2 className="font-heading text-xl md:text-2xl font-bold text-primary mb-2 leading-snug group-hover:text-primary/80 transition-colors">
            {post.title}
          </h2>

          <p className="text-sm text-secondary line-clamp-2 mb-4 leading-relaxed">
            {post.excerpt}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs text-secondary">
            <span className="font-medium text-primary">{post.authorName}</span>
            <span className="flex items-center gap-1"><Clock size={11} /> {post.readTime} min read</span>
            <span className="flex items-center gap-1"><Eye size={11} /> {post.views.toLocaleString()}</span>
            <span className="flex items-center gap-1"><TrendingUp size={11} /> {post.wordCount?.toLocaleString()} words</span>
            <span>{formatDistanceToNow(new Date(post.publishedAt), { addSuffix: true })}</span>
          </div>
        </button>

        {/* Like */}
        <div className="flex items-center px-4 border-l border-border">
          <button
            onClick={(e) => { e.stopPropagation(); onLike(); }}
            className="flex flex-col items-center gap-1 text-secondary hover:text-red-400 transition-colors group/like"
          >
            <Heart size={16} className="group-hover/like:fill-red-400 transition-colors" />
            <span className="text-xs">{post.likes}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
