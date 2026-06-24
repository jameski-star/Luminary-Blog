# Chapter 9 — Authentication & Security

Authentication answers "who are you?" Authorization answers "what can you do?"

## How auth works in this project

```
1. User types email + password
2. Server hashes the password with bcrypt
3. Server creates a JWT (JSON Web Token) — a signed digital ID card
4. Server sends the JWT to the frontend
5. Frontend stores the JWT in localStorage
6. Every subsequent API request includes the JWT in the header
7. Server verifies the JWT on protected routes
```

## Password hashing with bcrypt

Never store plaintext passwords. bcrypt hashes them:

```typescript
import bcrypt from 'bcrypt';

// Signup — hash the password (cost factor 12 = ~250ms)
const passwordHash = await bcrypt.hash(password, 12);

// Login — compare the attempt with the stored hash
const isValid = await bcrypt.compare(passwordAttempt, storedHash);
```

Open `server/src/routes/auth.ts`:

```typescript
// Signup
router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(400).json({ error: 'Email already in use.' });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const userCount = await User.countDocuments();
  const role = userCount === 0 ? 'admin' : 'user';  // first user = admin

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash,
    role,
  });

  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );

  res.json({ user: user.toJSON(), token });
});
```

## JWT (JSON Web Token)

A JWT is three base64-encoded parts separated by dots:

```
header.payload.signature
```

The **signature** is created with a secret key (`JWT_SECRET`). If anyone modifies the token, the signature becomes invalid.

```typescript
import jwt from 'jsonwebtoken';

// Create a token (usually at login/signup)
const token = jwt.sign(
  { id: user.id, role: user.role },  // payload — data embedded in the token
  process.env.JWT_SECRET!,            // secret — keep this private!
  { expiresIn: '7d' }                 // auto-expires
);

// Verify a token (on protected routes)
const decoded = jwt.verify(token, process.env.JWT_SECRET!);
// decoded = { id: '...', role: 'user', iat: ..., exp: ... }
```

## Auth middleware

Protect routes by verifying the JWT before the handler runs:

```typescript
// server/src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const token = header.slice(7);  // remove "Bearer "
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    (req as any).user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// For routes that work both with and without auth
export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try {
      const token = header.slice(7);
      (req as any).user = jwt.verify(token, process.env.JWT_SECRET!);
    } catch {}
  }
  next();
}
```

## Protecting routes

```typescript
// Public — anyone can read published posts
router.get('/posts', async (req, res) => { ... });

// Protected — only logged-in users can create
router.post('/posts', requireAuth, async (req, res) => {
  const user = (req as any).user;
  // user.id, user.role available here
});

// Admin-only
router.patch('/users/:id/promote', requireAuth, async (req, res) => {
  const user = (req as any).user;
  if (user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }
  // promote logic...
});
```

## Sending the token from the frontend

```typescript
// src/services/api.ts — global fetch wrapper
const token = localStorage.getItem('luminary_token');

const headers: Record<string, string> = {
  'Content-Type': 'application/json',
};

if (token) {
  headers['Authorization'] = `Bearer ${token}`;
}

const res = await fetch(`${BASE}/posts`, { headers });
```

## Role-based UI

The frontend checks the user's role to show/hide features:

```typescript
// AdminPage.tsx — only renders if admin
if (!user || user.role !== 'admin') {
  return <AccessDenied />;
}

// Show admin tools
{user?.role === 'admin' && <AdminControls />}
```

## Security checklist

1. **Never log passwords or tokens**
2. **Use HTTPS in production** (Render handles this)
3. **Set JWT expiry** (this project uses 7 days)
4. **Validate input** on the server (don't trust the frontend)
5. **Use environment variables** for secrets (never hardcode)

## Your practice

Create a simple auth flow:

```typescript
// 1. Hash a password
const hash = await bcrypt.hash('mypassword', 12);

// 2. Create a JWT
const token = jwt.sign({ userId: '123' }, 'my-secret', { expiresIn: '1h' });

// 3. Verify the JWT
const decoded = jwt.verify(token, 'my-secret');
console.log(decoded.userId); // '123'
```

In [Chapter 10](10-frontend.md), you'll see how all the frontend pages are built.
