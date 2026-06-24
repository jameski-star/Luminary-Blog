# Luminary — AI-Powered Blogging Platform

A single-page blogging application built with React 19, TypeScript, Tailwind CSS v4, and Vite 7. Features a 3-stage AI content pipeline (powered by Google Gemini), a full Markdown editor with formatting toolbar, dark/light theming, role-based admin panel, and full-text search.

All data is stored in `localStorage` — no database or server required.

---

## Prerequisites

- **Node.js** 18+ (includes `npm`)
- A **Google Gemini API key** (optional, only needed for AI autopost/pipeline features)

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev
```

The app opens at `http://localhost:5173/`.

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production (single-file output in `dist/`) |
| `npm run preview` | Preview the production build locally |

## Production Build

```bash
npm run build
```

Output: a single self-contained file `dist/index.html` (~760 KB gzipped to ~185 KB).

Everything (JS, CSS, fonts) is inlined into one HTML file via `vite-plugin-singlefile`. No other assets need to be deployed.

## Admin Access

The **first user who signs up** on a fresh install is automatically granted the `admin` role. Subsequent users get the `user` role.

The admin panel is accessible from the navbar Shield icon and lets you:
- View platform-wide stats (total posts, views, likes, users)
- Browse **all** posts across all users with sort/filter by status
- Change any post's status (draft / review / published / quarantined)
- Publish or delete any post
- View all registered users and their post counts

Existing users created before this role system was added are automatically migrated to `role: 'user'` on app load.

## Deployment

The app is fully client-side. Deploy the single `dist/index.html` file to any static hosting:

### Netlify (easiest)

```bash
# Install Netlify CLI (one-time)
npm install -g netlify-cli

# Deploy
npm run build
netlify deploy --prod --dir=dist
```

Or connect your Git repository to Netlify with these settings:
- **Build command:** `npm run build`
- **Publish directory:** `dist`

No redirect rules needed (single-page app is fully in one file).

### Vercel

```bash
# Install Vercel CLI (one-time)
npm install -g vercel

# Deploy
npm run build
vercel --prod
```

Or connect your Git repository to Vercel with:
- **Framework preset:** Vite
- **Build command:** `npm run build`
- **Output directory:** `dist`

### Cloudflare Pages

Connect your Git repository or use Wrangler:

```bash
npm run build
npx wrangler pages deploy dist --project-name=luminary
```

Build settings:
- **Build command:** `npm run build`
- **Build output directory:** `dist`

### GitHub Pages

```bash
npm run build
# Deploy dist/ to gh-pages branch
npx gh-pages -d dist
```

Or use the `peaceiris/actions-gh-pages` GitHub Action.

### Any Static Host (S3, Firebase, Nginx, Apache)

Upload or copy `dist/index.html` — that's the entire app.

For **custom domain / subdirectory hosting**, no path configuration is needed since the app uses a single HTML file with no client-side routing paths.

### Docker (optional)

```dockerfile
FROM nginx:alpine
COPY dist/index.html /usr/share/nginx/html/index.html
```

## Backend (Required for multi-user support)

Without the backend, every browser has its own isolated database (localStorage) — User A and User B cannot see each other's content. The Express + MongoDB backend enables shared data: posts, users, authentication, and the Gemini AI pipeline all live on the server.

### Prerequisites

- **Node.js 18+**
- **MongoDB** — you need a running MongoDB instance. The easiest option:
  1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas) and sign up (free tier, no credit card)
  2. Create a **Shared Cluster** (M0 free tier)
  3. Under **Security → Database Access**, create a database user (username + password)
  4. Under **Security → Network Access**, add `0.0.0.0/0` (allow all) or your deployment IP
  5. Click **Connect → Drivers** and copy the connection string — it looks like: `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/luminary?retryWrites=true&w=majority`

### Step 1 — Configure the server

```bash
# Navigate to the server directory
cd server

# Install all dependencies
npm install

# Create your environment file from the template
cp .env.example .env
```

### Step 2 — Fill in `.env`

Open `server/.env` in any text editor. It should look like this:

```
PORT=4000
MONGO_URI=mongodb+srv://youruser:yourpassword@cluster0.xxxxx.mongodb.net/luminary?retryWrites=true&w=majority
JWT_SECRET=replace-with-a-random-64-character-string
GEMINI_API_KEY=your-gemini-api-key
CORS_ORIGIN=http://localhost:5173
```

Replace each value:

