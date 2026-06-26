import { useEffect, useState } from 'react';
import { marked } from 'marked';
import { useApp } from '../context/AppContext';
import SEO, { BlogPostingSchema } from '../components/SEO';
import { api, isApiMode } from '../services/api';
import {
  ArrowLeft, Clock, Eye, Heart, Share2, Tag, Shield,
  Check, BookOpen
} from 'lucide-react';
import { format } from 'date-fns';
import type { BlogPost } from '../types';

export default function PostPage() {
  const { selectedPostId, getPost, incrementViews, likePost, setCurrentPage, posts } = useApp();
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState(false);
  const [htmlContent, setHtmlContent] = useState('');
  const [apiPost, setApiPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(false);

  const localPost = selectedPostId ? getPost(selectedPostId) : null;
  const post = apiPost || localPost;

  const contentStripped = (post?.content || '').replace(/[#*`>\[\]]/g, '').trim();
  const excerptIsDuplicate = !!post?.excerpt && contentStripped.startsWith(post.excerpt);

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
      // Try fetching via slug directly — generate a reasonable slug from id
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
    if (post) setHtmlContent(marked.parse(post.content || ''));
  }, [post?.content]);

  if (!post && loading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center pt-16">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-secondary">Loading post…</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center pt-16">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-primary mb-2">Post not found</h2>
          <p className="text-secondary mb-4">This article may have been removed or doesn't exist.</p>
          <button onClick={() => setCurrentPage('blog')} className="text-secondary hover:text-primary transition-colors">
            ← Back to Blog
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
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // User cancelled or failed — fall through to clipboard
      }
    }

    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const readingProgress = 0; // Could implement scroll tracking

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
      {/* Sticky progress bar */}
      <div className="fixed top-16 left-0 right-0 z-40 h-0.5 bg-border">
        <div
          className="h-full bg-primary transition-all duration-150"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-20 md:pt-24 pb-16 md:pb-20">

        {/* Back */}
        <button
          onClick={() => setCurrentPage('blog')}
          className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-sm text-secondary hover:text-primary transition-colors mb-4 md:mb-10"
        >
          <ArrowLeft size={13} />
          Back to Archive
        </button>

        {/* Cover Image */}
        {post.coverImage && (
          <div className="mb-4 md:mb-10 -mx-4 md:-mx-8 rounded-xl md:rounded-2xl overflow-hidden">
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full h-40 md:h-96 object-cover"
            />
          </div>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 md:gap-2 mb-3 md:mb-6">
          {post.tags.map(tag => (
            <span key={tag} className="flex items-center gap-1 md:gap-1.5 text-[10px] md:text-xs px-1.5 md:px-3 py-0.5 md:py-1 rounded-full bg-raised text-secondary">
              <Tag size={8} />
              {tag}
            </span>
          ))}
          {post.auditScore && (
            <span className="flex items-center gap-1 md:gap-1.5 text-[10px] md:text-xs px-1.5 md:px-3 py-0.5 md:py-1 rounded-full bg-primary/10 text-primary border border-muted">
              <Shield size={8} />
              Verified {post.auditScore}/100
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="font-heading text-2xl md:text-6xl font-bold text-primary leading-tight mb-3 md:mb-6">
          {post.title}
        </h1>

        {/* Excerpt — hidden if it's just auto-generated from the first 160 chars of content */}
        {post.excerpt && !excerptIsDuplicate && (
          <p className="text-sm md:text-xl text-secondary leading-relaxed mb-4 md:mb-8 border-l-2 md:border-l-4 border-primary pl-3 md:pl-5">
            {post.excerpt}
          </p>
        )}

        {/* Meta bar */}
        <div className="flex flex-wrap items-center gap-3 md:gap-5 text-[10px] md:text-sm text-secondary pb-4 md:pb-8 mb-4 md:mb-8 border-b border-border">
          <div className="flex items-center gap-1.5 md:gap-2.5">
            <div className="w-6 md:w-8 h-6 md:h-8 rounded-full bg-primary flex items-center justify-center text-[8px] md:text-xs font-bold text-canvas overflow-hidden">
              {post.authorAvatar || (post as any).avatar ? (
                <img src={post.authorAvatar || (post as any).avatar} alt="" loading="lazy" className="w-full h-full object-cover" />
              ) : (
                post.authorName.charAt(0)
              )}
            </div>
            <div>
              <p className="text-primary font-medium text-[10px] md:text-sm leading-tight">{post.authorName}</p>
              <p className="hidden md:block text-[10px] md:text-xs text-secondary">Author</p>
            </div>
          </div>

          <div className="h-3 md:h-4 w-px bg-border" />

          <time dateTime={post.publishedAt} className="flex items-center gap-1 md:gap-1.5">
            <span className="hidden md:inline">{format(new Date(post.publishedAt), 'MMMM d, yyyy')}</span>
            <span className="md:hidden">{format(new Date(post.publishedAt), 'MMM d, yyyy')}</span>
          </time>

          <span className="flex items-center gap-0.5 md:gap-1.5">
            <Clock size={11} />
            {post.readTime}m
          </span>

          <span className="flex items-center gap-0.5 md:gap-1.5 hidden md:flex">
            <BookOpen size={13} />
            {post.wordCount?.toLocaleString()} words
          </span>

          <span className="flex items-center gap-0.5 md:gap-1.5">
            <Eye size={11} />
            {post.views.toLocaleString()}
          </span>

          <div className="ml-auto flex items-center gap-2 md:gap-3">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1 md:gap-1.5 text-[10px] md:text-sm transition-colors ${liked ? 'text-red-400' : 'text-secondary hover:text-red-400'}`}
            >
              <Heart size={13} className={liked ? 'fill-red-400' : ''} />
              {post.likes + (liked ? 1 : 0)}
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-1 md:gap-1.5 text-[10px] md:text-sm text-secondary hover:text-primary transition-colors"
            >
              {copied ? <Check size={13} /> : <Share2 size={13} />}
              {copied ? 'Copied!' : 'Share'}
            </button>
          </div>
        </div>

        {/* Article Content */}
        <article
          className="prose-premium prose-premium-mobile"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />

        {/* Keywords */}
        {post.keywords.length > 0 && (
          <div className="mt-6 md:mt-12 pt-4 md:pt-8 border-t border-border">
            <p className="text-[10px] md:text-xs text-secondary uppercase tracking-widest mb-2 md:mb-3">Keywords</p>
            <div className="flex flex-wrap gap-1.5 md:gap-2">
              {post.keywords.map(kw => (
                <span key={kw} className="text-[10px] md:text-xs px-1.5 md:px-3 py-0.5 md:py-1 rounded-full bg-raised text-secondary">
                  {kw}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Share */}
        <div className="mt-4 md:mt-8 flex items-center justify-between">
          <button
            onClick={() => setCurrentPage('blog')}
            className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-sm text-secondary hover:text-primary transition-colors"
          >
            <ArrowLeft size={13} />
            Back to Archive
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-sm bg-surface border border-border hover:border-primary/50 text-primary px-2.5 md:px-4 py-1.5 md:py-2 rounded-full transition-colors"
          >
            <Share2 size={12} />
            {copied ? 'Copied!' : 'Share'}
          </button>
        </div>
      </div>
    </div>
  );
}


