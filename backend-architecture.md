# Backend Architecture — Node.js + Express + MongoDB

## Overview

This document maps the current frontend (localStorage-backed) to a proper backend. The frontend stays as-is; only the data layer changes — `appStore.ts` is replaced with API calls to this backend.

---

## Project Structure

```
server/
├── package.json
├── tsconfig.json
├── .env                      # MONGO_URI, JWT_SECRET, GEMINI_API_KEY, PORT
├── src/
│   ├── index.ts              # Express entry point
│   ├── config.ts             # Load env vars
│   ├── middleware/
│   │   ├── auth.ts           # Verify JWT, attach req.user
│   │   └── adminOnly.ts      # Check req.user.role === 'admin'
│   ├── models/
│   │   ├── User.ts
│   │   └── Post.ts
│   ├── routes/
│   │   ├── auth.ts           # POST /signup, /signin, /signout
│   │   ├── posts.ts          # CRUD + list + search
│   │   ├── users.ts          # Admin: list all users
│   │   └── admin.ts          # Admin: patch any post status, delete any post
│   └── services/
│       ├── gemini.ts         # Gemini pipeline (draft / audit / polish)
│       └── search.ts         # Full-text search (MongoDB text index)
```

---

## MongoDB Schemas

### User (`src/models/User.ts`)

```ts
interface IUser {
  _id: ObjectId;
  email: string;            // unique, indexed, case-insensitive collation
  name: string;
  passwordHash: string;     // bcrypt
  avatar?: string;
  bio?: string;
  role: 'user' | 'admin';   // default: 'user'; first user: 'admin'
  joinedAt: Date;
  postsCount: number;       // denormalized, updated on post create/delete
}

// Indexes: email (unique)
```

### Post (`src/models/Post.ts`)

```ts
interface IPost {
  _id: ObjectId;
  title: string;
  slug: string;                   // unique, generated from title
  excerpt: string;
  content: string;                // Markdown
  htmlContent?: string;           // Parsed HTML
  coverImage?: string;
  tags: string[];
  keywords: string[];
  authorId: ObjectId;             // ref -> User
  authorName: string;             // denormalized from User at creation
  authorAvatar?: string;          // denormalized
  publishedAt: Date;
  modifiedAt: Date;
  status: 'draft' | 'quarantined' | 'published' | 'review';
  readTime: number;
  views: number;
  likes: number;
  likedBy: ObjectId[];            // track who liked (prevent double-like)
  auditScore?: number;
  wordCount: number;
}

// Indexes:
//   slug (unique)
//   status + publishedAt (compound, for blog listing)
//   authorId + status (for user dashboard)
//   text index on title + excerpt + tags + keywords (for search)
```

---

## REST API Endpoints

### Auth (`/api/auth`)

| Method | Path | Auth | Body | Response | Notes |
|--------|------|------|------|----------|-------|
| POST | `/signup` | No | `{ name, email, password }` | `{ token, user }` | First user → `role: admin` |
| POST | `/signin` | No | `{ email, password }` | `{ token, user }` | Returns JWT |
| POST | `/signout` | Yes | — | `{ ok: true }` | Client discards token |
| GET | `/me` | Yes | — | `{ user }` | Validate token, return user |

### Posts (`/api/posts`)

| Method | Path | Auth | Query/Body | Response | Notes |
|--------|------|------|------------|----------|-------|
| GET | `/` | No | `?status=published&page=1&limit=20` | `{ posts, total, page }` | Public: only `published` returned. Include `?author=<id>` to filter |
| GET | `/search` | No | `?q=keyword&page=1` | `{ posts, total }` | MongoDB `$text` search, published only |
| GET | `/my` | Yes | `?status=all` | `{ posts }` | Current user's posts (all statuses) |
| GET | `/:slug` | No | — | `{ post }` | Public: increments views atomically |
| POST | `/` | Yes | `{ title, content, ... }` | `{ post }` | Creates with status `draft` |
| PUT | `/:id` | Yes | `{ title?, content?, ... }` | `{ post }` | Only author can update |
| DELETE | `/:id` | Yes | — | `{ ok: true }` | Only author or admin can delete |
| POST | `/:id/like` | Yes | — | `{ likes }` | Toggle like (add/remove from `likedBy`) |

### Admin (`/api/admin`) — Requires `admin` role

| Method | Path | Auth | Body | Response | Notes |
|--------|------|------|------|----------|-------|
| GET | `/posts` | Admin | `?status=all&page=1&sort=views` | `{ posts, total }` | All users' posts |
| PATCH | `/posts/:id/status` | Admin | `{ status }` | `{ post }` | Change any post's status |
| DELETE | `/posts/:id` | Admin | — | `{ ok: true }` | Delete any post |
| GET | `/users` | Admin | — | `{ users }` | All users with post counts |

### Gemini (`/api/gemini`) — Requires auth

| Method | Path | Auth | Body | Response | Notes |
|--------|------|------|------|----------|-------|
| POST | `/draft` | Yes | `{ topic, keywords? }` | `{ title, content, outline }` | Proxies to Gemini API |
| POST | `/audit` | Yes | `{ content }` | `{ audit }` | Score + vulnerabilities |
| POST | `/polish` | Yes | `{ content, audit }` | `{ content }` | Polish based on audit |

---

## Auth Flow (JWT)