| Variable | What to put | Where to get it |
|---|---|---|
| `PORT` | `4000` or any port | Leave as-is |
| `MONGO_URI` | Your MongoDB connection string | From Atlas (see Prerequisites step 5). Replace `<username>` and `<password>` with your database user's credentials |
| `JWT_SECRET` | A random 64-character string | Generate one: run `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` in your terminal |
| `GEMINI_API_KEY` | Your Google Gemini key | [Google AI Studio](https://aistudio.google.com/apikey) — leave blank if you don't need AI features |
| `CORS_ORIGIN` | Your frontend URL | `http://localhost:5173` for local dev; your deployed URL in production (e.g. `https://luminary.netlify.app`) |

### Step 3 — Start the dev server

```bash
npm run dev
```

You should see:

```
Connected to MongoDB
Server running on http://localhost:4000
```

On first launch, the server automatically:
- Creates a demo author account ("Luminary Editorial") with 3 demo posts
- These posts appear on the blog listing for all users immediately

Verify the server is working by visiting `http://localhost:4000/api/health` — you should see `{ "ok": true, "timestamp": "..." }`.

### Step 4 — Connect the frontend

The frontend checks for a `VITE_API_URL` environment variable. When set, it sends all data requests to the backend instead of localStorage.

**Option A — One-time (inline):**

```bash
# From the project root directory
VITE_API_URL=http://localhost:4000/api npm run dev
```

**Option B — Persistent (.env file):**

Create a file named `.env` in the **project root** (not in server/):

```bash
# From the project root directory
echo "VITE_API_URL=http://localhost:4000/api" > .env
```

Then `npm run dev` picks it up automatically.

**Option C — Production build:**

```bash
VITE_API_URL=http://localhost:4000/api npm run build
```

Deploy the resulting `dist/index.html` as usual.

When `VITE_API_URL` is **not set**, the frontend uses relative API paths (`/api/...`). This works automatically when the frontend is served by the Express server (unified deployment). If the Express server is not running, the frontend falls back to localStorage (single-user mode, no backend needed).

### Step 5 — Create an admin account

Open the app in your browser, click **Get Started**, and sign up with any email/password. The **first user to sign up** is automatically granted the `admin` role. You'll see a Shield icon in the navbar — that's the admin panel.

Subsequent users get the `user` role and cannot access the admin panel.

### Production deployment — two options

You can deploy either **just the frontend** (single-user, localStorage mode) or **backend + frontend together** (multi-user, shared database).

---

#### Option A — Frontend only (single-user, no backend)

Deploy `dist/index.html` to any static host:

- **Netlify:** `npm run build && netlify deploy --prod --dir=dist`
- **Vercel:** `npm run build && vercel --prod`
- **Cloudflare Pages:** `npm run build && wrangler pages deploy dist`
- **GitHub Pages:** `npm run build && npx gh-pages -d dist`
- **Any S3/nginx/Apache:** upload `dist/index.html`

No `VITE_API_URL` needed. Every browser has its own isolated data.

---

#### Option B — Deploy everything as one service (recommended for multi-user)

The Express server is configured to **serve the frontend** from its `dist/` folder. You deploy a single service — one URL handles both API and UI.

**1. Build the frontend first:**

```bash
# From the project root — no VITE_API_URL needed
npm run build
```

The frontend build output goes to `dist/index.html`. When the API is served from the same origin, the frontend automatically connects to `/api/...` on the same domain — no `VITE_API_URL` configuration needed.

**2. Deploy the server:**

The server serves `../dist/index.html` (the frontend) at the root URL and API routes at `/api/...`.

##### Railway (easiest — free tier available)

```bash
# Install Railway CLI
npm install -g @railway/cli

# From the project root
railway login
railway init

# Add MongoDB database
railway add --plugin mongodb

# Set environment variables
railway vars set JWT_SECRET="$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")"
railway vars set CORS_ORIGIN=$(railway domain)

# Deploy
railway up
```

Railway auto-detects the `start` script in the root `package.json`. Create a root-level `start.sh`:

```bash
# start.sh — at the project root
cd server && npm start
```

Or set the **Start Command** in Railway dashboard to: `cd server && node dist/index.js`

##### Render

1. Create a **Web Service** connected to your Git repository
2. **Root Directory:** (leave blank — use repo root)
3. **Build Command:** `cd server && npm install && npm run build && cd .. && npm run build`
4. **Start Command:** `cd server && node dist/index.js`
5. Add environment variables (see table below)

##### Fly.io

```bash
# server/Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY .. .
RUN npm install && cd server && npm install && npm run build
RUN cd server && npm run build
EXPOSE 4000
CMD ["node", "server/dist/index.js"]
```

```bash
fly launch --dockerfile server/Dockerfile
fly secrets set MONGO_URI=... JWT_SECRET=... CORS_ORIGIN=...
fly deploy
```

##### Any VPS

```bash
# On your server
git clone <repo> /app
cd /app && npm install && cd server && npm install
cd .. && npm run build    # Build frontend
cd server && npm run build  # Build backend
npm start                  # Or: cd server && node dist/index.js

# Use pm2 to keep it running
npm install -g pm2
pm2 start server/dist/index.js --name luminary
```

#### Environment variables (for unified deployment)

| Variable | Required | Default | Description |
|---|---|---|---|
| `MONGO_URI` | Yes | — | MongoDB connection string (e.g. `mongodb+srv://...`) |
| `JWT_SECRET` | Yes | — | Random 64-char hex string for signing auth tokens |
| `GEMINI_API_KEY` | No | — | Google Gemini API key (needed for AI pipeline) |
| `CORS_ORIGIN` | No | `http://localhost:5173` | Frontend URL (for local dev with separate frontend server) |
| `PORT` | No | `4000` | Server port |

In the unified setup, `CORS_ORIGIN` doesn't matter since frontend and API are on the same origin. The frontend's API client automatically uses relative paths (`/api/...`) when no `VITE_API_URL` is set.

#### What you get

After deploying the unified service, a single URL (e.g. `https://luminary.railway.app`) serves both:

| Route | Serves |
|---|---|
| `/` | The Luminary frontend app |
| `/api/health` | Health check |
| `/api/auth/*` | Auth endpoints |
| `/api/posts/*` | Post CRUD + search |
| `/api/admin/*` | Admin management |
| `/api/gemini/*` | Gemini AI pipeline |
| Any other path | `index.html` (SPA catch-all) |

No separate frontend hosting, no `VITE_API_URL`, no CORS issues — everything on one domain.

### File structure reference

```
server/
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
├── .env                      # Environment variables (gitignored)
├── .env.example              # Template for .env
└── src/
    ├── index.ts              # Express entry point — connects DB, seeds, starts server
    ├── config.ts             # Loads and exports env vars
    ├── middleware/
    │   ├── auth.ts           # JWT verification middleware
    │   └── adminOnly.ts      # Admin role gate middleware
    ├── models/
    │   ├── User.ts           # Mongoose schema for users
    │   └── Post.ts           # Mongoose schema for posts (with text index)
    ├── routes/
    │   ├── auth.ts           # Signup, signin, me
    │   ├── posts.ts          # CRUD, search, my posts, like
    │   ├── admin.ts          # Admin-only post/user management
    │   └── gemini.ts         # Gemini AI pipeline proxy
    ├── services/
    │   └── gemini.ts         # 3-stage pipeline (draft → audit → polish)
    └── seed.ts               # Seeds demo author + 3 demo posts
```

### API Endpoints

#### Auth (`/api/auth`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/signup` | No | Create account. First user → `admin`. Returns JWT + user |
| `POST` | `/signin` | No | Login. Returns JWT + user |
| `GET` | `/me` | Yes | Validate token, return current user |

**Request body** (signup/signin):
```json
{ "name": "Your Name", "email": "you@example.com", "password": "yourpassword" }
```

**Response**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "id": "...", "email": "...", "name": "...", "role": "admin", ... }
}
```

Store the `token` in localStorage under `luminary_token` and send it as `Authorization: Bearer <token>` on subsequent requests.

#### Posts (`/api/posts`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/` | No | List published posts. Query: `?page=1&limit=20&author=<id>` |
| `GET` | `/search?q=` | No | Full-text search across published posts |
| `GET` | `/:slug` | No | Get single post (increments view count) |
| `GET` | `/my` | Yes | List current user's posts (all statuses). Query: `?status=draft` |
| `POST` | `/` | Yes | Create a new post |
| `PUT` | `/:id` | Yes | Update own post |
| `DELETE` | `/:id` | Yes | Delete own post (author or admin) |
| `POST` | `/:id/like` | Yes | Toggle like on a post |

