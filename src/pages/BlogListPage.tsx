import { useState } from 'react';
import { useApp } from '../context/AppContext';
import SEO, { CollectionPageSchema } from '../components/SEO';
import { Clock, Eye, Heart, Search, Filter, TrendingUp, Shield } from 'lucide-react';
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
    <div className="min-h-screen bg-canvas pt-20 md:pt-24">
      <SEO
        title="Blog Archive"
        description={`Browse ${totalPublished} verified articles. Every one fact-checked. Every word indexed.`}
        canonical="https://luminary.blog/blog"
      />
      <CollectionPageSchema totalPosts={totalPublished} />

      <div className="border-b border-border px-4 py-8 md:py-12">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
            <div>
              <h1 className="font-heading text-3xl md:text-5xl font-bold text-primary tracking-tight">
                The Archive
              </h1>
              <p className="text-secondary text-sm md:text-lg mt-1">
                {published.length} articles. Every one verified. Every word indexed.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 max-w-lg rounded-2xl border border-border bg-surface px-4 py-2.5 focus-within:border-accent/50 transition-all duration-200 focus-within:shadow-lg focus-within:shadow-accent-glow/5">
            <Search size={15} className="text-secondary" />
            <input
              type="text"
              placeholder="Search any word across all articles…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-transparent text-primary text-sm outline-none w-full placeholder-secondary/60"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-secondary hover:text-primary text-xs shrink-0 font-medium">
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

      <div className="max-w-5xl mx-auto px-4 py-6 md:py-10">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 md:mb-8">
          <div className="flex flex-wrap gap-1.5">
            {displayTags.map(tag => (
              <button
                key={tag}
                onClick={() => setActiveTag(tag)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  activeTag === tag
                    ? 'bg-accent text-white'
                    : 'border border-border text-secondary hover:border-secondary/50 hover:text-primary'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Filter size={13} className="text-secondary" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as typeof sortBy)}
              className="bg-surface border border-border text-secondary text-xs rounded-xl px-3 py-1.5 outline-none focus:border-accent/50 transition-colors"
            >
              <option value="recent">Most Recent</option>
              <option value="popular">Most Read</option>
              <option value="quality">Highest Quality</option>
            </select>
          </div>
        </div>

        {sorted.length === 0 ? (
          <div className="text-center py-24">
            <h3 className="text-xl font-semibold text-primary mb-2">No articles found</h3>
            <p className="text-secondary">
              {searchQuery ? `No results for "${searchQuery}"` : 'No posts in this category yet.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
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
    <div className="group rounded-2xl border border-border bg-surface overflow-hidden hover:border-accent/30 transition-all duration-300 hover:shadow-lg hover:shadow-accent-glow/5">
      <div className="flex items-stretch">
        <div className="hidden sm:flex items-center justify-center w-14 md:w-18 border-r border-border shrink-0">
          <span className="text-lg md:text-2xl font-bold text-primary/10 group-hover:text-accent/30 transition-colors tabular-nums">
            {String(rank).padStart(2, '0')}
          </span>
        </div>

        {post.coverImage && (
          <div className="w-20 md:w-28 shrink-0 hidden sm:block overflow-hidden">
            <img src={post.coverImage} alt="" loading="lazy" className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" />
          </div>
        )}

        <button onClick={onClick} className="flex-1 text-left p-4 md:p-6 min-w-0">
          <div className="flex flex-wrap gap-1.5 mb-2">
            {post.tags.slice(0, 2).map(tag => (
              <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-raised text-secondary border border-border">
                {tag}
              </span>
            ))}
            {post.auditScore && post.auditScore >= 90 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-accent-soft text-accent border border-accent/20 flex items-center gap-1">
                <Shield size={10} /> Verified {post.auditScore}
              </span>
            )}
            {post.status === 'draft' && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-secondary">
                Draft
              </span>
            )}
          </div>

          <h2 className="font-heading text-base md:text-xl font-bold text-primary mb-1 md:mb-2 leading-snug group-hover:text-accent transition-colors line-clamp-2 tracking-tight">
            {post.title}
          </h2>

          <p className="hidden md:block text-sm text-secondary line-clamp-2 mb-3 leading-relaxed">
            {post.excerpt}
          </p>

          <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs text-secondary">
            <span className="font-medium text-primary truncate max-w-[120px] md:max-w-none">{post.authorName}</span>
            <span className="flex items-center gap-1"><Clock size={11} /> {post.readTime}m</span>
            <span className="flex items-center gap-1"><Eye size={11} /> {post.views.toLocaleString()}</span>
            <span className="hidden md:flex items-center gap-1"><TrendingUp size={12} /> {post.wordCount?.toLocaleString()} words</span>
            <span className="hidden md:inline text-secondary">{formatDistanceToNow(new Date(post.publishedAt), { addSuffix: true })}</span>
          </div>
        </button>

        <div className="flex items-center px-3 md:px-5 border-l border-border">
          <button
            onClick={(e) => { e.stopPropagation(); onLike(); }}
            className="flex flex-col items-center gap-0.5 text-secondary hover:text-accent transition-colors group/like"
          >
            <Heart size={14} className="group-hover/like:fill-accent transition-colors" />
            <span className="text-xs tabular-nums">{post.likes}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
