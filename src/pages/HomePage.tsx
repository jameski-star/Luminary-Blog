import { useApp } from '../context/AppContext';
import SEO, { OrganizationSchema } from '../components/SEO';
import { ArrowRight, Zap, TrendingUp, Clock, Eye, Heart, Sparkles, Shield, Check } from 'lucide-react';
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
        title="Premium AI-Powered Blog"
        description="Every article passes a 4-stage authenticity pipeline. Premium prose. No filler. No AI clichés."
        canonical="https://luminary.blog"
      />
      <OrganizationSchema />

      {/* Hero — Bento Grid */}
      <section className="pt-28 md:pt-36 pb-16 md:pb-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-12 gap-3 md:gap-4">
            <div className="md:col-span-7 rounded-3xl border border-border bg-gradient-to-br from-surface to-canvas p-8 md:p-12 flex flex-col justify-center">
              <div className="inline-flex items-center gap-1.5 text-xs font-medium text-accent bg-accent-soft px-3 py-1.5 rounded-full mb-5 w-fit">
                <Sparkles size={12} />
                AI-Powered Publishing
              </div>
              <h1 className="font-heading text-3xl md:text-6xl font-bold text-primary leading-none tracking-tight mb-4">
                The Blog That{' '}
                <span className="text-accent">
                  Outranks
                </span>
              </h1>
              <p className="text-sm md:text-lg text-secondary max-w-xl leading-relaxed mb-8">
                Every article passes a 4-stage authenticity pipeline — outline, draft, fact-check, and polish —
                before a single word reaches the index.
              </p>
              <div className="flex flex-col sm:flex-row items-start gap-3">
                <button
                  onClick={() => navTo('blog')}
                  className="flex items-center gap-2 bg-accent hover:bg-pink-500 text-white font-semibold px-6 py-3 rounded-2xl transition-all duration-200 cursor-pointer text-sm hover:shadow-lg hover:shadow-accent-glow/30"
                >
                  Explore Articles
                  <ArrowRight size={16} />
                </button>
                {!geminiKey && (
                  <button
                    onClick={() => navTo('autopost')}
                    className="flex items-center gap-2 border border-border hover:border-secondary/50 text-primary px-6 py-3 rounded-2xl transition-all duration-200 hover:bg-surface cursor-pointer text-sm"
                  >
                    <Zap size={16} className="text-secondary" />
                    Try AutoPost AI
                  </button>
                )}
              </div>
            </div>

            <div className="md:col-span-5 grid grid-cols-2 gap-3 md:gap-4">
              {[
                { value: '4-Stage', label: 'AI Pipeline', desc: 'Outline → Draft →\nFact-check → Polish' },
                { value: '100%', label: 'Fact-Checked', desc: 'Every claim verified\nbefore publish' },
                { value: '0', label: 'AI Clichés', desc: 'No filler. No fluff.\nNo hallucinations.' },
                { value: '∞', label: 'Indexable', desc: 'Every word searchable,\nevery concept linked' },
              ].map((s, i) => (
                <div key={i} className="rounded-2xl border border-border bg-surface p-5 md:p-6 flex flex-col justify-center hover:border-accent/30 transition-all duration-300 group">
                  <span className="font-heading text-2xl md:text-4xl font-bold text-primary tracking-tight group-hover:text-accent transition-colors">{s.value}</span>
                  <span className="text-xs font-semibold text-primary mt-1">{s.label}</span>
                  <span className="text-xs text-secondary mt-1 whitespace-pre-line leading-relaxed">{s.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Post */}
      {featured && (
        <section className="px-4 pb-16 md:pb-24">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6 md:mb-8">
              <h2 className="font-heading text-xl md:text-2xl font-bold text-primary tracking-tight flex items-center gap-2.5">
                <span className="w-1.5 h-5 md:h-6 rounded-full bg-accent" />
                Featured Article
              </h2>
            </div>
            <button
              onClick={() => openPost(featured)}
              className="w-full text-left group rounded-3xl border border-border bg-surface overflow-hidden hover:border-accent/30 transition-all duration-500 cursor-pointer"
            >
              <div className="grid md:grid-cols-5">
                {featured.coverImage && (
                  <div className="md:col-span-2 h-48 md:h-full overflow-hidden">
                    <img src={featured.coverImage} alt="" loading="lazy" className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700" />
                  </div>
                )}
                <div className={`p-6 md:p-10 ${featured.coverImage ? 'md:col-span-3' : 'md:col-span-5'} flex flex-col justify-center`}>
                  <div className="flex flex-wrap items-center gap-2 mb-3 md:mb-4">
                    {featured.tags.slice(0, 2).map(tag => (
                      <span key={tag} className="text-xs px-2.5 py-0.5 rounded-full bg-raised text-secondary border border-border">
                        {tag}
                      </span>
                    ))}
                    {featured.auditScore && (
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-accent-soft text-accent border border-accent/20 tabular-nums flex items-center gap-1">
                        <Shield size={10} />
                        Quality {featured.auditScore}
                      </span>
                    )}
                  </div>

                  <h2 className="font-heading text-xl md:text-4xl font-bold text-primary mb-2 md:mb-3 leading-tight tracking-tight group-hover:text-accent transition-colors duration-300">
                    {featured.title}
                  </h2>

                  <p className="text-sm md:text-base text-secondary max-w-2xl leading-relaxed line-clamp-2 md:line-clamp-3">
                    {featured.excerpt}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 md:gap-5 text-xs text-secondary mt-4 md:mt-6 pt-4 md:pt-6 border-t border-border">
                    <span className="flex items-center gap-1.5 font-medium text-primary">
                      {featured.authorAvatar ? (
                        <img src={featured.authorAvatar} alt="" loading="lazy" className="w-5 h-5 rounded-full object-cover" />
                      ) : (
                        <span className="w-5 h-5 rounded-full bg-gradient-to-br from-accent to-pink-500 flex items-center justify-center text-[8px] font-bold text-white">
                          {featured.authorName.charAt(0)}
                        </span>
                      )}
                      {featured.authorName}
                    </span>
                    <span className="flex items-center gap-1 tabular-nums"><Clock size={12} />{featured.readTime}m</span>
                    <span className="flex items-center gap-1 tabular-nums"><Eye size={12} />{featured.views.toLocaleString()}</span>
                    <span className="flex items-center gap-1 tabular-nums"><Heart size={12} />{featured.likes}</span>
                    <span className="hidden md:inline text-secondary">{formatDistanceToNow(new Date(featured.publishedAt), { addSuffix: true })}</span>
                    <span className="ml-auto flex items-center gap-1.5 text-accent font-medium group-hover:gap-3 transition-all text-sm">
                      Read Article <ArrowRight size={14} />
                    </span>
                  </div>
                </div>
              </div>
            </button>
          </div>
        </section>
      )}

      {/* Recent Posts */}
      {recent.length > 0 && (
        <section className="px-4 pb-16 md:pb-24">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6 md:mb-8">
              <h2 className="font-heading text-xl md:text-2xl font-bold text-primary tracking-tight flex items-center gap-2.5">
                <span className="w-1.5 h-5 md:h-6 rounded-full bg-accent" />
                Recent Articles
              </h2>
              <button
                onClick={() => navTo('blog')}
                className="text-sm text-secondary hover:text-accent flex items-center gap-1.5 transition-colors cursor-pointer font-medium"
              >
                View all <ArrowRight size={14} />
              </button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recent.map(post => (
                <PostCard key={post.id} post={post} onClick={() => openPost(post)} onLike={() => likePost(post.id)} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Trending */}
      {topPosts.length > 0 && (
        <section className="px-4 pb-16 md:pb-28">
          <div className="max-w-6xl mx-auto">
            <div className="rounded-3xl border border-border bg-gradient-to-br from-surface to-canvas p-6 md:p-10">
              <h2 className="font-heading text-xl md:text-2xl font-bold text-primary mb-6 md:mb-8 flex items-center gap-2.5 tracking-tight">
                <span className="w-1.5 h-5 md:h-6 rounded-full bg-accent" />
                <TrendingUp size={18} className="text-accent" />
                Most Read This Month
              </h2>
              <div className="grid md:grid-cols-3 gap-4 md:gap-6">
                {topPosts.map((post, i) => (
                  <button
                    key={post.id}
                    onClick={() => openPost(post)}
                    className="w-full text-left group cursor-pointer"
                  >
                    <div className="rounded-2xl border border-border bg-surface p-5 md:p-6 hover:border-accent/30 transition-all duration-300 h-full">
                      <span className="text-3xl md:text-4xl font-bold text-primary/10 leading-none block mb-3 md:mb-4 group-hover:text-accent/20 transition-colors tabular-nums">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <h3 className="font-heading text-base md:text-lg font-bold text-primary group-hover:text-accent transition-colors leading-snug mb-2 tracking-tight line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="text-xs text-secondary line-clamp-2 leading-relaxed mb-3">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-secondary tabular-nums">
                        <span className="flex items-center gap-1"><Eye size={11} /> {post.views.toLocaleString()}</span>
                        <span className="flex items-center gap-1"><Clock size={11} /> {post.readTime}m</span>
                      </div>
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

function PostCard({ post, onClick, onLike }: { post: BlogPost; onClick: () => void; onLike: (e: React.MouseEvent) => void }) {
  return (
    <div className="group rounded-2xl border border-border bg-surface overflow-hidden hover:border-accent/30 transition-all duration-300 flex flex-col hover:shadow-lg hover:shadow-accent-glow/5">
      {post.coverImage && (
        <div className="w-full h-44 overflow-hidden">
          <img src={post.coverImage} alt="" loading="lazy" className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700" />
        </div>
      )}
      <button onClick={onClick} className="flex-1 text-left p-5 cursor-pointer">
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {post.tags.slice(0, 2).map(tag => (
              <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-raised text-secondary border border-border">
                {tag}
              </span>
            ))}
          </div>
        )}

        <h3 className="font-heading text-base md:text-lg font-bold text-primary mb-2 leading-snug group-hover:text-accent transition-colors line-clamp-2 tracking-tight">
          {post.title}
        </h3>

        <p className="text-sm text-secondary leading-relaxed line-clamp-3">
          {post.excerpt}
        </p>
      </button>

      <div className="px-5 pb-4 flex items-center justify-between border-t border-border pt-4 mt-auto">
        <div className="flex items-center gap-3 text-xs text-secondary tabular-nums">
          <span className="flex items-center gap-1.5">
            {post.authorAvatar ? (
              <img src={post.authorAvatar} alt="" loading="lazy" className="w-4 h-4 rounded-full object-cover" />
            ) : (
              <span className="w-4 h-4 rounded-full bg-gradient-to-br from-accent to-pink-500 flex items-center justify-center text-[7px] font-bold text-white">
                {post.authorName.charAt(0)}
              </span>
            )}
            <span className="not-tabular-nums">{post.authorName}</span>
          </span>
          <span className="flex items-center gap-1"><Clock size={11} /> {post.readTime}m</span>
          <span className="flex items-center gap-1"><Eye size={11} /> {post.views.toLocaleString()}</span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onLike(e); }}
          className="flex items-center gap-1 text-xs text-secondary hover:text-accent transition-colors cursor-pointer tabular-nums"
        >
          <Heart size={12} /> {post.likes}
        </button>
      </div>
    </div>
  );
}
