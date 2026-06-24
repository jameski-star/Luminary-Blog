import { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import SEO from '../components/SEO';
import { Modal, usePrompt, useConfirm } from '../components/Modal';
import { validateManualPost } from '../services/geminiPipeline';
import { generateSlug, calcReadTime } from '../store/appStore';
import { detectRogueContent } from '../utils/contentDetection';
import { friendlyError } from '../utils/errors';
import type { BlogPost, AuditResult } from '../types';
import { marked } from 'marked';
import {
  Save, Send, Eye, EyeOff, Plus, X, Shield,
  AlertTriangle, CheckCircle, Info, ArrowLeft,
  Bold, Italic, Link2, Heading1, Heading2, Heading3, Image, Upload
} from 'lucide-react';

function FormatButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className="p-1.5 rounded-lg text-secondary hover:text-primary hover:bg-raised transition-colors"
    >
      {icon}
    </button>
  );
}

export default function EditorPage() {
  const { user, geminiKey, addPost, setCurrentPage, setSelectedPostId, posts } = useApp();
  const { prompt, PromptDialog } = usePrompt();
  const { confirm, ConfirmDialog } = useConfirm();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [keywordInput, setKeywordInput] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [coverImage, setCoverImage] = useState('');
  const [preview, setPreview] = useState(false);

  // Validation
  const [validating, setValidating] = useState(false);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [validationError, setValidationError] = useState('');
  const [rogueWarning, setRogueWarning] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const insertImage = async () => {
    const url = await prompt('Insert Image', 'Enter image URL:', 'https://', 'https://example.com/image.jpg');
    if (!url) return;
    setContent(prev => prev + `\n![${url.split('/').pop() || 'image'}](${url})\n`);
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setValidationError('Image too large. Maximum 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) setCoverImage(ev.target.result as string);
    };
    reader.readAsDataURL(file);
  };

  const insertFormatting = useCallback(async (type: 'bold' | 'italic' | 'h1' | 'h2' | 'h3' | 'link') => {
    const ta = textareaRef.current;
    if (!ta) return;

    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const sel = content.substring(start, end);
    const before = content.substring(0, start);
    const after = content.substring(end);

    let result: string;
    let cursorPos: number;

    switch (type) {
      case 'bold':
        result = before + '**' + (sel || 'bold') + '**' + after;
        cursorPos = start + 2;
        break;
      case 'italic':
        result = before + '_' + (sel || 'italic') + '_' + after;
        cursorPos = start + 1;
        break;
      case 'h1':
      case 'h2':
      case 'h3': {
        const prefix = type === 'h1' ? '# ' : type === 'h2' ? '## ' : '### ';
        const lineStart = content.lastIndexOf('\n', start - 1) + 1;
        const line = content.substring(lineStart, end);
        const stripped = line.replace(/^#{1,6} /, '');
        result = content.substring(0, lineStart) + prefix + stripped + content.substring(end);
        cursorPos = lineStart + prefix.length;
        break;
      }
      case 'link': {
        const url = await prompt('Insert Link', 'Enter URL:', 'https://', 'https://example.com');
        if (!url) return;
        const text = sel || url.replace(/^https?:\/\//, '');
        result = before + '[' + text + '](' + url + ')' + after;
        cursorPos = start + 1;
        break;
      }
      default:
        return;
    }

    setContent(result);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(cursorPos, cursorPos);
    });
  }, [content]);

  // Auto-excerpt
  useEffect(() => {
    if (!excerpt && content) {
      const clean = content.replace(/[#*`]/g, '').trim().slice(0, 160);
      setExcerpt(clean);
    }
  }, [content]);

  // Rogue content check
  useEffect(() => {
    const check = detectRogueContent(content);
    setRogueWarning(check.isRogue ? check.reason || 'Suspicious content detected.' : null);
  }, [content]);

  if (!user) {
    return (
        <div className="min-h-screen bg-canvas flex items-center justify-center pt-16">
        <SEO title="Editor" description="Write and publish articles." noindex />
        <div className="text-center">
          <h2 className="text-2xl font-bold text-primary mb-3">Sign in to write</h2>
          <button onClick={() => setCurrentPage('login')} className="bg-primary text-canvas font-semibold px-6 py-3 rounded-xl">Sign In</button>
        </div>
      </div>
    );
  }

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const readTime = calcReadTime(content);

  const addKeyword = () => {
    const kw = keywordInput.trim();
    if (kw && !keywords.includes(kw)) { setKeywords([...keywords, kw]); setKeywordInput(''); }
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t) && tags.length < 6) { setTags([...tags, t]); setTagInput(''); }
  };

  const runValidation = async () => {
    if (!geminiKey) { setValidationError('Add a Gemini API key in AutoPost to validate.'); return; }
    if (content.split(/\s+/).length < 100) { setValidationError('Write at least 100 words to validate.'); return; }

    setValidating(true);
    setAuditResult(null);
    setValidationError('');

    try {
      const result = await validateManualPost(content, geminiKey);
      setAuditResult(result);
    } catch (err: unknown) {
      setValidationError(friendlyError(err));
    } finally {
      setValidating(false);
    }
  };

  const canPublish = title.trim() && content.trim().split(/\s+/).length >= 50;

  const publishPost = async (status: 'published' | 'draft') => {
    if (!canPublish) return;

    // Rouge content check — auto-quarantine
    const rogue = detectRogueContent(content);
    if (rogue.isRogue && status === 'published') {
      const ok = await confirm('Suspicious Content Detected', `${rogue.reason} This post will be saved as a draft and submitted for admin review.`, 'Save as Draft');
      if (!ok) return;
      status = 'review';
    }

    // Gate: if audit failed and trying to publish, warn
    if (status === 'published' && auditResult && auditResult.score < 65) {
      const ok = await confirm('Low Authenticity Score', `Authenticity score is ${auditResult.score}/100 (below 65). Publish anyway?`, 'Publish Anyway');
      if (!ok) return;
    }

    const slug = generateSlug(title);
    const now = new Date().toISOString();
    const finalExcerpt = excerpt || content.replace(/[#*]/g, '').trim().slice(0, 160);

    const post: BlogPost = {
      id: `post_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      title: title.trim(),
      slug,
      excerpt: finalExcerpt,
      content,
      coverImage: coverImage || undefined,
      tags: tags.length > 0 ? tags : ['Uncategorized'],
      keywords,
      authorId: user.id,
      authorName: user.name,
      publishedAt: now,
      modifiedAt: now,
      status,
      readTime,
      views: 0,
      likes: 0,
      auditScore: auditResult?.score,
      wordCount,
    };

    addPost(post);
    if (status === 'published') {
      setSelectedPostId(post.id);
      setCurrentPage('post');
    } else {
      setCurrentPage('dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-canvas pt-20">
      <SEO title={title || 'New Post'} description="Write and publish articles." noindex />
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setCurrentPage('dashboard')} className="flex items-center gap-2 text-sm text-secondary hover:text-primary transition-colors">
            <ArrowLeft size={16} /> Dashboard
          </button>

          <div className="flex items-center gap-2 text-xs text-secondary">
            <span>{wordCount.toLocaleString()} words</span>
            <span>·</span>
            <span>{readTime} min read</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPreview(!preview)}
              className="flex items-center gap-2 text-sm text-secondary hover:text-primary transition-colors px-3 py-1.5 rounded-lg border border-border hover:border-primary/30"
            >
              {preview ? <EyeOff size={14} /> : <Eye size={14} />}
              {preview ? 'Edit' : 'Preview'}
            </button>
            <button
              onClick={() => publishPost('draft')}
              disabled={!canPublish}
              className="flex items-center gap-2 text-sm text-secondary hover:text-primary transition-colors px-3 py-1.5 rounded-lg border border-border hover:border-primary/30 disabled:opacity-40"
            >
              <Save size={14} />
              Save Draft
            </button>
            <button
              onClick={() => publishPost('published')}
              disabled={!canPublish}
              className="flex items-center gap-2 text-sm bg-primary hover:bg-white text-canvas font-semibold px-4 py-1.5 rounded-lg disabled:opacity-40 transition-all"
            >
              <Send size={14} />
              Publish
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Editor */}
          <div className="lg:col-span-2">
            {/* Title */}
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Article title…"
              className="w-full bg-transparent text-primary font-heading text-4xl font-bold outline-none mb-6 placeholder-raised border-b border-border pb-4 focus:border-primary/40 transition-colors"
            />

            {!preview && (
              <div className="flex items-center gap-1 px-3 py-2 mb-3 rounded-xl border border-border bg-surface">
                <FormatButton icon={<Bold size={15} />} label="Bold" onClick={() => insertFormatting('bold')} />
                <FormatButton icon={<Italic size={15} />} label="Italic" onClick={() => insertFormatting('italic')} />
                <span className="w-px h-5 bg-border mx-1" />
                <FormatButton icon={<Heading1 size={15} />} label="Heading 1" onClick={() => insertFormatting('h1')} />
                <FormatButton icon={<Heading2 size={15} />} label="Heading 2" onClick={() => insertFormatting('h2')} />
                <FormatButton icon={<Heading3 size={15} />} label="Heading 3" onClick={() => insertFormatting('h3')} />
                <span className="w-px h-5 bg-border mx-1" />
                <FormatButton icon={<Link2 size={15} />} label="Link" onClick={() => insertFormatting('link')} />
                <FormatButton icon={<Image size={15} />} label="Image" onClick={insertImage} />
              </div>
            )}

            {!preview ? (
              <textarea
                ref={textareaRef}
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder={`Write your article in Markdown…\n\n## Introduction\n\nStart with a hook that immediately delivers value. No filler.\n\n## Section Heading\n\nDive deep. Cite specific examples. Vary sentence length.\n\nShort sentence. Then a longer one that builds context and demonstrates your expertise through specific detail.`}
                className="w-full bg-transparent text-primary text-base outline-none resize-none placeholder-secondary/30 leading-relaxed font-mono"
                rows={35}
                style={{ minHeight: '60vh' }}
              />
            ) : (
              <div
                className="prose-premium"
                dangerouslySetInnerHTML={{ __html: marked.parse(content || '*Start writing to see preview…*', { async: false }) as string }}
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">

            {/* Tags */}
            <div className="rounded-2xl border border-border bg-surface p-5">
              <h3 className="text-xs font-semibold text-secondary uppercase tracking-wider mb-3">Categories</h3>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                  placeholder="Add tag…"
                  className="flex-1 bg-canvas border border-border rounded-lg px-3 py-2 text-primary text-xs outline-none focus:border-primary/60"
                />
                <button onClick={addTag} className="px-2.5 bg-raised rounded-lg hover:bg-muted transition-colors">
                  <Plus size={14} className="text-primary" />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {tags.map(t => (
                  <span key={t} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-raised text-secondary">
                    {t}
                    <button onClick={() => setTags(tags.filter(x => x !== t))}><X size={10} /></button>
                  </span>
                ))}
              </div>
            </div>

            {/* Cover Image */}
            <div className="rounded-2xl border border-border bg-surface p-5">
              <h3 className="text-xs font-semibold text-secondary uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Image size={12} className="text-secondary" />
                Cover Image
              </h3>
              {coverImage ? (
                <div className="relative mb-3">
                  <img src={coverImage} alt="Cover" className="w-full h-32 object-cover rounded-xl" />
                  <button
                    onClick={() => setCoverImage('')}
                    className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded-lg hover:bg-black/80 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="mb-3">
                  <button
                    onClick={() => coverInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 py-8 border-2 border-dashed border-border rounded-xl text-secondary hover:text-primary hover:border-primary/40 transition-colors"
                  >
                    <Upload size={20} />
                    <span className="text-sm">Upload Cover Image</span>
                  </button>
                  <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
                </div>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={coverImage}
                  onChange={e => setCoverImage(e.target.value)}
                  placeholder="Or paste image URL…"
                  className="flex-1 bg-canvas border border-border rounded-lg px-3 py-2 text-primary text-xs outline-none focus:border-primary/60"
                />
              </div>
            </div>

            {/* Keywords */}
            <div className="rounded-2xl border border-border bg-surface p-5">
              <h3 className="text-xs font-semibold text-secondary uppercase tracking-wider mb-3">Keywords</h3>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={keywordInput}
                  onChange={e => setKeywordInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addKeyword(); } }}
                  placeholder="Add keyword…"
                  className="flex-1 bg-canvas border border-border rounded-lg px-3 py-2 text-primary text-xs outline-none focus:border-primary/60"
                />
                <button onClick={addKeyword} className="px-2.5 bg-raised rounded-lg hover:bg-muted transition-colors">
                  <Plus size={14} className="text-primary" />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {keywords.map(k => (
                  <span key={k} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-raised text-secondary">
                    {k}
                    <button onClick={() => setKeywords(keywords.filter(x => x !== k))}><X size={10} /></button>
                  </span>
                ))}
              </div>
            </div>

            {/* Rogue Content Warning */}
            {rogueWarning && (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5">
                <div className="flex items-start gap-2.5 text-amber-400 text-xs">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold mb-1">Suspicious Content Detected</p>
                    <p>{rogueWarning}</p>
                    <p className="mt-1">Publishing will route to admin review.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Validation */}
            <div className="rounded-2xl border border-border bg-surface p-5">
              <h3 className="text-xs font-semibold text-secondary uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Shield size={12} className="text-secondary" />
                Authenticity Check
              </h3>

              {!geminiKey && (
                <div className="flex items-start gap-2 bg-muted/30 border border-muted/50 rounded-xl p-3 mb-3 text-xs text-secondary">
                  <Info size={12} className="mt-0.5 shrink-0" />
                  Add Gemini API key in AutoPost to validate
                </div>
              )}

              {validationError && (
                <div className="flex items-start gap-2 p-3 rounded-xl border border-border bg-surface mb-3 text-xs text-secondary">
                  <AlertTriangle size={12} className="text-amber-400 mt-0.5 shrink-0" />
                  {validationError}
                </div>
              )}

              {auditResult && (
                <div className={`rounded-xl p-3 mb-3 border ${
                  auditResult.score >= 80 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-primary">Score</span>
                    <span className={`text-lg font-bold ${auditResult.score >= 80 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {auditResult.score}/100
                    </span>
                  </div>
                  {auditResult.vulnerabilities.length > 0 && (
                    <ul className="space-y-1">
                      {auditResult.vulnerabilities.slice(0, 3).map((v, i) => (
                        <li key={i} className="text-xs text-secondary line-clamp-2">• {v}</li>
                      ))}
                    </ul>
                  )}
                  {auditResult.passedCheck && (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 mt-2">
                      <CheckCircle size={12} />
                      Passed authenticity check
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={runValidation}
                disabled={validating || !geminiKey || wordCount < 100}
                className="w-full flex items-center justify-center gap-2 text-xs font-medium bg-raised hover:bg-muted disabled:opacity-40 text-primary py-2.5 rounded-xl transition-colors"
              >
                {validating ? (
                  <><div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />Validating…</>
                ) : (
                  <><Shield size={13} />Run Validation</>
                )}
              </button>
            </div>

            {/* Markdown Guide */}
            <div className="rounded-2xl border border-border bg-surface p-5">
              <h3 className="text-xs font-semibold text-secondary uppercase tracking-wider mb-3">Markdown Reference</h3>
              <div className="space-y-1.5 text-xs font-mono text-secondary">
                {[
                  ['## Heading', 'H2'],
                  ['**bold text**', 'Bold'],
                  ['*italic text*', 'Italic'],
                  ['> blockquote', 'Quote'],
                  ['- list item', 'List'],
                  ['`inline code`', 'Code'],
                ].map(([syntax, label]) => (
                  <div key={label} className="flex items-center justify-between">
                      <code className="bg-canvas px-2 py-0.5 rounded text-primary">{syntax}</code>
                    <span className="text-secondary">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <PromptDialog />
      <ConfirmDialog />
    </div>
  );
}
