# Chapter 6 — Tailwind CSS in Practice

Tailwind is a **utility-first** CSS framework. Instead of writing custom CSS, you compose small utility classes directly in your JSX.

## The core idea

```css
/* Traditional CSS — write a class, then define its styles */
.card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
```

```html
<!-- Traditional HTML -->
<div class="card">Content</div>
```

```html
<!-- Tailwind — styles are in the class attribute -->
<div class="bg-white rounded-2xl p-4 shadow-sm">Content</div>
```

**You never leave your HTML/JSX.** No context switching between files.

## The utility cheat sheet

These are the classes you'll use 95% of the time:

### Layout

```html
<!-- Flexbox -->
<div class="flex items-center justify-between gap-4">
<div class="flex-col">  <!-- column direction -->
<div class="flex-wrap">  <!-- wrap to next line -->

<!-- Grid -->
<div class="grid grid-cols-3 gap-6">  <!-- 3 columns -->

<!-- Width & Height -->
<div class="w-full">       <!-- width: 100% -->
<div class="w-96">         <!-- width: 384px (24rem) -->
<div class="max-w-4xl">    <!-- max-width: 896px -->
<div class="h-screen">     <!-- height: 100vh -->
```

### Spacing (margin & padding)

Tailwind uses a 4px scale: `p-4` = padding: 16px, `p-6` = 24px, `mt-2` = margin-top: 8px

```html
<div class="p-4">    <!-- padding: 16px on all sides -->
<div class="px-6">   <!-- padding-left/right: 24px -->
<div class="py-3">   <!-- padding-top/bottom: 12px -->
<div class="mt-8">   <!-- margin-top: 32px -->
<div class="gap-4">  <!-- gap between children: 16px -->
```

| Class | Value | Class | Value |
|-------|-------|-------|-------|
| `p-0` | 0 | `p-4` | 16px |
| `p-1` | 4px | `p-5` | 20px |
| `p-2` | 8px | `p-6` | 24px |
| `p-3` | 12px | `p-8` | 32px |

### Typography

```html
<h1 class="text-4xl font-bold text-primary">   <!-- 36px bold -->
<p class="text-sm text-secondary">              <!-- 14px gray -->
<span class="text-xs text-muted">               <!-- 12px muted -->
<div class="font-heading">                      <!-- custom heading font -->
<div class="leading-relaxed">                   <!-- line-height: 1.625 -->
<div class="truncate">                          <!-- text-overflow: ellipsis -->
<div class="text-center">                       <!-- text-align: center -->
```

The project defines `text-primary`, `text-secondary`, `text-muted` in the theme. Open `src/index.css` to see them.

### Borders & Backgrounds

```html
<div class="border border-border">          <!-- 1px solid border -->
<div class="rounded-xl">                    <!-- border-radius: 12px -->
<div class="rounded-2xl">                   <!-- border-radius: 16px -->
<div class="rounded-full">                  <!-- circle/pill -->

<div class="bg-surface">                    <!-- card background -->
<div class="bg-canvas">                     <!-- page background -->
<div class="bg-raised">                     <!-- elevated surface -->
```

### Visual states

```html
<button class="hover:bg-white transition-all duration-200">
  <!-- Changes on hover, smooth animation -->
</button>

<button class="disabled:opacity-40 disabled:cursor-not-allowed">
  <!-- Grayed out when disabled -->
</button>

<div class="group hover:group-hover:opacity-80">
  <!-- Parent state affects children -->
</div>
```

## Responsive design

Tailwind uses **breakpoint prefixes**:

```html
<!-- Mobile: single column, Tablet+: two columns, Desktop+: three columns -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
```

| Prefix | Min width | Targets |
|--------|-----------|---------|
| (none) | 0 | Phone |
| `sm:` | 640px | Large phone |
| `md:` | 768px | Tablet |
| `lg:` | 1024px | Desktop |
| `xl:` | 1280px | Wide desktop |

**Build mobile-first:** start with the phone layout, add `md:` and `lg:` to enhance.

## Custom theme in this project

Open `src/index.css`:

```css
@import "tailwindcss";

@theme {
  --color-canvas: #0a0a0b;
  --color-surface: #18181b;
  --color-raised: #1f1f23;
  --color-primary: #fafafa;
  --color-secondary: #a1a1aa;
  --color-muted: #52525b;
  --color-border: #27272a;
  --color-accent: #6366f1;

  --font-heading: "DM Serif Display", serif;
  --font-body: "Inter", sans-serif;
  --font-mono: "JetBrains Mono", monospace;
}
```

This creates the `bg-canvas`, `text-primary`, `font-heading` classes used everywhere.

## Dark mode (it's built in)

The project uses a dark theme by default — `bg-canvas` is near-black (`#0a0a0b`). To add a light mode:

```css
@media (prefers-color-scheme: light) {
  :root {
    --color-canvas: #ffffff;
    --color-surface: #f5f5f5;
    --color-primary: #0a0a0b;
    /* ... swap all dark colors for light */
  }
}
```

## Real example from the project

Open `src/pages/AdminPage.tsx` and look at `StatCard`:

```tsx
function StatCard({ icon, label, value, highlighted }: {
  icon: React.ReactNode; label: string; value: string | number; highlighted?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className={`mb-3 ${highlighted ? 'text-primary' : 'text-secondary'}`}>{icon}</div>
      <p className="text-2xl font-bold text-primary mb-1">{value}</p>
      <p className="text-xs text-secondary">{label}</p>
    </div>
  );
}
```

No custom CSS needed. Every style comes from utility classes.

## Your practice

Build a simple card using only Tailwind classes:

```html
<div class="max-w-sm rounded-2xl border border-border bg-surface p-6 hover:border-primary/30 transition-colors">
  <h2 class="text-lg font-bold text-primary mb-2">Post Title</h2>
  <p class="text-sm text-secondary mb-4">Short excerpt goes here...</p>
  <div class="flex items-center gap-3 text-xs text-muted">
    <span>5 min read</span>
    <span>42 views</span>
  </div>
</div>
```

In [Chapter 7](07-node-express.md), you'll switch to the backend.
