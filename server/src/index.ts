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
    .logo {
      width: 56px; height: 56px;
      border-radius: 14px;
      background: #FAFAFA;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 24px;
    }
    .logo span {
      color: #000;
      font-family: 'Libre Bodoni', Georgia, serif;
      font-size: 28px;
      font-weight: 700;
    }
    h1 {
      font-family: 'Libre Bodoni', Georgia, serif;
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 8px;
      letter-spacing: -0.01em;
    }
    p {
      color: #A1A1AA;
      font-size: 14px;
      margin-bottom: 32px;
    }
    .spinner {
      width: 24px; height: 24px;
      border: 2px solid #27272A;
      border-top-color: #FAFAFA;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .sr-only {
      position: absolute; width: 1px; height: 1px;
      overflow: hidden; clip: rect(0,0,0,0);
      white-space: nowrap; border: 0;
    }
  </style>
</head>
<body>
  <div class="splash">
    <div class="logo"><span>L</span></div>
    <h1>Luminary</h1>
    <p>Waking up the server…</p>
    <div class="spinner" role="status">
      <span class="sr-only">Loading…</span>
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
