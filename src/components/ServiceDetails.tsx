import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Star, 
  Clock, 
  ShieldCheck, 
  MessageSquare, 
  Share2, 
  Heart,
  Check,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Download
} from 'lucide-react';
import { Button, Card } from './ui';
import { useAuth } from '../contexts/AuthContext';
import { db, doc, getDoc, updateDoc, arrayUnion, arrayRemove, handleFirestoreError, OperationType } from '../firebase';
import { cn } from '../lib/utils';
import { Service } from '../types';
import { getOrCreateConversation } from '../services/messagingService';
import { SellerAvatar } from './SellerAvatar';

export const ServiceDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [service, setService] = useState<Service | null>(null);
  const [seller, setSeller] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [contacting, setContacting] = useState(false);
  const isFavorited = user?.favorites?.includes(id || '');

  const [activeMedia, setActiveMedia] = useState<number>(0);
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    const fetchServiceAndSeller = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const serviceRef = doc(db, 'services', id);
        const serviceSnap = await getDoc(serviceRef);
        
        if (serviceSnap.exists()) {
          const serviceData = { id: serviceSnap.id, ...serviceSnap.data() } as Service;
          setService(serviceData);

          // Fetch seller profile
          const sellerRef = doc(db, 'seller_profiles', serviceData.sellerId);
          const sellerSnap = await getDoc(sellerRef);
          if (sellerSnap.exists()) {
            setSeller(sellerSnap.data());
          }
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `services/${id}`);
      } finally {
        setLoading(false);
      }
    };

    fetchServiceAndSeller();
  }, [id]);

  const toggleFavorite = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!id) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        favorites: isFavorited ? arrayRemove(id) : arrayUnion(id)
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleContactSeller = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!seller || !service) return;

    // Don't message yourself
    if (seller.uid === user.uid) return;

    setContacting(true);
    try {
      const conversationId = await getOrCreateConversation(user, seller);
      navigate('/messages', { state: { activeId: conversationId } });
    } catch (error) {
      console.error('Error starting conversation:', error);
    } finally {
      setContacting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <h2 className="text-3xl font-display font-bold mb-4">Service Not Found</h2>
        <Link to="/marketplace" className="text-brand hover:underline">Return to Marketplace</Link>
      </div>
    );
  }

  const sellerName = seller?.displayName || seller?.name || "Professional Seller";
  const sellerAvatar = seller?.avatar || seller?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${sellerName}`;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Link to="/marketplace" className="inline-flex items-center gap-2 text-text-secondary hover:text-brand mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Marketplace
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left Column: Content */}
        <div className="lg:col-span-2">
          {/* Media Gallery */}
          <div className="space-y-4 mb-8">
            <div className="aspect-video rounded-3xl overflow-hidden bg-black border border-border-subtle relative group">
              {showVideo && service.videoUrl ? (
                <video 
                  src={service.videoUrl} 
                  className="w-full h-full object-contain" 
                  controls 
                  autoPlay
                />
              ) : (
                <img 
                  src={service.images?.[activeMedia] || `https://picsum.photos/seed/${service.id}/800/600`} 
                  alt={service.title} 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer" 
                />
              )}
            </div>
            
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {service.videoUrl && (
                <button 
                  onClick={() => setShowVideo(true)}
                  className={cn(
                    "w-24 aspect-video rounded-xl overflow-hidden border-2 shrink-0 relative flex items-center justify-center bg-black",
                    showVideo ? "border-brand" : "border-transparent hover:border-brand/50"
                  )}
                >
                  <video src={service.videoUrl} className="w-full h-full object-cover opacity-50" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-brand/80 flex items-center justify-center text-white">
                      <Loader2 className="w-4 h-4" /> {/* Placeholder for Play icon if I had one, but I'll use Loader2 or just text */}
                    </div>
                  </div>
                </button>
              )}
              {service.images?.map((img, idx) => (
                <button 
                  key={idx}
                  onClick={() => {
                    setActiveMedia(idx);
                    setShowVideo(false);
                  }}
                  className={cn(
                    "w-24 aspect-video rounded-xl overflow-hidden border-2 shrink-0",
                    (!showVideo && activeMedia === idx) ? "border-brand" : "border-transparent hover:border-brand/50"
                  )}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl font-display font-bold mb-6 leading-tight">
            {service.title}
          </h1>

          <div className="flex items-center gap-6 mb-8 py-6 border-y border-border-subtle">
            <div 
              className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                if (seller?.slug) {
                  navigate(`/seller/${seller.slug}`);
                }
              }}
            >
              <SellerAvatar 
                sellerId={service.sellerId} 
                sellerName={sellerName}
                fallbackAvatar={sellerAvatar}
                className="w-12 h-12"
              />
              <div>
                <p className="font-bold hover:text-brand transition-colors flex items-center gap-2">
                  {sellerName}
                  {seller?.verified && <CheckCircle2 className="w-4 h-4 text-brand" />}
                </p>
                <div className="flex items-center gap-1 text-xs text-text-muted">
                  <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                  <span className="text-text-primary font-bold">{seller?.rating || 5.0}</span>
                  <span>({seller?.reviewsCount || 0} reviews)</span>
                </div>
              </div>
            </div>
            <div className="h-10 w-px bg-border-subtle" />
            <div>
              <p className="text-xs text-text-muted uppercase font-bold tracking-wider mb-1">Seller Since</p>
              <p className="text-sm font-medium">{seller?.joinedAt ? new Date(seller.joinedAt).toLocaleDateString() : "2022"}</p>
            </div>
          </div>

          <div className="prose prose-invert max-w-none">
            <h3 className="text-xl font-bold mb-4">About this service</h3>
            <p className="text-text-secondary whitespace-pre-line leading-relaxed">
              {service.description}
            </p>
          </div>
        </div>

        {/* Right Column: Sidebar */}
        <div className="space-y-6">
          <Card className="p-8 sticky top-24">
            <div className="flex items-center justify-between mb-6">
              <span className="text-text-secondary font-medium">Standard Package</span>
              <span className="text-3xl font-display font-bold text-brand">
                {service.isFree ? 'FREE' : `$${service.price.toFixed(2)}`}
              </span>
            </div>

            <div className="space-y-4 mb-8">
              {/* Features could be added to the service model later */}
              <div className="flex items-center gap-3 text-sm text-text-secondary">
                <Check className="w-4 h-4 text-green-500" />
                Professional Quality
              </div>
              <div className="flex items-center gap-3 text-sm text-text-secondary">
                <Check className="w-4 h-4 text-green-500" />
                Commercial Use License
              </div>
              <div className="flex items-center gap-3 text-sm text-text-secondary">
                <Check className="w-4 h-4 text-green-500" />
                High Quality Files
              </div>
            </div>

            {service.downloadUrl && (service.isFree || service.sellerId === user?.uid) ? (
              <a 
                href={service.downloadUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full"
              >
                <Button className="w-full py-4 text-lg mb-4 bg-green-500 hover:bg-green-600 text-white flex items-center justify-center gap-2">
                  <Download className="w-5 h-5" />
                  Instant Download
                </Button>
              </a>
            ) : (
              <Button className="w-full py-4 text-lg mb-4">
                {service.isFree ? 'Get Free Access' : 'Continue to Checkout'}
              </Button>
            )}
            
            <Button 
              variant="outline" 
              className="w-full py-4 flex items-center justify-center gap-2"
              onClick={handleContactSeller}
              disabled={contacting || seller?.uid === user?.uid}
            >
              {contacting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <MessageSquare className="w-5 h-5" />
                  Contact Seller
                </>
              )}
            </Button>

            <div className="mt-6 flex items-center justify-center gap-6 text-text-muted">
              <button 
                onClick={toggleFavorite}
                className={cn(
                  "flex items-center gap-2 transition-colors text-xs font-bold uppercase tracking-widest",
                  isFavorited ? "text-brand" : "hover:text-brand"
                )}
              >
                <Heart className={cn("w-4 h-4", isFavorited && "fill-brand")} />
                {isFavorited ? 'Saved' : 'Save'}
              </button>
              <button className="flex items-center gap-2 hover:text-brand transition-colors text-xs font-bold uppercase tracking-widest">
                <Share2 className="w-4 h-4" />
                Share
              </button>
            </div>
          </Card>

          <Card className="p-6 bg-brand/5 border-brand/20">
            <div className="flex gap-4">
              <ShieldCheck className="w-6 h-6 text-brand shrink-0" />
              <div>
                <h4 className="font-bold text-sm mb-1">Indiy Protection</h4>
                <p className="text-xs text-text-secondary">Your payment is held in escrow until you approve the final delivery.</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
