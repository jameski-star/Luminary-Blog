import type { User, BlogPost } from '../types';

// ──────────────────────────────────────────────
// Local-storage helpers (simulate a DB)
// ──────────────────────────────────────────────
const STORAGE_KEYS = {
  USERS: 'luminary_users',
  POSTS: 'luminary_posts',
  CURRENT_USER: 'luminary_current_user',
  GEMINI_KEY: 'luminary_gemini_key',
};

export function getStoredUsers(): User[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
  } catch { return []; }
}

function migrateUser(user: User): User {
  if (!user.role) user.role = 'user';
  return user;
}

export function migrateStoredData() {
  const users = getStoredUsers().map(migrateUser);
  saveUsers(users);
  const current = getCurrentUser();
  if (current) {
    setCurrentUser(migrateUser(current));
  }
}

export function saveUsers(users: User[]) {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
}

export function getStoredPosts(): BlogPost[] {
  try {
    const posts = JSON.parse(localStorage.getItem(STORAGE_KEYS.POSTS) || '[]');
    return posts;
  } catch { return []; }
}

export function savePosts(posts: BlogPost[]) {
  localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
}

export function getCurrentUser(): User | null {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || 'null');
  } catch { return null; }
}

export function setCurrentUser(user: User | null) {
  if (user) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }
}

export function getGeminiKey(): string {
  return localStorage.getItem(STORAGE_KEYS.GEMINI_KEY) || '';
}

export function saveGeminiKey(key: string) {
  localStorage.setItem(STORAGE_KEYS.GEMINI_KEY, key);
}

// ──────────────────────────────────────────────
// Word Indexer — indexes every word in a post
// ──────────────────────────────────────────────
export function buildWordIndex(content: string): Record<string, number[]> {
  const paragraphs = content.split('\n').filter(Boolean);
  const index: Record<string, number[]> = {};

  paragraphs.forEach((para, idx) => {
    const words = para
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2);

    words.forEach(word => {
      if (!index[word]) index[word] = [];
      if (!index[word].includes(idx)) index[word].push(idx);
    });
  });

  return index;
}

// ──────────────────────────────────────────────
// Slug generator
// ──────────────────────────────────────────────
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .slice(0, 80);
}

// ──────────────────────────────────────────────
// Read time calculator
// ──────────────────────────────────────────────
export function calcReadTime(content: string): number {
  const words = content.split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 238));
}

// ──────────────────────────────────────────────
// Auth helpers
// ──────────────────────────────────────────────
function isValidEmail(email: string): boolean {
  const match = email.toLowerCase().trim().match(/^[^\s@]+@([^\s@]+)$/);
  if (!match) return false;
  return ['gmail.com', 'outlook.com', 'hotmail.com'].includes(match[1]);
}

export function signUp(name: string, email: string, password: string): { success: boolean; error?: string; user?: User } {
  const users = getStoredUsers();
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    return { success: false, error: 'Email already registered.' };
  }
  if (!isValidEmail(email)) {
    return { success: false, error: 'Only @gmail.com, @outlook.com, and @hotmail.com emails are allowed.' };
  }
  if (password.length < 8) {
    return { success: false, error: 'Password must be at least 8 characters.' };
  }
  // Store hashed password (simple base64 for demo; in production use bcrypt)
  const isFirstUser = users.length === 0;
  const user: User = {
    id: `user_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    email,
    name,
    joinedAt: new Date().toISOString(),
    postsCount: 0,
    bio: '',
    role: isFirstUser ? 'admin' : 'user',
  };
  // Store credentials separately
  const creds = JSON.parse(localStorage.getItem('luminary_creds') || '{}');
  creds[email.toLowerCase()] = btoa(password);
  localStorage.setItem('luminary_creds', JSON.stringify(creds));
  users.push(user);
  saveUsers(users);
  setCurrentUser(user);
  return { success: true, user };
}

export function signIn(email: string, password: string): { success: boolean; error?: string; user?: User } {
  const users = getStoredUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) return { success: false, error: 'No account found with that email.' };

  if (user.banned) {
    return { success: false, error: 'Your account has been banned. Contact an administrator.' };
  }

  const creds = JSON.parse(localStorage.getItem('luminary_creds') || '{}');
  if (creds[email.toLowerCase()] !== btoa(password)) {
    return { success: false, error: 'Incorrect password.' };
  }
  setCurrentUser(user);
  return { success: true, user };
}

export function signOut() {
  setCurrentUser(null);
}


