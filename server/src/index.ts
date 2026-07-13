import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { config } from './config.js';
import { seed } from './seed.js';
import { Post } from './models/Post.js';
import { User } from './models/User.js';
import { marked } from 'marked';

// Routes
import authRoutes from './routes/auth.js';
import postRoutes from './routes/posts.js';
import adminRoutes from './routes/admin.js';
import geminiRoutes from './routes/gemini.js';
import seoRoutes from './routes/seo.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const frontendDist = path.resolve(__dirname, '../../dist');

// ── Custom splash page (shown during Render cold start) ──
const splashPage = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="google-site-verification" content="KXotf7v8wV-xHSfSbFhAE_ODXtlGpveuNXsW984Y3vo" />
  <meta name="robots" content="index,follow" />
  <meta name="description" content="Luminary — Premium AI-Powered Blog. Every article passes a 3-stage AI authenticity pipeline." />
  <meta property="og:title" content="Luminary — Premium AI-Powered Blog" />
  <meta property="og:description" content="Every article passes a 3-stage AI authenticity pipeline. No filler. No fluff." />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Luminary" />
  <meta property="og:locale" content="en_US" />
  <meta name="twitter:card" content="summary_large_image" />
  <title>Luminary — Premium AI-Powered Blog</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #000;
      color: #FAFAFA;
      font-family: 'Public Sans', system-ui, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      -webkit-font-smoothing: antialiased;
    }
    .splash { text-align: center; }

    /* ── Word container ── */
    .word {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100px;
      margin-bottom: 40px;
    }
    .letter {
      font-family: 'Libre Bodoni', Georgia, serif;
      font-weight: 700;
      font-size: 56px;
      letter-spacing: -0.02em;
      opacity: 0;
    }
    .letter.l {
      font-size: 120px;
      animation: lShow 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards,
                 lSettle 0.7s 1.1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .letter:not(.l) {
      animation: spreadIn 0.55s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .letter.u { animation-delay: 1.15s; }
    .letter.m { animation-delay: 1.25s; }
    .letter.i { animation-delay: 1.35s; }
    .letter.n { animation-delay: 1.45s; }
    .letter.a { animation-delay: 1.55s; }
    .letter.r { animation-delay: 1.65s; }
    .letter.y { animation-delay: 1.75s; }

    @keyframes lShow {
      0%   { opacity: 0; transform: scale(0.4); filter: blur(12px); }
      60%  { filter: blur(0); }
      100% { opacity: 1; transform: scale(1); filter: blur(0); }
    }
    @keyframes lSettle {
      0%   { font-size: 120px; transform: translateX(0) scale(1); }
      100% { font-size: 56px; transform: translateX(0) scale(1); }
    }
    @keyframes spreadIn {
      0%   { opacity: 0; transform: scale(0.3) translateY(40px) rotate(-12deg); filter: blur(6px); }
      60%  { filter: blur(0); }
      100% { opacity: 1; transform: scale(1) translateY(0) rotate(0deg); filter: blur(0); }
    }

    /* ── Tagline ── */
    .tagline {
      color: #52525B;
      font-size: 13px;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      font-weight: 500;
      margin-bottom: 36px;
      opacity: 0;
      animation: fadeUp 0.6s 2.2s ease forwards;
    }
    @keyframes fadeUp {
      0%   { opacity: 0; transform: translateY(12px); }
      100% { opacity: 1; transform: translateY(0); }
    }

    /* ── Horizontal dashes loading bar ── */
    .dash-loader {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      opacity: 0;
      animation: fadeUp 0.4s 2.6s ease forwards;
    }
    .dash-loader .dash {
      height: 3px;
      border-radius: 2px;
      background: #27272A;
      overflow: hidden;
      position: relative;
    }
    .dash-loader .dash::after {
      content: '';
      position: absolute;
      top: 0; left: -100%;
      height: 100%;
      width: 60%;
      border-radius: 2px;
      background: #FAFAFA;
      animation: dashRun 1.4s ease-in-out infinite;
    }
    .dash-loader .dash:nth-child(1) { width: 200px; }
    .dash-loader .dash:nth-child(2) { width: 160px; }
    .dash-loader .dash:nth-child(3) { width: 120px; }
    .dash-loader .dash:nth-child(4) { width: 80px; }
    .dash-loader .dash:nth-child(1)::after { animation-delay: 0s; }
    .dash-loader .dash:nth-child(2)::after { animation-delay: 0.15s; }
    .dash-loader .dash:nth-child(3)::after { animation-delay: 0.3s; }
    .dash-loader .dash:nth-child(4)::after { animation-delay: 0.45s; }

    @keyframes dashRun {
      0%   { left: -60%; }
      50%  { left: 100%; }
      100% { left: 100%; }
    }

    .sr-only {
      position: absolute; width: 1px; height: 1px;
      overflow: hidden; clip: rect(0,0,0,0);
      white-space: nowrap; border: 0;
    }
  </style>
</head>
<body>
  <div class="splash">
    <div class="word">
      <span class="letter l">L</span>
      <span class="letter u">u</span>
      <span class="letter m">m</span>
      <span class="letter i">i</span>
      <span class="letter n">n</span>
      <span class="letter a">a</span>
      <span class="letter r">r</span>
      <span class="letter y">y</span>
    </div>
    <p class="tagline">Premium AI-Powered Blog</p>
    <div class="dash-loader" role="status" aria-label="Loading">
      <span class="sr-only">Loading…</span>
      <div class="dash"></div>
      <div class="dash"></div>
      <div class="dash"></div>
      <div class="dash"></div>
    </div>
  </div>
  <script>
    (function poll() {
      fetch('/api/health', { cache: 'no-store' })
        .then(function (r) { if (r.ok) location.reload(); else setTimeout(poll, 2000); })
        .catch(function () { setTimeout(poll, 2000); });
    })();
  </script>
</body>
</html>`;

// ── Readiness flag ──
let isReady = false;

// ── Splash middleware (catches all requests until server is ready) ──
app.use((req, res, next) => {
  if (isReady) return next();
  if (req.path.startsWith('/api/')) {
    res.set('Access-Control-Allow-Origin', config.corsOrigin);
    res.set('Access-Control-Allow-Credentials', 'true');
    return res.status(503).json({ error: 'Server is starting up. Please try again in a moment.' });
  }
  res.type('html').send(splashPage);
});

// ── Start listening immediately (before DB connects) ──
app.listen(config.port, () => {
  console.log(`Server listening on port ${config.port} (starting up...)`);
});

// ── Self-keepalive (prevents Render free-tier spin-down) ──
function startKeepalive() {
  const interval = 10 * 60 * 1000; // 10 minutes
  try {
    const healthUrl = new URL('/api/health', config.appUrl).toString();
    console.log(`Keepalive started — pinging ${healthUrl} every 10 min`);
    setInterval(async () => {
      try {
        const res = await fetch(healthUrl, { signal: AbortSignal.timeout(10000) });
        if (!res.ok) throw new Error(`status ${res.status}`);
        console.log(`Keepalive ping OK (${new Date().toISOString()})`);
      } catch (err) {
        console.warn(`Keepalive ping failed:`, (err as Error).message);
      }
    }, interval);
  } catch (urlErr) {
    console.error(`Keepalive start failed due to invalid appUrl:`, (urlErr as Error).message);
  }
}

// ── Initialize services ──
async function start() {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('Connected to MongoDB');

    try {
      await User.syncIndexes();
      await Post.syncIndexes();
      console.log('Database indexes synchronized successfully');
    } catch (indexErr) {
      console.warn('Index synchronization warning (safe to ignore on first run):', (indexErr as Error).message);
    }

    await seed();
    await migrateApprovedPosts();
    await ensureAdmin();

    // Mount real middleware & routes (evaluated after splash middleware)
    app.use(cors({ origin: config.corsOrigin, credentials: true }));
    app.use(express.json({ limit: '10mb' }));
    app.use(express.static(frontendDist, { index: false }));

    // ── SEO routes ──
    function baseUrl(req: express.Request) {
      return `${req.protocol}://${req.get('host')}`;
    }

    app.get('/robots.txt', (req, res) => {
      res.type('text/plain').send(
        `User-agent: *\nAllow: /\nSitemap: ${baseUrl(req)}/sitemap.xml\n`
      );
    });

    app.get('/sitemap.xml', async (req, res) => {
      try {
        const appUrl = baseUrl(req);
        const posts = await Post.find({ status: 'published' }).sort({ publishedAt: -1 }).lean();
        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
        xml += `  <url><loc>${new URL('/', appUrl).toString()}</loc><priority>1.0</priority></url>\n`;
        xml += `  <url><loc>${new URL('/blog', appUrl).toString()}</loc><priority>0.8</priority></url>\n`;
        for (const post of posts) {
          const mod = (post as any).modifiedAt || (post as any).publishedAt;
          xml += `  <url><loc>${new URL(`/blog/${(post as any).slug}`, appUrl).toString()}</loc>`;
          if (mod) xml += `<lastmod>${new Date(mod).toISOString()}</lastmod>`;
          xml += `<priority>0.6</priority></url>\n`;
        }
        xml += `</urlset>`;
        res.type('application/xml').send(xml);
      } catch (err) {
        console.error('Sitemap error:', err);
        res.status(500).type('text/plain').send('Error generating sitemap');
      }
    });

    app.get('/api/health', (_req, res) => {
      res.json({ ok: true, timestamp: new Date().toISOString() });
    });

    app.use('/api/auth', authRoutes);
    app.use('/api/posts', postRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/gemini', geminiRoutes);
    app.use('/api/seo', seoRoutes);

    app.use('/api/*', (_req, res) => {
      res.status(404).json({ error: 'API endpoint not found.' });
    });

    // ── SPA catch-all with server-side OG tag injection ──
    app.get('*', async (req, res) => {
      const htmlPath = path.join(frontendDist, 'index.html');
      let html: string;
      try {
        html = await fs.promises.readFile(htmlPath, 'utf-8');
      } catch {
        return res.status(503).send('Application not ready yet');
      }

      const appUrl = baseUrl(req);
      const blogMatch = req.path.match(/^\/blog\/(.+)/);

      function sanitize(str: string): string {
        return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
      }

      let ogTitle = 'Luminary — Premium AI-Powered Blog';
      let ogDesc = 'A premium blogging platform where every article passes a 3-stage AI authenticity pipeline. No filler. No fluff.';
      let ogImage = new URL('/hero-bg.jpg', appUrl).toString();
      let ogUrl = new URL(req.path, appUrl).toString();
      let ogType = 'website';
      let extraMeta = '';
      let contentHtml = '';

      if (blogMatch) {
        const slug = blogMatch[1];
        try {
          const post = await Post.findOne({ slug, status: 'published' }).lean() as any;
          if (post) {
            ogTitle = `${post.title} — Luminary`;
            ogDesc = post.excerpt;
            if (post.coverImage) ogImage = post.coverImage;
            ogUrl = new URL(`/blog/${slug}`, appUrl).toString();
            ogType = 'article';
            if (post.tags?.length) {
              extraMeta = post.tags.map((t: string) => `<meta property="article:tag" content="${sanitize(t)}" />`).join('\n    ');
            }
            if (post.publishedAt) {
              extraMeta += `\n    <meta property="article:published_time" content="${post.publishedAt}" />`;
            }
            if (post.authorName) {
              extraMeta += `\n    <meta name="author" content="${sanitize(post.authorName)}" />`;
            }
            if (post.excerpt) {
              extraMeta += `\n    <meta name="description" content="${sanitize(post.excerpt)}" />`;
            }
            // Render full content for crawler word-for-word indexing
            if (post.content) {
              contentHtml = marked.parse(post.content) as string;
            }
          }
        } catch {}
      } else if (req.path === '/blog') {
        ogDesc = 'Browse all verified articles on Luminary. Every post passes a 3-stage AI authenticity pipeline.';
      }

      const ogTags = `
    <meta property="og:title" content="${sanitize(ogTitle)}" />
    <meta property="og:description" content="${sanitize(ogDesc)}" />
    <meta property="og:image" content="${sanitize(ogImage)}" />
    <meta property="og:url" content="${ogUrl}" />
    <meta property="og:type" content="${ogType}" />
    <meta property="og:site_name" content="Luminary" />
    <meta property="og:locale" content="en_US" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${sanitize(ogTitle)}" />
    <meta name="twitter:description" content="${sanitize(ogDesc)}" />
    <meta name="twitter:image" content="${sanitize(ogImage)}" />
    <link rel="canonical" href="${ogUrl}" />${extraMeta ? '\n    ' + extraMeta : ''}
  `;

      html = html.replace('</head>', ogTags + '</head>');

      // Inject sr-only CSS and pre-rendered content for crawlers
      html = html.replace('</style>', '.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}</style>');
      if (contentHtml) {
        html = html.replace('</body>', `<article class="sr-only">${contentHtml}</article></body>`);
      }

      res.type('html').send(html);
    });

    app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      console.error('Unhandled error:', err);
      res.status(500).json({ error: 'Internal server error.' });
    });

    isReady = true;
    console.log('Server fully ready');

    // ── Self-keepalive: prevents Render free-tier spin-down ──
    startKeepalive();
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

// ── Auto-promote specific user to admin on every startup ──
const ADMIN_EMAILS = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase()) : [];

async function ensureAdmin() {
  for (const email of ADMIN_EMAILS) {
    try {
      const user = await User.findOne({ email: email.toLowerCase().trim() });
      if (user) {
        if (user.role !== 'admin') {
          user.role = 'admin';
          await user.save();
          console.log(`Admin privileges restored for: ${email}`);
        }
      }
    } catch (err) {
      console.error(`ensureAdmin error for ${email}:`, err);
    }
  }
}

async function migrateApprovedPosts() {
  try {
    const result = await Post.updateMany(
      { status: 'published', isApproved: { $ne: true } },
      { $set: { isApproved: true } }
    );
    if (result.modifiedCount > 0) {
      console.log(`Migrated ${result.modifiedCount} published posts to isApproved=true`);
    }
  } catch (err) {
    console.error('Migration error:', err);
  }
}

start();
