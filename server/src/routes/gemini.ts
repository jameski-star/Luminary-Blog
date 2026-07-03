import { Router, Request, Response } from 'express';
import { auth } from '../middleware/auth.js';
import { config } from '../config.js';
import { executePipeline, validateContent, formatContent } from '../services/gemini.js';
import { Post } from '../models/Post.js';

const router = Router();

// All Gemini routes require auth
router.use(auth);

// POST /api/gemini/pipeline — full 3-stage pipeline
router.post('/pipeline', async (req: Request, res: Response) => {
  try {
    const { topic, keywords } = req.body;

    if (!topic) {
      return res.status(400).json({ error: 'Topic is required.' });
    }
    if (!config.geminiApiKey) {
      return res.status(400).json({ error: 'Gemini API key not configured on the server. Set GEMINI_API_KEY in environment.' });
    }

    const posts = await Post.find({ status: 'published' }).select('title slug tags').lean() as any;
    const existingArticles = (posts || []).map((p: any) => ({
      title: p.title,
      slug: p.slug,
      tags: p.tags || [],
    }));

    const result = await executePipeline(
      topic,
      keywords || [],
      config.geminiApiKey,
      config.geminiApiKey2,
      config.geminiApiKey3,
      existingArticles
    );
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Gemini pipeline error:', message);
    res.status(500).json({ error: message });
  }
});

// POST /api/gemini/audit — audit existing content
router.post('/audit', async (req: Request, res: Response) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'Content is required.' });
    }
    if (!config.geminiApiKey) {
      return res.status(400).json({ error: 'Gemini API key not configured on the server.' });
    }

    const posts = await Post.find({ status: 'published' }).select('title slug tags').lean() as any;
    const existingArticles = (posts || []).map((p: any) => ({
      title: p.title,
      slug: p.slug,
      tags: p.tags || [],
    }));

    const result = await validateContent(
      content,
      config.geminiApiKey,
      config.geminiApiKey2,
      config.geminiApiKey3,
      existingArticles
    );
    res.json(result);
  } catch (err) {
    console.error('Gemini audit error:', err);
    res.status(500).json({ error: 'Audit failed.' });
  }
});

// POST /api/gemini/format — auto-enhance document formatting
router.post('/format', async (req: Request, res: Response) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'Content is required.' });
    }
    if (!config.geminiApiKey) {
      return res.status(400).json({ error: 'Gemini API key not configured on the server.' });
    }

    const result = await formatContent(content, config.geminiApiKey, config.geminiApiKey2, config.geminiApiKey3);
    res.json({ content: result });
  } catch (err) {
    console.error('Gemini format error:', err);
    res.status(500).json({ error: 'Formatting failed.' });
  }
});

export default router;
