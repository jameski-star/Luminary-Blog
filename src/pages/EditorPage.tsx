import { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import SEO from '../components/SEO';
import { Modal, usePrompt, useConfirm } from '../components/Modal';
import { validateManualPost } from '../services/geminiPipeline';
import { generateSlug, calcReadTime } from '../store/appStore';
import { detectRogueContent } from '../utils/contentDetection';
import { friendlyError } from '../utils/errors';
import type { BlogPost, AuditResult } from '../types';
import {
  Save, Send, Eye, EyeOff, Plus, X, Shield,
  AlertTriangle, CheckCircle, Info, ArrowLeft,
  Bold, Italic, Link2, Heading1, Heading2, Heading3, Image, Upload,
  Quote, List, ListOrdered
} from 'lucide-react';

function FormatButton({ icon, label, onClick, active }: { icon: React.ReactNode; label: string; onClick: () => void; active?: boolean }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`p-1.5 rounded-lg transition-colors ${
        active ? 'bg-primary/20 text-primary' : 'text-secondary hover:text-primary hover:bg-raised'
      }`}
    >
      {icon}
    </button>
  );
}

function htmlToMarkdown(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;

  function walk(node: Node): string {
    const result: string[] = [];
    for (let i = 0; i < node.childNodes.length; i++) {
      const child = node.childNodes[i];
      if (child.nodeType === Node.TEXT_NODE) {
        const text = child.textContent || '';
        if (text.trim()) result.push(text.replace(/\u00A0/g, ' '));
        continue;
      }
      if (child.nodeType !== Node.ELEMENT_NODE) continue;
      const el = child as HTMLElement;
      const tag = el.tagName.toLowerCase();

      switch (tag) {
        case 'h1': result.push(`\n\n# ${el.textContent}\n\n`); break;
        case 'h2': result.push(`\n\n## ${el.textContent}\n\n`); break;
        case 'h3': result.push(`\n\n### ${el.textContent}\n\n`); break;
        case 'blockquote': {
          const inner = walk(el).trim();
          result.push('\n\n' + inner.split('\n').map(l => l.trim() ? `> ${l}` : '>').join('\n') + '\n\n');
          break;
        }
        case 'ul':
        case 'ol': {
          const items = el.querySelectorAll(':scope > li');
          items.forEach(li => result.push(`\n- ${walk(li).trim()}`));
          result.push('\n');
          break;
        }
        case 'strong': case 'b': result.push(`**${walk(el)}**`); break;
        case 'em': case 'i': result.push(`*${walk(el)}*`); break;
        case 'u': result.push(`<u>${walk(el)}</u>`); break;
        case 'a': {
          const href = (el as HTMLAnchorElement).href || '';
          result.push(`[${walk(el)}](${href})`);
          break;
        }
        case 'img': {
          const src = (el as HTMLImageElement).src || '';
          const alt = (el as HTMLImageElement).alt || '';
          result.push(`![${alt}](${src})`);
          break;
        }
        case 'br': result.push('\n'); break;
        case 'p': {
          const inner = walk(el).trim();
          if (inner) result.push(`${inner}\n\n`);
          break;
        }
        case 'div': case 'span':
        default: result.push(walk(el)); break;
      }
    }
    return result.join('');
  }

  return walk(div).replace(/\n{4,}/g, '\n\n').trim();
}

