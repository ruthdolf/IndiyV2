import React, { useEffect, useState } from 'react';
import { db, collection, query, where, getDocs, handleFirestoreError, OperationType, setDoc, doc, addDoc } from '../firebase';
import { Service } from '../types';
import { ServiceCard } from './ServiceCard';
import { Loader2, Search, Filter, Database } from 'lucide-react';
import { Button } from './ui';

export const Marketplace: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All Categories');
  const [sortBy, setSortBy] = useState('Newest');
  const [searchQuery, setSearchQuery] = useState('');

  const [isSeeding, setIsSeeding] = useState(false);

  const handleSeedData = async () => {
    if (!window.confirm('This will add 4 dummy sellers and 8 dummy services to your database. Continue?')) return;
    
    setIsSeeding(true);
    try {
      const dummySellers = [
        {
          uid: 'dummy_seller_1',
          displayName: 'Alex Rivera',
          email: 'alex@example.com',
          avatar: 'https://picsum.photos/seed/alex/200',
          bio: 'Digital artist with 10+ years of experience in character design and concept art.',
          skills: ['Digital Art', 'Illustration', 'Concept Art'],
          slug: 'alex-rivera',
          verified: true,
          joinedAt: Date.now() - 1000 * 60 * 60 * 24 * 30,
          role: 'seller',
          profileComplete: true
        },
        {
          uid: 'dummy_seller_2',
          displayName: 'Sarah Chen',
          email: 'sarah@example.com',
          avatar: 'https://picsum.photos/seed/sarah/200',
          bio: 'Full stack developer specializing in React, Node.js, and scalable cloud architectures.',
          skills: ['React', 'Node.js', 'Firebase', 'TypeScript'],
          slug: 'sarah-chen',
          verified: true,
          joinedAt: Date.now() - 1000 * 60 * 60 * 24 * 60,
          role: 'seller',
          profileComplete: true
        },
        {
          uid: 'dummy_seller_3',
          displayName: 'Marcus Thorne',
          email: 'marcus@example.com',
          avatar: 'https://picsum.photos/seed/marcus/200',
          bio: 'Professional video editor and motion graphics designer for top-tier YouTube creators.',
          skills: ['Video Editing', 'After Effects', 'Premiere Pro'],
          slug: 'marcus-thorne',
          verified: false,
          joinedAt: Date.now() - 1000 * 60 * 60 * 24 * 15,
          role: 'seller',
          profileComplete: true
        },
        {
          uid: 'dummy_seller_4',
          displayName: 'Elena Vance',
          email: 'elena@example.com',
          avatar: 'https://picsum.photos/seed/elena/200',
          bio: 'UI/UX designer focused on creating intuitive and beautiful mobile experiences.',
          skills: ['UI Design', 'UX Research', 'Figma', 'Prototyping'],
          slug: 'elena-vance',
          verified: true,
          joinedAt: Date.now() - 1000 * 60 * 60 * 24 * 45,
          role: 'seller',
          profileComplete: true
        }
      ];

      const dummyServices = [
        {
          sellerId: 'dummy_seller_1',
          sellerName: 'Alex Rivera',
          sellerVerified: true,
          title: 'Custom Digital Portrait Illustration',
          description: 'I will create a high-quality digital portrait based on your photo. Perfect for gifts, social media profiles, or personal branding. Includes 2 revisions and high-res files.',
          price: 85,
          category: 'Graphics & Design',
          images: ['https://picsum.photos/seed/portrait1/800/600', 'https://picsum.photos/seed/portrait2/800/600'],
          status: 'active',
          isApproved: true,
          createdAt: Date.now()
        },
        {
          sellerId: 'dummy_seller_1',
          sellerName: 'Alex Rivera',
          sellerVerified: true,
          title: 'Character Concept Art for Games',
          description: 'Professional character concept art including front/back views and expression sheets. Tailored for indie game developers and writers.',
          price: 150,
          category: 'Graphics & Design',
          images: ['https://picsum.photos/seed/concept1/800/600', 'https://picsum.photos/seed/concept2/800/600'],
          status: 'active',
          isApproved: true,
          createdAt: Date.now()
        },
        {
          sellerId: 'dummy_seller_2',
          sellerName: 'Sarah Chen',
          sellerVerified: true,
          title: 'Full Stack React & Node.js Web App',
          description: 'I will build a complete, production-ready web application using the MERN stack or React/Firebase. Includes responsive design and basic SEO.',
          price: 1200,
          category: 'Programming & Tech',
          images: ['https://picsum.photos/seed/web1/800/600', 'https://picsum.photos/seed/web2/800/600'],
          status: 'active',
          isApproved: true,
          createdAt: Date.now()
        },
        {
          sellerId: 'dummy_seller_2',
          sellerName: 'Sarah Chen',
          sellerVerified: true,
          title: 'Custom API Integration & Development',
          description: 'Need to connect your app to Stripe, Twilio, or Google Maps? I provide seamless API integrations and custom backend logic.',
          price: 350,
          category: 'Programming & Tech',
          images: ['https://picsum.photos/seed/api1/800/600'],
          status: 'active',
          isApproved: true,
          createdAt: Date.now()
        },
        {
          sellerId: 'dummy_seller_3',
          sellerName: 'Marcus Thorne',
          sellerVerified: false,
          title: 'Professional YouTube Video Editing',
          description: 'High-energy editing with transitions, sound design, and color grading. I specialize in gaming, lifestyle, and educational content.',
          price: 120,
          category: 'Video & Animation',
          images: ['https://picsum.photos/seed/video1/800/600'],
          status: 'active',
          isApproved: true,
          createdAt: Date.now()
        },
        {
          sellerId: 'dummy_seller_3',
          sellerName: 'Marcus Thorne',
          sellerVerified: false,
          title: 'Custom Motion Graphics Intro/Outro',
          description: 'Eye-catching 2D or 3D motion graphics for your brand. 5-10 seconds long, perfectly synced with your music.',
          price: 200,
          category: 'Video & Animation',
          images: ['https://picsum.photos/seed/motion1/800/600'],
          status: 'active',
          isApproved: true,
          createdAt: Date.now()
        },
        {
          sellerId: 'dummy_seller_4',
          sellerName: 'Elena Vance',
          sellerVerified: true,
          title: 'Mobile App UI/UX Design (Figma)',
          description: 'Complete UI design for your mobile app (iOS/Android). Includes user flow mapping, wireframes, and high-fidelity prototypes.',
          price: 600,
          category: 'Graphics & Design',
          images: ['https://picsum.photos/seed/ui1/800/600', 'https://picsum.photos/seed/ui2/800/600'],
          status: 'active',
          isApproved: true,
          createdAt: Date.now()
        },
        {
          sellerId: 'dummy_seller_4',
          sellerName: 'Elena Vance',
          sellerVerified: true,
          title: 'Modern Website Landing Page Design',
          description: 'Conversion-focused landing page design. I focus on clean aesthetics and clear call-to-actions to help your business grow.',
          price: 450,
          category: 'Graphics & Design',
          images: ['https://picsum.photos/seed/landing1/800/600'],
          status: 'active',
          isApproved: true,
          createdAt: Date.now()
        }
      ];

      for (const seller of dummySellers) {
        const { uid, ...sellerData } = seller;
        await setDoc(doc(db, 'users', uid), {
          uid,
          displayName: sellerData.displayName,
          email: sellerData.email,
          avatar: sellerData.avatar,
          role: sellerData.role,
          profileComplete: sellerData.profileComplete,
          createdAt: sellerData.joinedAt
        }, { merge: true });
        // Pass the full seller object to include uid
        await setDoc(doc(db, 'seller_profiles', uid), seller, { merge: true });
      }

      for (const service of dummyServices) {
        const serviceRef = doc(collection(db, 'services'));
        await setDoc(serviceRef, {
          ...service,
          id: serviceRef.id
        });
      }

      alert('Dummy data seeded successfully!');
      window.location.reload();
    } catch (error) {
      console.error('Error seeding data:', error);
      alert('Failed to seed dummy data.');
    } finally {
      setIsSeeding(false);
    }
  };

  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      try {
        let q = query(collection(db, 'services'), where('status', '==', 'active'));
        
        if (category !== 'All Categories') {
          q = query(q, where('category', '==', category));
        }

        const querySnapshot = await getDocs(q);
        let fetchedServices = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service));

        // filter approved only (allowing undefined for older services)
        fetchedServices = fetchedServices.filter(s => s.isApproved !== false);

        // Client-side filtering for search query (Firestore doesn't support full-text search natively without third-party)
        if (searchQuery) {
          const lowerQuery = searchQuery.toLowerCase();
          fetchedServices = fetchedServices.filter(s => 
            s.title.toLowerCase().includes(lowerQuery) || 
            s.description.toLowerCase().includes(lowerQuery)
          );
        }

        // Client-side sorting
        if (sortBy === 'Price: Low to High') {
          fetchedServices.sort((a, b) => a.price - b.price);
        } else if (sortBy === 'Price: High to Low') {
          fetchedServices.sort((a, b) => b.price - a.price);
        } else if (sortBy === 'Top Rated') {
          fetchedServices.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        } else {
          // Newest
          fetchedServices.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        }

        setServices(fetchedServices);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'services');
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [category, sortBy, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-display font-bold mb-2 tracking-tight">Marketplace</h1>
          <p className="text-text-muted">Discover the best digital services from top-tier creators.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input 
              type="text"
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-bg-elevated border border-border-subtle rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-brand/50 w-64"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-text-muted" />
            <select 
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-bg-elevated border border-border-subtle rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand/50"
            >
              <option>All Categories</option>
              <option>Music Production</option>
              <option>Mixing & Mastering</option>
              <option>Vocal Services</option>
              <option>Graphic Design</option>
              <option>Video Editing</option>
              <option>Marketing</option>
            </select>
          </div>
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-bg-elevated border border-border-subtle rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand/50"
          >
            <option>Sort by: Newest</option>
            <option>Price: Low to High</option>
            <option>Price: High to Low</option>
            <option>Top Rated</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-brand animate-spin" />
        </div>
      ) : services.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((service) => (
            <ServiceCard
              key={service.id}
              id={service.id}
              sellerId={service.sellerId}
              title={service.title}
              sellerName={service.sellerName || "Professional Seller"}
              sellerAvatar={service.sellerAvatar}
              price={service.price}
              rating={service.rating || 5.0}
              reviews={service.reviewsCount || 0}
              images={service.images || []}
              category={service.category}
              isFree={service.isFree}
              downloadUrl={service.downloadUrl}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-bg-elevated rounded-[3rem] border border-dashed border-border-subtle flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6">
            <Database className="w-8 h-8 text-text-muted" />
          </div>
          <h3 className="text-xl font-bold mb-2">No services found</h3>
          <p className="text-text-muted mb-8 max-w-md mx-auto">Try adjusting your filters or search query. If you're an admin, you can seed the marketplace with dummy data.</p>
          
          <Button 
            variant="outline" 
            onClick={handleSeedData} 
            isLoading={isSeeding}
            className="border-brand/30 text-brand hover:bg-brand/10"
          >
            Seed Dummy Data
          </Button>
        </div>
      )}
    </div>
  );
};
