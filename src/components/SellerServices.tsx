import React, { useState, useEffect } from 'react';
import { db, collection, query, where, onSnapshot, doc, deleteDoc, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Service } from '../types';
import { Card } from './ui';
import { Plus, Edit2, Trash2, Eye, MoreVertical, Package } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

export const SellerServices: React.FC = () => {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'services'), where('sellerId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const servicesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service));
      setServices(servicesData.filter(s => s.status !== 'deleted'));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'services');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleDelete = async (serviceId: string) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return;
    try {
      await deleteDoc(doc(db, 'services', serviceId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `services/${serviceId}`);
    }
  };

  if (loading) return <div className="p-20 text-center">Loading your services...</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold mb-2">My Services</h1>
          <p className="text-text-muted">Manage your service listings and track their performance.</p>
        </div>
        <Link 
          to="/dashboard/services/create"
          className="bg-brand hover:bg-brand-hover text-white px-6 py-3 rounded-full font-bold flex items-center gap-2 transition-all shadow-lg shadow-brand/20"
        >
          <Plus className="w-5 h-5" />
          Create New Service
        </Link>
      </div>

      {services.length === 0 ? (
        <Card className="p-20 text-center flex flex-col items-center justify-center border-dashed border-2">
          <div className="w-20 h-20 rounded-full bg-bg-elevated flex items-center justify-center mb-6">
            <Package className="w-10 h-10 text-text-muted" />
          </div>
          <h3 className="text-xl font-bold mb-2">No services yet</h3>
          <p className="text-text-muted mb-8 max-w-md mx-auto">
            You haven't created any services yet. Start selling your music skills to the world!
          </p>
          <Link 
            to="/dashboard/services/create"
            className="bg-brand hover:bg-brand-hover text-white px-8 py-3 rounded-full font-bold transition-all"
          >
            Create Your First Service
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <Card key={service.id} className="overflow-hidden group">
              <div className="aspect-video relative overflow-hidden bg-bg-elevated">
                {service.images?.[0] ? (
                  <img 
                    src={service.images[0]} 
                    alt={service.title}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-12 h-12 text-text-muted opacity-20" />
                  </div>
                )}
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => navigate(`/dashboard/services/edit/${service.id}`)}
                    className="p-2 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-brand transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(service.id)}
                    className="p-2 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="absolute bottom-4 left-4">
                  <span className={cn(
                    "px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest",
                    service.status === 'active' ? "bg-green-500 text-white" : "bg-orange-500 text-white"
                  )}>
                    {service.status}
                  </span>
                </div>
              </div>
              <div className="p-6">
                <h3 className="font-bold text-lg mb-2 line-clamp-1">{service.title}</h3>
                <p className="text-text-muted text-sm mb-4 line-clamp-2">{service.description}</p>
                <div className="flex items-center justify-between pt-4 border-t border-border-subtle">
                  <div className="text-xl font-display font-bold text-brand">${service.price}</div>
                  <div className="flex items-center gap-4">
                    <Link 
                      to={`/service/${service.id}`}
                      className="text-text-muted hover:text-text-primary transition-colors flex items-center gap-1 text-xs font-bold uppercase tracking-widest"
                    >
                      <Eye className="w-4 h-4" /> View
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
