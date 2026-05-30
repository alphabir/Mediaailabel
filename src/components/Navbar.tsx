import { Activity, Code, Settings, Menu, X, Terminal, Cpu, Database, Play } from 'lucide-react';
import { useState } from 'react';

interface NavbarProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  userLoggedIn: boolean;
  setUserLoggedIn: (status: boolean) => void;
}

export default function Navbar({ currentPage, setCurrentPage, userLoggedIn, setUserLoggedIn }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home', icon: Cpu },
    { id: 'features', label: 'Features', icon: Activity },
    { id: 'pricing', label: 'Pricing', icon: Database },
    { id: 'docs', label: 'API Docs', icon: Code },
  ];

  const handleNavigate = (pageId: string) => {
    setCurrentPage(pageId);
    setMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-purple-950/40 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => handleNavigate('home')}>
            <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 text-white shadow-lg shadow-purple-500/20">
              <Terminal className="h-5 w-5" />
              <div className="absolute -right-0.5 -bottom-0.5 h-2 w-2 rounded-full bg-indigo-400 ring-2 ring-slate-950 animate-pulse"></div>
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              Media<span className="bg-gradient-to-r from-purple-400 to-indigo-300 bg-clip-text text-transparent">Forge</span>
            </span>
          </div>

          {/* Nav Items (Desktop) */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-item-${item.id}`}
                  onClick={() => handleNavigate(item.id)}
                  className={`flex items-center space-x-1.5 rounded-md px-3 h-9 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-purple-900/40 text-purple-300 ring-1 ring-purple-500/30'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Action buttons (Desktop) */}
          <div className="hidden md:flex items-center space-x-3">
            {userLoggedIn ? (
              <>
                <button
                  id="nav-btn-dashboard"
                  onClick={() => handleNavigate('dashboard')}
                  className={`flex items-center space-x-1 px-4 h-9 rounded-md text-sm font-medium transition-all duration-200 ${
                    currentPage === 'dashboard'
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20 hover:bg-purple-500'
                      : 'border border-purple-950 bg-purple-950/20 text-purple-300 hover:bg-purple-900/40'
                  }`}
                >
                  <Play className="h-4.5 w-4.5 fill-current" />
                  <span>Access Console</span>
                </button>
                <button
                  id="nav-btn-logout"
                  onClick={() => {
                    setUserLoggedIn(false);
                    handleNavigate('home');
                  }}
                  className="px-3 h-9 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  Log Out
                </button>
              </>
            ) : (
              <>
                <button
                  id="nav-btn-login"
                  onClick={() => handleNavigate('login')}
                  className="px-4 h-9 rounded-md text-sm font-medium text-slate-400 hover:text-white transition-colors"
                >
                  Sign In
                </button>
                <button
                  id="nav-btn-signup"
                  onClick={() => handleNavigate('signup')}
                  className="flex items-center justify-center rounded-md bg-gradient-to-r from-purple-600 to-indigo-600 px-4 h-9 text-sm font-semibold text-white shadow-lg shadow-purple-500/10 hover:from-purple-500 hover:to-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-500 transition-all duration-200"
                >
                  Get Started
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex items-center">
            <button
              id="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-md p-2 text-slate-400 hover:bg-slate-900 hover:text-white focus:outline-none"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-purple-950/40 bg-slate-950 px-2 pt-2 pb-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                id={`mobile-nav-${item.id}`}
                onClick={() => handleNavigate(item.id)}
                className={`flex w-full items-center space-x-3 rounded-md px-3 py-2 text-base font-medium transition-colors ${
                  isActive
                    ? 'bg-purple-900/40 text-purple-300 ring-1 ring-purple-500/20'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
          <div className="border-t border-purple-950/20 pt-4 mt-4 space-y-2 px-3">
            {userLoggedIn ? (
              <>
                <button
                  id="mobile-nav-dashboard"
                  onClick={() => handleNavigate('dashboard')}
                  className="flex w-full items-center justify-center rounded-md bg-purple-600 py-2.5 text-sm font-semibold text-white shadow"
                >
                  Console Dashboard
                </button>
                <button
                  id="mobile-nav-logout"
                  onClick={() => {
                    setUserLoggedIn(false);
                    handleNavigate('home');
                  }}
                  className="flex w-full items-center justify-center rounded-md border border-slate-800 py-2.5 text-sm font-semibold text-slate-400"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <button
                  id="mobile-nav-login"
                  onClick={() => handleNavigate('login')}
                  className="flex w-full items-center justify-center rounded-md border border-slate-800 py-2.5 text-sm font-semibold text-slate-400"
                >
                  Sign In
                </button>
                <button
                  id="mobile-nav-signup"
                  onClick={() => handleNavigate('signup')}
                  className="flex w-full items-center justify-center rounded-md bg-gradient-to-r from-purple-600 to-indigo-600 py-2.5 text-sm font-semibold text-white shadow-md shadow-purple-500/10"
                >
                  Create Account
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
