import { useEffect, useState } from 'react';
import { marked } from 'marked';
import { useApp } from '../context/AppContext';
import SEO, { BlogPostingSchema } from '../components/SEO';
import {
  ArrowLeft, Clock, Eye, Heart, Share2, Tag, Shield,
  Copy, Check, BookOpen
} from 'lucide-react';
import { format } from 'date-fns';

export default function PostPage() {
  const { selectedPostId, getPost, incrementViews, likePost, setCurrentPage } = useApp();
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState(false);
  const [htmlContent, setHtmlContent] = useState('');

  const post = selectedPostId ? getPost(selectedPostId) : null;

  useEffect(() => {
    if (post) {
      incrementViews(post.id);
      const parsed = marked.parse(post.content || '', { async: false }) as string;
      setHtmlContent(parsed);
    }
  }, [post?.id]);

  if (!post) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center pt-16">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-primary mb-2">Post not found</h2>
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

  const handleCopy = () => {
    const url = `${window.location.origin}/?post=${post.slug}`;
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
      />
      <BlogPostingSchema post={post} />
      {/* Sticky progress bar */}
      <div className="fixed top-16 left-0 right-0 z-40 h-0.5 bg-border">
        <div
          className="h-full bg-primary transition-all duration-150"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-24 pb-20">

        {/* Back */}
        <button
          onClick={() => setCurrentPage('blog')}
          className="flex items-center gap-2 text-sm text-secondary hover:text-primary transition-colors mb-10"
        >
          <ArrowLeft size={16} />
          Back to Archive
        </button>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-6">
          {post.tags.map(tag => (
            <span key={tag} className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-raised text-secondary">
              <Tag size={10} />
              {tag}
            </span>
          ))}
          {post.auditScore && (
            <span className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-primary/10 text-primary border border-muted">
              <Shield size={10} />
              Verified {post.auditScore}/100
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="font-heading text-4xl md:text-6xl font-bold text-primary leading-tight mb-6">
          {post.title}
        </h1>

        {/* Excerpt */}
        <p className="text-xl text-secondary leading-relaxed mb-8 border-l-4 border-primary pl-5">
          {post.excerpt}
        </p>

        {/* Meta bar */}
        <div className="flex flex-wrap items-center gap-5 text-sm text-secondary pb-8 mb-8 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-canvas">
              {post.authorName.charAt(0)}
            </div>
            <div>
              <p className="text-primary font-medium text-sm leading-tight">{post.authorName}</p>
              <p className="text-xs text-secondary">Author</p>
            </div>
          </div>

          <div className="h-4 w-px bg-border" />

          <time dateTime={post.publishedAt} className="flex items-center gap-1.5">
            <span>{format(new Date(post.publishedAt), 'MMMM d, yyyy')}</span>
          </time>

          <span className="flex items-center gap-1.5">
            <Clock size={13} />
            {post.readTime} min read
          </span>

          <span className="flex items-center gap-1.5">
            <BookOpen size={13} />
            {post.wordCount?.toLocaleString()} words
          </span>

          <span className="flex items-center gap-1.5">
            <Eye size={13} />
            {post.views.toLocaleString()} views
          </span>

          <div className="ml-auto flex items-center gap-3">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 text-sm transition-colors ${liked ? 'text-red-400' : 'text-secondary hover:text-red-400'}`}
            >
              <Heart size={15} className={liked ? 'fill-red-400' : ''} />
              {post.likes + (liked ? 1 : 0)}
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-sm text-secondary hover:text-primary transition-colors"
            >
              {copied ? <Check size={15} /> : <Copy size={15} />}
              {copied ? 'Copied!' : 'Copy link'}
            </button>
          </div>
        </div>

        {/* Article Content */}
        <article
          className="prose-premium"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />

        {/* Keywords */}
        {post.keywords.length > 0 && (
          <div className="mt-12 pt-8 border-t border-border">
            <p className="text-xs text-secondary uppercase tracking-widest mb-3">Keywords</p>
            <div className="flex flex-wrap gap-2">
              {post.keywords.map(kw => (
                <span key={kw} className="text-xs px-3 py-1 rounded-full bg-raised text-secondary">
                  {kw}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Share */}
        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={() => setCurrentPage('blog')}
            className="flex items-center gap-2 text-sm text-secondary hover:text-primary transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Archive
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 text-sm bg-surface border border-border hover:border-primary/50 text-primary px-4 py-2 rounded-full transition-colors"
          >
            <Share2 size={14} />
            Share Article
          </button>
        </div>
      </div>
    </div>
  );
}


