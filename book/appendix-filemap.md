# Appendix A — Project File Map

Every file in the project with a one-line description of its purpose.

## Root level

| File | Purpose |
|------|---------|
| `index.html` | HTML entry point — contains `<div id="root">` where React mounts |
| `package.json` | Dependencies and scripts for the frontend |
| `vite.config.ts` | Vite build configuration (plugins, build options) |
| `tailwind.config.js` | Tailwind CSS customization (colors, fonts — not used in v4) |
| `postcss.config.js` | PostCSS configuration (processes Tailwind CSS) |
| `tsconfig.json` | TypeScript configuration for frontend |
| `tsconfig.app.json` | TypeScript config for app source files |
| `tsconfig.node.json` | TypeScript config for Vite config files |

## Frontend source (`src/`)

### Entry & Root

| File | Purpose |
|------|---------|
| `src/main.tsx` | React entry point — renders `<App>` into `#root` |
| `src/App.tsx` | Root component — routing via `currentPage` state, loads fonts |
| `src/index.css` | Global styles — Tailwind imports, CSS variables, theme, base styles |
| `src/vite-env.d.ts` | Vite type declarations |

### Types

| File | Purpose |
|------|---------|
| `src/types/index.ts` | Shared TypeScript interfaces — `User`, `BlogPost`, `AuditResult`, `PipelineResult` |

### State & Data

| File | Purpose |
|------|---------|
| `src/context/AppContext.tsx` | React Context — global state: user, posts, pages, Gemini key, and all actions |
| `src/store/appStore.ts` | localStorage helpers — save/load posts and users, signup/signin, slug generation, word indexing |

### Pages

| File | Purpose |
|------|---------|
| `src/pages/HomePage.tsx` | Landing page — hero, featured post, recent posts grid, stats |
| `src/pages/BlogListPage.tsx` | Browse all published posts — search bar, tag filter, post list with cover images |
| `src/pages/PostPage.tsx` | Read a single post — cover image, markdown content, author info, views/likes |
| `src/pages/EditorPage.tsx` | Write/edit posts — title, content, excerpt, tags, cover image, rogue detection, AI validation |
| `src/pages/AutoPostPage.tsx` | AI article generation — topic/keyword input, 3-stage pipeline, progress display, publish/save |
| `src/pages/DashboardPage.tsx` | User's post manager — tabs for published/drafts/review, stats, create button |
| `src/pages/AdminPage.tsx` | Administration — review queue (approve/reject flagged posts), all-posts management, user management |
| `src/pages/AuthPages.tsx` | Login and Signup — email/password forms, validation, JWT token handling |
| `src/pages/ProfilePage.tsx` | User profile — name, email, role, join date, post count |

### Components

| File | Purpose |
|------|---------|
| `src/components/SEO.tsx` | Sets document title and meta description for each page |
| `src/components/Modal.tsx` | Reusable modal dialog — also exports `usePrompt()` and `useConfirm()` hooks |

### Services

| File | Purpose |
|------|---------|
| `src/services/api.ts` | HTTP client — typed wrappers for every API endpoint, `isApiMode()` check, dual localStorage/API support |
| `src/services/geminiPipeline.ts` | AI pipeline — 3 stages (draft, audit, polish), retry logic with exponential backoff |

### Utilities

| File | Purpose |
|------|---------|
| `src/utils/contentDetection.ts` | Rogue content detector — checks for gibberish, keyboard spam, copy-paste, short content |
| `src/utils/errors.ts` | User-friendly error messages — maps raw errors to "try again in 5 minutes" style messages |
| `src/utils/cn.ts` | Tailwind class merging utility — `cn('base', condition && 'extra')` |

## Backend (`server/`)

### Config

| File | Purpose |
|------|---------|
| `server/package.json` | Backend dependencies and scripts |
| `server/tsconfig.json` | TypeScript configuration for backend |
| `server/src/config.ts` | Environment variables loader — port, MongoDB URI, JWT secret, app URL |
| `server/src/index.ts` | Server entry — Express setup, middleware, routes, DB connection |
| `server/src/seed.ts` | Database seeding — creates initial admin from env vars if no users exist |

### Models (Mongoose)

| File | Purpose |
|------|---------|
| `server/src/models/User.ts` | User schema — name, email, passwordHash, role, joinedAt |
| `server/src/models/Post.ts` | Post schema — title, slug, content, status, author, tags, views, likes |

### Routes (Express)

| File | Purpose |
|------|---------|
| `server/src/routes/auth.ts` | Auth endpoints — `POST /signup`, `POST /signin`, `GET /me` |
| `server/src/routes/posts.ts` | Post CRUD — list, get, create, update, delete with auth checks |
| `server/src/routes/admin.ts` | Admin endpoints — list users, get all posts, promote user to admin |
| `server/src/routes/gemini.ts` | AI endpoints — `POST /pipeline`, `POST /audit` (server-side Gemini calls) |

### Middleware

| File | Purpose |
|------|---------|
| `server/src/middleware/auth.ts` | Auth middleware — `requireAuth` (blocks unauthenticated), `optionalAuth` (attaches user if token present) |

### Services

| File | Purpose |
|------|---------|
| `server/src/services/gemini.ts` | Server-side Gemini service — same 3-stage pipeline as frontend, with retry logic |

## Documentation

| File | Purpose |
|------|---------|
| `README.md` | Project overview and setup instructions |
| `backend-architecture.md` | Backend architecture documentation |
| `book/` | This guide — 12 chapters + appendix |
