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
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-canvas/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-3 md:px-6">
        <div className="flex items-center justify-between h-14 md:h-16">

          {/* Logo */}
          <button onClick={() => nav('home')} className="flex items-center gap-1.5 md:gap-2.5 group shrink-0">
            <div className="w-7 md:w-8 h-7 md:h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-canvas font-bold text-[11px] md:text-sm">L</span>
            </div>
            <span className="font-heading text-base md:text-xl font-bold text-primary group-hover:text-primary/80 transition-colors">
              Luminary
            </span>
          </button>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
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

          {/* Search + Auth */}
          <div className="flex items-center gap-1.5 md:gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="text-secondary hover:text-primary transition-colors p-1 md:p-1.5 rounded-lg hover:bg-surface"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            </button>

          {/* Search Input */}
          <div className="hidden sm:block relative">
            <div className={`flex items-center gap-1.5 md:gap-2 rounded-full border px-2 md:px-3 py-1 md:py-1.5 transition-all duration-200 ${searchFocused ? 'border-primary bg-surface w-48 md:w-64' : 'border-border bg-surface w-32 md:w-40'}`}>
              <Search size={12} className="text-secondary flex-shrink-0" />
              <input
                type="text"
                placeholder="Search posts…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
                className="bg-transparent text-primary text-[10px] md:text-sm outline-none w-full placeholder-secondary"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-secondary hover:text-primary text-[10px] md:text-xs shrink-0">×</button>
              )}
            </div>
            {/* Live Search Dropdown */}
            {searchFocused && searchQuery && searchResults.length > 0 && (
              <div className="absolute top-10 left-0 right-0 bg-surface border border-border rounded-xl md:rounded-2xl shadow-2xl overflow-hidden z-50 w-64 md:w-80">
                {searchResults.slice(0, 5).map(post => (
                  <button
                    key={post.id}
                    onClick={() => { setSelectedPostId(post.id); setCurrentPage('post'); setSearchQuery(''); }}
                    className="w-full text-left px-3 md:px-4 py-2 md:py-3 hover:bg-raised transition-colors border-b border-border last:border-0"
                  >
                    <p className="text-[10px] md:text-sm font-medium text-primary line-clamp-1">{post.title}</p>
                    <p className="text-[9px] md:text-xs text-secondary mt-0.5 line-clamp-1">{post.excerpt}</p>
                  </button>
                ))}
                {searchResults.length > 5 && (
                  <button
                    onClick={() => nav('blog')}
                    className="w-full text-center text-[10px] md:text-xs text-secondary hover:text-primary py-2 md:py-3 hover:bg-raised transition-colors"
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
                  className="flex items-center gap-1 md:gap-2 rounded-full px-2 md:px-3 py-1 md:py-1.5 border border-border hover:border-primary/50 transition-colors bg-surface"
                >
                  <div className="w-5 md:w-6 h-5 md:h-6 rounded-full bg-primary flex items-center justify-center text-[9px] md:text-xs font-bold text-canvas overflow-hidden">
                    {user.avatar ? (
                      <img src={user.avatar} alt="" loading="lazy" className="w-full h-full object-cover" />
                    ) : (
                      user.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <span className="hidden sm:block text-[10px] md:text-sm text-primary">{user.name.split(' ')[0]}</span>
                  <ChevronDown size={11} className={`text-secondary transition-transform ${profileOpen ? 'rotate-180' : ''} hidden md:block`} />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-10 md:top-12 w-40 md:w-48 rounded-xl border border-border bg-surface shadow-2xl overflow-hidden z-50">
                    <div className="px-3 md:px-4 py-2 md:py-3 border-b border-border">
                      <p className="text-[10px] md:text-sm font-medium text-primary truncate">{user.name}</p>
                      <p className="text-[9px] md:text-xs text-secondary truncate">{user.email}</p>
                    </div>
                    <DropItem icon={<User size={12} />} label="Profile" onClick={() => nav('profile')} />
                    <DropItem icon={<LayoutDashboard size={12} />} label="Dashboard" onClick={() => nav('dashboard')} />
                    {user.role === 'admin' && <DropItem icon={<Shield size={12} />} label="Admin Panel" onClick={() => nav('admin')} />}
                    <DropItem icon={<PenLine size={12} />} label="Write Post" onClick={() => nav('editor')} />
                    <DropItem icon={<Zap size={12} />} label="AutoPost AI" onClick={() => nav('autopost')} />
                    <div className="border-t border-border">
                      <DropItem icon={<LogOut size={12} />} label="Sign Out" onClick={logout} danger />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1 md:gap-2">
                <button
                  onClick={() => nav('login')}
                  className="hidden sm:block text-[10px] md:text-sm text-secondary hover:text-primary transition-colors px-2 md:px-3 py-1 md:py-1.5"
                >
                  Sign In
                </button>
                <button
                  onClick={() => nav('signup')}
                  className="text-[10px] md:text-sm font-medium bg-primary hover:bg-white text-canvas px-3 md:px-4 py-1 md:py-1.5 rounded-full transition-colors"
                >
                  Get Started
                </button>
              </div>
            )}

            {/* Mobile Menu */}
            <button
              className="md:hidden text-secondary hover:text-primary transition-colors p-1"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {menuOpen && (
        <div className="md:hidden border-t border-border bg-canvas px-3 md:px-4 py-3 md:py-4 space-y-0.5 md:space-y-1 max-h-[calc(100vh-3.5rem)] overflow-y-auto">
          <div className="flex items-center gap-1.5 md:gap-2 rounded-full border border-border px-2.5 md:px-3 py-1.5 md:py-2 mb-2 md:mb-3">
            <Search size={12} className="text-secondary" />
            <input
              type="text"
              placeholder="Search posts…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-transparent text-primary text-[10px] md:text-sm outline-none w-full placeholder-secondary"
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
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all duration-200 font-medium
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
      className={`w-full flex items-center gap-2 md:gap-2.5 px-3 md:px-4 py-2 md:py-2.5 text-[10px] md:text-sm transition-colors
        ${danger ? 'text-red-400 hover:bg-red-950/30'
          : 'text-secondary hover:text-primary hover:bg-raised'}`}
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
      className={`w-full text-left px-3 md:px-4 py-2 md:py-3 rounded-lg md:rounded-xl text-[10px] md:text-sm font-medium transition-colors
        ${danger ? 'text-red-400 hover:bg-red-950/30'
          : 'text-secondary hover:text-primary hover:bg-surface'}`}
    >
      {label}
    </button>
  );
}
