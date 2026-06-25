import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, BlogPost, NavPage } from '../types';
import {
  getCurrentUser,
  setCurrentUser,
  getStoredPosts,
  savePosts,
  getGeminiKey,
  saveGeminiKey,
  migrateStoredData,
  buildWordIndex,
  generateSlug,
  calcReadTime,
} from '../store/appStore';
import { api, isApiMode, setApiToken, getApiToken } from '../services/api';

type Theme = 'dark' | 'light';

const STORAGE_THEME_KEY = 'luminary_theme';

function getStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_THEME_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {}
  return 'dark';
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('light', theme === 'light');
}

// Apply saved theme immediately to prevent flash
applyTheme(getStoredTheme());

interface AppContextType {
  // Auth
  user: User | null;
  setUser: (u: User | null) => void;
  logout: () => void;

  // Navigation
  currentPage: NavPage;
  setCurrentPage: (p: NavPage) => void;
  selectedPostId: string | null;
  setSelectedPostId: (id: string | null) => void;

  // Posts
  posts: BlogPost[];
  addPost: (post: BlogPost) => void;
  updatePost: (id: string, updates: Partial<BlogPost>) => void;
  deletePost: (id: string) => void;
  getPost: (id: string) => BlogPost | undefined;
  likePost: (id: string) => void;
  incrementViews: (id: string) => void;

  // Gemini
  geminiKey: string;
  setGeminiKey: (k: string) => void;

  // Search
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  searchResults: BlogPost[];

  // Theme
  theme: Theme;
  toggleTheme: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<NavPage>('home');
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [geminiKey, setGeminiKeyState] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<BlogPost[]>([]);
  const [theme, setTheme] = useState<Theme>(getStoredTheme);

  // Initialize
  useEffect(() => {
    if (isApiMode()) {
      const token = getApiToken();
      if (token) {
      api.auth.me()
        .then(res => setUserState(res.user))
        .catch(err => {
          const msg = err instanceof Error ? err.message.toLowerCase() : '';
          if (msg.includes('banned')) {
            setApiToken(null);
            setUserState(null);
          } else {
            setApiToken(null);
          }
        });
      }
      api.posts.list({ status: 'published', limit: '100' })
        .then(res => setPosts(res.posts as BlogPost[]))
        .catch(() => {});
    } else {
      migrateStoredData();
      const storedUser = getCurrentUser();
      const storedPosts = getStoredPosts();
      if (storedUser) setUserState(storedUser);
      setPosts(storedPosts);
    }

    const storedKey = getGeminiKey();
    if (storedKey) setGeminiKeyState(storedKey);
    applyTheme(theme);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem(STORAGE_THEME_KEY, next);
      applyTheme(next);
      return next;
    });
  }, []);

  // Search effect
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    if (isApiMode()) {
      api.posts.search(searchQuery.trim())
        .then(res => setSearchResults(res.posts as BlogPost[]))
        .catch(() => setSearchResults([]));
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const words = query.split(/\s+/);

    const results = posts
      .filter(p => p.status === 'published' && p.isApproved !== false)
      .map(post => {
        let score = 0;
        words.forEach(word => {
          if (post.title.toLowerCase().includes(word)) score += 10;
          if (post.excerpt.toLowerCase().includes(word)) score += 5;
          if ((post.content || '').toLowerCase().includes(word)) score += 3;
          if (post.tags.some(t => t.toLowerCase().includes(word))) score += 8;
          if (post.keywords.some(k => k.toLowerCase().includes(word))) score += 6;
          if (post.wordIndex && post.wordIndex[word]) score += post.wordIndex[word].length * 2;
        });
        return { post, score };
      })
      .filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(r => r.post);

    setSearchResults(results);
  }, [searchQuery, posts]);

  const setUser = useCallback((u: User | null) => {
    setUserState(u);
    setCurrentUser(u);
  }, []);

  const logout = useCallback(() => {
    setUserState(null);
    setCurrentUser(null);
    setApiToken(null);
    setCurrentPage('home');
  }, []);

  const setGeminiKey = useCallback((k: string) => {
    setGeminiKeyState(k);
    saveGeminiKey(k);
  }, []);

  const addPost = useCallback((post: BlogPost) => {
    if (isApiMode()) {
      api.posts.create(post).then(res => {
        setPosts(prev => [res.post as BlogPost, ...prev]);
      }).catch(console.error);
    } else {
      setPosts(prev => {
        const enriched = {
          ...post,
          wordIndex: buildWordIndex(post.content),
          slug: post.slug || generateSlug(post.title),
          readTime: post.readTime || calcReadTime(post.content),
          wordCount: post.content.split(/\s+/).length,
        };
        const next = [enriched, ...prev];
        savePosts(next);
        return next;
      });
    }
  }, []);

  const updatePost = useCallback((id: string, updates: Partial<BlogPost>) => {
    if (isApiMode()) {
      api.posts.update(id, updates).then(res => {
        setPosts(prev => prev.map(p => p.id === id ? (res.post as BlogPost) : p));
      }).catch(console.error);
    } else {
      setPosts(prev => {
        const next = prev.map(p => {
          if (p.id !== id) return p;
          const updated = { ...p, ...updates };
          if (updates.content) {
            updated.wordIndex = buildWordIndex(updates.content);
            updated.wordCount = updates.content.split(/\s+/).length;
            updated.readTime = calcReadTime(updates.content);
          }
          return updated;
        });
        savePosts(next);
        return next;
      });
    }
  }, []);

  const deletePost = useCallback((id: string) => {
    if (isApiMode()) {
      api.posts.delete(id).then(() => {
        setPosts(prev => prev.filter(p => p.id !== id));
      }).catch(console.error);
    } else {
      setPosts(prev => {
        const next = prev.filter(p => p.id !== id);
        savePosts(next);
        return next;
      });
    }
  }, []);

  const getPost = useCallback((id: string) => {
    return posts.find(p => p.id === id);
  }, [posts]);

  const likePost = useCallback((id: string) => {
    if (isApiMode()) {
      api.posts.like(id).catch(console.error);
      setPosts(prev => prev.map(p =>
        p.id === id ? { ...p, likes: p.likes + 1 } : p
      ));
    } else {
      setPosts(prev => {
        const next = prev.map(p =>
          p.id === id ? { ...p, likes: p.likes + 1 } : p
        );
        savePosts(next);
        return next;
      });
    }
  }, []);

  const incrementViews = useCallback((id: string) => {
    setPosts(prev => {
      const next = prev.map(p =>
        p.id === id ? { ...p, views: p.views + 1 } : p
      );
      if (!isApiMode()) savePosts(next);
      return next;
    });
  }, []);

  return (
    <AppContext.Provider value={{
      user, setUser, logout,
      currentPage, setCurrentPage,
      selectedPostId, setSelectedPostId,
      posts, addPost, updatePost, deletePost, getPost, likePost, incrementViews,
      geminiKey, setGeminiKey,
      searchQuery, setSearchQuery, searchResults,
      theme, toggleTheme,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
