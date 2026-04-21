import React, { useState, useEffect } from 'react';
import { 
  Users, 
  ShoppingCart, 
  TrendingUp, 
  MessageSquare, 
  ShieldCheck, 
  ArrowUpRight, 
  ArrowDownRight,
  Search,
  Filter,
  MoreHorizontal,
  Loader2,
  Calendar,
  DollarSign
} from 'lucide-react';
import { Card, Button } from './ui';
import { db, collection, query, orderBy, limit, getDocs, onSnapshot, where } from '../firebase';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export const AdminPlatformDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSales: 0,
    totalRevenue: 0,
    activeConversations: 0,
    pendingApplications: 0
  });
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [recentMessages, setRecentMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Real-time listeners for stats and activity
    const usersQuery = query(collection(db, 'users'));
    const salesQuery = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(5));
    const messagesQuery = query(collection(db, 'conversations'), orderBy('updatedAt', 'desc'), limit(5));
    const appsQuery = query(collection(db, 'seller_applications'), where('status', '==', 'pending'));

    const unsubUsers = onSnapshot(usersQuery, (snap) => {
      setStats(prev => ({ ...prev, totalUsers: snap.size }));
    });

    const unsubSales = onSnapshot(query(collection(db, 'orders')), (snap) => {
      const docs = snap.docs.map(d => d.data());
      const total = docs.reduce((acc, curr) => acc + (curr.amount || 0), 0);
      setStats(prev => ({ ...prev, totalSales: snap.size, totalRevenue: total }));
      setRecentSales(snap.docs.slice(0, 5).map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubConvs = onSnapshot(messagesQuery, (snap) => {
      setStats(prev => ({ ...prev, activeConversations: snap.size }));
      setRecentMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubApps = onSnapshot(appsQuery, (snap) => {
      setStats(prev => ({ ...prev, pendingApplications: snap.size }));
    });

    setLoading(false);

    return () => {
      unsubUsers();
      unsubSales();
      unsubConvs();
      unsubApps();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
      </div>
    );
  }

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-500', trend: '+12%', up: true },
    { label: 'Total Sales', value: stats.totalSales, icon: ShoppingCart, color: 'text-green-500', trend: '+8%', up: true },
    { label: 'Platform Revenue', value: `$${stats.totalRevenue.toFixed(2)}`, icon: DollarSign, color: 'text-brand', trend: '+15%', up: true },
    { label: 'Pending Sellers', value: stats.pendingApplications, icon: ShieldCheck, color: 'text-orange-500', trend: 'Critical', up: false },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold mb-2">Platform Overview</h1>
          <p className="text-text-muted">Global marketplace activity and administrative controls.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Last 30 Days
          </Button>
          <Button className="bg-brand text-white">Generate Report</Button>
        </div>
      </header>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <Card key={stat.label} className="p-6 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-4">
              <div className={cn("p-3 rounded-2xl bg-white/5", stat.color)}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div className={cn(
                "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full",
                stat.up ? "bg-green-500/10 text-green-500" : "bg-orange-500/10 text-orange-500"
              )}>
                {stat.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {stat.trend}
              </div>
            </div>
            <div>
              <p className="text-text-muted text-xs uppercase tracking-widest font-bold mb-1">{stat.label}</p>
              <h3 className="text-3xl font-display font-bold">{stat.value}</h3>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <stat.icon className="w-24 h-24" />
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sales Feed */}
        <Card className="flex flex-col h-[500px]">
          <div className="p-6 border-b border-border-subtle flex items-center justify-between">
            <h3 className="font-bold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-brand" />
              Recent Global Sales
            </h3>
            <Button variant="ghost" className="text-xs text-brand p-0">View All</Button>
          </div>
          <div className="flex-grow overflow-y-auto">
            {recentSales.length > 0 ? (
              <div className="divide-y divide-border-subtle/50">
                {recentSales.map((sale) => (
                  <div key={sale.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500 font-bold">
                        $
                      </div>
                      <div>
                        <p className="text-sm font-bold">Order #{sale.id.slice(-6)}</p>
                        <p className="text-xs text-text-muted">
                          {sale.createdAt?.seconds ? format(sale.createdAt.seconds * 1000, 'MMM d, h:mm a') : 'Just now'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-brand">${sale.amount?.toFixed(2)}</p>
                      <p className="text-[10px] uppercase font-bold tracking-widest text-green-500">{sale.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-text-muted p-12 text-center">
                <ShoppingCart className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-sm">No sales data available yet.</p>
              </div>
            )}
          </div>
        </Card>

        {/* Communications Monitor */}
        <Card className="flex flex-col h-[500px]">
          <div className="p-6 border-b border-border-subtle flex items-center justify-between">
            <h3 className="font-bold flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-500" />
              Conversation Stream
            </h3>
            <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full font-bold uppercase tracking-widest animate-pulse">Live</span>
          </div>
          <div className="flex-grow overflow-y-auto">
            {recentMessages.length > 0 ? (
              <div className="divide-y divide-border-subtle/50">
                {recentMessages.map((conv) => {
                  const participants = Object.values(conv.participantDetails || {});
                  return (
                    <div key={conv.id} className="p-4 hover:bg-white/5 transition-colors group">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center -space-x-2">
                          {participants.slice(0, 2).map((p: any, i) => (
                            <img 
                              key={i} 
                              src={p.avatar} 
                              alt="" 
                              className="w-8 h-8 rounded-full border-2 border-bg-surface bg-bg-elevated"
                            />
                          ))}
                        </div>
                        <span className="text-[10px] text-text-muted">
                          {conv.updatedAt?.seconds ? format(conv.updatedAt.seconds * 1000, 'h:mm a') : 'Now'}
                        </span>
                      </div>
                      <p className="text-xs font-bold truncate">
                        {participants.map((p: any) => p.displayName).join(' & ')}
                      </p>
                      <p className="text-[11px] text-text-muted truncate mt-1 italic">
                        "{conv.lastMessage?.text || 'Conversation started'}"
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-text-muted p-12 text-center">
                <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-sm">No conversations detected.</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Data Explorer Placeholder */}
      <Card className="p-8 border-dashed border-2 border-border-subtle bg-transparent">
        <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto py-8">
          <Users className="w-12 h-12 text-brand mb-4" />
          <h3 className="text-xl font-bold mb-2">Advanced User Management</h3>
          <p className="text-sm text-text-muted mb-6">
            Search, filter, and moderate every user on the platform. Change roles, view dispute history, and manage verification badges.
          </p>
          <div className="flex gap-4">
            <Button variant="outline">Browse Users</Button>
            <Button className="bg-brand text-white">Verification Engine</Button>
          </div>
        </div>
      </Card>

      {/* Services Management Quick Link */}
      <Card className="p-8 border-dashed border-2 border-border-subtle bg-transparent">
        <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto py-8">
          <Calendar className="w-12 h-12 text-blue-500 mb-4" />
          <h3 className="text-xl font-bold mb-2">Service Moderation</h3>
          <p className="text-sm text-text-muted mb-6">
            Review new services, approve high-quality gigs, and provide feedback for rejections.
          </p>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => navigate('/dashboard/admin/services')}>Manage Services</Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
