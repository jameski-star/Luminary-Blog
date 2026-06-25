import { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import SEO from '../components/SEO';
import { Modal, usePrompt, useConfirm } from '../components/Modal';
import { validateManualPost } from '../services/geminiPipeline';
import { generateSlug, calcReadTime } from '../store/appStore';
import { detectRogueContent } from '../utils/contentDetection';
import { friendlyError } from '../utils/errors';
import { marked } from 'marked';
import { getTemplates, getTemplateCategories } from '../utils/templates';
import type { PostTemplate } from '../utils/templates';
import type { BlogPost, AuditResult } from '../types';
import {
  Save, Send, Eye, EyeOff, Plus, X, Shield,
  AlertTriangle, CheckCircle, Info, ArrowLeft,
  Bold, Italic, Link2, Heading1, Heading2, Heading3, Image, Upload,
  Quote, List, ListOrdered, LayoutTemplate
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

  // Templates
  const [showTemplates, setShowTemplates] = useState(false);
  const [templateCategory, setTemplateCategory] = useState('all');
  const templates = getTemplates();
  const templateCategories = ['all', ...getTemplateCategories()];
  const filteredTemplates = templateCategory === 'all'
    ? templates
    : templates.filter(t => t.category === templateCategory);

  // Context menu
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  // Writing font
  const [writingFont, setWritingFont] = useState('"Inter", system-ui, sans-serif');
  const PREMIUM_FONTS = [
    { name: 'Inter', family: '"Inter", system-ui, sans-serif', css: 'Inter:wght@400;500;600;700', type: 'Sans' },
    { name: 'DM Sans', family: '"DM Sans", system-ui, sans-serif', css: 'DM+Sans:wght@400;500;600;700', type: 'Sans' },
    { name: 'Playfair Display', family: '"Playfair Display", Georgia, serif', css: 'Playfair+Display:wght@400;500;600;700', type: 'Serif' },
    { name: 'Merriweather', family: '"Merriweather", Georgia, serif', css: 'Merriweather:wght@300;400;700;900', type: 'Serif' },
    { name: 'Lora', family: '"Lora", Georgia, serif', css: 'Lora:wght@400;500;600;700', type: 'Serif' },
    { name: 'Source Serif 4', family: '"Source Serif 4", Georgia, serif', css: 'Source+Serif+4:wght@400;500;600;700;900', type: 'Serif' },
    { name: 'IBM Plex Serif', family: '"IBM Plex Serif", Georgia, serif', css: 'IBM+Plex+Serif:wght@400;500;600;700', type: 'Serif' },
    { name: 'Crimson Pro', family: '"Crimson Pro", Georgia, serif', css: 'Crimson+Pro:wght@400;500;600;700', type: 'Serif' },
    { name: 'DM Serif Display', family: '"DM Serif Display", Georgia, serif', css: 'DM+Serif+Display:wght@400', type: 'Serif' },
    { name: 'Times New Roman', family: '"Times New Roman", Times, serif', css: '', type: 'Serif' },
    { name: 'JetBrains Mono', family: '"JetBrains Mono", monospace', css: 'JetBrains+Mono:wght@400;500;600;700', type: 'Mono' },
  ];

  useEffect(() => {
    const id = 'writing-font-link';
    if (document.getElementById(id)) return;
    const selected = PREMIUM_FONTS.find(f => f.family === writingFont);
    if (!selected || !selected.css || selected.name === 'Inter') return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${selected.css}&display=swap`;
    document.head.appendChild(link);
  }, [writingFont]);

  const applyTemplate = (tmpl: PostTemplate) => {
    setTitle(tmpl.title);
    if (editorRef.current) {
      editorRef.current.innerHTML = marked.parse(tmpl.content, { async: false }) as string;
    }
    if (tmpl.tags) setTags(tmpl.tags.slice(0, 6));
    setExcerpt(tmpl.excerpt);
    setShowTemplates(false);
  };

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

  const publishPost = async (intendedStatus: 'published' | 'draft') => {
    if (!canPublish) return;

    const content = getContentMarkdown();

    const rogue = detectRogueContent(content);
    let finalStatus: BlogPost['status'] = intendedStatus;
    if (rogue.isRogue && intendedStatus === 'published') {
      const ok = await confirm('Suspicious Content Detected', `${rogue.reason} This post will be saved as a draft and submitted for admin review.`, 'Save as Draft');
      if (!ok) return;
      finalStatus = 'review';
    }

    if (finalStatus === 'published' && auditResult && auditResult.score < 65) {
      const ok = await confirm('Low Authenticity Score', `Authenticity score is ${auditResult.score}/100 (below 65). Publish anyway?`, 'Publish Anyway');
      if (!ok) return;
    }

    const slug = generateSlug(title);
    const now = new Date().toISOString();
    const finalExcerpt = excerpt || content.replace(/[#*]/g, '').trim().slice(0, 160);

    const isApproved = finalStatus === 'published' && (auditResult?.score || 0) >= 65 && !rogue.isRogue;

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
      status: finalStatus,
      readTime,
      views: 0,
      likes: 0,
      auditScore: auditResult?.score,
      wordCount,
      isApproved,
    };

    addPost(post);
    if (finalStatus === 'published') {
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
            <div className="flex items-center gap-1 px-3 py-2 mb-3 rounded-xl border border-border bg-surface flex-wrap">
              <FormatButton icon={<LayoutTemplate size={15} />} label="Templates" onClick={() => setShowTemplates(true)} />
              <span className="w-px h-5 bg-border mx-1" />
              <select
                value={writingFont}
                onChange={e => setWritingFont(e.target.value)}
                className="text-xs bg-canvas border border-border rounded-lg px-2 py-1.5 text-primary outline-none focus:border-primary/40 cursor-pointer max-w-[120px]"
                style={{ fontFamily: writingFont }}
              >
                {PREMIUM_FONTS.map(f => (
                  <option key={f.name} value={f.family} style={{ fontFamily: f.family }}>
                    {f.name}
                  </option>
                ))}
              </select>
              <span className="w-px h-5 bg-border mx-1" />
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
                const sel = window.getSelection();
                const editor = editorRef.current;
                let savedRange: Range | null = null;
                let selectedText = '';
                if (sel && sel.rangeCount > 0 && editor?.contains(sel.anchorNode)) {
                  savedRange = sel.getRangeAt(0).cloneRange();
                  if (!sel.isCollapsed) selectedText = sel.toString();
                }
                const url = await prompt('Insert Link', 'Enter URL:', 'https://', 'https://example.com');
                if (!url || !editor) return;
                const displayText = selectedText
                  ? selectedText
                  : await prompt('Link Text', 'Enter the text to display:', '', 'Click here');
                if (!displayText) return;
                editor.focus();
                if (savedRange) {
                  const newSel = window.getSelection();
                  newSel?.removeAllRanges();
                  newSel?.addRange(savedRange);
                }
                document.execCommand('insertHTML', false, `<a href="${url.replace(/"/g, '&quot;')}">${displayText}</a>`);
              }} />
              <FormatButton icon={<Image size={15} />} label="Image" onClick={insertImage} />
            </div>

            {/* Editor / Preview */}
            <div
              ref={editorRef}
              contentEditable={!preview}
              onInput={handleInput}
              onContextMenu={e => {
                if (!preview) {
                  e.preventDefault();
                  setContextMenu({ x: e.clientX, y: e.clientY });
                }
              }}
              onClick={() => setContextMenu(null)}
              suppressContentEditableWarning
              className={`w-full bg-transparent text-primary text-base outline-none leading-relaxed min-h-[60vh] ${
                preview ? '' : 'border border-border rounded-2xl p-5'
              } ${preview ? 'prose-premium' : ''}`}
              style={preview ? {} : { minHeight: '60vh', fontFamily: writingFont }}
            />

            {/* Context Menu */}
            {contextMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)} />
                <div
                  className="fixed z-50 rounded-xl border border-border bg-surface shadow-2xl p-1 min-w-[160px]"
                  style={{ left: contextMenu.x, top: contextMenu.y }}
                >
                  <button
                    className="w-full text-left px-3 py-2 text-sm text-primary hover:bg-raised rounded-lg transition-colors flex items-center gap-2"
                    onClick={async () => {
                      setContextMenu(null);
                      const sel = window.getSelection();
                      const editor = editorRef.current;
                      let savedRange: Range | null = null;
                      let selectedText = '';
                      if (sel && sel.rangeCount > 0 && editor?.contains(sel.anchorNode)) {
                        savedRange = sel.getRangeAt(0).cloneRange();
                        if (!sel.isCollapsed) selectedText = sel.toString();
                      }
                      const url = await prompt('Insert Link', 'Enter URL:', 'https://', 'https://example.com');
                      if (!url || !editor) return;
                      const displayText = selectedText
                        ? selectedText
                        : await prompt('Link Text', 'Enter the text to display:', '', 'Click here');
                      if (!displayText) return;
                      editor.focus();
                      if (savedRange) {
                        const newSel = window.getSelection();
                        newSel?.removeAllRanges();
                        newSel?.addRange(savedRange);
                      }
                      document.execCommand('insertHTML', false, `<a href="${url.replace(/"/g, '&quot;')}">${displayText}</a>`);
                    }}
                  >
                    <Link2 size={14} />
                    Hyperlink
                  </button>
                </div>
              </>
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

      {/* Template Picker Modal */}
      {showTemplates && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowTemplates(false)} />
          <div className="relative w-full max-w-3xl max-h-[80vh] rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border">
              <h2 className="text-lg font-semibold text-primary">Choose a Template</h2>
              <button onClick={() => setShowTemplates(false)} className="text-secondary hover:text-primary transition-colors p-1 rounded-lg hover:bg-raised">
                <X size={18} />
              </button>
            </div>

            {/* Category filter */}
            <div className="flex gap-2 px-6 py-4 border-b border-border overflow-x-auto">
              {templateCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setTemplateCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    templateCategory === cat
                      ? 'bg-primary text-canvas'
                      : 'bg-raised text-secondary hover:text-primary'
                  }`}
                >
                  {cat === 'all' ? 'All Templates' : cat}
                </button>
              ))}
            </div>

            <div className="overflow-y-auto p-6 max-h-[50vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTemplates.map(tmpl => (
                  <button
                    key={tmpl.id}
                    onClick={() => applyTemplate(tmpl)}
                    className="text-left rounded-2xl border border-border bg-raised p-5 hover:border-primary/40 transition-all group"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">{tmpl.icon}</span>
                      <div>
                        <h3 className="text-sm font-semibold text-primary group-hover:text-primary/80 transition-colors">{tmpl.name}</h3>
                        <span className="text-xs text-muted">{tmpl.category}</span>
                      </div>
                    </div>
                    <p className="text-xs text-secondary leading-relaxed line-clamp-2">{tmpl.description}</p>
                    <div className="flex gap-1.5 mt-3">
                      {tmpl.tags.slice(0, 3).map(t => (
                        <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-canvas text-muted">{t}</span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <PromptDialog />
      <ConfirmDialog />
    </div>
  );
}
