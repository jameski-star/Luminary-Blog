import { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import BlogListPage from './pages/BlogListPage';
import PostPage from './pages/PostPage';
import EditorPage from './pages/EditorPage';
import AutoPostPage from './pages/AutoPostPage';
import DashboardPage from './pages/DashboardPage';
import AdminPage from './pages/AdminPage';
import ProfilePage from './pages/ProfilePage';
import LegalPage from './pages/LegalPage';
import { LoginPage, SignupPage } from './pages/AuthPages';

function AppRouter() {
  const { currentPage, posts, setSelectedPostId, setCurrentPage } = useApp();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [currentPage]);

  // URL-based deep linking
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const postSlug = params.get('post');
    if (postSlug) {
      const post = posts.find(p => p.slug === postSlug);
      if (post) {
        setSelectedPostId(post.id);
        setCurrentPage('post');
      }
    }
  }, [posts]);

  // Update URL when viewing a post
  useEffect(() => {
    if (currentPage === 'post') {
      const post = posts.find(p => p.id === selectedPostId);
      if (post) {
        const url = `${window.location.pathname}?post=${post.slug}`;
        window.history.replaceState(null, '', url);
      }
    }
  }, [currentPage, selectedPostId]);

  const renderPage = () => {
    switch (currentPage) {
      case 'home':      return <HomePage />;
      case 'blog':      return <BlogListPage />;
      case 'post':      return <PostPage />;
      case 'editor':    return <EditorPage />;
      case 'autopost':  return <AutoPostPage />;
      case 'dashboard': return <DashboardPage />;
      case 'admin':     return <AdminPage />;
      case 'profile':   return <ProfilePage />;
      case 'login':     return <LoginPage />;
      case 'signup':    return <SignupPage />;
      case 'privacy':   return <LegalPage page="privacy" />;
      case 'terms':     return <LegalPage page="terms" />;
      case 'cookies':   return <LegalPage page="cookies" />;
      default:          return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen bg-canvas">
      <Navbar />
      <main>
        {renderPage()}
      </main>
      <Footer />
    </div>
  );
}

function Footer() {
  const { user, setCurrentPage } = useApp();

  return (
    <footer className="border-t border-border bg-canvas px-4 py-12 mt-8">
      <div className="max-w-5xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <button onClick={() => setCurrentPage('home')} className="flex items-center gap-2.5 mb-4 group">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-canvas font-bold text-sm">L</span>
              </div>
              <span className="font-heading text-xl font-bold text-primary">Luminary</span>
            </button>
            <p className="text-sm text-secondary leading-relaxed max-w-xs">
              The premium blogging platform where every article passes a 3-stage AI validation pipeline.
              No filler. No fluff.
            </p>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-xs font-semibold text-secondary uppercase tracking-wider mb-4">Platform</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Blog', page: 'blog' as const },
                { label: 'Write', page: 'editor' as const },
                { label: 'AutoPost AI', page: 'autopost' as const },
                { label: 'Dashboard', page: 'dashboard' as const },
              ].map(l => (
                <li key={l.label}>
                  <button
                    onClick={() => setCurrentPage(l.page)}
                    className="text-sm text-secondary hover:text-primary transition-colors"
                  >
                    {l.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="text-xs font-semibold text-secondary uppercase tracking-wider mb-4">Account</h4>
            <ul className="space-y-2.5">
              {user ? (
                <>
                  <li>
                    <button
                      onClick={() => setCurrentPage('dashboard')}
                      className="text-sm text-secondary hover:text-primary transition-colors"
                    >
                      Dashboard
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setCurrentPage('profile')}
                      className="text-sm text-secondary hover:text-primary transition-colors"
                    >
                      Profile
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <button
                      onClick={() => setCurrentPage('login')}
                      className="text-sm text-secondary hover:text-primary transition-colors"
                    >
                      Sign In
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setCurrentPage('signup')}
                      className="text-sm text-secondary hover:text-primary transition-colors"
                    >
                      Create Account
                    </button>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>

        <div className="border-t border-border pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <p className="text-xs text-secondary">
            &copy; 2026 Luminary Blog.
          </p>
          <div className="flex items-center gap-4 text-xs text-secondary">
            <button onClick={() => setCurrentPage('privacy')} className="hover:text-primary transition-colors">Privacy</button>
            <button onClick={() => setCurrentPage('terms')} className="hover:text-primary transition-colors">Terms</button>
            <button onClick={() => setCurrentPage('cookies')} className="hover:text-primary transition-colors">Cookies</button>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppRouter />
    </AppProvider>
  );
}
