import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Edit2, 
  ExternalLink, 
  MoreVertical,
  Loader2,
  AlertCircle,
  Download,
  Info,
  Clock,
  Archive
} from 'lucide-react';
import { Card, Button, Input } from './ui';
import { db, collection, query, orderBy, onSnapshot, doc, updateDoc, handleFirestoreError, OperationType } from '../firebase';
import { Service } from '../types';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export const AdminServiceManagement = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [rejectionModal, setRejectionModal] = useState<{ id: string, reason: string } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(collection(db, 'services'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Service));
      setServices(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'services');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      await updateDoc(doc(db, 'services', id), {
        isApproved: true,
        rejectionReason: null,
        status: 'active'
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `services/${id}`);
    }
  };

  const handleReject = async () => {
    if (!rejectionModal || !rejectionModal.reason.trim()) return;
    try {
      await updateDoc(doc(db, 'services', rejectionModal.id), {
        isApproved: false,
        rejectionReason: rejectionModal.reason,
        status: 'paused'
      });
      setRejectionModal(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `services/${rejectionModal.id}`);
    }
  };

  const filteredServices = services.filter(s => {
    const matchesSearch = s.title.toLowerCase().includes(search.toLowerCase()) || 
                         s.sellerName?.toLowerCase().includes(search.toLowerCase());
    
    if (filter === 'pending') return matchesSearch && s.isApproved === false && !s.rejectionReason;
    if (filter === 'approved') return matchesSearch && s.isApproved === true;
    if (filter === 'rejected') return matchesSearch && s.rejectionReason;
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-24">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold mb-2">Service Moderation</h1>
          <p className="text-text-muted">Review, approve, or reject gig listings from across the platform.</p>
        </div>
      </header>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <Input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search gigs or sellers..."
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all shrink-0",
                filter === f 
                  ? "bg-brand text-white shadow-lg shadow-brand/20" 
                  : "bg-bg-elevated text-text-muted hover:text-text-primary border border-border-subtle"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredServices.map((service) => (
          <Card key={service.id} className="p-6 group hover:border-brand/30 transition-all duration-300 overflow-hidden relative">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Thumbnail */}
              <div className="w-full md:w-48 aspect-video rounded-xl overflow-hidden relative shrink-0 bg-bg-elevated border border-border-subtle">
                {service.images?.[0] ? (
                  <img src={service.images[0]} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-text-muted opacity-20">
                    <Archive className="w-12 h-12" />
                  </div>
                )}
                {service.downloadUrl && (
                  <div className="absolute top-2 right-2 p-1.5 bg-black/60 backdrop-blur-md rounded-lg text-white border border-white/10 group-hover:bg-brand transition-colors">
                    <Download className="w-3 h-3" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-grow min-w-0 flex flex-col justify-between py-1">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md",
                      service.isApproved ? "bg-green-500/10 text-green-500" : 
                      service.rejectionReason ? "bg-red-500/10 text-red-500" : "bg-orange-500/10 text-orange-500"
                    )}>
                      {service.isApproved ? 'Approved' : service.rejectionReason ? 'Rejected' : 'Pending Review'}
                    </span>
                    <span className="text-[10px] text-text-muted uppercase tracking-widest font-bold border-l border-border-subtle pl-3">
                      {service.category}
                    </span>
                    {service.isFree && (
                      <span className="text-[10px] bg-brand/10 text-brand px-2 py-1 rounded-md font-bold uppercase tracking-widest">Free</span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold mb-1 truncate group-hover:text-brand transition-colors">
                    {service.title}
                  </h3>
                  <p className="text-sm text-text-muted line-clamp-1 mb-3">
                    by <span className="text-text-primary font-bold">{service.sellerName}</span> • 
                    Created {service.createdAt ? format(service.createdAt, 'MMM d, yyyy') : 'No date'}
                  </p>
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-bold text-text-primary">${service.price.toFixed(2)}</span>
                  </div>
                  {service.rejectionReason && (
                    <div className="flex items-center gap-2 text-xs text-red-400 bg-red-400/5 px-3 py-1 rounded-lg border border-red-400/10 max-w-md truncate">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span className="truncate">Reason: {service.rejectionReason}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex md:flex-col gap-2 justify-end">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-xl flex items-center gap-2"
                  onClick={() => navigate(`/dashboard/services/edit/${service.id}`)}
                >
                  <Edit2 className="w-4 h-4" /> Edit
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-xl flex items-center gap-2"
                  onClick={() => navigate(`/service/${service.id}`)}
                >
                  <ExternalLink className="w-4 h-4" /> View
                </Button>
                
                {service.isApproved ? (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="rounded-xl text-red-400 border-red-400/20 hover:bg-red-400/5"
                    onClick={() => setRejectionModal({ id: service.id, reason: '' })}
                  >
                    <XCircle className="w-4 h-4 mr-2" /> Reject
                  </Button>
                ) : (
                  <>
                    <Button 
                      size="sm" 
                      className="bg-green-500 hover:bg-green-600 text-white rounded-xl"
                      onClick={() => handleApprove(service.id)}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" /> Approve
                    </Button>
                    {!service.rejectionReason && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="rounded-xl text-red-400 border-red-400/20 hover:bg-red-400/5"
                        onClick={() => setRejectionModal({ id: service.id, reason: '' })}
                      >
                        <XCircle className="w-4 h-4 mr-2" /> Reject
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </Card>
        ))}

        {filteredServices.length === 0 && (
          <Card className="p-24 text-center border-dashed border-2">
            <Filter className="w-16 h-16 text-text-muted mx-auto mb-4 opacity-20" />
            <h3 className="text-xl font-bold mb-2">No services found</h3>
            <p className="text-text-muted">Try adjusting your search or filters.</p>
          </Card>
        )}
      </div>

      {/* Rejection Modal */}
      {rejectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="max-w-md w-full p-8 space-y-6 shadow-2xl scale-in-center overflow-hidden relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold">Reject Service</h2>
            </div>
            
            <p className="text-sm text-text-secondary leading-relaxed">
              Provide a clear reason for the seller. They will see this message as feedback to improve their listing.
            </p>
            
            <textarea 
              autoFocus
              className="w-full h-32 bg-bg-elevated border border-border-subtle rounded-2xl p-4 text-sm focus:outline-none focus:border-red-500/50 transition-all resize-none"
              placeholder="e.g., Description is too short, or images are low quality..."
              value={rejectionModal.reason}
              onChange={(e) => setRejectionModal({ ...rejectionModal, reason: e.target.value })}
            />
            
            <div className="flex gap-3 pt-4">
              <Button 
                variant="ghost" 
                className="flex-grow"
                onClick={() => setRejectionModal(null)}
              >
                Cancel
              </Button>
              <Button 
                className="flex-grow bg-red-500 hover:bg-red-600 text-white"
                disabled={!rejectionModal.reason.trim()}
                onClick={handleReject}
              >
                Reject Gig
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
