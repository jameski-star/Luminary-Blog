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

  const published = posts.filter(p => p.status === 'published' && p.isApproved !== false);

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
      <div className="border-b border-border px-4 py-6 md:py-10">
        <div className="max-w-5xl mx-auto">
          <h1 className="font-heading text-2xl md:text-5xl font-bold text-primary mb-1 md:mb-3">
            The Archive
          </h1>
          <p className="text-secondary text-sm md:text-lg mb-4 md:mb-6">
            {published.length} articles. Every one verified. Every word indexed.
          </p>

          {/* Search */}
          <div className="flex items-center gap-1.5 md:gap-2 max-w-lg rounded-xl md:rounded-2xl border border-border bg-surface px-3 md:px-4 py-2 md:py-3 focus-within:border-primary/50 transition-colors">
            <Search size={14} className="text-secondary" />
            <input
              type="text"
              placeholder="Search any word across all articles…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-transparent text-primary text-xs md:text-sm outline-none w-full placeholder-secondary"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-secondary hover:text-primary text-[10px] md:text-xs shrink-0">
                Clear
              </button>
            )}
          </div>

          {searchQuery && (
            <p className="text-[10px] md:text-sm text-secondary mt-1 md:mt-2">
              {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{searchQuery}"
            </p>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-4 md:py-8">
        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 md:gap-4 mb-4 md:mb-8">
          <div className="flex flex-wrap gap-1.5 md:gap-2">
            {displayTags.map(tag => (
              <button
                key={tag}
                onClick={() => setActiveTag(tag)}
                className={`px-2 md:px-3 py-1 md:py-1.5 rounded-full text-[10px] md:text-xs font-medium transition-all ${
                  activeTag === tag
                    ? 'bg-primary text-canvas'
                    : 'border border-border text-secondary hover:border-primary/40 hover:text-primary'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 md:gap-2">
            <Filter size={12} className="text-secondary" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as typeof sortBy)}
              className="bg-surface border border-border text-secondary text-[10px] md:text-xs rounded-lg px-2 md:px-3 py-1 md:py-1.5 outline-none focus:border-primary/50"
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
    <div className="group rounded-xl md:rounded-2xl border border-border bg-surface overflow-hidden hover:border-primary/30 transition-all duration-300">
      <div className="flex items-stretch">
        {/* Rank */}
        <div className="hidden sm:flex items-center justify-center w-12 md:w-16 border-r border-border shrink-0">
          <span className="text-lg md:text-2xl font-bold text-raised group-hover:text-muted transition-colors">
            {String(rank).padStart(2, '0')}
          </span>
        </div>

        {/* Cover Thumbnail */}
        {post.coverImage && (
          <div className="w-16 md:w-24 shrink-0 hidden sm:block">
            <img src={post.coverImage} alt="" className="w-full h-full object-cover" />
          </div>
        )}

        {/* Content */}
        <button onClick={onClick} className="flex-1 text-left p-3 md:p-6 min-w-0">
          <div className="flex flex-wrap gap-1.5 md:gap-2 mb-1.5 md:mb-3">
            {post.tags.slice(0, 2).map(tag => (
              <span key={tag} className="text-[10px] md:text-xs px-1.5 md:px-2.5 py-0.5 rounded-full bg-raised text-secondary">
                {tag}
              </span>
            ))}
            {post.auditScore && post.auditScore >= 90 && (
              <span className="text-[10px] md:text-xs px-1.5 md:px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-muted flex items-center gap-1">
                <Zap size={8} /> Verified {post.auditScore}/100
              </span>
            )}
            {post.status === 'draft' && (
              <span className="text-[10px] md:text-xs px-1.5 md:px-2.5 py-0.5 rounded-full bg-muted text-secondary">
                Draft
              </span>
            )}
          </div>

          <h2 className="font-heading text-sm md:text-2xl font-bold text-primary mb-1 md:mb-2 leading-snug group-hover:text-primary/80 transition-colors line-clamp-2 md:line-clamp-none">
            {post.title}
          </h2>

          <p className="hidden md:block text-sm text-secondary line-clamp-2 mb-4 leading-relaxed">
            {post.excerpt}
          </p>

          <div className="flex flex-wrap items-center gap-2 md:gap-4 text-[10px] md:text-xs text-secondary">
            <span className="font-medium text-primary truncate max-w-[100px] md:max-w-none">{post.authorName}</span>
            <span className="flex items-center gap-0.5 md:gap-1"><Clock size={9} /> {post.readTime}m</span>
            <span className="flex items-center gap-0.5 md:gap-1"><Eye size={9} /> {post.views.toLocaleString()}</span>
            <span className="hidden md:flex items-center gap-1"><TrendingUp size={11} /> {post.wordCount?.toLocaleString()} words</span>
            <span className="hidden md:inline">{formatDistanceToNow(new Date(post.publishedAt), { addSuffix: true })}</span>
          </div>
        </button>

        {/* Like */}
        <div className="flex items-center px-2 md:px-4 border-l border-border">
          <button
            onClick={(e) => { e.stopPropagation(); onLike(); }}
            className="flex flex-col items-center gap-0.5 md:gap-1 text-secondary hover:text-red-400 transition-colors group/like"
          >
            <Heart size={13} className="group-hover/like:fill-red-400 transition-colors" />
            <span className="text-[10px] md:text-xs">{post.likes}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
