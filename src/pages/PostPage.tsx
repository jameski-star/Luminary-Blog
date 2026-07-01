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
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-secondary">Loading post…</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center pt-16">
        <div className="text-center">
          <h2 className="font-heading text-2xl font-bold text-primary mb-2">Post not found</h2>
          <p className="text-secondary mb-4">This article may have been removed or doesn't exist.</p>
          <button onClick={() => setCurrentPage('blog')} className="text-secondary hover:text-accent transition-colors font-medium">
            ← Back to Archive
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
      } catch {}
    }

    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const readingProgress = 0;

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

      <div className="fixed top-16 md:top-18 left-0 right-0 z-40 h-0.5 bg-border">
        <div
          className="h-full bg-accent transition-all duration-150"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      <article className="max-w-4xl mx-auto px-4 pt-24 md:pt-28 pb-16 md:pb-24">

        <button
          onClick={() => setCurrentPage('blog')}
          className="flex items-center gap-1.5 text-sm text-secondary hover:text-accent transition-colors mb-6 md:mb-10 font-medium"
        >
          <ArrowLeft size={14} />
          Back to Archive
        </button>

        {post.coverImage && (
          <div className="mb-6 md:mb-10 -mx-4 md:-mx-8 rounded-2xl md:rounded-3xl overflow-hidden">
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full h-48 md:h-96 object-cover"
            />
          </div>
        )}

        <div className="flex flex-wrap gap-1.5 md:gap-2 mb-4 md:mb-6">
          {post.tags.map(tag => (
            <span key={tag} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-raised text-secondary border border-border">
              <Tag size={10} />
              {tag}
            </span>
          ))}
          {post.auditScore && (
            <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-accent-soft text-accent border border-accent/20">
              <Shield size={10} />
              Verified {post.auditScore}/100
            </span>
          )}
        </div>

        <h1 className="font-heading text-3xl md:text-6xl font-bold text-primary leading-tight mb-4 md:mb-6 tracking-tight">
          {post.title}
        </h1>

        {post.excerpt && !excerptIsDuplicate && (
          <p className="text-base md:text-xl text-secondary leading-relaxed mb-6 md:mb-10 border-l-2 md:border-l-4 border-accent pl-4 md:pl-6">
            {post.excerpt}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3 md:gap-5 text-sm text-secondary pb-6 md:pb-8 mb-6 md:mb-10 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-7 md:w-9 h-7 md:h-9 rounded-full bg-gradient-to-br from-accent to-pink-500 flex items-center justify-center text-[9px] md:text-xs font-bold text-white overflow-hidden">
              {post.authorAvatar || (post as any).avatar ? (
                <img src={post.authorAvatar || (post as any).avatar} alt="" loading="lazy" className="w-full h-full object-cover" />
              ) : (
                post.authorName.charAt(0)
              )}
            </div>
            <div>
              <p className="text-primary font-medium text-sm leading-tight">{post.authorName}</p>
              <p className="hidden md:block text-xs text-secondary">Author</p>
            </div>
          </div>

          <div className="h-4 w-px bg-border" />

          <time dateTime={post.publishedAt} className="flex items-center gap-1">
            <span className="hidden md:inline">{format(new Date(post.publishedAt), 'MMMM d, yyyy')}</span>
            <span className="md:hidden">{format(new Date(post.publishedAt), 'MMM d, yyyy')}</span>
          </time>

          <span className="flex items-center gap-1">
            <Clock size={13} />
            {post.readTime}m
          </span>

          <span className="flex items-center gap-1 hidden md:flex">
            <BookOpen size={14} />
            {post.wordCount?.toLocaleString()} words
          </span>

          <span className="flex items-center gap-1">
            <Eye size={13} />
            {post.views.toLocaleString()}
          </span>

          <div className="ml-auto flex items-center gap-3">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 text-sm transition-colors ${liked ? 'text-accent' : 'text-secondary hover:text-accent'}`}
            >
              <Heart size={14} className={liked ? 'fill-accent' : ''} />
              {post.likes + (liked ? 1 : 0)}
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 text-sm text-secondary hover:text-accent transition-colors"
            >
              {copied ? <Check size={14} /> : <Share2 size={14} />}
              {copied ? 'Copied!' : 'Share'}
            </button>
          </div>
        </div>

        <div
          className="prose-premium prose-premium-mobile"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />

        {post.keywords.length > 0 && (
          <div className="mt-8 md:mt-12 pt-6 md:pt-8 border-t border-border">
            <p className="text-xs text-secondary uppercase tracking-widest mb-3 font-medium">Keywords</p>
            <div className="flex flex-wrap gap-1.5">
              {post.keywords.map(kw => (
                <span key={kw} className="text-xs px-2.5 py-1 rounded-full bg-raised text-secondary border border-border">
                  {kw}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 md:mt-12 flex items-center justify-between">
          <button
            onClick={() => setCurrentPage('blog')}
            className="flex items-center gap-1.5 text-sm text-secondary hover:text-accent transition-colors font-medium"
          >
            <ArrowLeft size={14} />
            Back to Archive
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 text-sm bg-surface border border-border hover:border-accent/50 text-primary px-4 py-2 rounded-2xl transition-all duration-200 hover:shadow-lg hover:shadow-accent-glow/10"
          >
            <Share2 size={13} />
            {copied ? 'Copied!' : 'Share'}
          </button>
        </div>
      </article>
    </div>
  );
}
