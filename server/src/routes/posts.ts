import { Router, Request, Response } from 'express';
import { Post } from '../models/Post';
import { User } from '../models/User';
import { auth, optionalAuth } from '../middleware/auth';

const router = Router();

function calcReadTime(content: string): number {
  const words = content.split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 238));
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .slice(0, 80);
}

// GET /api/posts — public, published only
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const author = req.query.author as string;

    const filter: Record<string, unknown> = { status: 'published', isApproved: true };
    if (author) filter.authorId = author;

    const [posts, total] = await Promise.all([
      Post.find(filter)
        .sort({ publishedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select('-content -likedBy'),
      Post.countDocuments(filter),
    ]);

    res.json({ posts, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('List posts error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/posts/search — public, published only
router.get('/search', async (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string || '').trim();
    if (!q) {
      return res.json({ posts: [], total: 0 });
    }

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));

    const [posts, total] = await Promise.all([
      Post.find(
        { $text: { $search: q }, status: 'published', isApproved: true },
        { score: { $meta: 'textScore' } }
      )
        .sort({ score: { $meta: 'textScore' } })
        .skip((page - 1) * limit)
        .limit(limit)
        .select('-content -likedBy'),
      Post.countDocuments({ $text: { $search: q }, status: 'published', isApproved: true }),
    ]);

    res.json({ posts, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('Search posts error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/posts/my — user's own posts (all statuses)
router.get('/my', auth, async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string;
    const filter: Record<string, unknown> = { authorId: req.user!.userId };
    if (status && status !== 'all') filter.status = status;

    const posts = await Post.find(filter)
      .sort({ modifiedAt: -1 })
      .select('-content -likedBy');

    res.json({ posts });
  } catch (err) {
    console.error('My posts error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/posts/:slug — public, but increment views
router.get('/:slug', async (req: Request, res: Response) => {
  try {
    const post = await Post.findOne({ slug: req.params.slug });
    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    // Only approved published posts are publicly readable
    if (post.status !== 'published' || !post.isApproved) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    // Increment views asynchronously (don't wait)
    Post.updateOne({ _id: post._id }, { $inc: { views: 1 } }).exec();

    res.json({ post });
  } catch (err) {
    console.error('Get post error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/posts — create
router.post('/', auth, async (req: Request, res: Response) => {
  try {
    const { title, content, excerpt, tags, keywords, coverImage, status, isApproved, auditScore } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required.' });
    }

    const user = await User.findById(req.user!.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    let slug = generateSlug(title);
    // Ensure unique slug
    const existing = await Post.findOne({ slug });
    if (existing) {
      slug = `${slug}-${Date.now()}`;
    }

    const wordCount = content.split(/\s+/).length;
    const readTime = calcReadTime(content);

    const post = await Post.create({
      title,
      slug,
      excerpt: excerpt || content.slice(0, 200).replace(/[#*]/g, '').trim(),
      content,
      tags: tags || [],
      keywords: keywords || [],
      coverImage,
      authorId: user._id,
      authorName: user.name,
      authorAvatar: user.avatar,
      status: status || 'draft',
      isApproved: status === 'published' ? (isApproved ?? true) : false,
      auditScore,
      readTime,
      wordCount,
    });

    // Update user's post count
    await User.updateOne({ _id: user._id }, { $inc: { postsCount: 1 } });

    res.status(201).json({ post });
  } catch (err) {
    console.error('Create post error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/posts/:id — update
router.put('/:id', auth, async (req: Request, res: Response) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    // Only author can update
    if (String(post.authorId) !== req.user!.userId) {
      return res.status(403).json({ error: 'You can only edit your own posts.' });
    }

    const allowed = ['title', 'content', 'excerpt', 'tags', 'keywords', 'coverImage', 'status', 'isApproved', 'auditScore', 'publishedAt'] as const;
    for (const field of allowed) {
      if (req.body[field] !== undefined) {
        (post as unknown as Record<string, unknown>)[field] = req.body[field];
      }
    }

    if (req.body.status === 'published' && req.body.isApproved === undefined) {
      post.isApproved = true;
    }

    if (req.body.content) {
      post.wordCount = req.body.content.split(/\s+/).length;
      post.readTime = calcReadTime(req.body.content);
    }

    post.modifiedAt = new Date();

    if (req.body.title) {
      post.slug = generateSlug(req.body.title);
    }

    await post.save();

    res.json({ post });
  } catch (err) {
    console.error('Update post error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/posts/:id
router.delete('/:id', auth, async (req: Request, res: Response) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    // Only author or admin can delete
    if (String(post.authorId) !== req.user!.userId && req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this post.' });
    }

    await Post.deleteOne({ _id: post._id });
    await User.updateOne({ _id: post.authorId }, { $inc: { postsCount: -1 } });

    res.json({ ok: true });
  } catch (err) {
    console.error('Delete post error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/posts/:id/like — toggle like
router.post('/:id/like', auth, async (req: Request, res: Response) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    const userId = req.user!.userId;
    const alreadyLiked = post.likedBy.some(id => String(id) === userId);

    if (alreadyLiked) {
      post.likedBy = post.likedBy.filter(id => String(id) !== userId);
      post.likes = Math.max(0, post.likes - 1);
    } else {
      post.likedBy.push(userId as unknown as typeof post.likedBy[0]);
      post.likes += 1;
    }

    await post.save();
    res.json({ likes: post.likes, liked: !alreadyLiked });
  } catch (err) {
    console.error('Like post error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
