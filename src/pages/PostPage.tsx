import { useEffect, useState, useRef, useCallback } from 'react';
import { marked } from 'marked';
import { useApp } from '../context/AppContext';
import SEO, { BlogPostingSchema } from '../components/SEO';
import { api, isApiMode } from '../services/api';
import {
  ArrowLeft, Clock, Eye, Heart, Share2, Tag, Shield,
  Check, BookOpen, ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import type { BlogPost } from '../types';

function renderMarkdown(content: string): string {
  const html = marked.parse(content) as string;
  return html.replace(
    /<img src="([^"]+)" alt="([^"]*)"(.*?)\/?>/g,
    (_, src, alt, rest) => {
      const caption = alt || '';
      const loading = rest.includes('loading=') ? rest : `loading="lazy" ${rest}`;
      if (caption) {
        return `<figure><img src="${src}" alt="${caption}" ${loading}><figcaption>${caption}</figcaption></figure>`;
      }
      return `<figure><img src="${src}" alt="" ${loading}></figure>`;
    }
  );
}

function estimateWordCount(html: string): number {
  const div = document.createElement('div');
  div.innerHTML = html;
  return (div.innerText || '').split(/\s+/).filter(Boolean).length;
}

export default function PostPage() {
  const { selectedPostId, getPost, incrementViews, likePost, setCurrentPage, posts } = useApp();
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState(false);
  const [htmlContent, setHtmlContent] = useState('');
  const [apiPost, setApiPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const articleRef = useRef<HTMLDivElement>(null);

  const localPost = selectedPostId ? getPost(selectedPostId) : null;
  const post = apiPost || localPost;

  const contentStripped = (post?.content || '').replace(/[#*`>\[\]]/g, '').trim();
  const excerptIsDuplicate = !!post?.excerpt && contentStripped.startsWith(post.excerpt);

  const relatedPosts = posts
    .filter(p => p.id !== post?.id && p.status === 'published' && p.isApproved !== false)
    .filter(p => post?.tags.some(t => p.tags.includes(t)))
    .slice(0, 3);

  useEffect(() => {
    if (!selectedPostId) return;
    const found = getPost(selectedPostId);

    function fetchFull(slug: string) {
      setLoading(true);
      api.posts.get(slug)
        .then(res => setApiPost(res.post))
        .catch(() => {})
        .finally(() => setLoading(false));
    }

    if (found) {
      if (isApiMode() && !found.content) {
        fetchFull(found.slug);
      }
      return;
    }

    if (isApiMode()) {
      setLoading(true);
      api.posts.list({ status: 'published', limit: '100' })
        .then(res => {
          const p = res.posts.find((x: BlogPost) => x.id === selectedPostId);
          if (p) fetchFull((p as BlogPost).slug);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [selectedPostId, posts]);

  useEffect(() => {
    if (post?.id) incrementViews(post.id);
  }, [post?.id]);

  useEffect(() => {
    if (post) setHtmlContent(renderMarkdown(post.content || ''));
  }, [post?.content]);

  const contentWordCount = htmlContent ? estimateWordCount(htmlContent) : 0;
  const isLongContent = contentWordCount > 800;

  const handleScroll = useCallback(() => {
    const article = articleRef.current;
    if (!article) return;
    const rect = article.getBoundingClientRect();
    const total = rect.height - window.innerHeight + 80;
    const current = -rect.top;
    const progress = Math.min(Math.max((current / total) * 100, 0), 100);
    setScrollProgress(Math.round(progress));
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll, htmlContent]);

  if (!post && loading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center pt-16">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-secondary text-sm">Loading&hellip;</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center pt-16">
        <div className="text-center max-w-md">
          <h2 className="font-heading text-2xl font-bold text-primary mb-2">Post not found</h2>
          <p className="text-secondary mb-6 text-sm">This article may have been removed or doesn&rsquo;t exist.</p>
          <button onClick={() => setCurrentPage('blog')} className="text-sm text-accent hover:text-accent/80 transition-colors font-medium border-b border-accent/30 hover:border-accent pb-0.5">
            &larr; Back to Archive
          </button>
        </div>
      </div>
    );
  }

  const handleLike = () => {
    if (!liked) {
      likePost(post.id);
      setLiked(true);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/blog/${post.slug}`;
    const shareData = { title: post.title, text: post.excerpt, url };

    if (navigator.share) {
      try { await navigator.share(shareData); return; } catch {}
    }

    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openPost = (p: BlogPost) => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    setSelectedPostId(p.id);
    setCurrentPage('post');
  };

  return (
    <div className="min-h-screen bg-canvas">
      <SEO
        title={post.title}
        description={post.excerpt}
        canonical={`https://luminary.blog/blog/${post.slug}`}
        type="article"
        publishedAt={post.publishedAt}
        author={post.authorName}
        tags={post.tags}
        image={post.coverImage}
      />
      <BlogPostingSchema post={post} />

      <div className="fixed top-16 md:top-18 left-0 right-0 z-40 h-px bg-border">
        <div
          className="h-full bg-accent transition-[width] duration-150 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <div ref={articleRef}>
        <article>
          {/* Back link */}
          <div className="max-w-5xl mx-auto px-4 pt-24 md:pt-28">
            <button
              onClick={() => setCurrentPage('blog')}
              className="flex items-center gap-1.5 text-xs small-caps text-secondary hover:text-accent transition-colors mb-8 md:mb-12 tracking-wider"
            >
              <ArrowLeft size={12} />
              Back to Archive
            </button>
          </div>

          {/* Cover Image — full bleed */}
          {post.coverImage && (
            <div className="mb-10 md:mb-16 aspect-[16/9]">
              <img
                src={post.coverImage}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Article Header */}
          <header className="max-w-5xl mx-auto px-4 mb-10 md:mb-12">
            <div className="flex flex-wrap gap-1.5 md:gap-2 mb-5">
              {post.tags.map(tag => (
                <span key={tag} className="text-xs px-3 py-1 rounded-full bg-surface text-secondary border border-border">
                  {tag}
                </span>
              ))}
              {post.auditScore && (
                <span className="text-xs px-3 py-1 rounded-full bg-accent-soft text-accent border border-accent/20">
                  <Shield size={10} className="inline mr-1" />
                  Verified {post.auditScore}/100
                </span>
              )}
            </div>

            <h1 className="font-heading text-3xl md:text-5xl lg:text-6xl font-bold text-primary leading-tight mb-5 tracking-tight max-w-4xl">
              {post.title}
            </h1>

            {post.excerpt && !excerptIsDuplicate && (
              <p className="text-base md:text-lg text-secondary leading-relaxed max-w-3xl font-light">
                {post.excerpt}
              </p>
            )}

            {/* Byline — small caps magazine style */}
            <div className="flex flex-wrap items-center gap-4 md:gap-6 text-sm text-secondary mt-8 pt-6 border-t border-border">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent to-amber-600 flex items-center justify-center text-xs font-bold text-white overflow-hidden">
                  {post.authorAvatar || (post as any).avatar ? (
                    <img src={post.authorAvatar || (post as any).avatar} alt="" loading="lazy" className="w-full h-full object-cover" />
                  ) : (
                    post.authorName.charAt(0)
                  )}
                </div>
                <div>
                  <p className="text-primary text-sm font-medium leading-tight">{post.authorName}</p>
                  <p className="text-xs text-secondary small-caps tracking-wider">Staff Writer</p>
                </div>
              </div>

              <span className="text-secondary/40">&middot;</span>

              <time dateTime={post.publishedAt} className="tabular-nums">
                {format(new Date(post.publishedAt), 'MMMM d, yyyy')}
              </time>

              <span className="text-secondary/40">&middot;</span>

              <span className="tabular-nums flex items-center gap-1">
                <Clock size={12} />
                {post.readTime}m
              </span>

              {isLongContent && (
                <span className="tabular-nums text-accent small-caps tracking-wider text-[11px] hidden md:flex items-center gap-1">
                  <BookOpen size={11} />
                  {contentWordCount.toLocaleString()} words &middot; column layout
                </span>
              )}

              <div className="ml-auto flex items-center gap-3">
                <button
                  onClick={handleLike}
                  className={`flex items-center gap-1.5 text-sm transition-colors min-h-11 ${liked ? 'text-accent' : 'text-secondary hover:text-accent'}`}
                >
                  <Heart size={13} className={liked ? 'fill-accent' : ''} />
                  {post.likes + (liked ? 1 : 0)}
                </button>
                <button
                  onClick={handleShare}
                  className="flex items-center gap-1.5 text-sm text-secondary hover:text-accent transition-colors min-h-11"
                >
                  {copied ? <Check size={13} /> : <Share2 size={13} />}
                  {copied ? 'Copied' : 'Share'}
                </button>
              </div>
            </div>
          </header>

          {/* Article Body — multi-column for long reads */}
          <div className={`mx-auto px-4 pb-12 md:pb-20 ${isLongContent ? 'max-w-6xl' : 'max-w-4xl'}`}>
            <div
              className={`prose-premium ${isLongContent ? 'prose-columns' : ''} ${isLongContent ? '' : 'prose-premium-mobile'}`}
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />

            {/* Footer nav — concise, no heavy dividers */}
            <div className={`flex items-center justify-between ${isLongContent ? 'mt-10 pt-6 border-t border-border max-w-4xl mx-auto' : 'mt-14 md:mt-20 pt-6 md:pt-8 border-t border-border'}`}>
              <button
                onClick={() => setCurrentPage('blog')}
                className="flex items-center gap-1.5 text-xs small-caps text-secondary hover:text-accent transition-colors tracking-wider min-h-11"
              >
                <ArrowLeft size={12} />
                Back to Archive
              </button>
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 text-sm bg-surface border border-border hover:border-accent/50 text-primary px-4 py-2 rounded-lg transition-all duration-200 min-h-11"
              >
                <Share2 size={12} />
                {copied ? 'Copied' : 'Share'}
              </button>
            </div>
          </div>
        </article>
      </div>

      {/* Related Articles */}
      {relatedPosts.length > 0 && (
        <section className="border-t border-border">
          <div className="max-w-5xl mx-auto px-4 py-14 md:py-20">
            <h2 className="font-heading text-xl md:text-2xl font-bold text-primary mb-2 tracking-tight">
              Related Articles
            </h2>
            <p className="text-sm text-secondary mb-8 max-w-lg">
              Further reading from the Luminary archive.
            </p>
            <div className="grid md:grid-cols-3 gap-6 md:gap-8">
              {relatedPosts.map(p => (
                <button
                  key={p.id}
                  onClick={() => openPost(p)}
                  className="text-left group cursor-pointer"
                >
                  {p.coverImage && (
                    <div className="w-full rounded-lg overflow-hidden mb-4 bg-surface aspect-[16/9]">
                      <img src={p.coverImage} alt="" loading="lazy" className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500" />
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {p.tags.slice(0, 1).map(tag => (
                      <span key={tag} className="text-xs px-2 py-0.5 rounded bg-surface text-secondary border border-border">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h3 className="font-heading text-sm md:text-base font-semibold text-primary group-hover:text-accent transition-colors leading-snug mb-1.5 line-clamp-2">
                    {p.title}
                  </h3>
                  <p className="text-xs text-secondary line-clamp-2 leading-relaxed mb-3">
                    {p.excerpt}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-secondary small-caps tracking-wider">
                    <Clock size={10} /> {p.readTime}m &middot; <Eye size={10} /> {p.views.toLocaleString()}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
