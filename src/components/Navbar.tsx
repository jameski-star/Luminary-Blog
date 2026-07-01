import { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Search, PenLine, Zap, User, LogOut, Menu, X,
  LayoutDashboard, BookOpen, Home, ChevronDown, Sun, Moon, Shield
} from 'lucide-react';

export default function Navbar() {
  const { user, logout, setCurrentPage, setSearchQuery, searchQuery, searchResults, currentPage, setSelectedPostId, theme, toggleTheme } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const nav = (page: Parameters<typeof setCurrentPage>[0]) => {
    setCurrentPage(page);
    setMenuOpen(false);
    setProfileOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-canvas/80 backdrop-blur-2xl supports-[backdrop-filter]:bg-canvas/60" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-16 md:h-18">

          <button onClick={() => nav('home')} className="flex items-center gap-2.5 group shrink-0">
            <div className="w-8 h-8 rounded bg-accent flex items-center justify-center">
              <span className="text-canvas font-bold text-sm font-heading">L</span>
            </div>
            <span className="font-heading text-lg font-bold text-primary group-hover:text-accent transition-colors duration-200">
              Luminary
            </span>
          </button>

          <nav className="hidden md:flex items-center gap-0.5">
            <NavBtn active={currentPage === 'home'} onClick={() => nav('home')} icon={<Home size={15} />} label="Home" />
            <NavBtn active={currentPage === 'blog'} onClick={() => nav('blog')} icon={<BookOpen size={15} />} label="Blog" />
            {user && (
              <>
                <NavBtn active={currentPage === 'dashboard'} onClick={() => nav('dashboard')} icon={<LayoutDashboard size={15} />} label="Dashboard" />
                <NavBtn active={currentPage === 'editor'} onClick={() => nav('editor')} icon={<PenLine size={15} />} label="Write" />
                <NavBtn active={currentPage === 'autopost'} onClick={() => nav('autopost')} icon={<Zap size={15} />} label="AutoPost AI" />
                {user.role === 'admin' && (
                  <NavBtn active={currentPage === 'admin'} onClick={() => nav('admin')} icon={<Shield size={15} />} label="Admin" />
                )}
              </>
            )}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="text-secondary hover:text-primary transition-colors p-2.5 md:p-2 rounded-xl hover:bg-surface min-h-11 min-w-11"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            <div className="hidden sm:block relative">
              <div className={`flex items-center gap-2 rounded-2xl border px-3 py-1.5 transition-all duration-200 ${searchFocused ? 'border-accent bg-surface w-56 md:w-72 shadow-lg shadow-accent-glow/5' : 'border-border bg-surface w-36 md:w-44 hover:border-secondary/50'}`}>
                <Search size={13} className="text-secondary shrink-0" />
                <input
                  type="text"
                  placeholder="Search posts…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
                  className="bg-transparent text-primary text-xs md:text-sm outline-none w-full placeholder-secondary/60"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-secondary hover:text-primary text-xs shrink-0 leading-none">✕</button>
                )}
              </div>
              {searchFocused && searchQuery && searchResults.length > 0 && (
                <div className="absolute top-11 left-0 right-0 bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden z-50 w-72 md:w-80 backdrop-blur-xl">
                  {searchResults.slice(0, 5).map(post => (
                    <button
                      key={post.id}
                      onClick={() => { setSelectedPostId(post.id); setCurrentPage('post'); setSearchQuery(''); }}
                      className="w-full text-left px-4 py-3 hover:bg-raised transition-colors border-b border-border last:border-0 group/search"
                    >
                      <p className="text-sm font-medium text-primary line-clamp-1 group-hover/search:text-accent transition-colors">{post.title}</p>
                      <p className="text-xs text-secondary mt-0.5 line-clamp-1">{post.excerpt}</p>
                    </button>
                  ))}
                  {searchResults.length > 5 && (
                    <button
                      onClick={() => nav('blog')}
                      className="w-full text-center text-xs text-secondary hover:text-primary py-3 hover:bg-raised transition-colors font-medium"
                    >
                      View all {searchResults.length} results →
                    </button>
                  )}
                </div>
              )}
            </div>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 rounded-full pl-1 pr-3 py-1 border border-border hover:border-secondary/50 transition-colors bg-surface/80 hover:bg-surface"
                >
                  <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-canvas overflow-hidden aspect-square">
                    {user.avatar ? (
                      <img src={user.avatar} alt="" loading="lazy" className="w-full h-full object-cover" />
                    ) : (
                      user.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <span className="hidden sm:block text-sm text-primary">{user.name.split(' ')[0]}</span>
                  <ChevronDown size={12} className={`text-secondary transition-transform ${profileOpen ? 'rotate-180' : ''} hidden md:block`} />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-12 w-48 rounded-2xl border border-border bg-surface/95 backdrop-blur-xl shadow-2xl overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-border">
                      <p className="text-sm font-medium text-primary truncate">{user.name}</p>
                      <p className="text-xs text-secondary truncate">{user.email}</p>
                    </div>
                    <DropItem icon={<User size={13} />} label="Profile" onClick={() => nav('profile')} />
                    <DropItem icon={<LayoutDashboard size={13} />} label="Dashboard" onClick={() => nav('dashboard')} />
                    {user.role === 'admin' && <DropItem icon={<Shield size={13} />} label="Admin Panel" onClick={() => nav('admin')} />}
                    <DropItem icon={<PenLine size={13} />} label="Write Post" onClick={() => nav('editor')} />
                    <DropItem icon={<Zap size={13} />} label="AutoPost AI" onClick={() => nav('autopost')} />
                    <div className="border-t border-border">
                      <DropItem icon={<LogOut size={13} />} label="Sign Out" onClick={logout} danger />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => nav('login')}
                  className="hidden sm:block text-sm text-secondary hover:text-primary transition-colors px-4 py-2.5 md:py-1.5 rounded-xl hover:bg-surface min-h-11"
                >
                  Sign In
                </button>
                <button
                  onClick={() => nav('signup')}
                  className="text-sm text-accent hover:text-accent/80 transition-colors border-b border-accent/30 hover:border-accent/60 pb-0.5 min-h-11 flex items-center"
                >
                  Get started
                </button>
              </div>
            )}

            <button
              className="md:hidden text-secondary hover:text-primary transition-colors p-3 rounded-xl min-h-11 min-w-11"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-border bg-canvas/95 backdrop-blur-xl px-4 py-4 space-y-0.5 max-h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="flex items-center gap-2 rounded-2xl border border-border px-3 py-2 mb-3 bg-surface">
            <Search size={13} className="text-secondary" />
            <input
              type="text"
              placeholder="Search posts…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-transparent text-primary text-sm outline-none w-full placeholder-secondary/60"
            />
          </div>
          <MobileNavBtn label="Home" onClick={() => nav('home')} />
          <MobileNavBtn label="Blog" onClick={() => nav('blog')} />
          {user ? (
            <>
              <MobileNavBtn label="Dashboard" onClick={() => nav('dashboard')} />
              {user.role === 'admin' && <MobileNavBtn label="Admin Panel" onClick={() => nav('admin')} />}
              <MobileNavBtn label="Write Post" onClick={() => nav('editor')} />
              <MobileNavBtn label="AutoPost AI" onClick={() => nav('autopost')} />
              <MobileNavBtn label="Profile" onClick={() => nav('profile')} />
              <MobileNavBtn label="Sign Out" onClick={logout} danger />
            </>
          ) : (
            <>
              <MobileNavBtn label="Sign In" onClick={() => nav('login')} />
              <MobileNavBtn label="Get Started" onClick={() => nav('signup')} />
            </>
          )}
        </div>
      )}
    </header>
  );
}

function NavBtn({ active, onClick, icon, label }: {
  active?: boolean; onClick: () => void; icon: React.ReactNode; label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3.5 py-2.5 md:py-1.5 rounded-xl text-sm transition-all duration-200 font-medium min-h-11
        ${active
          ? 'bg-raised text-primary'
          : 'text-secondary hover:text-primary hover:bg-surface'
        }`}
    >
      {icon}
      {label}
    </button>
  );
}

function DropItem({ icon, label, onClick, danger }: {
  icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors
        ${danger ? 'text-red-400 hover:bg-red-950/30' : 'text-secondary hover:text-primary hover:bg-raised'}`}
    >
      {icon}
      {label}
    </button>
  );
}

function MobileNavBtn({ label, onClick, danger }: {
  label: string; onClick: () => void; danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors
        ${danger ? 'text-red-400 hover:bg-red-950/30' : 'text-secondary hover:text-primary hover:bg-surface'}`}
    >
      {label}
    </button>
  );
}
