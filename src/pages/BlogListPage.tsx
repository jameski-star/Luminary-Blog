import { useState } from 'react';
import { useApp } from '../context/AppContext';
import SEO, { CollectionPageSchema } from '../components/SEO';
import { Clock, Eye, Heart, Search, TrendingUp, Shield } from 'lucide-react';
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
        title="Archive &mdash; Luminary Blog"
        description={`Browse ${totalPublished} verified articles. Every one fact-checked. Every word indexed.`}
        canonical="https://luminary.blog/blog"
      />
      <CollectionPageSchema totalPosts={totalPublished} />

      {/* Magazine-style header */}
      <div className="border-b border-border px-4 py-10 md:py-14">
        <div className="max-w-5xl mx-auto">
          <div className="small-caps text-xs tracking-widest text-accent mb-2">
            The Archive
          </div>
          <h1 className="font-heading text-3xl md:text-5xl font-bold text-primary tracking-tight mb-2">
            Explore All Articles
          </h1>
          <p className="text-sm md:text-base text-secondary max-w-lg">
            {published.length} articles. Every one verified. Every word indexed.
          </p>

          <div className="mt-6 max-w-md">
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-surface focus-within:border-accent/50 transition-colors">
              <Search size={14} className="text-secondary" />
              <input
                type="text"
                placeholder="Search all articles&hellip;"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-transparent text-primary text-sm outline-none w-full placeholder-secondary/50"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-secondary hover:text-primary text-xs shrink-0">
                  Clear
                </button>
              )}
            </div>
            {searchQuery && (
              <p className="text-xs text-secondary mt-1.5">
                {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for &ldquo;{searchQuery}&rdquo;
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8 md:mb-10">
          <div className="flex flex-wrap gap-1.5">
            {displayTags.map(tag => (
              <button
                key={tag}
                onClick={() => setActiveTag(tag)}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-all min-h-11 ${
                  activeTag === tag
                    ? 'bg-accent text-canvas'
                    : 'bg-surface text-secondary hover:text-primary border border-border'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs text-secondary">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as typeof sortBy)}
              className="bg-surface border border-border text-secondary rounded px-3 py-2 outline-none focus:border-accent/50 transition-colors small-caps tracking-wider min-h-11"
            >
              <option value="recent">Most Recent</option>
              <option value="popular">Most Read</option>
              <option value="quality">Highest Quality</option>
            </select>
          </div>
        </div>

        {/* Article List — stacked magazine style */}
        {sorted.length === 0 ? (
          <div className="text-center py-20 max-w-md mx-auto">
            <h3 className="font-heading text-xl font-bold text-primary mb-2">No articles found</h3>
            <p className="text-sm text-secondary">
              {searchQuery ? `No results for &ldquo;${searchQuery}&rdquo;` : 'No posts in this category yet.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {sorted.map((post, idx) => (
              <div key={post.id} className="group py-5 md:py-6 first:pt-0 last:pb-0">
                <div className="flex items-stretch gap-4 md:gap-6">
                  {/* Rank */}
                  <div className="hidden sm:flex items-start pt-1 w-8 shrink-0">
                    <span className="font-heading text-base font-bold text-primary/10 group-hover:text-accent/20 transition-colors tabular-nums">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                  </div>

                  {/* Thumbnail */}
                  {post.coverImage && (
                    <div className="w-20 h-20 md:w-24 md:h-24 shrink-0 rounded-lg overflow-hidden bg-surface aspect-square">
                      <img src={post.coverImage} alt="" loading="lazy" className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500" />
                    </div>
                  )}

                  {/* Content */}
                  <button onClick={() => openPost(post)} className="flex-1 text-left min-w-0 cursor-pointer">
                    <div className="flex flex-wrap gap-1.5 mb-1">
                      {post.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="text-xs px-2 py-0.5 rounded bg-surface text-secondary border border-border">
                          {tag}
                        </span>
                      ))}
                      {post.auditScore && post.auditScore >= 90 && (
                        <span className="text-xs px-2 py-0.5 rounded bg-accent-soft text-accent border border-accent/20 flex items-center gap-1">
                          <Shield size={9} /> Verified
                        </span>
                      )}
                      {post.status === 'draft' && (
                        <span className="text-xs px-2 py-0.5 rounded bg-muted text-secondary">
                          Draft
                        </span>
                      )}
                    </div>

                    <h2 className="font-heading text-sm md:text-lg font-semibold text-primary group-hover:text-accent transition-colors leading-snug mb-1 line-clamp-2">
                      {post.title}
                    </h2>

                    <p className="text-xs md:text-sm text-secondary line-clamp-2 leading-relaxed mb-2">
                      {post.excerpt}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-secondary small-caps tracking-wider">
                      <span>{post.authorName}</span>
                      <span className="text-secondary/40">&middot;</span>
                      <span className="tabular-nums flex items-center gap-1"><Clock size={9} />{post.readTime}m</span>
                      <span className="text-secondary/40">&middot;</span>
                      <span className="tabular-nums flex items-center gap-1"><Eye size={9} />{post.views.toLocaleString()}</span>
                      <span className="text-secondary/40 hidden sm:inline">&middot;</span>
                      <span className="hidden sm:inline tabular-nums">{formatDistanceToNow(new Date(post.publishedAt), { addSuffix: true })}</span>
                    </div>
                  </button>

                  {/* Like */}
                  <div className="flex items-center">
                    <button
                      onClick={(e) => { e.stopPropagation(); likePost(post.id); }}
                      className="flex flex-col items-center gap-0.5 text-secondary hover:text-accent transition-colors group/like px-1"
                    >
                      <Heart size={13} className="group-hover/like:fill-accent transition-colors" />
                      <span className="text-xs tabular-nums">{post.likes}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
