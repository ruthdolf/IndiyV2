import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, MessageSquare, Share2, MapPin, Calendar, CheckCircle2, ArrowLeft, ShieldCheck, Loader2 } from 'lucide-react';
import { Button, Card } from './ui';
import { ServiceCard } from './ServiceCard';
import { cn } from '../lib/utils';
import { db, collection, query, where, getDocs, doc, updateDoc, handleFirestoreError, OperationType, getDoc } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { getOrCreateConversation } from '../services/messagingService';
import { SellerAvatar } from './SellerAvatar';

export const SellerProfile = () => {
  const { sellerId } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [seller, setSeller] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [contacting, setContacting] = useState(false);

  useEffect(() => {
    const fetchSellerAndServices = async () => {
      setLoading(true);
      try {
        // 1. Fetch Seller Profile
        const q = query(collection(db, 'seller_profiles'), where('slug', '==', sellerId));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const sellerData = querySnapshot.docs[0].data();
          setSeller(sellerData);

          // 2. Fetch Services for this seller
          const servicesQ = query(
            collection(db, 'services'), 
            where('sellerId', '==', sellerData.uid),
            where('status', '==', 'active')
          );
          const servicesSnapshot = await getDocs(servicesQ);
          setServices(servicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } else {
          // Fallback to mock data if not found in Firestore (for existing mock sellers)
          const mockSeller = {
            uid: 'mock-uid',
            name: sellerId?.replace(/_/g, ' ') || "Creative Studio",
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${sellerId}`,
            bio: "Professional digital creator with over 10 years of experience in music production and sound design. I've worked with top-tier artists and brands to deliver high-quality audio solutions. My goal is to help you bring your creative vision to life with precision and passion.",
            location: "Los Angeles, CA",
            joined: "January 2022",
            rating: 4.9,
            reviewsCount: 1240,
            servicesCount: 12,
            completedOrders: 2500,
            skills: ["Music Production", "Mixing", "Mastering", "Sound Design", "Vocal Tuning"],
            languages: ["English (Native)", "Spanish (Fluent)"],
            verified: false,
            slug: sellerId
          };
          setSeller(mockSeller);
          
          // Mock services
          setServices([1, 2, 3].map(i => ({
            id: `service-${i}`,
            title: `Professional Service ${i} from ${mockSeller.name}`,
            sellerName: mockSeller.name,
            price: 49.99 + i * 20,
            rating: 4.9,
            reviews: 120,
            images: [`https://picsum.photos/seed/service-${i}/800/600`],
            category: "Digital"
          })));
        }
      } catch (error) {
        console.error("Error fetching seller:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSellerAndServices();
  }, [sellerId]);

  const handleVerify = async (status: boolean) => {
    if (!seller?.uid || seller.uid === 'mock-uid') return;
    setUpdating(true);
    try {
      const sellerRef = doc(db, 'seller_profiles', seller.uid);
      await updateDoc(sellerRef, { verified: status });
      setSeller({ ...seller, verified: status });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `seller_profiles/${seller.uid}`);
    } finally {
      setUpdating(false);
    }
  };

  const handleContactMe = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    if (!seller) return;

    // Don't message yourself
    if (seller.uid === currentUser.uid) return;

    setContacting(true);
    try {
      const conversationId = await getOrCreateConversation(currentUser, seller);
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

  if (!seller) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <h2 className="text-3xl font-display font-bold mb-4">Seller Not Found</h2>
        <Link to="/marketplace" className="text-brand hover:underline">Return to Marketplace</Link>
      </div>
    );
  }

  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Link to="/marketplace" className="inline-flex items-center gap-2 text-text-secondary hover:text-brand mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Marketplace
      </Link>

      {/* Admin Verification Banner */}
      {isAdmin && (
        <Card className="mb-8 p-6 bg-blue-500/10 border-blue-500/30 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/20 rounded-2xl">
              <ShieldCheck className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Admin Verification Panel</h3>
              <p className="text-sm text-text-secondary">Review this seller's profile and credentials for verification.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {seller.verified ? (
              <Button 
                variant="outline" 
                className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                onClick={() => handleVerify(false)}
                isLoading={updating}
              >
                Revoke Verification
              </Button>
            ) : (
              <Button 
                className="bg-blue-500 hover:bg-blue-600 text-white shadow-blue-500/20"
                onClick={() => handleVerify(true)}
                isLoading={updating}
              >
                Approve Verification
              </Button>
            )}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        {/* Left Sidebar: Seller Info */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="p-8 text-center">
            <div className="relative inline-block mb-6">
              <SellerAvatar 
                sellerId={seller.uid} 
                sellerName={seller.displayName || seller.name}
                fallbackAvatar={seller.avatar || seller.photoURL}
                className="w-32 h-32 mx-auto"
              />
              <div className={cn(
                "absolute bottom-1 right-1 w-6 h-6 border-4 border-bg-surface rounded-full",
                seller.verified ? "bg-brand" : "bg-gray-500"
              )} />
            </div>
            
            <h1 className="text-2xl font-display font-bold mb-2 flex items-center justify-center gap-2">
              {seller.displayName || seller.name}
              {seller.verified && <CheckCircle2 className="w-5 h-5 text-brand" />}
            </h1>
            
            <div className="flex items-center justify-center gap-1 mb-6">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span className="font-bold">{seller.rating}</span>
              <span className="text-text-muted">({seller.reviewsCount} reviews)</span>
            </div>

            {seller.verified && (
              <div className="mb-6 px-4 py-2 rounded-xl bg-brand/10 border border-brand/20 text-brand text-xs font-bold flex items-center justify-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                VERIFIED SELLER
              </div>
            )}

            <div className="space-y-4 pt-6 border-t border-border-subtle">
              <Button 
                className="w-full py-3" 
                onClick={handleContactMe}
                disabled={contacting || seller.uid === currentUser?.uid}
              >
                {contacting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Contact Me"}
              </Button>
              <Button variant="outline" className="w-full py-3 flex items-center justify-center gap-2">
                <Share2 className="w-4 h-4" />
                Share Profile
              </Button>
            </div>

            <div className="mt-8 space-y-4 text-left">
              <div className="flex items-center gap-3 text-sm text-text-secondary">
                <MapPin className="w-4 h-4" />
                {seller.location || "Global"}
              </div>
              <div className="flex items-center gap-3 text-sm text-text-secondary">
                <Calendar className="w-4 h-4" />
                Member since {seller.joined || (seller.joinedAt ? new Date(seller.joinedAt).toLocaleDateString() : "2022")}
              </div>
            </div>
          </Card>

          {seller.skills && (
            <Card className="p-6">
              <h3 className="font-bold mb-4 uppercase text-xs tracking-widest text-text-muted">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {seller.skills.map((skill: string) => (
                  <span key={skill} className="px-3 py-1 rounded-full bg-bg-elevated text-xs border border-border-subtle">
                    {skill}
                  </span>
                ))}
              </div>
            </Card>
          )}

          {seller.languages && (
            <Card className="p-6">
              <h3 className="font-bold mb-4 uppercase text-xs tracking-widest text-text-muted">Languages</h3>
              <div className="space-y-2">
                {seller.languages.map((lang: string) => (
                  <p key={lang} className="text-sm text-text-secondary">{lang}</p>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right Column: Bio, Services, Reviews */}
        <div className="lg:col-span-3 space-y-12">
          <section>
            <h2 className="text-2xl font-display font-bold mb-6">About Me</h2>
            <p className="text-text-secondary leading-relaxed whitespace-pre-line">
              {seller.bio}
            </p>
          </section>

          <section>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-display font-bold">My Services</h2>
              <span className="text-text-muted text-sm">{seller.servicesCount || 0} services total</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {services.length > 0 ? (
                services.map(service => (
                  <ServiceCard 
                    key={service.id}
                    id={service.id}
                    sellerId={service.sellerId}
                    title={service.title}
                    sellerName={seller.displayName || seller.name}
                    sellerAvatar={seller.avatar || seller.photoURL}
                    price={service.price}
                    rating={service.rating || 5.0}
                    reviews={service.reviewsCount || 0}
                    images={service.images || []}
                    category={service.category}
                  />
                ))
              ) : (
                <div className="col-span-2 py-12 text-center bg-bg-elevated rounded-3xl border border-dashed border-border-subtle">
                  <p className="text-text-muted">No active services found for this seller.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
