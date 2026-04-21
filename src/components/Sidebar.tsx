import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Package, 
  MessageSquare, 
  Settings, 
  Users, 
  ShieldAlert, 
  BarChart3,
  LogOut
} from 'lucide-react';
import { cn } from '../lib/utils';
import { UserRole } from '../types';

import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  role: UserRole;
}

export const Sidebar: React.FC<SidebarProps> = ({ role }) => {
  const location = useLocation();
  const { user } = useAuth();
  
  const ADMIN_EMAILS = [
    'theindiemarketplace@gmail.com',
    'chris@indiy.com',
    'theindiemarketplace@gmail.com'
  ];

  const commonLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Messages', path: '/dashboard/messages', icon: MessageSquare },
    { name: 'Settings', path: '/dashboard/settings', icon: Settings },
  ];

  const isGlobalAdmin = user && ADMIN_EMAILS.includes(user.email);
  const effectiveRole = isGlobalAdmin ? UserRole.ADMIN : role;

  const roleLinks = {
    [UserRole.BUYER]: [
      { name: 'My Purchases', path: '/dashboard/purchases', icon: ShoppingBag },
      { name: 'Support Tickets', path: '/dashboard/tickets', icon: ShieldAlert },
    ],
    [UserRole.SELLER]: [
      { name: 'My Services', path: '/dashboard/services', icon: Package },
      { name: 'Orders', path: '/dashboard/orders', icon: ShoppingBag },
      { name: 'Analytics', path: '/dashboard/analytics', icon: BarChart3 },
    ],
    [UserRole.ADMIN]: [
      { name: 'Review Queue', path: '/dashboard/review', icon: ShieldAlert },
      { name: 'Site Settings', path: '/dashboard/site-settings', icon: Settings },
      { name: 'Gig Moderation', path: '/dashboard/admin/services', icon: ShoppingBag },
      { name: 'User Management', path: '/dashboard/users', icon: Users },
      { name: 'Platform Stats', path: '/dashboard/stats', icon: BarChart3 },
      { name: 'System Health', path: '/dashboard/health', icon: ShieldAlert },
      { name: 'System Logs', path: '/dashboard/logs', icon: ShieldAlert },
    ],
    [UserRole.OPERATIONS]: [
      { name: 'Review Queue', path: '/dashboard/review', icon: ShieldAlert },
      { name: 'Support Queue', path: '/dashboard/queue', icon: MessageSquare },
      { name: 'Disputes', path: '/dashboard/disputes', icon: ShieldAlert },
      { name: 'Spam Control', path: '/dashboard/spam', icon: ShieldAlert },
    ],
  };

  const links = [...commonLinks, ...(roleLinks[effectiveRole] || [])];

  return (
    <aside className="w-64 glass border-r border-border-subtle h-[calc(100vh-64px)] sticky top-16 hidden md:flex flex-col">
      <div className="p-6 flex-grow">
        <div className="space-y-1">
          {links.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                location.pathname === link.path
                  ? "bg-brand/10 text-brand border border-brand/20"
                  : "text-text-secondary hover:text-text-primary hover:bg-white/5"
              )}
            >
              <link.icon className="w-5 h-5" />
              {link.name}
            </Link>
          ))}
        </div>
      </div>
      
      <div className="p-6 border-t border-border-subtle">
        <button className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-400/5 transition-all w-full">
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};
