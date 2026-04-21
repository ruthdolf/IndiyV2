import React, { useState, useEffect } from 'react';
import { db, collection, query, where, onSnapshot, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Order, Service } from '../types';
import { Card } from './ui';
import { TrendingUp, Users, ShoppingCart, DollarSign, BarChart3, Star, Clock, ArrowUpRight } from 'lucide-react';
import { cn } from '../lib/utils';

export const SellerAnalytics: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const ordersQ = query(collection(db, 'orders'), where('sellerId', '==', user.uid));
    const servicesQ = query(collection(db, 'services'), where('sellerId', '==', user.uid));

    const unsubscribeOrders = onSnapshot(ordersQ, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
    });

    const unsubscribeServices = onSnapshot(servicesQ, (snapshot) => {
      setServices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service)));
      setLoading(false);
    });

    return () => {
      unsubscribeOrders();
      unsubscribeServices();
    };
  }, [user]);

  const totalEarnings = orders.filter(o => o.status === 'completed').reduce((acc, o) => acc + o.amount, 0);
  const activeOrders = orders.filter(o => o.status === 'active' || o.status === 'pending').length;
  const completedOrders = orders.filter(o => o.status === 'completed').length;
  const totalServices = services.length;

  const stats = [
    { label: 'Total Earnings', value: `$${totalEarnings.toLocaleString()}`, icon: DollarSign, color: 'text-green-500', trend: '+12.5%' },
    { label: 'Active Orders', value: activeOrders.toString(), icon: ShoppingCart, color: 'text-blue-500', trend: '+2' },
    { label: 'Total Services', value: totalServices.toString(), icon: BarChart3, color: 'text-brand', trend: '+1' },
    { label: 'Avg. Rating', value: '4.9', icon: Star, color: 'text-yellow-500', trend: '0.0' },
  ];

  if (loading) return <div className="p-20 text-center">Loading analytics...</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold mb-2">Analytics</h1>
        <p className="text-text-muted">Track your performance and see how your services are growing.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={cn("p-3 rounded-2xl bg-white/5", stat.color)}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-full">
                <ArrowUpRight className="w-3 h-3" />
                {stat.trend}
              </div>
            </div>
            <p className="text-text-muted text-xs uppercase tracking-widest font-bold mb-1">{stat.label}</p>
            <h3 className="text-2xl font-display font-bold">{stat.value}</h3>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-8">
          <h3 className="text-xl font-bold mb-6">Earnings Overview</h3>
          <div className="h-64 flex items-end justify-between gap-2">
            {[40, 60, 45, 80, 55, 90, 75].map((height, i) => (
              <div key={i} className="flex-grow group relative">
                <div 
                  className="w-full bg-brand/20 group-hover:bg-brand transition-all rounded-t-lg" 
                  style={{ height: `${height}%` }}
                />
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-bg-elevated border border-border-subtle px-2 py-1 rounded text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                  ${(height * 10).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-4 text-[10px] font-bold uppercase tracking-widest text-text-muted">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>
        </Card>

        <Card className="p-8">
          <h3 className="text-xl font-bold mb-6">Service Performance</h3>
          <div className="space-y-6">
            {services.slice(0, 4).map((service, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-bg-elevated flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-text-muted" />
                  </div>
                  <div>
                    <p className="text-sm font-bold line-clamp-1">{service.title}</p>
                    <p className="text-xs text-text-muted">12 sales this month</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-brand">$450.00</p>
                  <p className="text-[10px] text-green-500 font-bold">+15%</p>
                </div>
              </div>
            ))}
            {services.length === 0 && (
              <div className="p-12 text-center text-text-muted italic text-sm">
                No services to analyze yet.
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
