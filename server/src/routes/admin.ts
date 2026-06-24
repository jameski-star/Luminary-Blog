import { Router, Request, Response } from 'express';
import { auth } from '../middleware/auth';
import { adminOnly } from '../middleware/adminOnly';
import { Post } from '../models/Post';
import { User } from '../models/User';

const router = Router();

// All admin routes require auth + admin role
router.use(auth, adminOnly);

// GET /api/admin/posts — all posts across all users
router.get('/posts', async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
    const status = req.query.status as string;
    const sort = (req.query.sort as string) || 'date';

    const filter: Record<string, unknown> = {};
    if (status && status !== 'all') filter.status = status;

    const sortMap: Record<string, Record<string, -1 | 1>> = {
      date: { publishedAt: -1 },
      views: { views: -1 },
      likes: { likes: -1 },
    };

    const [posts, total] = await Promise.all([
      Post.find(filter)
        .sort(sortMap[sort] || { publishedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select('-content -likedBy'),
      Post.countDocuments(filter),
    ]);

    res.json({ posts, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('Admin list posts error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PATCH /api/admin/posts/:id/status — change any post's status
router.patch('/posts/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const validStatuses = ['draft', 'quarantined', 'published', 'review'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
    }

    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { status, modifiedAt: new Date() },
      { new: true }
    ).select('-content -likedBy');

    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    res.json({ post });
  } catch (err) {
    console.error('Admin set status error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/admin/posts/:id — delete any post
router.delete('/posts/:id', async (req: Request, res: Response) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    await Post.deleteOne({ _id: post._id });
    await User.updateOne({ _id: post.authorId }, { $inc: { postsCount: -1 } });

    res.json({ ok: true });
  } catch (err) {
    console.error('Admin delete post error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PATCH /api/admin/users/:id/promote — promote a user to admin
router.patch('/users/:id/promote', async (req: Request, res: Response) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role: 'admin' },
      { new: true }
    ).select('-passwordHash');

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({ user: { id: String(user._id), email: user.email, name: user.name, role: user.role } });
  } catch (err) {
    console.error('Admin promote user error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/admin/users — all users
router.get('/users', async (_req: Request, res: Response) => {
  try {
    const users = await User.find()
      .select('-passwordHash')
      .sort({ joinedAt: -1 })
      .lean();

    const result = users.map(u => ({
      id: String(u._id),
      email: u.email,
      name: u.name,
      avatar: u.avatar || '',
      bio: u.bio || '',
      role: u.role,
      joinedAt: u.joinedAt.toISOString(),
      postsCount: u.postsCount,
    }));

    res.json({ users: result });
  } catch (err) {
    console.error('Admin list users error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
