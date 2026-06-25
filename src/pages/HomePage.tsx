import { useApp } from '../context/AppContext';
import SEO, { OrganizationSchema } from '../components/SEO';
import { ArrowRight, Zap, TrendingUp, Clock, Eye, Heart } from 'lucide-react';
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
        description="Every article passes a 3-stage AI authenticity pipeline. Premium prose. No filler. No AI clichés."
        canonical="https://luminary.blog"
      />
      <OrganizationSchema />

      {/* Hero Section */}
      <section className="relative pt-32 pb-28 px-4 overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="font-heading text-5xl md:text-7xl font-bold text-primary leading-none tracking-tighter mb-6">
            The Blog That{' '}
            <span className="italic text-primary/70">
              Outranks
            </span>{' '}
            Everything
          </h1>

          <p className="text-lg md:text-xl text-secondary max-w-2xl mx-auto mb-10 leading-relaxed">
            Every article passes a 4-stage authenticity pipeline — outline, draft, fact-check, and polish —
            before a single word reaches the index.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navTo('blog')}
              className="flex items-center gap-2 bg-primary hover:bg-white text-canvas font-semibold px-8 py-3.5 rounded-full transition-all duration-200 cursor-pointer"
            >
              Explore Articles
              <ArrowRight size={18} />
            </button>
            {!geminiKey && (
              <button
                onClick={() => navTo('autopost')}
                className="flex items-center gap-2 border border-border hover:border-primary/50 text-primary px-8 py-3.5 rounded-full transition-all duration-200 hover:bg-surface cursor-pointer"
              >
                <Zap size={18} className="text-secondary" />
                Try AutoPost AI
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Editorial Stats — replaces uniform feature card grid to avoid AI-template tell */}
      <section className="px-4 pb-28">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-px bg-border rounded-2xl overflow-hidden">
          {[
            { value: '4-Stage', label: 'AI Pipeline', desc: 'Outline → Draft → Fact-check → Polish' },
            { value: '100%', label: 'Fact-Checked', desc: 'Every claim verified before publish' },
            { value: '0', label: 'AI Clichés', desc: 'No filler. No fluff. No hallucinations.' },
            { value: '∞', label: 'Indexable', desc: 'Every word searchable, every concept linked' },
          ].map((s, i) => (
            <div key={i} className="bg-surface p-6 md:p-8 flex flex-col items-center text-center gap-2">
              <span className="font-heading text-3xl md:text-4xl font-bold text-primary tracking-tight">{s.value}</span>
              <span className="text-sm font-semibold text-primary">{s.label}</span>
              <span className="text-xs text-secondary leading-relaxed max-w-[18ch]">{s.desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Post */}
      {featured && (
        <section className="px-4 pb-16">
          <div className="max-w-5xl mx-auto">
            <button
              onClick={() => openPost(featured)}
              className="w-full text-left group rounded-3xl border border-border bg-surface overflow-hidden hover:border-primary/40 transition-all duration-300 cursor-pointer"
            >
              {featured.coverImage && (
                <div className="w-full h-56 md:h-80 overflow-hidden">
                  <img src={featured.coverImage} alt="" className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500" />
                </div>
              )}
              <div className="p-8 md:p-12">
                <div className="flex flex-wrap items-center gap-3 mb-6">
                  {featured.tags.slice(0, 2).map(tag => (
                    <span key={tag} className="text-xs px-3 py-1 rounded-full bg-raised text-secondary">
                      {tag}
                    </span>
                  ))}
                  {featured.auditScore && (
                    <span className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary border border-muted tabular-nums">
                      Quality {featured.auditScore}/100
                    </span>
                  )}
                  <span className="text-xs text-muted ml-auto">Featured</span>
                </div>

                <h2 className="font-heading text-3xl md:text-5xl font-bold text-primary mb-4 leading-tight tracking-tight group-hover:text-primary/80 transition-colors">
                  {featured.title}
                </h2>

                <p className="text-lg text-secondary mb-8 max-w-3xl leading-relaxed">
                  {featured.excerpt}
                </p>

                <div className="flex flex-wrap items-center gap-6 text-sm text-secondary">
                  <span className="flex items-center gap-1.5 font-medium text-primary">
                    {featured.authorAvatar ? (
                      <img src={featured.authorAvatar} alt="" className="w-5 h-5 rounded-full object-cover" />
                    ) : (
                      <span className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-[9px] font-bold text-canvas">
                        {featured.authorName.charAt(0)}
                      </span>
                    )}
                    {featured.authorName}
                  </span>
                  <span className="flex items-center gap-1.5 tabular-nums">
                    <Clock size={13} />
                    {featured.readTime}m
                  </span>
                  <span className="flex items-center gap-1.5 tabular-nums">
                    <Eye size={13} />
                    {featured.views.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1.5 tabular-nums">
                    <Heart size={13} />
                    {featured.likes}
                  </span>
                  <span>{formatDistanceToNow(new Date(featured.publishedAt), { addSuffix: true })}</span>
                  <span className="ml-auto flex items-center gap-1.5 text-primary font-medium group-hover:gap-3 transition-all">
                    Read Article <ArrowRight size={15} />
                  </span>
                </div>
              </div>
            </button>
          </div>
        </section>
      )}

      {/* Recent Posts Grid */}
      {recent.length > 0 && (
        <section className="px-4 pb-28">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-heading text-2xl font-bold text-primary tracking-tight">Recent Articles</h2>
              <button
                onClick={() => navTo('blog')}
                className="text-sm text-secondary hover:text-primary flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                View all <ArrowRight size={14} />
              </button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {recent.map(post => (
                <PostCard key={post.id} post={post} onClick={() => openPost(post)} onLike={() => likePost(post.id)} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Trending Sidebar Section */}
      {topPosts.length > 0 && (
        <section className="px-4 pb-28">
          <div className="max-w-5xl mx-auto">
            <div className="rounded-3xl border border-border bg-surface p-8">
              <h2 className="font-heading text-xl font-bold text-primary mb-6 flex items-center gap-2 tracking-tight">
                <TrendingUp size={18} className="text-secondary" />
                Most Read This Month
              </h2>
              <div className="space-y-5">
                {topPosts.map((post, i) => (
                  <button
                    key={post.id}
                    onClick={() => openPost(post)}
                    className="w-full text-left flex items-start gap-4 group cursor-pointer"
                  >
                    <span className="text-3xl font-bold text-raised leading-none mt-0.5 tabular-nums group-hover:text-muted transition-colors">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold text-primary group-hover:text-primary/80 transition-colors leading-snug mb-1 tracking-tight">
                        {post.title}
                      </h3>
                      <p className="text-xs text-secondary flex items-center gap-2 tabular-nums">
                        <Eye size={11} /> {post.views.toLocaleString()}
                        <Clock size={11} /> {post.readTime}m
                      </p>
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
    <div className="group rounded-2xl border border-border bg-surface overflow-hidden hover:border-primary/40 transition-all duration-300 flex flex-col">
      {post.coverImage && (
        <div className="w-full h-40 overflow-hidden">
          <img src={post.coverImage} alt="" className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500" />
        </div>
      )}
      <button onClick={onClick} className="flex-1 text-left p-6 cursor-pointer">
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {post.tags.slice(0, 2).map(tag => (
              <span key={tag} className="text-xs px-2.5 py-0.5 rounded-full bg-raised text-secondary">
                {tag}
              </span>
            ))}
          </div>
        )}

        <h3 className="font-heading text-lg font-bold text-primary mb-2 leading-snug group-hover:text-primary/80 transition-colors line-clamp-2 tracking-tight">
          {post.title}
        </h3>

        <p className="text-sm text-secondary leading-relaxed line-clamp-3">
          {post.excerpt}
        </p>
      </button>

      <div className="px-6 pb-4 flex items-center justify-between border-t border-border pt-4 mt-auto">
        <div className="flex items-center gap-3 text-xs text-secondary tabular-nums">
          <span className="flex items-center gap-1.5">
            {post.authorAvatar ? (
              <img src={post.authorAvatar} alt="" className="w-4 h-4 rounded-full object-cover" />
            ) : (
              <span className="w-4 h-4 rounded-full bg-primary flex items-center justify-center text-[7px] font-bold text-canvas">
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
          className="flex items-center gap-1 text-xs text-secondary hover:text-red-400 transition-colors cursor-pointer tabular-nums"
        >
          <Heart size={12} /> {post.likes}
        </button>
      </div>
    </div>
  );
}
