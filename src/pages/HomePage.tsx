import { useApp } from '../context/AppContext';
import SEO, { OrganizationSchema } from '../components/SEO';
import { ArrowRight, Clock, Eye, Heart, TrendingUp, Shield, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { BlogPost } from '../types';

export default function HomePage() {
  const { posts, setCurrentPage, setSelectedPostId, likePost, geminiKey, setCurrentPage: navTo } = useApp();

  const published = posts.filter(p => p.status === 'published' && p.isApproved !== false);
  const featured = published[0];
  const recent = published.slice(1, 7);
  const topPosts = [...published].sort((a, b) => b.views - a.views).slice(0, 3);

  const openPost = (post: BlogPost) => {
    setSelectedPostId(post.id);
    setCurrentPage('post');
  };

  return (
    <div className="min-h-screen bg-canvas">
      <SEO
        title="Luminary &mdash; Premium AI-Powered Publishing"
        description="Every article passes a 4-stage authenticity pipeline. Premium prose. No filler. No AI clich&eacute;s."
        canonical="https://luminary.blog"
      />
      <OrganizationSchema />

      {/* Hero — Asymmetric magazine-style */}
      <section className="pt-28 md:pt-36 pb-14 md:pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="md:grid md:grid-cols-12 md:gap-10 items-end">
            <div className="md:col-span-7">
              <div className="small-caps text-xs tracking-widest text-accent mb-4">
                AI-Powered Publishing
              </div>
              <h1 className="font-heading text-4xl md:text-6xl lg:text-7xl font-bold text-primary leading-none tracking-tight mb-5">
                The Blog That
                <br />
                <span className="italic text-accent">Outranks</span>
              </h1>
              <p className="text-base md:text-lg text-secondary max-w-xl leading-relaxed">
                Every article passes a 4-stage authenticity pipeline&mdash;outline, draft,
                fact-check, and polish&mdash;before a single word reaches the index.
              </p>
              <div className="flex flex-col sm:flex-row items-start gap-3 mt-8">
                <button
                  onClick={() => navTo('blog')}
                  className="inline-flex items-center gap-2 border-b-2 border-accent text-primary hover:text-accent transition-colors text-sm font-medium pb-0.5 min-h-11"
                >
                  Explore Articles
                  <ArrowRight size={14} />
                </button>
                {!geminiKey && (
                  <button
                    onClick={() => navTo('autopost')}
                    className="inline-flex items-center gap-2 text-secondary hover:text-accent transition-colors text-sm border-b border-transparent hover:border-accent/50 pb-0.5 min-h-11"
                  >
                    <Zap size={13} />
                    Try AutoPost AI
                  </button>
                )}
              </div>
            </div>

            <div className="md:col-span-5 mt-10 md:mt-0">
              <div className="border-l border-accent/30 pl-5 md:pl-8 space-y-6">
                {[
                  { value: '4-Stage', label: 'AI Pipeline', desc: 'Outline &rarr; Draft &rarr; Fact-check &rarr; Polish' },
                  { value: '100%', label: 'Fact-Checked', desc: 'Every claim verified before publish' },
                  { value: '0', label: 'AI Clich&eacute;s', desc: 'No filler. No fluff. No hallucinations.' },
                  { value: '&infin;', label: 'Indexable', desc: 'Every word searchable, every concept linked' },
                ].map((s, i) => (
                  <div key={i} className="group">
                    <span
                      className="font-heading text-2xl md:text-3xl font-bold text-primary group-hover:text-accent transition-colors"
                      dangerouslySetInnerHTML={{ __html: s.value }}
                    />
                    <span className="small-caps text-xs tracking-wider text-secondary ml-2">{s.label}</span>
                    <p className="text-xs text-secondary/70 mt-0.5" dangerouslySetInnerHTML={{ __html: s.desc }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Article — magazine lead story */}
      {featured && (
        <section className="px-4 pb-14 md:pb-20">
          <div className="max-w-6xl mx-auto">
            <div className="small-caps text-xs tracking-widest text-accent mb-5">
              Lead Story
            </div>
            <button
              onClick={() => openPost(featured)}
              className="w-full text-left group cursor-pointer"
            >
              {featured.coverImage && (
                <div className="w-full rounded-lg overflow-hidden mb-6 bg-surface aspect-[16/9]">
                  <img src={featured.coverImage} alt="" loading="lazy" className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-700" />
                </div>
              )}
              <div className="max-w-4xl">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {featured.tags.slice(0, 2).map(tag => (
                    <span key={tag} className="text-xs px-2.5 py-0.5 rounded bg-surface text-secondary border border-border">
                      {tag}
                    </span>
                  ))}
                  {featured.auditScore && (
                    <span className="text-xs px-2.5 py-0.5 rounded bg-accent-soft text-accent border border-accent/20 flex items-center gap-1">
                      <Shield size={9} />
                      Quality {featured.auditScore}
                    </span>
                  )}
                </div>

                <h2 className="font-heading text-2xl md:text-4xl lg:text-5xl font-bold text-primary leading-tight mb-3 group-hover:text-accent transition-colors tracking-tight">
                  {featured.title}
                </h2>

                <p className="text-sm md:text-base text-secondary max-w-3xl leading-relaxed mb-4">
                  {featured.excerpt}
                </p>

                <div className="flex flex-wrap items-center gap-3 text-xs text-secondary small-caps tracking-wider">
                  <span className="font-medium text-primary not-small-caps tracking-normal">
                    {featured.authorName}
                  </span>
                  <span className="text-secondary/40">&middot;</span>
                  <span className="flex items-center gap-1"><Clock size={10} />{featured.readTime}m</span>
                  <span className="text-secondary/40">&middot;</span>
                  <span className="tabular-nums">{formatDistanceToNow(new Date(featured.publishedAt), { addSuffix: true })}</span>
                </div>
              </div>
            </button>
          </div>
        </section>
      )}

      {/* Recent Articles — magazine stacked list */}
      {recent.length > 0 && (
        <section className="px-4 pb-14 md:pb-20">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-xl md:text-2xl font-bold text-primary tracking-tight">
                Recent Articles
              </h2>
              <button
                onClick={() => navTo('blog')}
                className="text-xs small-caps text-secondary hover:text-accent transition-colors tracking-wider"
              >
                View all &rarr;
              </button>
            </div>

            <div className="divide-y divide-border">
              {recent.map((post, i) => (
                <button
                  key={post.id}
                  onClick={() => openPost(post)}
                  className="w-full text-left group cursor-pointer py-5 md:py-6 first:pt-0"
                >
                  <div className="md:grid md:grid-cols-12 md:gap-6 items-center">
                    {post.coverImage && (
                      <div className="md:col-span-4 mb-3 md:mb-0">
                        <div className="w-full rounded-lg overflow-hidden bg-surface aspect-[4/3] md:aspect-[16/9]">
                          <img src={post.coverImage} alt="" loading="lazy" className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500" />
                        </div>
                      </div>
                    )}
                    <div className={`${post.coverImage ? 'md:col-span-8' : 'md:col-span-12'}`}>
                      <div className="flex flex-wrap gap-1.5 mb-1.5">
                        {post.tags.slice(0, 1).map(tag => (
                          <span key={tag} className="text-xs px-2 py-0.5 rounded bg-surface text-secondary border border-border">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <h3 className="font-heading text-base md:text-lg font-semibold text-primary group-hover:text-accent transition-colors leading-snug mb-1 line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="text-xs md:text-sm text-secondary line-clamp-2 leading-relaxed mb-2">
                        {post.excerpt}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-secondary small-caps tracking-wider">
                        <span>{post.authorName}</span>
                        <span className="text-secondary/40">&middot;</span>
                        <span className="tabular-nums flex items-center gap-1"><Clock size={9} />{post.readTime}m</span>
                        <span className="text-secondary/40">&middot;</span>
                        <span className="tabular-nums">{formatDistanceToNow(new Date(post.publishedAt), { addSuffix: true })}</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Trending — sidebar in magazine style */}
      {topPosts.length > 0 && (
        <section className="px-4 pb-16 md:pb-24">
          <div className="max-w-6xl mx-auto">
            <div className="border-t border-accent/30 pt-8">
              <h2 className="font-heading text-xl md:text-2xl font-bold text-primary mb-6 tracking-tight flex items-center gap-2">
                <TrendingUp size={16} className="text-accent" />
                Most Read
              </h2>
              <div className="grid md:grid-cols-3 gap-6 md:gap-8">
                {topPosts.map((post, i) => (
                  <button
                    key={post.id}
                    onClick={() => openPost(post)}
                    className="text-left group cursor-pointer"
                  >
                    <span className="font-heading text-5xl md:text-6xl font-bold text-primary/5 block leading-none mb-2 group-hover:text-accent/10 transition-colors">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <h3 className="font-heading text-sm md:text-base font-semibold text-primary group-hover:text-accent transition-colors leading-snug mb-1 line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-xs text-secondary line-clamp-2 leading-relaxed mb-2">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-secondary small-caps tracking-wider">
                      <span className="tabular-nums"><Eye size={10} className="inline mr-0.5" />{post.views.toLocaleString()}</span>
                      <span className="text-secondary/40">&middot;</span>
                      <span className="tabular-nums">{post.readTime}m</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
