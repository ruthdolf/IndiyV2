import React, { useState, useEffect } from 'react';
import { db, collection, query, where, onSnapshot, doc, updateDoc, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Order } from '../types';
import { Card } from './ui';
import { ShoppingBag, CheckCircle, Clock, AlertCircle, MessageSquare, MoreVertical } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

export const SellerOrders: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'orders'), where('sellerId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      setOrders(ordersData.sort((a, b) => b.createdAt - a.createdAt));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'orders');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'active': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'completed': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'disputed': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'cancelled': return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  if (loading) return <div className="p-20 text-center">Loading your orders...</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold mb-2">Orders</h1>
        <p className="text-text-muted">Manage your active projects and track your sales history.</p>
      </div>

      {orders.length === 0 ? (
        <Card className="p-20 text-center flex flex-col items-center justify-center border-dashed border-2">
          <div className="w-20 h-20 rounded-full bg-bg-elevated flex items-center justify-center mb-6">
            <ShoppingBag className="w-10 h-10 text-text-muted" />
          </div>
          <h3 className="text-xl font-bold mb-2">No orders yet</h3>
          <p className="text-text-muted mb-8 max-w-md mx-auto">
            When buyers purchase your services, they will appear here. Keep up the great work!
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id} className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-bg-elevated flex items-center justify-center">
                    <ShoppingBag className="w-6 h-6 text-brand" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Order #{order.id.slice(-6).toUpperCase()}</h3>
                    <p className="text-xs text-text-muted">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="flex-grow md:px-8">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border",
                      getStatusColor(order.status)
                    )}>
                      {order.status}
                    </span>
                    <span className="text-xs text-text-muted">•</span>
                    <span className="text-xs font-bold text-brand">${order.amount}</span>
                  </div>
                  <p className="text-sm text-text-secondary">Service ID: {order.serviceId}</p>
                </div>

                <div className="flex items-center gap-3">
                  <Link 
                    to={`/dashboard/messages?chat=${order.buyerId}`}
                    className="p-3 rounded-xl bg-bg-elevated hover:bg-white/5 border border-border-subtle transition-all"
                    title="Message Buyer"
                  >
                    <MessageSquare className="w-5 h-5 text-text-muted" />
                  </Link>
                  
                  {order.status === 'pending' && (
                    <button 
                      onClick={() => updateOrderStatus(order.id, 'active')}
                      className="px-4 py-2 bg-brand hover:bg-brand-hover text-white rounded-xl text-sm font-bold transition-all"
                    >
                      Accept Order
                    </button>
                  )}
                  
                  {order.status === 'active' && (
                    <button 
                      onClick={() => updateOrderStatus(order.id, 'completed')}
                      className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-bold transition-all"
                    >
                      Mark Completed
                    </button>
                  )}

                  <button className="p-3 rounded-xl bg-bg-elevated hover:bg-white/5 border border-border-subtle transition-all">
                    <MoreVertical className="w-5 h-5 text-text-muted" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
