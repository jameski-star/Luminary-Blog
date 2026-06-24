# Chapter 12 — Putting It Together

This chapter covers building for production, environment variables, and deploying to Render.

## The build process

Before deploying, every file must be **compiled and bundled**:

### Frontend build

```bash
cd project-root
npm run build
```

This runs `vite build`, which:
1. Compiles TypeScript to JavaScript
2. Bundles all imports into a single JS file
3. Inlines CSS into the HTML
4. Outputs to `dist/index.html` — a single, self-contained file

The output is **~800 KB gzipped** for this project.

### Backend build

```bash
cd server
npm run build
```

This runs `tsc` (the TypeScript compiler), which:
1. Strips types from `.ts` files
2. Outputs `.js` files to `server/dist/`
3. Maintains the folder structure

## Build scripts

The root `package.json` has a combined build script:

```jsonc
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "build:server": "cd server && npm run build"
  }
}
```

## Environment variables

The app uses environment variables for configuration:

### Frontend (Vite)

Vite variables must use the `VITE_` prefix:

```bash
# .env (frontend)
VITE_API_URL=https://your-app.onrender.com/api
```

Accessed as `import.meta.env.VITE_API_URL` in code.

### Backend (Node.js)

```bash
# Server environment variables
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname
JWT_SECRET=a-long-random-string
GEMINI_API_KEY=AIzaSy...
APP_URL=https://your-app.onrender.com
ADMIN_EMAIL=you@example.com
ADMIN_PASSWORD=your-password
PORT=3001
```

## Deployment to Render

Render is a cloud platform that hosts both static sites and web services.

### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/your-repo.git
git push -u origin main
```

### Step 2: Create the Web Service (backend)

1. Go to https://dashboard.render.com
2. Click **New +** → **Web Service**
3. Connect your GitHub repo
4. Configure:

| Field | Value |
|-------|-------|
| Name | `your-app-api` |
| Root Directory | `server` |
| Build Command | `npm install && npm run build` |
| Start Command | `npm start` |
| Plan | Free |

5. Add environment variables in the dashboard:
   - `MONGO_URI`
   - `JWT_SECRET`
   - `GEMINI_API_KEY`
   - `APP_URL` = `https://your-app.onrender.com`
   - `ADMIN_EMAIL` and `ADMIN_PASSWORD` (optional, for initial admin)

### Step 3: Create the Static Site (frontend)

1. Click **New +** → **Static Site**
2. Connect the same repo
3. Configure:

| Field | Value |
|-------|-------|
| Name | `your-app` |
| Build Command | `npm install && npm run build` |
| Publish Directory | `dist` |
| Plan | Free |

4. Add environment variable:
   - `VITE_API_URL` = `https://your-app-api.onrender.com/api`

5. In the **Redirects** section, add:
   - Source: `/*`
   - Destination: `/index.html`
   - Status: `200`

   This is critical — React handles its own routing, so all paths must serve `index.html`.

### Step 4: Set up MongoDB

1. Create a free cluster at https://cloud.mongodb.com
2. Get the connection string (looks like `mongodb+srv://...`)
3. Set it as `MONGO_URI` in the backend's environment variables

## The dual-mode trick

Without `VITE_API_URL`, the app runs entirely in **localStorage mode** — no backend needed. This is how you develop locally:

```bash
# Terminal 1 — frontend only (no backend)
npm run dev
```

With `VITE_API_URL` set (on Render), the app calls the real API:

```bash
# Terminal 1 — backend
cd server && npm run dev

# Terminal 2 — frontend pointing to backend
VITE_API_URL=http://localhost:3001/api npm run dev
```

## What happens on first deploy

1. Render starts the backend web service
2. Backend connects to MongoDB
3. Seed script checks if users exist
4. If no users, and `ADMIN_EMAIL`/`ADMIN_PASSWORD` are set, creates an admin
5. If no admin env vars, first signup via UI becomes admin (via `userCount === 0` check)
6. Render starts the static site
7. Static site fetches `VITE_API_URL` at runtime and connects to backend

## Production checklist

- [ ] `MONGO_URI` uses a real MongoDB Atlas cluster, not localhost
- [ ] `JWT_SECRET` is a long, random string (generate with `openssl rand -hex 32`)
- [ ] `GEMINI_API_KEY` is a valid key from Google AI Studio
- [ ] `VITE_API_URL` points to the Render backend URL
- [ ] `APP_URL` points to the Render frontend URL
- [ ] `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set (or plan to sign up first)
- [ ] Redirect rule `/* → /index.html` is configured on the static site
- [ ] Both builds (`npm run build` in root and `server/`) succeed locally

## Monitoring

Render provides logs for both services:
- Backend logs show MongoDB connection, seed status, and request logs
- Frontend logs show build output and CDN serving

Check `https://dashboard.render.com` → your service → **Logs**.

## Troubleshooting

**"Post not found"** — The frontend caches posts in state. If you navigate to a post that isn't in memory, PostPage falls back to the API. Make sure the API is running and CORS is configured.

**"Can't sign in"** — The first user to sign up gets admin. If you already have users, sign up a new account and promote it via Admin Panel → Users → Make Admin.

**"Gemini errors"** — Check your `GEMINI_API_KEY`. The free tier has rate limits (60 requests/minute). The retry logic handles congestion, but a bad key always fails.

**Blank page on Render** — The redirect rule `/* → /index.html` is often the culprit. Without it, navigating to `/post/abc` returns a 404.

## Your final practice

Deploy the app:
1. Push to GitHub
2. Create MongoDB Atlas cluster
3. Create Render Web Service (backend)
4. Create Render Static Site (frontend)
5. Set up environment variables
6. Sign up as the first user — you'll be admin
7. Go to Admin Panel → Posts → see it's empty
8. Create a post in Editor or use AutoPost with a Gemini key

You've now built and deployed a full-stack AI-powered blogging platform from scratch.

---

**You've completed this book.** Every concept, pattern, and technique used in this project is now in your hands. The best way to solidify it: build something of your own.
