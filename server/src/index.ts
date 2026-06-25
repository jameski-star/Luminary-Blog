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

// Middleware
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json({ limit: '2mb' }));

// In production, serve the frontend from the parent dist/ folder
const frontendDist = path.resolve(__dirname, '../../dist');
app.use(express.static(frontendDist));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/gemini', geminiRoutes);

// API 404 handler
app.use('/api/*', (_req, res) => {
  res.status(404).json({ error: 'API endpoint not found.' });
});

// SPA catch-all — serve index.html for any non-API route
app.get('*', (_req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

// Migrate existing published posts to isApproved=true
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

// Start
async function start() {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('Connected to MongoDB');

    await seed();
    await migrateApprovedPosts();

    app.listen(config.port, () => {
      console.log(`Server running on http://localhost:${config.port}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
