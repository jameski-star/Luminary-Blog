import { useEffect, lazy, Suspense } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Navbar from './components/Navbar';

const HomePage = lazy(() => import('./pages/HomePage'));
const BlogListPage = lazy(() => import('./pages/BlogListPage'));
const PostPage = lazy(() => import('./pages/PostPage'));
const EditorPage = lazy(() => import('./pages/EditorPage'));
const AutoPostPage = lazy(() => import('./pages/AutoPostPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const LegalPage = lazy(() => import('./pages/LegalPage'));
const LoginPage = lazy(() => import('./pages/AuthPages').then(m => ({ default: m.LoginPage })));
const SignupPage = lazy(() => import('./pages/AuthPages').then(m => ({ default: m.SignupPage })));

function AppRouter() {
  const { currentPage, posts, selectedPostId, setSelectedPostId, setCurrentPage } = useApp();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [currentPage]);

  // Path-based routing: sync pathname → currentPage on mount & popstate
  useEffect(() => {
    function syncPageFromPath() {
      const path = window.location.pathname;
      const slug = window.location.pathname.match(/^\/blog\/(.+)/)?.[1];
      const params = new URLSearchParams(window.location.search);
      const postSlug = slug || params.get('post');

      if (postSlug) {
        const post = posts.find(p => p.slug === postSlug);
        if (post) {
          setSelectedPostId(post.id);
          setCurrentPage('post');
          return;
        }
      }

      switch (path) {
        case '/blog': setCurrentPage('blog'); break;
        case '/privacy': setCurrentPage('privacy'); break;
        case '/terms': setCurrentPage('terms'); break;
        case '/cookies': setCurrentPage('cookies'); break;
        default: setCurrentPage('home');
      }
    }

    syncPageFromPath();
    window.addEventListener('popstate', syncPageFromPath);
    return () => window.removeEventListener('popstate', syncPageFromPath);
  }, [posts]);

  // Sync currentPage → pathname
  useEffect(() => {
    const post = currentPage === 'post' ? posts.find(p => p.id === selectedPostId) : null;
    const pathMap: Record<string, string> = {
      home: '/',
      blog: '/blog',
      editor: '/editor',
      autopost: '/autopost',
      dashboard: '/dashboard',
      admin: '/admin',
      profile: '/profile',
      login: '/login',
      signup: '/signup',
      privacy: '/privacy',
      terms: '/terms',
      cookies: '/cookies',
    };
    const target = post ? `/blog/${post.slug}` : (pathMap[currentPage] || '/');
    if (window.location.pathname + window.location.search !== target && window.location.pathname !== target) {
      window.history.pushState(null, '', target);
    }
  }, [currentPage, selectedPostId, posts]);

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
        <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
          {renderPage()}
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

function Footer() {
  const { user, setCurrentPage } = useApp();

  return (
    <footer className="border-t border-border px-4 py-16 md:py-20 mt-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-4 gap-10 mb-12">
          <div className="md:col-span-2">
            <button onClick={() => setCurrentPage('home')} className="flex items-center gap-2.5 mb-4 group">
              <div className="w-8 h-8 rounded bg-accent flex items-center justify-center">
                <span className="text-canvas font-bold text-sm font-heading">L</span>
              </div>
              <span className="font-heading text-xl font-bold text-primary group-hover:text-accent transition-colors">Luminary</span>
            </button>
            <p className="text-sm text-secondary leading-relaxed max-w-sm">
              Every article passes a 4-stage authenticity pipeline&mdash;outline, draft, fact-check, and polish.
              No filler. No fluff.
            </p>
          </div>

          <div>
            <h4 className="small-caps text-xs tracking-widest text-secondary mb-5">Platform</h4>
            <ul className="space-y-3">
              {[
                { label: 'Blog', page: 'blog' as const },
                { label: 'Write', page: 'editor' as const },
                { label: 'AutoPost AI', page: 'autopost' as const },
                { label: 'Dashboard', page: 'dashboard' as const },
              ].map(l => (
                <li key={l.label}>
                  <button
                    onClick={() => setCurrentPage(l.page)}
                    className="text-sm text-secondary hover:text-accent transition-colors"
                  >
                    {l.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="small-caps text-xs tracking-widest text-secondary mb-5">Account</h4>
            <ul className="space-y-3">
              {user ? (
                <>
                  <li>
                    <button
                      onClick={() => setCurrentPage('dashboard')}
                      className="text-sm text-secondary hover:text-accent transition-colors"
                    >
                      Dashboard
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setCurrentPage('profile')}
                      className="text-sm text-secondary hover:text-accent transition-colors"
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
                      className="text-sm text-secondary hover:text-accent transition-colors"
                    >
                      Sign in
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setCurrentPage('signup')}
                      className="text-sm text-secondary hover:text-accent transition-colors"
                    >
                      Create account
                    </button>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>

        <div className="border-t border-border pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-xs text-secondary">
            &copy; 2026 Luminary Blog.
          </p>
          <div className="flex items-center gap-5 text-xs text-secondary">
            <button onClick={() => setCurrentPage('privacy')} className="hover:text-accent transition-colors">Privacy</button>
            <button onClick={() => setCurrentPage('terms')} className="hover:text-accent transition-colors">Terms</button>
            <button onClick={() => setCurrentPage('cookies')} className="hover:text-accent transition-colors">Cookies</button>
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