```
Signup/Login → Server validates → Creates/checks user → Returns JWT + user object
                                                         ↓
JWT stored in localStorage under 'luminary_token'
                                                         ↓
Every API request includes: Authorization: Bearer <token>
                                                         ↓
auth middleware: verifies JWT → attaches req.user → route handler executes
```

**JWT payload:**
```json
{ "userId": "...", "role": "user", "iat": ..., "exp": ... }
```

**Token expiry:** 7 days.

---

## Frontend Changes Required

### 1. Add an API client (`src/services/api.ts`)

```ts
// Centralized fetch wrapper
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

async function request(path: string, options?: RequestInit) {
  const token = localStorage.getItem('luminary_token');
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  if (!res.ok) throw new Error(/* parse error body */);
  return res.json();
}

export const api = {
  auth: {
    signup: (body) => request('/auth/signup', { method: 'POST', body: JSON.stringify(body) }),
    signin: (body) => request('/auth/signin', { method: 'POST', body: JSON.stringify(body) }),
    me: () => request('/auth/me'),
  },
  posts: {
    list: (params) => request(`/posts?${new URLSearchParams(params)}`),
    search: (q) => request(`/posts/search?q=${encodeURIComponent(q)}`),
    get: (slug) => request(`/posts/${slug}`),
    create: (body) => request('/posts', { method: 'POST', body: JSON.stringify(body) }),
    update: (id, body) => request(`/posts/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id) => request(`/posts/${id}`, { method: 'DELETE' }),
    like: (id) => request(`/posts/${id}/like`, { method: 'POST' }),
    my: (status?) => request(`/posts/my${status ? `?status=${status}` : ''}`),
  },
  admin: {
    posts: (params) => request(`/admin/posts?${new URLSearchParams(params)}`),
    setStatus: (id, status) => request(`/admin/posts/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    deletePost: (id) => request(`/admin/posts/${id}`, { method: 'DELETE' }),
    users: () => request('/admin/users'),
  },
  gemini: {
    draft: (body) => request('/gemini/draft', { method: 'POST', body: JSON.stringify(body) }),
    audit: (body) => request('/gemini/audit', { method: 'POST', body: JSON.stringify(body) }),
    polish: (body) => request('/gemini/polish', { method: 'POST', body: JSON.stringify(body) }),
  },
};
```

### 2. Replace `src/store/appStore.ts` with API calls

- Remove all localStorage read/write functions
- Replace `signUp` / `signIn` / `signOut` with `api.auth.*` calls
- Replace `getStoredPosts` / `savePosts` with `api.posts.*` calls
- Replace `deletePost` / `updatePost` / `addPost` in `AppContext` with API calls
- Keep `buildWordIndex`, `generateSlug`, `calcReadTime` as client-only utilities (slash-friendly helpers for real-time preview)

### 3. Update `AppContext.tsx`

- Remove `posts` array state; fetch from API on mount and cache in state
- Replace direct localStorage user save with JWT token storage
- After login/signup, store JWT in `localStorage` under `luminary_token`
- On mount, call `api.auth.me()` with stored token to restore session

### 4. Environment variable

Add to `.env` or Vite's `import.meta.env.VITE_API_URL`:
```
VITE_API_URL=https://api.luminary.app/api
```

---

## Seed Data

The backend seeds demo content on startup if the posts collection is empty:

```ts
// src/index.ts (or a seed script)
if ((await Post.countDocuments()) === 0) {
  const demoAuthor = await User.create({
    name: 'Luminary Editorial',
    email: 'editorial@luminary.app',
    passwordHash: bcrypt.hashSync('seed_only_not_meant_for_login', 10),
    role: 'admin',
    bio: 'The official Luminary editorial team.',
  });

  await Post.insertMany(DEMO_POSTS.map(p => ({
    ...p,
    authorId: demoAuthor._id,
    authorName: demoAuthor.name,
    publishedAt: new Date(p.publishedAt),
    modifiedAt: new Date(p.modifiedAt),
  })));
}
```

---

## Deployment

### Backend

| Service | Notes |
|---------|-------|
| **Railway** | Most turnkey — deploy from GitHub, set env vars |
| **Render** | Web Service + MongoDB Atlas |
| **Fly.io** | Docker-based, global regions |
| **DigitalOcean App Platform** | Simple, built-in MongoDB via DO Managed Database |

### Database

| Service | Free Tier |
|---------|-----------|
| **MongoDB Atlas** | 512 MB, shared |
| **Railway** | $5/mo includes MongoDB plugin |

### Environment Variables

```
PORT=4000
MONGO_URI=mongodb+srv://...
JWT_SECRET=<random-64-char-string>
GEMINI_API_KEY=<your-gemini-key>
CORS_ORIGIN=https://luminary.app
```

---

## Migration Strategy

**Phase 1 — API parallel to localStorage** (no downtime)
- Stand up backend with seed data
- Add `VITE_API_URL` env var (leave empty to keep using localStorage)
- Frontend checks: if `VITE_API_URL` is set, use API; else localStorage

**Phase 2 — Cutover**
- Set `VITE_API_URL`, deploy frontend
- Existing localStorage users won't be migrated (they'd need to recreate accounts)
- All new data flows through the shared database

**Phase 3 — Import tool** (optional)
- Build a one-time script that reads a user's localStorage export and POSTs to the API
