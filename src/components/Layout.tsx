import React from 'react';
import { Navbar } from './Navbar';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { Headphones } from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { settings } = useSiteSettings();
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        {children}
      </main>
      <footer className="bg-bg-surface border-t border-border-subtle py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center mb-4">
                {settings.logoUrl ? (
                  <img src={settings.logoUrl} alt={settings.siteName} className="h-10 w-auto" referrerPolicy="no-referrer" />
                ) : (
                  <span className="text-xl font-display font-bold text-brand">{settings.siteName}</span>
                )}
              </div>
              <p className="text-text-muted text-sm max-w-xs">
                The premier marketplace for high-quality digital services and creative assets.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-text-secondary">Marketplace</h4>
              <ul className="space-y-2 text-sm text-text-muted">
                <li><a href="#" className="hover:text-brand transition-colors">Browse Services</a></li>
                <li><a href="#" className="hover:text-brand transition-colors">Top Sellers</a></li>
                <li><a href="#" className="hover:text-brand transition-colors">New Releases</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-text-secondary">Support</h4>
              <ul className="space-y-2 text-sm text-text-muted">
                <li><a href="#" className="hover:text-brand transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-brand transition-colors">Dispute Resolution</a></li>
                <li><a href="#" className="hover:text-brand transition-colors">Contact Us</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-text-secondary">Legal</h4>
              <ul className="space-y-2 text-sm text-text-muted">
                <li><a href="#" className="hover:text-brand transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-brand transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-brand transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-border-subtle flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-text-muted text-xs">
              © {new Date().getFullYear()} Indiy Inc. All rights reserved.
            </p>
            <div className="flex gap-6">
              {/* Social icons could go here */}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
