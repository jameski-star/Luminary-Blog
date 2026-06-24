import { useApp } from '../context/AppContext';
import SEO, { OrganizationSchema } from '../components/SEO';
import { ArrowRight, Zap, Search, Shield, TrendingUp, Clock, Eye, Heart } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { BlogPost } from '../types';

export default function HomePage() {
  const { posts, setCurrentPage, setSelectedPostId, likePost, geminiKey, setCurrentPage: navTo } = useApp();

  const published = posts.filter(p => p.status === 'published');
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
      <section className="relative pt-24 pb-20 px-4 overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-muted bg-surface text-secondary text-sm mb-8">
            <Zap size={14} />
            <span>Powered by Gemini 4-Stage AI Pipeline</span>
          </div>

          <h1 className="font-heading text-5xl md:text-7xl font-bold text-primary leading-tight mb-6">
            The Blog That{' '}
            <span className="italic text-primary">
              Outranks
            </span>{' '}
            Everything
          </h1>

          <p className="text-xl text-secondary max-w-2xl mx-auto mb-10 leading-relaxed">
            Every article passes a 4-stage authenticity pipeline — outline, draft, fact-check, and polish —
            before a single word reaches the index. Premium prose. No filler. No AI clichés.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navTo('blog')}
              className="flex items-center gap-2 bg-primary hover:bg-white text-canvas font-semibold px-8 py-3.5 rounded-full transition-all duration-200"
            >
              Explore Articles
              <ArrowRight size={18} />
            </button>
            {!geminiKey && (
              <button
                onClick={() => navTo('autopost')}
                className="flex items-center gap-2 border border-border hover:border-primary/50 text-primary px-8 py-3.5 rounded-full transition-all duration-200 hover:bg-surface"
              >
                <Zap size={18} className="text-secondary" />
                Try AutoPost AI
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Feature Pills */}
      <section className="px-4 pb-16">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: <Shield size={16} />, label: 'Authenticity Gate', desc: 'Multi-stage fact-check' },
            { icon: <Search size={16} />, label: 'Word-Level Index', desc: 'Every word discoverable' },
            { icon: <TrendingUp size={16} />, label: 'Authenticity Validation', desc: 'AI fact-check pipeline' },
            { icon: <Zap size={16} />, label: 'Gemini Pipeline', desc: '4-stage AI authoring' },
          ].map((f, i) => (
            <div key={i} className="rounded-2xl border border-border bg-surface p-4 flex flex-col gap-2">
              <div className="text-secondary">{f.icon}</div>
              <p className="text-sm font-semibold text-primary">{f.label}</p>
              <p className="text-xs text-secondary">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Post */}
      {featured && (
        <section className="px-4 pb-16">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px flex-1 bg-raised" />
              <span className="text-xs font-semibold text-secondary uppercase tracking-widest">Featured</span>
              <div className="h-px flex-1 bg-raised" />
            </div>

            <button
              onClick={() => openPost(featured)}
              className="w-full text-left group rounded-3xl border border-border bg-surface overflow-hidden hover:border-primary/30 transition-all duration-300"
            >
              <div className="p-8 md:p-12">
                <div className="flex flex-wrap gap-2 mb-6">
                  {featured.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="text-xs px-3 py-1 rounded-full bg-raised text-secondary">
                      {tag}
                    </span>
                  ))}
                  {featured.auditScore && (
                    <span className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary border border-muted">
                      Quality: {featured.auditScore}/100
                    </span>
                  )}
                </div>

                <h2 className="font-heading text-3xl md:text-5xl font-bold text-primary mb-4 leading-tight group-hover:text-white/80 transition-colors">
                  {featured.title}
                </h2>

                <p className="text-lg text-secondary mb-8 max-w-3xl leading-relaxed">
                  {featured.excerpt}
                </p>

                <div className="flex flex-wrap items-center gap-6 text-sm text-secondary">
                  <span className="font-medium text-primary">{featured.authorName}</span>
                  <span className="flex items-center gap-1.5">
                    <Clock size={13} />
                    {featured.readTime} min read
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Eye size={13} />
                    {featured.views.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Heart size={13} />
                    {featured.likes.toLocaleString()}
                  </span>
                  <span>{formatDistanceToNow(new Date(featured.publishedAt), { addSuffix: true })}</span>
                  <span className="ml-auto flex items-center gap-1.5 text-secondary font-medium group-hover:text-primary group-hover:gap-3 transition-all">
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
        <section className="px-4 pb-16">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-heading text-2xl font-bold text-primary">Recent Articles</h2>
              <button
                onClick={() => navTo('blog')}
                className="text-sm text-secondary hover:text-primary flex items-center gap-1.5 transition-colors"
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

      {/* Trending Sidebar Section */}
      {topPosts.length > 0 && (
        <section className="px-4 pb-20">
          <div className="max-w-5xl mx-auto">
            <div className="rounded-3xl border border-border bg-surface p-8">
              <h2 className="font-heading text-xl font-bold text-primary mb-6 flex items-center gap-2">
                <TrendingUp size={18} className="text-secondary" />
                Most Read This Month
              </h2>
              <div className="space-y-5">
                {topPosts.map((post, i) => (
                  <button
                    key={post.id}
                    onClick={() => openPost(post)}
                    className="w-full text-left flex items-start gap-4 group"
                  >
                    <span className="text-3xl font-bold text-raised leading-none mt-0.5 group-hover:text-muted transition-colors">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold text-primary group-hover:text-white/80 transition-colors leading-snug mb-1">
                        {post.title}
                      </h3>
                      <p className="text-xs text-secondary flex items-center gap-2">
                        <Eye size={11} /> {post.views.toLocaleString()} views
                        <Clock size={11} /> {post.readTime}m read
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
    <div className="group rounded-2xl border border-border bg-surface overflow-hidden hover:border-primary/30 transition-all duration-300 flex flex-col">
      <button onClick={onClick} className="flex-1 text-left p-6">
        <div className="flex flex-wrap gap-1.5 mb-4">
          {post.tags.slice(0, 2).map(tag => (
            <span key={tag} className="text-xs px-2.5 py-0.5 rounded-full bg-raised text-secondary">
              {tag}
            </span>
          ))}
        </div>

        <h3 className="font-heading text-lg font-bold text-primary mb-2 leading-snug group-hover:text-white/80 transition-colors line-clamp-2">
          {post.title}
        </h3>

        <p className="text-sm text-secondary leading-relaxed line-clamp-3 mb-4">
          {post.excerpt}
        </p>
      </button>

      <div className="px-6 pb-4 flex items-center justify-between border-t border-border pt-4">
        <div className="flex items-center gap-3 text-xs text-secondary">
          <span className="flex items-center gap-1"><Clock size={11} /> {post.readTime}m</span>
          <span className="flex items-center gap-1"><Eye size={11} /> {post.views.toLocaleString()}</span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onLike(e); }}
          className="flex items-center gap-1 text-xs text-secondary hover:text-red-400 transition-colors"
        >
          <Heart size={12} /> {post.likes}
        </button>
      </div>
    </div>
  );
}