export default function EditorPage() {
  const { user, geminiKey, addPost, setCurrentPage, setSelectedPostId } = useApp();
  const { prompt, PromptDialog } = usePrompt();
  const { confirm, ConfirmDialog } = useConfirm();

  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [keywordInput, setKeywordInput] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [coverImage, setCoverImage] = useState('');
  const [preview, setPreview] = useState(false);

  const [validating, setValidating] = useState(false);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [validationError, setValidationError] = useState('');
  const [rogueWarning, setRogueWarning] = useState<string | null>(null);

  const editorRef = useRef<HTMLDivElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const getContentText = useCallback(() => editorRef.current?.innerText || '', []);
  const getContentHtml = useCallback(() => editorRef.current?.innerHTML || '', []);

  const getContentMarkdown = useCallback(() => {
    return htmlToMarkdown(getContentHtml());
  }, [getContentHtml]);

  const insertImage = async () => {
    const url = await prompt('Insert Image', 'Enter image URL:', 'https://', 'https://example.com/image.jpg');
    if (!url) return;
    document.execCommand('insertHTML', false, `<br><img src="${url}" alt="${url.split('/').pop() || 'image'}" /><br>`);
  };

  const execFormat = useCallback((cmd: string, value?: string) => {
    document.execCommand(cmd, false, value);
    editorRef.current?.focus();
  }, []);

  const handleInput = useCallback(() => {
    const text = getContentText();
    const rogue = detectRogueContent(text);
    setRogueWarning(rogue.isRogue ? rogue.reason || 'Suspicious content detected.' : null);
  }, [getContentText]);

  useEffect(() => {
    if (!excerpt && getContentText()) {
      setExcerpt(getContentText().replace(/[#*`]/g, '').trim().slice(0, 160));
    }
  }, [getContentText]);

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

  const text = getContentText();
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const readTime = calcReadTime(text);

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
    const md = getContentMarkdown();
    if (md.split(/\s+/).length < 100) { setValidationError('Write at least 100 words to validate.'); return; }
    setValidating(true);
    setAuditResult(null);
    setValidationError('');
    try {
      const result = await validateManualPost(md, geminiKey);
      setAuditResult(result);
    } catch (err: unknown) {
      setValidationError(friendlyError(err));
    } finally {
      setValidating(false);
    }
  };

  const canPublish = title.trim() && wordCount >= 50;

  const publishPost = async (status: 'published' | 'draft') => {
    if (!canPublish) return;

    const content = getContentMarkdown();

    const rogue = detectRogueContent(content);
    if (rogue.isRogue && status === 'published') {
      const ok = await confirm('Suspicious Content Detected', `${rogue.reason} This post will be saved as a draft and submitted for admin review.`, 'Save as Draft');
      if (!ok) return;
      status = 'review';
    }

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

            {/* Formatting Toolbar */}
            <div className="flex items-center gap-1 px-3 py-2 mb-3 rounded-xl border border-border bg-surface">
              <FormatButton icon={<Bold size={15} />} label="Bold" onClick={() => execFormat('bold')} />
              <FormatButton icon={<Italic size={15} />} label="Italic" onClick={() => execFormat('italic')} />
              <span className="w-px h-5 bg-border mx-1" />
              <FormatButton icon={<Heading1 size={15} />} label="Heading 1" onClick={() => execFormat('formatBlock', 'h1')} />
              <FormatButton icon={<Heading2 size={15} />} label="Heading 2" onClick={() => execFormat('formatBlock', 'h2')} />
              <FormatButton icon={<Heading3 size={15} />} label="Heading 3" onClick={() => execFormat('formatBlock', 'h3')} />
              <span className="w-px h-5 bg-border mx-1" />
              <FormatButton icon={<Quote size={15} />} label="Blockquote" onClick={() => execFormat('formatBlock', 'blockquote')} />
              <FormatButton icon={<List size={15} />} label="Bullet List" onClick={() => execFormat('insertUnorderedList')} />
              <FormatButton icon={<ListOrdered size={15} />} label="Numbered List" onClick={() => execFormat('insertOrderedList')} />
              <span className="w-px h-5 bg-border mx-1" />
              <FormatButton icon={<Link2 size={15} />} label="Link" onClick={async () => {
                const url = await prompt('Insert Link', 'Enter URL:', 'https://', 'https://example.com');
                if (url) execFormat('createLink', url);
              }} />
              <FormatButton icon={<Image size={15} />} label="Image" onClick={insertImage} />
            </div>

            {/* Editor / Preview */}
            <div
              ref={editorRef}
              contentEditable={!preview}
              onInput={handleInput}
              suppressContentEditableWarning
              className={`w-full bg-transparent text-primary text-base outline-none leading-relaxed min-h-[60vh] ${
                preview ? '' : 'border border-border rounded-2xl p-5'
              } ${preview ? 'prose-premium' : ''}`}
              style={preview ? {} : { minHeight: '60vh' }}
            />
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
                  <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 5 * 1024 * 1024) { setValidationError('Image too large. Maximum 5MB.'); return; }
                    const reader = new FileReader();
                    reader.onload = (ev) => { if (ev.target?.result) setCoverImage(ev.target.result as string); };
                    reader.readAsDataURL(file);
                  }} />
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

            {/* Markdown Reference */}
            <div className="rounded-2xl border border-border bg-surface p-5">
              <h3 className="text-xs font-semibold text-secondary uppercase tracking-wider mb-3">Formatting Reference</h3>
              <div className="space-y-1.5 text-xs font-mono text-secondary">
                {[
                  ['Ctrl+B', 'Bold'],
                  ['Ctrl+I', 'Italic'],
                  ['Ctrl+K', 'Link'],
                  ['Select text then click a tool', 'Apply formatting'],
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
