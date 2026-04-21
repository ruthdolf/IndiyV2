import React from 'react';
import { Sidebar } from './Sidebar';
import { UserRole } from '../types';
import { Card } from './ui';
import { TrendingUp, Users, ShoppingCart, AlertCircle } from 'lucide-react';
import { Routes, Route, Link, Navigate } from 'react-router-dom';
import { Chat } from './Chat';
import { AdminReviewQueue } from './AdminReviewQueue';
import { SiteSettings } from './SiteSettings';
import { ProfileSettings } from './ProfileSettings';
import { SellerServices } from './SellerServices';
import { CreateService } from './CreateService';
import { EditService } from './EditService';
import { SellerOrders } from './SellerOrders';
import { SellerAnalytics } from './SellerAnalytics';
import { AdminPlatformDashboard } from './AdminPlatformDashboard';
import { AdminServiceManagement } from './AdminServiceManagement';
import { FirebaseDiagnostics } from './FirebaseDiagnostics';
import { useAuth } from '../contexts/AuthContext';
import { db, doc, updateDoc, handleFirestoreError, OperationType } from '../firebase';
import { cn } from '../lib/utils';

interface DashboardProps {
  role: UserRole;
}

export const Dashboard: React.FC<DashboardProps> = ({ role }) => {
  const { user } = useAuth();
  const [activeRole, setActiveRole] = React.useState<UserRole>(role);

  // Sync activeRole with role prop when it changes (e.g. initial load)
  React.useEffect(() => {
    setActiveRole(role);
  }, [role]);

  const changeRole = async (newRole: UserRole) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), { role: newRole });
      setActiveRole(newRole);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const renderStats = () => {
    const stats = {
      [UserRole.BUYER]: [
        { label: 'Active Orders', value: '0', icon: ShoppingCart, color: 'text-blue-500' },
        { label: 'Total Spent', value: '$0.00', icon: TrendingUp, color: 'text-green-500' },
        { label: 'Open Tickets', value: '0', icon: AlertCircle, color: 'text-orange-500' },
      ],
      [UserRole.SELLER]: [
        { label: 'Total Sales', value: '$0.00', icon: TrendingUp, color: 'text-green-500' },
        { label: 'Active Orders', value: '0', icon: ShoppingCart, color: 'text-blue-500' },
        { label: 'Avg. Rating', value: 'N/A', icon: Users, color: 'text-yellow-500' },
      ],
      [UserRole.ADMIN]: [
        { label: 'Total Users', value: '0', icon: Users, color: 'text-blue-500' },
        { label: 'Daily Revenue', value: '$0.00', icon: TrendingUp, color: 'text-green-500' },
        { label: 'System Health', value: '100%', icon: AlertCircle, color: 'text-green-500' },
      ],
      [UserRole.OPERATIONS]: [
        { label: 'Open Tickets', value: '0', icon: AlertCircle, color: 'text-orange-500' },
        { label: 'Active Disputes', value: '0', icon: AlertCircle, color: 'text-red-500' },
        { label: 'Spam Reports', value: '0', icon: AlertCircle, color: 'text-yellow-500' },
      ],
    };

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {(stats[activeRole] || []).map((stat) => (
          <Card key={stat.label} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-muted text-sm uppercase tracking-wider mb-1">{stat.label}</p>
                <h3 className="text-2xl font-display font-bold">{stat.value}</h3>
              </div>
              <div className={cn("p-3 rounded-2xl bg-white/5", stat.color)}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  };

  const ADMIN_EMAILS = [
    'theindiemarketplace@gmail.com',
    'chris@indiy.com',
    'theindiemarketplace@gmail.com'
  ];

  const AdminRoute = ({ children }: { children: React.ReactNode }) => {
    const isGlobalAdmin = user && ADMIN_EMAILS.includes(user.email);
    if (user?.role !== UserRole.ADMIN && !isGlobalAdmin) return <Navigate to="/dashboard/main" replace />;
    return <>{children}</>;
  };

  const OperationsRoute = ({ children }: { children: React.ReactNode }) => {
    const isGlobalAdmin = user && ADMIN_EMAILS.includes(user.email);
    if (user?.role !== UserRole.ADMIN && user?.role !== UserRole.OPERATIONS && !isGlobalAdmin) 
      return <Navigate to="/dashboard/main" replace />;
    return <>{children}</>;
  };

  const MainDashboard = () => {
    const isGlobalAdmin = user && ADMIN_EMAILS.includes(user.email);
    return (
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold mb-2">Welcome back, {user?.displayName}</h1>
            <p className="text-text-muted">Here's what's happening with your {activeRole} account today.</p>
          </div>
          
          {/* Role Switcher for Admins only - used for testing/demo */}
          {(user?.role === UserRole.ADMIN || user?.role === UserRole.OPERATIONS || isGlobalAdmin) && (
            <div className="glass p-1.5 rounded-full flex gap-1">
            {Object.values(UserRole).map((r) => (
              <button
                key={r}
                onClick={() => changeRole(r)}
                className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all",
                  activeRole === r ? "bg-brand text-white" : "text-text-muted hover:text-text-primary"
                )}
              >
                {r}
              </button>
            ))}
          </div>
        )}
      </header>

      {renderStats()}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-6">
          <h3 className="text-xl font-bold mb-6">Recent Activity</h3>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <ShoppingCart className="w-6 h-6 text-text-muted" />
            </div>
            <p className="text-sm font-medium">No recent activity</p>
            <p className="text-xs text-text-muted mt-1">Orders and updates will appear here.</p>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-xl font-bold mb-6">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <Link to="/dashboard/services/create" className="p-4 rounded-2xl bg-bg-elevated hover:bg-white/5 border border-border-subtle transition-all text-left">
              <h4 className="font-bold mb-1">Create Listing</h4>
              <p className="text-xs text-text-muted">Add a new service to the marketplace</p>
            </Link>
            <Link to="/dashboard/orders" className="p-4 rounded-2xl bg-bg-elevated hover:bg-white/5 border border-border-subtle transition-all text-left">
              <h4 className="font-bold mb-1">View Orders</h4>
              <p className="text-xs text-text-muted">Manage your active and past orders</p>
            </Link>
            <Link to="/dashboard/settings" className="p-4 rounded-2xl bg-bg-elevated hover:bg-white/5 border border-border-subtle transition-all text-left">
              <h4 className="font-bold mb-1">Profile Settings</h4>
              <p className="text-xs text-text-muted">Update your public profile and avatar</p>
            </Link>
            <button className="p-4 rounded-2xl bg-bg-elevated hover:bg-white/5 border border-border-subtle transition-all text-left">
              <h4 className="font-bold mb-1">Support</h4>
              <p className="text-xs text-text-muted">Contact our operations team</p>
            </button>
          </div>
        </Card>
      </div>
    </div>
    );
  };

  return (
    <div className="flex">
      <Sidebar role={activeRole} />
      <main className="flex-grow p-8">
        <Routes>
          <Route path="main" element={<MainDashboard />} />
          <Route path="messages" element={<Chat />} />
          <Route path="review" element={
            <OperationsRoute>
              <AdminReviewQueue />
            </OperationsRoute>
          } />
          <Route path="site-settings" element={
            <AdminRoute>
              <SiteSettings />
            </AdminRoute>
          } />
          <Route path="settings" element={<ProfileSettings />} />
          <Route path="services" element={<SellerServices />} />
          <Route path="services/create" element={<CreateService />} />
          <Route path="services/edit/:id" element={<EditService />} />
          <Route path="orders" element={<SellerOrders />} />
          <Route path="analytics" element={<SellerAnalytics />} />
          <Route path="admin/services" element={
            <AdminRoute>
              <AdminServiceManagement />
            </AdminRoute>
          } />
          <Route path="health" element={
            <AdminRoute>
              <FirebaseDiagnostics />
            </AdminRoute>
          } />
          <Route path="stats" element={
            <AdminRoute>
              <AdminPlatformDashboard />
            </AdminRoute>
          } />
          <Route path="*" element={<div className="p-20 text-center text-2xl font-bold opacity-20">View Coming Soon</div>} />
        </Routes>
      </main>
    </div>
  );
};