**Create post request body:**
```json
{
  "title": "My Post Title",
  "content": "## Markdown content here...",
  "excerpt": "Optional short description",
  "tags": ["Technology", "Architecture"],
  "keywords": ["key1", "key2"],
  "status": "draft"
}
```

#### Admin (`/api/admin`) — Requires `role: admin`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/posts` | List all posts. Query: `?status=draft&sort=views&page=1` |
| `PATCH` | `/posts/:id/status` | Change any post's status |
| `DELETE` | `/posts/:id` | Delete any post |
| `GET` | `/users` | List all users |

#### Gemini (`/api/gemini`) — Requires auth

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/pipeline` | Run 3-stage pipeline: draft → audit → polish |
| `POST` | `/audit` | Audit existing content (returns score + vulnerabilities) |

## Configuring Gemini AI

In localStorage mode, enter your Gemini API key in the AutoPost page. In API mode, set `GEMINI_API_KEY` on the server — the frontend key input is ignored.

Generate a key at [Google AI Studio](https://aistudio.google.com/apikey).

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 |
| Language | TypeScript 5.9 |
| Bundler | Vite 7 |
| Styling | Tailwind CSS v4 |
| Icons | Lucide React |
| Markdown | marked |
| AI Pipeline | @google/genai |
| Date Formatting | date-fns |
| Build Output | Single self-contained HTML file |

## Architecture Notes

- **Dual data mode.** Without `VITE_API_URL`, all data persists in `localStorage` (single-user). With `VITE_API_URL`, the app connects to the Node.js + Express + MongoDB backend for multi-user support.
- **No client-side router.** Page state is managed via React context (`NavPage` enum) and a central `switch` statement in `App.tsx`.
- **Theme** is applied before React mounts via a module-level `applyTheme()` call to eliminate color flash.
- **Admin role** is determined by the `role` field on the `User` object. Only the first signup gets `admin`; all subsequent signups get `user`.
# Luminary-Blog
