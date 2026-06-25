import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { config } from './config';
import { seed } from './seed';
import { Post } from './models/Post';

// Routes
import authRoutes from './routes/auth';
import postRoutes from './routes/posts';
import adminRoutes from './routes/admin';
import geminiRoutes from './routes/gemini';

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
  <title>Luminary — Starting up...</title>
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

// ── Initialize services ──
async function start() {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('Connected to MongoDB');

    await seed();
    await migrateApprovedPosts();

    // Mount real middleware & routes (evaluated after splash middleware)
    app.use(cors({ origin: config.corsOrigin, credentials: true }));
    app.use(express.json({ limit: '2mb' }));
    app.use(express.static(frontendDist));

    app.get('/api/health', (_req, res) => {
      res.json({ ok: true, timestamp: new Date().toISOString() });
    });

    app.use('/api/auth', authRoutes);
    app.use('/api/posts', postRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/gemini', geminiRoutes);

    app.use('/api/*', (_req, res) => {
      res.status(404).json({ error: 'API endpoint not found.' });
    });

    app.get('*', (_req, res) => {
      res.sendFile(path.join(frontendDist, 'index.html'));
    });

    app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      console.error('Unhandled error:', err);
      res.status(500).json({ error: 'Internal server error.' });
    });

    isReady = true;
    console.log('Server fully ready');
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
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
