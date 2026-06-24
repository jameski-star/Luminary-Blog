# Chapter 5 — React from the Ground Up

React is a library for building **component-based UIs**. Every piece of the screen is a component — a reusable chunk of HTML + logic.

## A React component is just a function

```tsx
// Button.tsx
function Button({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 bg-blue-500 text-white rounded-lg"
    >
      {label}
    </button>
  );
}
```

**Key idea:** The function receives `props` (an object of arguments) and returns **JSX** (HTML-like syntax).

## JSX — JavaScript + XML

JSX looks like HTML but runs in JavaScript:

```tsx
const name = 'Alice';

// You embed JS expressions in {}
const element = (
  <div>
    <h1>Hello, {name}</h1>
    <p>2 + 2 = {2 + 2}</p>
    {isAdmin && <AdminBadge />}          {/* conditional rendering */}
    {items.map(item => <Item key={item.id} item={item} />)}  {/* lists */}
  </div>
);
```

**Rules of JSX:**
1. Return a single root element (use `<>...</>` fragment to wrap without a div)
2. Use `className` instead of `class` (because `class` is a JS keyword)
3. Close every tag: `<br />`, `<img />`
4. JS comments in `{/* */}`

## Props — component arguments

```tsx
interface CardProps {
  title: string;
  children: React.ReactNode;  // any renderable content
  variant?: 'default' | 'highlighted';
}

function Card({ title, children, variant = 'default' }: CardProps) {
  return (
    <div className={`rounded-2xl border p-5 ${variant === 'highlighted' ? 'bg-primary/5' : 'bg-surface'}`}>
      <h3 className="font-semibold text-primary">{title}</h3>
      <div className="text-secondary text-sm">{children}</div>
    </div>
  );
}

// Usage:
<Card title="Stats" variant="highlighted">
  <p>Total views: 1,234</p>
</Card>
```

Open `src/pages/AdminPage.tsx` and find `StatCard` — it's exactly this pattern.

## State — data that changes

`useState` is a hook that gives a component memory:

```tsx
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  //   ^variable  ^setter function   ^initial value

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>+1</button>
    </div>
  );
}
```

**Rules of hooks:**
1. Only call hooks at the **top level** of a component (not inside loops/conditions)
2. Only call hooks from **React functions** (components or custom hooks)
3. `useState` causes the component to **re-render** when you call the setter

### State in this project

```tsx
// AutoPostPage.tsx — multiple pieces of state
const [topic, setTopic] = useState('');
const [keywords, setKeywords] = useState<string[]>([]);
const [stages, setStages] = useState<PipelineStage[]>([]);
const [running, setRunning] = useState(false);
const [result, setResult] = useState<PipelineResult | null>(null);
const [error, setError] = useState('');
```

## Effects — running code at the right time

`useEffect` runs code after the component renders:

```tsx
import { useState, useEffect } from 'react';

function UserList() {
  const [users, setUsers] = useState<User[]>([]);

  // Run once when component mounts (empty dependency array)
  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => setUsers(data.users));
  }, []);  // <-- empty array = run once

  // Run when count changes
  useEffect(() => {
    document.title = `${count} new messages`;
  }, [count]);

  return (
    <div>
      {users.map(u => <div key={u.id}>{u.name}</div>)}
    </div>
  );
}
```

Seen in `src/pages/AdminPage.tsx:21-27` — fetching users on mount:

```tsx
useEffect(() => {
  if (isApiMode()) {
    api.admin.users().then(res => setUsers(res.users)).catch(() => {});
  } else {
    setUsers(getStoredUsers());
  }
}, []);
```

## Context — global state without prop drilling

When many components need the same data (current user, posts), pass it through **context**:

```tsx
// 1. Create the context
const AppContext = createContext<AppContextType | null>(null);

// 2. Provider wraps the app and holds the state
function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<BlogPost[]>([]);

  return (
    <AppContext.Provider value={{ user, setUser, posts, setPosts }}>
      {children}
    </AppContext.Provider>
  );
}

// 3. Any component consumes it
function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
```

Open `src/context/AppContext.tsx` — this is exactly how it works. `useApp()` is called in every page.

## Common patterns in this project

### Conditional rendering

```tsx
// In JSX, use && or ternary
{user ? (
  <Dashboard />
) : (
  <LoginPrompt />
)}

{isLoading && <Spinner />}

{posts.length === 0 && (
  <EmptyState message="No posts yet" />
)}
```

### Rendering lists

```tsx
{posts.map(post => (
  <PostCard key={post.id} post={post} />
))}
```

**Always use a unique `key` prop** when rendering lists. It helps React track changes.

### Event handlers

```tsx
// onClick
<button onClick={() => setCount(c => c + 1)}>+</button>

// onChange (input)
<input
  type="text"
  value={title}
  onChange={e => setTitle(e.target.value)}
/>

// onSubmit (form)
<form onSubmit={handleSubmit}>
  ...
</form>
```

### Custom hooks (reusable logic)

```tsx
// useConfirm.ts — reusable confirmation dialog
function useConfirm() {
  const [state, setState] = useState({ ... });
  const confirm = (message: string) => {
    return new Promise<boolean>(resolve => {
      setState({ open: true, message, resolve });
    });
  };
  return { confirm, ConfirmDialog };
}

// Used in AdminPage:
const ok = await confirm('Delete this post?');
if (ok) deletePost(id);
```

## Pages in this project

Each page is a component. The app uses conditional rendering (no React Router):

```tsx
// App.tsx (simplified)
function App() {
  const { currentPage } = useApp();

  switch (currentPage) {
    case 'home': return <HomePage />;
    case 'blog': return <BlogListPage />;
    case 'post': return <PostPage />;
    case 'editor': return <EditorPage />;
    case 'autopost': return <AutoPostPage />;
    case 'dashboard': return <DashboardPage />;
    case 'admin': return <AdminPage />;
    case 'login': return <LoginPage />;
    case 'signup': return <SignupPage />;
    case 'profile': return <ProfilePage />;
    default: return <HomePage />;
  }
}
```

## Your practice

Build a simple `LikeButton` component:

```tsx
function LikeButton() {
  const [liked, setLiked] = useState(false);
  return (
    <button
      onClick={() => setLiked(!liked)}
      className={`px-4 py-2 rounded-xl transition-colors ${
        liked ? 'bg-red-500 text-white' : 'bg-surface text-secondary'
      }`}
    >
      {liked ? '❤️ Liked' : '🤍 Like'}
    </button>
  );
}
```

In [Chapter 6](06-tailwind.md), you'll learn how Tailwind replaces handwritten CSS.
