import crypto from 'crypto';
import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User, generateVerificationToken } from '../models/User.js';
import { config } from '../config.js';
import { auth } from '../middleware/auth.js';
import { sendVerificationEmail } from '../services/email.js';

const router = Router();

function signToken(userId: string, role: string): string {
  return jwt.sign({ userId, role }, config.jwtSecret, { expiresIn: '7d' });
}

function sanitizeUser(user: { _id: unknown; email: string; name: string; avatar?: string; bio?: string; role: string; joinedAt: Date; postsCount: number; verified: boolean }) {
  return {
    id: String(user._id),
    email: user.email,
    name: user.name,
    avatar: user.avatar || '',
    bio: user.bio || '',
    role: user.role,
    joinedAt: user.joinedAt.toISOString(),
    postsCount: user.postsCount,
    verified: user.verified,
  };
}

// POST /api/auth/signup
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered.' });
    }

    const userCount = await User.countDocuments();
    const passwordHash = await bcrypt.hash(password, 12);

    const { raw, hash } = generateVerificationToken();

    const user = await User.create({
      email: normalizedEmail,
      name: name.trim(),
      passwordHash,
      role: userCount === 0 ? 'admin' : 'user',
      verificationTokenHash: hash,
    });

    const token = signToken(String(user._id), user.role);

    sendVerificationEmail(normalizedEmail, raw).catch(err =>
      console.error('Failed to send verification email:', err)
    );

    res.status(201).json({ token, user: sanitizeUser(user.toObject()) });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/auth/verify?token=...
router.get('/verify', async (req: Request, res: Response) => {
  try {
    const { token } = req.query;
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Verification token is required.' });
    }

    const hash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({ verificationTokenHash: hash });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired verification token.' });
    }

    user.verified = true;
    user.verificationTokenHash = undefined;
    await user.save();

    res.json({ message: 'Email verified successfully.' });
  } catch (err) {
    console.error('Verify error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/auth/resend-verification
router.post('/resend-verification', auth, async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user!.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    if (user.verified) {
      return res.status(400).json({ error: 'Email already verified.' });
    }

    const { raw, hash } = generateVerificationToken();
    user.verificationTokenHash = hash;
    await user.save();

    sendVerificationEmail(user.email, raw).catch(err =>
      console.error('Failed to send verification email:', err)
    );

    res.json({ message: 'Verification email sent.' });
  } catch (err) {
    console.error('Resend verification error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/auth/signin
router.post('/signin', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ error: 'No account found with that email.' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Incorrect password.' });
    }

    const token = signToken(String(user._id), user.role);

    res.json({ token, user: sanitizeUser(user.toObject()) });
  } catch (err) {
    console.error('Signin error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/auth/me
router.get('/me', auth, async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user!.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json({ user: sanitizeUser(user.toObject()) });
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PATCH /api/auth/profile — update name, bio, avatar
router.patch('/profile', auth, async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user!.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const { name, bio, avatar } = req.body;

    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ error: 'Name cannot be empty.' });
      }
      user.name = name.trim();
    }

    if (bio !== undefined) {
      user.bio = bio.trim();
    }

    if (avatar !== undefined) {
      if (avatar === '') {
        user.avatar = undefined;
      } else if (typeof avatar === 'string' && avatar.startsWith('data:image/')) {
        user.avatar = avatar;
      } else {
        return res.status(400).json({ error: 'Avatar must be a valid data URL (data:image/...).' });
      }
    }

    await user.save();
    res.json({ user: sanitizeUser(user.toObject()) });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
