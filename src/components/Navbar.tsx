import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, ShoppingCart, User, Menu, X, Bell, LogOut, Headphones } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { SellerAvatar } from './SellerAvatar';

export const Navbar = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();
  const { settings } = useSiteSettings();

  const navLinks = [
    { name: 'Marketplace', path: '/marketplace' },
    { name: 'Sell Services', path: '/sell' },
    { name: 'Support', path: '/support' },
  ];

  return (
    <nav className="sticky top-0 z-50 glass border-b border-border-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex-shrink-0 flex items-center">
              {settings.logoUrl ? (
                <img src={settings.logoUrl} alt={settings.siteName} className="h-12 w-auto" referrerPolicy="no-referrer" />
              ) : (
                <span className="text-2xl font-display font-bold text-brand">{settings.siteName}</span>
              )}
            </Link>
            
            <div className="hidden md:block">
              <div className="flex items-baseline space-x-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    className={cn(
                      "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      location.pathname === link.path
                        ? "text-brand"
                        : "text-text-secondary hover:text-text-primary"
                    )}
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder="Search services..."
                className="bg-bg-elevated border border-border-subtle rounded-full py-1.5 pl-10 pr-4 text-sm focus:outline-none focus:border-brand/50 w-64"
              />
            </div>
            
            <button className="p-2 text-text-secondary hover:text-text-primary transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            <button className="p-2 text-text-secondary hover:text-text-primary transition-colors">
              <ShoppingCart className="w-5 h-5" />
            </button>
            
            {user ? (
              <div className="relative ml-4">
                <button 
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 p-1 rounded-full hover:bg-white/5 transition-all"
                >
                  <SellerAvatar 
                    sellerId={user.uid} 
                    sellerName={user.displayName} 
                    className="w-8 h-8"
                  />
                </button>
                
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-bg-surface/95 backdrop-blur-xl border border-border-strong rounded-2xl py-2 shadow-2xl animate-in fade-in zoom-in duration-200 ring-1 ring-white/5">
                    <div className="px-4 py-2 border-b border-border-subtle mb-2">
                      <p className="text-sm font-bold truncate">{user.displayName}</p>
                      <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest">{user.role}</p>
                    </div>
                    <Link 
                      to="/dashboard" 
                      className="block px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-white/5"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <button 
                      onClick={() => {
                        logout();
                        setIsProfileOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-400/5 flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link 
                to="/login"
                className="ml-4 bg-brand hover:bg-brand-hover text-white px-5 py-2 rounded-full text-sm font-semibold transition-all shadow-lg shadow-brand/20"
              >
                Sign In
              </Link>
            )}
          </div>

          <div className="md:hidden flex items-center gap-4">
            <button className="p-2 text-text-secondary">
              <Search className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-text-secondary hover:text-text-primary"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-bg-base/95 backdrop-blur-2xl border-t border-border-subtle animate-in slide-in-from-top duration-200 shadow-2xl">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className="block px-3 py-2 rounded-md text-base font-medium text-text-secondary hover:text-text-primary hover:bg-white/5"
                onClick={() => setIsOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="block px-3 py-2 rounded-md text-base font-medium text-text-secondary hover:text-text-primary hover:bg-white/5"
                  onClick={() => setIsOpen(false)}
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-400"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="block px-3 py-2 rounded-md text-base font-medium text-brand"
                onClick={() => setIsOpen(false)}
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
