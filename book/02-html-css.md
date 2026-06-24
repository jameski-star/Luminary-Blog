# Chapter 2 — HTML & CSS Foundations

React components render HTML and Tailwind writes CSS classes. Before touching either, you need to understand what they generate.

## HTML — The skeleton

Every webpage is built from **elements** (tags):

```html
<!-- This is a comment -->
<h1>Big heading</h1>
<h2>Smaller heading</h2>
<p>A paragraph of text.</p>
<a href="https://example.com">Clickable link</a>
<img src="photo.jpg" alt="Description" />
<button>Click me</button>
<input type="text" placeholder="Your name" />

<!-- Containers (used constantly in React) -->
<div>A generic box</div>
<span>Inline text wrapper</span>
```

### Two categories of elements

**Block elements** — stack vertically, take full width:
```html
<div>, <h1>-<h6>, <p>, <section>, <nav>, <header>, <footer>
```

**Inline elements** — sit next to each other on the same line:
```html
<span>, <a>, <strong>, <em>, <img>, <input>, <button>
```

### The minimal HTML page

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>My Page</title>
</head>
<body>
  <h1>Hello world</h1>
</body>
</html>
```

Open `index.html` in this project — you'll see exactly this structure, with `<div id="root"></div>` in the body where React injects everything.

## CSS — The skin

CSS selects HTML elements and styles them:

```css
/* Select by tag name */
h1 {
  color: blue;
  font-size: 32px;
}

/* Select by class (reusable) */
.card {
  background: white;
  border-radius: 12px;
  padding: 16px;
}

/* Select by id (unique) */
#submit-btn {
  background: green;
  color: white;
}
```

### The box model (memorize this)

Every element is a box:

```
┌─────────────────────────────────────┐
│            Margin (outside)         │
│  ┌───────────────────────────────┐  │
│  │         Border                │  │
│  │  ┌─────────────────────────┐  │  │
│  │  │      Padding            │  │  │
│  │  │  ┌───────────────────┐  │  │  │
│  │  │  │     Content       │  │  │  │
│  │  │  └───────────────────┘  │  │  │
│  │  └─────────────────────────┘  │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

```css
.box {
  width: 200px;
  padding: 16px;       /* space INSIDE the box */
  border: 1px solid black;
  margin: 12px;         /* space OUTSIDE the box */
}
```

### Flexbox — the layout superpower

Flexbox arranges items in a row or column:

```css
.container {
  display: flex;           /* children become flex items */
  gap: 12px;               /* space between children */
  justify-content: center; /* horizontal: start, center, space-between */
  align-items: center;     /* vertical: start, center, stretch */
  flex-wrap: wrap;         /* allow items to wrap to next line */
}
```

**Every page in this project uses flexbox.** Open any component file and you'll see `flex`, `items-center`, `gap-3` everywhere — those are Tailwind's names for these properties.

### Grid — two-dimensional layouts

```css
.grid-container {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;  /* three equal columns */
  gap: 16px;
}
```

### Responsive design with media queries

```css
/* Phone first — single column */
.card { width: 100%; }

/* Tablet and up — two columns */
@media (min-width: 768px) {
  .card { width: 50%; }
}

/* Desktop — three columns */
@media (min-width: 1024px) {
  .card { width: 33%; }
}
```

Tailwind does this with prefixes like `md:w-1/2` and `lg:w-1/3`.

## CSS variables (custom properties)

This project uses CSS variables for theming:

```css
/* Defined in src/index.css */
:root {
  --color-canvas: #0a0a0b;
  --color-surface: #18181b;
  --color-primary: #fafafa;
  --color-secondary: #a1a1aa;
  --color-border: #27272a;
  --color-accent: #6366f1;
}
```

They're used like this:
```css
.some-element {
  background: var(--color-surface);
  color: var(--color-primary);
}
```

Tailwind classes like `bg-surface` and `text-primary` are custom utilities mapped to these variables.

## See it in action

Open `src/index.css` in this project. You'll see:
1. `@import "tailwindcss"` — loads all of Tailwind
2. `@theme` block — defines custom colors and fonts
3. `@layer base` — resets and global styles
4. `@layer utilities` — custom helper classes

## Your practice

1. Create a file `practice.html`
2. Add a `<div>` with three ` <p>` inside
3. Style them with a `<style>` block to display as a row with 16px gap
4. Give them borders and padding

This is exactly how React components work — just with JavaScript instead of raw HTML files.

In [Chapter 3](03-javascript.md), you'll learn the JavaScript that makes the page interactive.
