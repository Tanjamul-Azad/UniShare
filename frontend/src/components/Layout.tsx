import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, Search, Github, Twitter, Linkedin, ShoppingCart, MessageSquare, ShieldCheck } from 'lucide-react';
import { cn } from '../lib/utils';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import NotificationsDropdown from './NotificationsDropdown';
import ProfileMenu from './ProfileMenu';
import ChatHead from './ChatHead';
import { useApiQuery } from '../hooks/useApiQuery';
import { getCartPreviewItems, type MarketplaceItem } from '../lib/api';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const { unreadThreadCount } = useSocket();
  const isAdmin = user?.role === 'admin';
  const { data: cartItems = [] } = useApiQuery<MarketplaceItem[]>({
    queryKey: ['cart-preview-items'],
    queryFn: getCartPreviewItems,
    enabled: Boolean(user) && !isAdmin,
  });

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileMenuOpen(false); }, [location.pathname]);

  // Always-visible nav items
  const publicNav = [
    { path: '/', label: 'Home' },
    { path: '/how-it-works', label: 'How it Works' },
    { path: '/about', label: 'About' },
    { path: '/contact', label: 'Contact' },
  ];

  // Only shown when logged in
  const authNav = [
    { path: '/marketplace', label: 'Marketplace' },
    { path: '/co-subs', label: 'Co-Subscriptions' },
    { path: '/community', label: 'Community' },
  ];

  const navItems = user ? [...publicNav.slice(0, 1), ...authNav, ...publicNav.slice(1)] : publicNav;

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col font-sans">
      {/* ── Header ─────────────────────────────────────────── */}
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 h-16 transition-all duration-200 border-b',
          scrolled ? 'bg-white/95 backdrop-blur-md border-gray-200 shadow-sm' : 'bg-white border-transparent'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight text-gray-900">UniShare</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-0.5">
            {navItems.map((item) => {
              const isActive = item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'px-3.5 py-1.5 rounded-full text-sm font-medium transition-all duration-150',
                    isActive
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const q = new FormData(e.currentTarget).get('q');
                if (q) navigate(`/marketplace?q=${encodeURIComponent(q.toString())}`);
              }}
              className="relative hidden lg:block"
            >
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                name="q"
                placeholder="Search…"
                className="pl-8 pr-3 py-1.5 bg-gray-100 border border-transparent rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:bg-white focus:border-gray-200 transition-all w-40 focus:w-52"
              />
            </form>

            {user ? (
              <>
                {/* Inbox */}
                <Link
                  to="/inbox"
                  className="relative p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                  title="Inbox"
                >
                  <MessageSquare className="w-5 h-5" />
                  {unreadThreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-indigo-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                      {unreadThreadCount > 9 ? '9+' : unreadThreadCount}
                    </span>
                  )}
                </Link>
                <NotificationsDropdown />
                {!isAdmin && (
                  <Link to="/cart" className="relative p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors" title="Cart">
                    <ShoppingCart className="w-5 h-5" />
                    {cartItems.length > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-emerald-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                        {cartItems.length > 9 ? '9+' : cartItems.length}
                      </span>
                    )}
                  </Link>
                )}
                {user.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-full transition-colors"
                    title="Admin Portal"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Admin
                  </Link>
                )}
                <ProfileMenu />
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-100"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="px-3.5 py-1.5 bg-indigo-600 text-white text-sm font-semibold rounded-full hover:bg-indigo-700 transition-all shadow-sm hover:shadow"
                >
                  Sign up
                </Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 rounded-full text-gray-600 hover:bg-gray-100 transition-colors"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1 shadow-lg">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="block px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                {item.label}
              </Link>
            ))}
            {!user && (
              <div className="pt-2 flex gap-2 border-t border-gray-100 mt-2">
                <Link to="/login" className="flex-1 text-center py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50">Log in</Link>
                <Link to="/signup" className="flex-1 text-center py-2.5 text-sm font-semibold text-white bg-gray-900 rounded-xl hover:bg-gray-800">Sign up</Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* ── Main Content ───────────────────────────────────── */}
      <main className="flex-1 w-full flex flex-col pt-16">
        <div className={cn('w-full mx-auto', location.pathname === '/' ? 'max-w-full px-0' : 'max-w-7xl px-4 sm:px-6 py-8')}>
          <Outlet />
        </div>
      </main>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="bg-white border-t border-gray-200 pt-14 pb-8 mt-auto">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            <div className="col-span-2 md:col-span-1">
              <Link to="/" className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 bg-gray-900 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="font-bold text-base tracking-tight text-gray-900">UniShare</span>
              </Link>
              <p className="text-sm text-gray-500 leading-relaxed mb-5 max-w-56">
                A UIU-only student marketplace for textbooks and subscription sharing.
              </p>
              <div className="flex items-center gap-3">
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-700 transition-colors"><Twitter className="w-4 h-4" /></a>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-700 transition-colors"><Github className="w-4 h-4" /></a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-700 transition-colors"><Linkedin className="w-4 h-4" /></a>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Platform</h4>
              <ul className="space-y-2.5 text-sm text-gray-500">
                <li><Link to="/marketplace" className="hover:text-gray-900 transition-colors">Marketplace</Link></li>
                <li><Link to="/co-subs" className="hover:text-gray-900 transition-colors">Co-Subscriptions</Link></li>
                <li><Link to="/how-it-works" className="hover:text-gray-900 transition-colors">How it Works</Link></li>
                <li><Link to="/pricing" className="hover:text-gray-900 transition-colors">Pricing</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Company</h4>
              <ul className="space-y-2.5 text-sm text-gray-500">
                <li><Link to="/about" className="hover:text-gray-900 transition-colors">About Us</Link></li>
                <li><Link to="/blog" className="hover:text-gray-900 transition-colors">Blog</Link></li>
                <li><Link to="/contact" className="hover:text-gray-900 transition-colors">Contact</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Legal</h4>
              <ul className="space-y-2.5 text-sm text-gray-500">
                <li><Link to="/privacy" className="hover:text-gray-900 transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-gray-900 transition-colors">Terms of Service</Link></li>
                <li><Link to="/cookies" className="hover:text-gray-900 transition-colors">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-gray-400">© {new Date().getFullYear()} UniShare Inc. All rights reserved.</p>
            <p className="text-xs text-gray-400">Made with care for students.</p>
          </div>
        </div>
      </footer>

      {/* Global Floating Chat Head */}
      {user && <ChatHead />}
    </div>
  );
}
