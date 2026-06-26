import { Router, Request, Response } from 'express';
import { auth } from '../middleware/auth.js';
import { config } from '../config.js';
import {
  researchKeywords,
  analyzeCompetitors,
  optimizeContent,
} from '../services/serper.js';

const router = Router();

router.use(auth);

function requireSerperKey(res: Response): boolean {
  if (!config.serperApiKey) {
    res.status(400).json({ error: 'Serper.dev API key not configured. Set SERPER_API_KEY in server environment.' });
    return false;
  }
  return true;
}

router.post('/keywords', async (req: Request, res: Response) => {
  try {
    if (!requireSerperKey(res)) return;

    const { topic } = req.body;
    if (!topic) {
      return res.status(400).json({ error: 'Topic is required.' });
    }

    const result = await researchKeywords(topic, config.serperApiKey);
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('SEO keywords error:', message);
    res.status(500).json({ error: message });
  }
});

router.post('/competitors', async (req: Request, res: Response) => {
  try {
    if (!requireSerperKey(res)) return;

    const { keyword } = req.body;
    if (!keyword) {
      return res.status(400).json({ error: 'Keyword is required.' });
    }

    const result = await analyzeCompetitors(keyword, config.serperApiKey);
    res.json({ competitors: result, keyword });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('SEO competitors error:', message);
    res.status(500).json({ error: message });
  }
});

router.post('/optimize', async (req: Request, res: Response) => {
  try {
    if (!requireSerperKey(res)) return;

    const { title, content, keywords } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required.' });
    }

    const result = await optimizeContent(
      title,
      content,
      keywords || [],
      config.serperApiKey
    );
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('SEO optimize error:', message);
    res.status(500).json({ error: message });
  }
});

export default router;
