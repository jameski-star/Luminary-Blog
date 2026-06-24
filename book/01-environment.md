# Chapter 1 — The Stack & Your Environment

Before writing a single line of code, you need to understand what we're building and install the tools.

## What we're building

A full-stack **AI-powered blogging platform** where:

- Users sign up, write blog posts, and publish them
- AI generates complete articles from a topic and keywords
- AI audits content for quality and flags suspicious posts
- Admins review flagged content and manage users
- Posts have cover images, tags, read-time estimates, and search

## The full stack

```
┌─────────────────────────────────────────────────┐
│                 Frontend (React)                 │
│  TypeScript · Vite · Tailwind CSS · Lucide Icons │
└────────────────────┬────────────────────────────┘
                     │ HTTP (fetch)
┌────────────────────▼────────────────────────────┐
│               Backend (Node.js)                  │
│        Express · TypeScript · JWT Auth           │
└────────────────────┬────────────────────────────┘
                     │ Mongoose ODM
┌────────────────────▼────────────────────────────┐
│              Database (MongoDB)                  │
│           Users · Posts · (embedded data)        │
└─────────────────────────────────────────────────┘
```

## Install these tools

### 1. Node.js (includes npm)

Node.js lets you run JavaScript outside the browser. We use it for both the dev server and the backend.

Download the **LTS version** from https://nodejs.org

Verify it worked:
```bash
node --version   # v20.x or higher
npm --version    # 10.x or higher
```

### 2. VS Code

Download from https://code.visualstudio.com

Install these extensions (press Ctrl+Shift+X):
- **ESLint** — catches errors as you type
- **Tailwind CSS IntelliSense** — autocomplete for Tailwind classes
- **Prettier** — auto-formats your code

### 3. Git

Download from https://git-scm.com

Verify:
```bash
git --version
```

### 4. A modern browser

Chrome or Firefox for the DevTools (F12).

## Your first terminal commands

Open your terminal (VS Code: Ctrl+\`). These are the commands you'll use daily:

```bash
# Check what's in a folder
ls                      # list files
ls -la                  # list all files (including hidden)

# Navigate
cd project-folder       # go into a folder
cd ..                   # go up one folder

# Create/remove
mkdir new-folder        # create a folder
rm file.txt             # delete a file (careful!)
rm -rf folder           # delete a folder and everything inside

# Run the project
npm install             # download all dependencies
npm run dev             # start the dev server
npm run build           # build for production
```

## Project folder structure (what we'll build)

```
ai-blogging-platform-architecture/
├── index.html              # HTML entry point
├── package.json            # dependencies & scripts
├── vite.config.ts          # build tool config
├── tailwind.config.js      # Tailwind custom theme
├── postcss.config.js       # CSS processing
├── tsconfig.json           # TypeScript config
├── src/                    # all frontend code
│   ├── main.tsx            # React entry point
│   ├── App.tsx             # root component + routing
│   ├── index.css           # global styles + Tailwind
│   ├── types/              # shared TypeScript types
│   │   └── index.ts
│   ├── store/              # data helpers
│   │   └── appStore.ts
│   ├── context/            # React context (global state)
│   │   └── AppContext.tsx
│   ├── components/         # reusable UI pieces
│   │   ├── SEO.tsx
│   │   ├── Modal.tsx
│   │   └── ...
│   ├── pages/              # one file per page
│   │   ├── HomePage.tsx
│   │   ├── BlogListPage.tsx
│   │   ├── PostPage.tsx
│   │   ├── EditorPage.tsx
│   │   ├── AutoPostPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── AdminPage.tsx
│   │   ├── AuthPages.tsx
│   │   └── ProfilePage.tsx
│   ├── services/           # API calls & AI logic
│   │   ├── api.ts
│   │   └── geminiPipeline.ts
│   └── utils/              # small helper functions
│       ├── contentDetection.ts
│       └── errors.ts
├── server/                 # all backend code
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts        # Express server entry
│       ├── config.ts       # environment & settings
│       ├── seed.ts         # database seeding
│       ├── models/         # Mongoose schemas
│       │   ├── User.ts
│       │   └── Post.ts
│       ├── routes/         # API endpoints
│       │   ├── auth.ts
│       │   ├── posts.ts
│       │   ├── admin.ts
│       │   └── gemini.ts
│       ├── middleware/     # request processing
│       │   └── auth.ts
│       └── services/       # backend business logic
│           └── gemini.ts
└── book/                   # this guide
    └── ...
```

Take 5 minutes to scan your actual project folder and match each file to this map.

## The package.json file

Every Node project has a `package.json`. It's the manifest:

```jsonc
// package.json
{
  "name": "react-vite-tailwind",     // project name
  "private": true,                   // not published to npm
  "version": "0.0.0",
  "type": "module",                  // use ES module syntax (import/export)
  "scripts": {                       // shortcuts for `npm run X`
    "dev": "vite",                   //   starts dev server
    "build": "vite build",           //   builds for production
    "preview": "vite preview"        //   previews the build
  },
  "dependencies": {                  // libraries the app needs at runtime
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "lucide-react": "^0.400.0"
  },
  "devDependencies": {               // libraries only needed during development
    "typescript": "^5.7.0",
    "vite": "^7.0.0",
    "tailwindcss": "^4.0.0"
  }
}
```

**Key difference:** `dependencies` ship to production. `devDependencies` are only for your dev machine.

## Your first script

Run `npm run dev` in the project root. This starts the Vite dev server. Open the URL it prints (usually `http://localhost:5173`). You should see the app.

Press **Ctrl+C** in the terminal to stop it.

## What's next

In [Chapter 2](02-html-css.md), you'll learn the HTML and CSS fundamentals needed to understand React components and Tailwind.

---

**Try this:** Open `index.html` in the project root. Can you find the `<div id="root">`? That's where React mounts the entire app.
