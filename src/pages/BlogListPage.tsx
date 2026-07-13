import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import SEO, { CollectionPageSchema } from '../components/SEO';
import { Clock, Eye, Heart, Search, Shield, ArrowLeft, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { BlogPost } from '../types';

const PER_PAGE = 12;

export default function BlogListPage() {
  const { posts, setCurrentPage, setSelectedPostId, likePost, searchQuery, setSearchQuery, searchResults } = useApp();
  const [activeTag, setActiveTag] = useState('All');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'quality'>('recent');
  const [page, setPage] = useState(1);

  const published = posts.filter(p => p.status === 'published' && p.isApproved !== false);
  const displayPosts = searchQuery ? searchResults : published;

  const filtered = activeTag === 'All'
    ? displayPosts
    : displayPosts.filter(p => p.tags.some(t => t === activeTag));

  const sorted = useMemo(() =>
    [...filtered].sort((a, b) => {
      if (sortBy === 'popular') return b.views - a.views;
      if (sortBy === 'quality') return (b.auditScore || 0) - (a.auditScore || 0);
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    }),
    [filtered, sortBy]
  );

  const totalPages = Math.max(1, Math.ceil(sorted.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const [hero, ...rest] = sorted;
  const featured = rest.slice(0, 3);
  const remaining = rest.slice(3);
  const paginated = remaining.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

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
      <div className="border-b border-border px-4 py-12 md:py-16">
        <div className="max-w-7xl mx-auto">
          <div className="small-caps text-xs tracking-widest text-accent mb-3">
            The Archive
          </div>
          <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-primary tracking-tight leading-[1.08] mb-3">
            Explore All Articles
          </h1>
          <p className="text-secondary text-base md:text-lg max-w-xl leading-relaxed">
            {published.length} articles. Every one verified. Every word indexed.
          </p>

          <div className="mt-6 max-w-md">
            <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-border bg-surface focus-within:border-accent/50 transition-colors">
              <Search size={14} className="text-secondary" />
              <input
                type="text"
                placeholder="Search all articles&hellip;"
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
                className="bg-transparent text-primary text-sm outline-none w-full placeholder-secondary/50"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-secondary hover:text-primary text-xs shrink-0 min-h-11 flex items-center px-1">
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

      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-10 md:mb-14">
          <div className="flex flex-wrap gap-1.5">
            {displayTags.map(tag => (
              <button
                key={tag}
                onClick={() => { setActiveTag(tag); setPage(1); }}
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
              onChange={e => { setSortBy(e.target.value as typeof sortBy); setPage(1); }}
              className="bg-surface border border-border text-secondary rounded px-3 py-2 outline-none focus:border-accent/50 transition-colors small-caps tracking-wider min-h-11"
            >
              <option value="recent">Most Recent</option>
              <option value="popular">Most Read</option>
              <option value="quality">Highest Quality</option>
            </select>
          </div>
        </div>

        {sorted.length === 0 ? (
          <div className="text-center py-20 max-w-md mx-auto">
            <h3 className="font-heading text-xl font-bold text-primary mb-2">No articles found</h3>
            <p className="text-sm text-secondary">
              {searchQuery ? `No results for &ldquo;${searchQuery}&rdquo;` : 'No posts in this category yet.'}
            </p>
          </div>
        ) : (
          <>
            {/* Hero Article — latest, full-width, image-led */}
            {hero && !searchQuery && activeTag === 'All' && sortBy === 'recent' && (
              <article className="group mb-14 md:mb-18 cursor-pointer" onClick={() => openPost(hero)}>
                {hero.coverImage && (
                  <div className="w-full aspect-[16/9] md:aspect-[2.4/1] rounded-lg overflow-hidden mb-6 bg-surface">
                    <img
                      src={hero.coverImage}
                      alt=""
                      loading="eager"
                      className="w-full h-full object-cover group-hover:scale-[1.005] transition-transform duration-700"
                    />
                  </div>
                )}
                <div className="max-w-4xl">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    {hero.tags.slice(0, 2).map(tag => (
                      <span key={tag} className="small-caps text-[10px] tracking-widest text-accent border border-accent/20 px-2.5 py-1 rounded">{tag}</span>
                    ))}
                  </div>
                  <h2 className="font-heading text-2xl md:text-4xl lg:text-5xl font-bold text-primary leading-[1.08] mb-3 group-hover:text-accent transition-colors duration-300">
                    {hero.title}
                  </h2>
                  <p className="text-secondary text-base md:text-lg leading-relaxed max-w-2xl mb-4">
                    {hero.excerpt}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-xs small-caps tracking-wider text-secondary">
                    <span className="text-accent font-medium">{hero.authorName}</span>
                    <span className="text-secondary/40">&middot;</span>
                    <span className="tabular-nums flex items-center gap-1"><Clock size={10} />{hero.readTime}m</span>
                    <span className="text-secondary/40">&middot;</span>
                    <span className="tabular-nums">{formatDistanceToNow(new Date(hero.publishedAt), { addSuffix: true })}</span>
                  </div>
                </div>
              </article>
            )}

            {/* Featured grid — 3 highlighted articles */}
            {featured.length > 0 && !searchQuery && (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <span className="small-caps text-[10px] tracking-widest text-accent">Featured Stories</span>
                  <span className="h-px flex-1 bg-border" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 mb-14 md:mb-18">
                  {featured.map(post => (
                    <article
                      key={post.id}
                      className="group cursor-pointer"
                      onClick={() => openPost(post)}
                    >
                      {post.coverImage && (
                        <div className="w-full aspect-[16/9] rounded-lg overflow-hidden mb-3 bg-surface">
                          <img
                            src={post.coverImage}
                            alt=""
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                          />
                        </div>
                      )}
                      <div className={post.coverImage ? '' : 'pt-1'}>
                        <div className="flex flex-wrap gap-1.5 mb-1.5">
                          {post.tags.slice(0, 1).map(tag => (
                            <span key={tag} className="small-caps text-[9px] tracking-widest text-accent/70">{tag}</span>
                          ))}
                        </div>
                        <h3 className="font-heading text-base md:text-lg font-semibold text-primary leading-snug mb-1.5 group-hover:text-accent transition-colors duration-200 line-clamp-3">
                          {post.title}
                        </h3>
                        <p className="text-xs md:text-sm text-secondary leading-relaxed line-clamp-2 mb-2">
                          {post.excerpt}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] small-caps tracking-wider text-secondary">
                          <span>{post.authorName}</span>
                          <span className="text-secondary/40">&middot;</span>
                          <span className="tabular-nums">{post.readTime}m</span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            )}

            {/* Remaining articles grid */}
            {paginated.length > 0 && (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <span className="small-caps text-[10px] tracking-widest text-accent">More Articles</span>
                  <span className="h-px flex-1 bg-border" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 md:gap-x-8 gap-y-8 md:gap-y-10">
                  {paginated.map(post => (
                    <article
                      key={post.id}
                      className="group cursor-pointer"
                      onClick={() => openPost(post)}
                    >
                      {post.coverImage ? (
                        <>
                          <div className="w-full aspect-[16/9] rounded-lg overflow-hidden mb-3 bg-surface">
                            <img
                              src={post.coverImage}
                              alt=""
                              loading="lazy"
                              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                            />
                          </div>
                          <div className="flex flex-wrap gap-1 mb-1.5">
                            {post.tags.slice(0, 2).map(tag => (
                              <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-surface text-secondary border border-border">{tag}</span>
                            ))}
                            {post.auditScore && post.auditScore >= 90 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-soft text-accent border border-accent/20 flex items-center gap-1">
                                <Shield size={8} /> Verified
                              </span>
                            )}
                          </div>
                          <h3 className="font-heading text-sm md:text-base font-semibold text-primary leading-snug mb-1 group-hover:text-accent transition-colors duration-200 line-clamp-2">
                            {post.title}
                          </h3>
                          <p className="text-xs md:text-sm text-secondary leading-relaxed line-clamp-2 mb-2">
                            {post.excerpt}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 text-[10px] small-caps tracking-wider text-secondary">
                            <span>{post.authorName}</span>
                            <span className="text-secondary/40">&middot;</span>
                            <span className="tabular-nums">{post.readTime}m</span>
                            <span className="text-secondary/40">&middot;</span>
                            <span className="tabular-nums flex items-center gap-1"><Eye size={9} />{post.views.toLocaleString()}</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex flex-wrap gap-1 mb-1.5">
                            {post.tags.slice(0, 2).map(tag => (
                              <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-surface text-secondary border border-border">{tag}</span>
                            ))}
                            {post.auditScore && post.auditScore >= 90 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-soft text-accent border border-accent/20 flex items-center gap-1">
                                <Shield size={8} /> Verified
                              </span>
                            )}
                          </div>
                          <h3 className="font-heading text-sm md:text-base font-semibold text-primary leading-snug mb-1 group-hover:text-accent transition-colors duration-200 line-clamp-2">
                            {post.title}
                          </h3>
                          <p className="text-xs md:text-sm text-secondary leading-relaxed line-clamp-3 mb-3">
                            {post.excerpt}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 text-[10px] small-caps tracking-wider text-secondary">
                            <span>{post.authorName}</span>
                            <span className="text-secondary/40">&middot;</span>
                            <span className="tabular-nums">{post.readTime}m</span>
                            <span className="text-secondary/40">&middot;</span>
                            <span className="tabular-nums flex items-center gap-1"><Eye size={9} />{post.views.toLocaleString()}</span>
                          </div>

                          {/* Like inline */}
                          <div className="mt-3 pt-3 border-t border-border flex items-center gap-3">
                            <button
                              onClick={(e) => { e.stopPropagation(); likePost(post.id); }}
                              className="flex items-center gap-1.5 text-secondary hover:text-accent transition-colors text-xs min-h-11"
                            >
                              <Heart size={11} />
                              <span className="tabular-nums">{post.likes}</span>
                            </button>
                            <span className="text-[10px] text-secondary/50 tabular-nums">
                              {formatDistanceToNow(new Date(post.publishedAt), { addSuffix: true })}
                            </span>
                          </div>
                        </>
                      )}
                    </article>
                  ))}
                </div>
              </>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-14 md:mt-18 pt-8 md:pt-10 border-t border-border flex items-center justify-between">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                  className="flex items-center gap-1.5 text-xs small-caps tracking-wider text-secondary hover:text-accent transition-colors disabled:opacity-30 disabled:pointer-events-none min-h-11"
                >
                  <ArrowLeft size={12} />
                  Previous
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                    <button
                      key={n}
                      onClick={() => setPage(n)}
                      className={`w-8 h-8 rounded text-xs font-medium transition-colors tabular-nums ${
                        n === safePage
                          ? 'bg-accent text-canvas'
                          : 'text-secondary hover:text-primary hover:bg-surface'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                  className="flex items-center gap-1.5 text-xs small-caps tracking-wider text-secondary hover:text-accent transition-colors disabled:opacity-30 disabled:pointer-events-none min-h-11"
                >
                  Next
                  <ArrowRight size={12} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
