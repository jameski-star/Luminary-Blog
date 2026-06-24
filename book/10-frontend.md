# Chapter 10 — Building the Frontend Pages

This chapter walks through every page in the app, showing the patterns you'll use in each one.

## Routing (without a router)

This project doesn't use React Router. Instead, `App.tsx` holds a `currentPage` string in context and conditionally renders the right page:

```tsx
// App.tsx
function App() {
  const { currentPage } = useApp();

  switch (currentPage) {
    case 'home':    return <HomePage />;
    case 'blog':    return <BlogListPage />;
    case 'post':    return <PostPage />;
    case 'editor':  return <EditorPage />;
    case 'autopost': return <AutoPostPage />;
    case 'dashboard': return <DashboardPage />;
    case 'admin':   return <AdminPage />;
    case 'login':   return <LoginPage />;
    case 'signup':  return <SignupPage />;
    case 'profile': return <ProfilePage />;
    default:        return <HomePage />;
  }
}
```

Navigation is just `setCurrentPage('blog')`.

## HomePage

**Purpose:** Landing page — featured post, recent posts list, hero section.

**Key patterns:**
```tsx
// src/pages/HomePage.tsx
export default function HomePage() {
  const { posts, setCurrentPage } = useApp();

  // Compute derived data from state
  const published = posts.filter(p => p.status === 'published');
  const featured = published[0];  // most recent is first
  const recent = published.slice(0, 6);

  return (
    <div className="min-h-screen bg-canvas pt-16">
      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <h1 className="font-heading text-5xl font-bold text-primary mb-4">
          Write with AI
        </h1>
        <p className="text-xl text-secondary mb-8">
          Generate, audit, and publish content
        </p>
        <button
          onClick={() => setCurrentPage('autopost')}
          className="bg-primary text-canvas font-semibold px-8 py-4 rounded-2xl"
        >
          Start Writing
        </button>
      </section>

      {/* Featured Post */}
      {featured && (
        <FeaturedPostCard post={featured} />
      )}

      {/* Recent Posts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recent.map(post => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
```

## BlogListPage

**Purpose:** Browse all published posts with search and tag filtering.

```tsx
// src/pages/BlogListPage.tsx
export default function BlogListPage() {
  const { posts } = useApp();
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('all');

  const published = posts.filter(p => p.status === 'published');

  // Derive tag list from posts
  const allTags = ['all', ...new Set(published.flatMap(p => p.tags))];

  // Filter chain
  const filtered = published.filter(p => {
    const matchesSearch = !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.content.toLowerCase().includes(search.toLowerCase());
    const matchesTag = selectedTag === 'all' || p.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  return (
    <div className="min-h-screen bg-canvas pt-20">
      <SEO title="Blog" description="Browse all published articles." />

      {/* Search Bar */}
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search articles..."
        className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-primary"
      />

      {/* Tag Filters */}
      <div className="flex gap-2">
        {allTags.map(tag => (
          <button
            key={tag}
            onClick={() => setSelectedTag(tag)}
            className={`px-3 py-1.5 rounded-lg text-xs ${
              selectedTag === tag
                ? 'bg-primary text-canvas'
                : 'bg-surface text-secondary'
            }`}
          >
            {tag === 'all' ? 'All' : tag}
          </button>
        ))}
      </div>

      {/* Post List */}
      {filtered.map(post => (
        <BlogRow key={post.id} post={post} />
      ))}
    </div>
  );
}
```

## PostPage

**Purpose:** Read a single blog post.

```tsx
export default function PostPage() {
  const { selectedPostId, posts, setCurrentPage } = useApp();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try local state first
    let found = posts.find(p => p.id === selectedPostId);

    // Fallback to API
    if (!found && isApiMode() && selectedPostId) {
      api.posts.get(selectedPostId).then(res => {
        setPost(res.post);
        setLoading(false);
      });
    } else {
      setPost(found || null);
      setLoading(false);
    }
  }, [selectedPostId, posts]);

  if (loading) return <LoadingSpinner />;
  if (!post) return <NotFound />;

  return (
    <article className="max-w-3xl mx-auto px-4 pt-24 pb-20">
      {/* Cover Image */}
      {post.coverImage && (
        <img src={post.coverImage} alt=""
          className="w-full rounded-2xl mb-8 max-h-96 object-cover"
        />
      )}

      <h1 className="font-heading text-4xl font-bold text-primary mb-4">
        {post.title}
      </h1>

      <div className="flex items-center gap-4 text-sm text-secondary mb-8">
        <span>{post.authorName}</span>
        <span>{post.readTime} min read</span>
        <span>{formatDistanceToNow(new Date(post.publishedAt))}</span>
      </div>

      {/* Content rendered from Markdown */}
      <div
        className="prose-premium"
        dangerouslySetInnerHTML={{
          __html: marked.parse(post.content, { async: false }) as string
        }}
      />
    </article>
  );
}
```

