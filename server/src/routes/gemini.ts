import { Router, Request, Response } from 'express';
import { auth } from '../middleware/auth.js';
import { config } from '../config.js';
import { executePipeline, validateContent } from '../services/gemini.js';

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

    const result = await executePipeline(topic, keywords || [], config.geminiApiKey);
    res.json(result);
  } catch (err) {
    console.error('Gemini pipeline error:', err);
    res.status(500).json({ error: 'Pipeline failed.' });
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

    const result = await validateContent(content, config.geminiApiKey);
    res.json(result);
  } catch (err) {
    console.error('Gemini audit error:', err);
    res.status(500).json({ error: 'Audit failed.' });
  }
});

export default router;
