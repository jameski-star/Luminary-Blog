# Chapter 7 — Node.js & Express API

The frontend talks to the backend via HTTP. The backend is a Node.js server using Express.

## What is Node.js?

Node.js runs JavaScript **outside the browser** — on your server. It handles:
- Reading/writing files and databases
- Serving API responses to the frontend
- Running background tasks

## What is Express?

Express is a web framework for Node.js. It handles:
- **Routing** — matching URLs to code
- **Middleware** — processing requests (auth, logging, parsing)
- **Responses** — sending JSON back to the frontend

## The simplest Express server

```javascript
import express from 'express';

const app = express();
const PORT = 3001;

// Route: GET /api/health
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

## Request & response cycle

```
Browser/React           Express Server
    |                        |
    |--- GET /api/posts ---->|
    |                        |
    |    (middleware runs)   |
    |    (auth check)        |
    |    (database query)    |
    |                        |
    |<--- JSON response -----|
    |    { posts: [...] }    |
```

## Routes — mapping URLs to handlers

```typescript
// server/src/routes/posts.ts
import { Router, Request, Response } from 'express';

const router = Router();

// GET /api/posts — list all published posts
router.get('/', async (req: Request, res: Response) => {
  const posts = await Post.find({ status: 'published' });
  res.json({ posts });
});

// GET /api/posts/:id — get one post
router.get('/:id', async (req: Request, res: Response) => {
  const post = await Post.findById(req.params.id);
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }
  res.json({ post });
});

// POST /api/posts — create a post
router.post('/', async (req: Request, res: Response) => {
  const post = await Post.create(req.body);
  res.status(201).json({ post });
});

export default router;
```

Open `server/src/routes/posts.ts` — you'll see these exact patterns.

## Request object

```typescript
// req.params — URL parameters
router.get('/users/:id', (req, res) => {
  req.params.id  // "u_123" from /users/u_123
});

// req.query — URL query string
router.get('/posts', (req, res) => {
  req.query.page   // "2" from /posts?page=2
  req.query.status // "published" from /posts?status=published
});

// req.body — JSON body (requires express.json() middleware)
router.post('/posts', (req, res) => {
  req.body.title    // from JSON in request body
  req.body.content
});
```

## Response methods

```typescript
res.json({ user });        // Send JSON (most common)
res.status(201).json({});  // Set status code + JSON
res.status(404).json({ error: 'Not found' });
res.sendStatus(204);       // Success, no content
```

## Middleware — pipeline for requests

Middleware functions run between receiving the request and sending the response:

```typescript
// server/src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    (req as any).user = decoded;  // attach user to request
    next();  // continue to the route handler
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}
```

Usage:
```typescript
// Protected route — requires auth
router.post('/posts', requireAuth, async (req, res) => {
  const post = await Post.create({
    ...req.body,
    authorId: (req as any).user.id,  // from the middleware
  });
  res.json({ post });
});
```

Open `server/src/middleware/auth.ts` — same pattern with two variants: `requireAuth` and `optionalAuth`.

## Error handling

```typescript
// Global error handler (server/src/index.ts)
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});
```

Always wrap async routes in try/catch or use a wrapper:

```typescript
// Wrapper to catch async errors
function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
```

## CORS — cross-origin requests

The frontend (port 5173) and backend (port 3001) run on different ports. CORS lets them talk:

```typescript
import cors from 'cors';

app.use(cors({
  origin: process.env.APP_URL || 'http://localhost:5173',
  credentials: true,
}));
```

## The main server file

Open `server/src/index.ts`:

```typescript
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { config } from './config';
import authRoutes from './routes/auth';
import postRoutes from './routes/posts';
import adminRoutes from './routes/admin';
import geminiRoutes from './routes/gemini';
import { seed } from './seed';

const app = express();

// Middleware (order matters)
app.use(cors({ origin: config.appUrl }));
app.use(express.json({ limit: '10mb' }));  // parse JSON bodies

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/gemini', geminiRoutes);

// Database connection + start
mongoose.connect(config.mongoUri)
  .then(() => {
    console.log('Connected to MongoDB');
    return seed();  // create initial admin if needed
  })
  .then(() => {
    app.listen(config.port, () => {
      console.log(`Server running on port ${config.port}`);
    });
  })
  .catch(err => console.error(err));
```

## API call from frontend

Open `src/services/api.ts`:

```typescript
// src/services/api.ts
const BASE = import.meta.env.VITE_API_URL || '/api';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('luminary_token');
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Request failed (${res.status})`);
  }

  return res.json();
}
```

Then each endpoint gets a typed method:

```typescript
export const api = {
  posts: {
    list: () => request<{ posts: BlogPost[] }>('/posts'),
    get: (id: string) => request<{ post: BlogPost }>(`/posts/${id}`),
    create: (post: Partial<BlogPost>) =>
      request<{ post: BlogPost }>('/posts', { method: 'POST', body: JSON.stringify(post) }),
    update: (id: string, data: Partial<BlogPost>) =>
      request<{ post: BlogPost }>(`/posts/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/posts/${id}`, { method: 'DELETE' }),
  },
  // ... auth, admin, gemini
};
```

## Dual mode (localStorage + API)

This project works **both** with and without a backend:

```typescript
// src/services/api.ts
export function isApiMode(): boolean {
  return !!import.meta.env.VITE_API_URL;
}
```

When `VITE_API_URL` is set (deployed on Render), the app calls the real API. Without it, everything runs in localStorage.

## Your practice

Create an Express route that:
1. Accepts `GET /api/tasks`
2. Returns a JSON array of tasks
3. Each task has `{ id, title, completed }`

```typescript
import { Router } from 'express';
const router = Router();

let tasks = [
  { id: '1', title: 'Learn Express', completed: true },
  { id: '2', title: 'Build an API', completed: false },
];

router.get('/', (req, res) => {
  res.json({ tasks });
});

router.post('/', (req, res) => {
  const task = { id: String(Date.now()), ...req.body, completed: false };
  tasks.push(task);
  res.status(201).json({ task });
});
```

In [Chapter 8](08-mongodb.md), you'll store data in MongoDB.