## EditorPage

**Purpose:** Write and publish blog posts with cover images, tags, and AI validation.

**State:**
```tsx
const [title, setTitle] = useState('');
const [content, setContent] = useState('');
const [excerpt, setExcerpt] = useState('');
const [tags, setTags] = useState<string[]>([]);
const [coverImage, setCoverImage] = useState<string | null>(null);
const [validationError, setValidationError] = useState('');
const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
```

**Key feature — rogue content detection:**
```tsx
// Runs on every keystroke
useEffect(() => {
  const check = detectRogueContent(content);
  setRogueWarning(check.isRogue ? check.reason || 'Suspicious content detected.' : null);
}, [content]);

// Blocks publish if rogue
const rogue = detectRogueContent(content);
if (rogue.isRogue && status === 'published') {
  const ok = await confirm('Suspicious Content Detected', rogue.reason!, 'Save as Draft');
  if (!ok) return;
  status = 'review';  // force review
}
```

## DashboardPage

**Purpose:** User's personal post manager — shows their posts with tabs for Published, Drafts, and In Review.

```tsx
const userPosts = posts.filter(p => p.authorId === user.id);

// Tab-based filtering
const published = userPosts.filter(p => p.status === 'published');
const drafts = userPosts.filter(p => p.status === 'draft');
const inReview = userPosts.filter(p => p.status === 'review' || p.status === 'quarantined');
```

## AdminPage

**Purpose:** Platform administration — manage all posts and users.

**Three tabs:**
1. **Review Queue** — approve/reject flagged posts
2. **Posts** — browse/edit/delete all posts with filters
3. **Users** — promote users to admin

**Key pattern — admin-only gate:**
```tsx
if (!user || user.role !== 'admin') {
  return <AccessDenied />;
}
```

## AutoPostPage

**Purpose:** AI-powered article generation with a 3-stage pipeline.

**Pipeline stages displayed as progress:**
```tsx
{stages.map(stage => (
  <div key={stage.id} className="flex items-center gap-3">
    {stage.status === 'running' && <Spinner />}
    {stage.status === 'complete' && <CheckCircle className="text-emerald-400" />}
    {stage.status === 'error' && <AlertTriangle className="text-red-400" />}
    <span>{stage.label}</span>
    {stage.message && <span className="text-xs text-secondary">{stage.message}</span>}
  </div>
))}
```

## ProfilePage

**Purpose:** View/edit profile, see account stats.

## Common patterns across all pages

### Loading state
```tsx
if (loading) {
  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center pt-16">
      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );
}
```

### Empty state
```tsx
{posts.length === 0 && (
  <div className="text-center py-20">
    <FileText className="text-secondary mx-auto mb-3" size={32} />
    <h3 className="text-lg font-semibold text-primary mb-2">No posts yet</h3>
    <p className="text-secondary">Create your first post to get started.</p>
  </div>
)}
```

### Error state
```tsx
{error && (
  <div className="flex items-start gap-3 p-4 rounded-2xl border border-border bg-surface mb-6">
    <AlertTriangle className="text-amber-400 shrink-0 mt-0.5" size={16} />
    <p className="text-secondary text-sm">{error}</p>
  </div>
)}
```

### SEO component
Each page sets title and description:
```tsx
<SEO title="Page Name" description="Page description for search engines." />
```

## Your practice

Build a simple TasksPage that:
1. Shows a list of tasks from state
2. Has a form to add new tasks
3. Can toggle completion
4. Filters between All / Active / Completed

```tsx
function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [input, setInput] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const addTask = () => {
    setTasks([...tasks, { id: Date.now(), title: input, completed: false }]);
    setInput('');
  };

  const filtered = tasks.filter(t =>
    filter === 'all' ? true
    : filter === 'active' ? !t.completed
    : t.completed
  );

  return (
    <div className="max-w-lg mx-auto p-4">
      <h1 className="text-2xl font-bold text-primary mb-4">Tasks</h1>

      <div className="flex gap-2 mb-4">
        {(['all', 'active', 'completed'] as const).map(f => (
          <button key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-lg text-sm ${
              filter === f ? 'bg-primary text-canvas' : 'bg-surface text-secondary'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {filtered.map(task => (
        <div key={task.id}
          className="flex items-center gap-3 p-3 rounded-xl bg-surface border border-border mb-2"
        >
          <input type="checkbox" checked={task.completed}
            onChange={() => setTasks(tasks.map(t =>
              t.id === task.id ? { ...t, completed: !t.completed } : t
            ))}
          />
          <span className={task.completed ? 'line-through text-muted' : 'text-primary'}>
            {task.title}
          </span>
        </div>
      ))}
    </div>
  );
}
```

In [Chapter 11](11-ai-pipeline.md), you'll integrate the Gemini AI API.
