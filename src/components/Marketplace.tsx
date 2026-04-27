import React, { useEffect, useState } from 'react';
import { db, collection, query, where, getDocs, handleFirestoreError, OperationType, setDoc, doc, addDoc } from '../firebase';
import { Service } from '../types';  //import data structure of services (title, description, price, etc)
import { ServiceCard } from './ServiceCard';  //import template to display each service in a nice format (title, price, image, etc)
import { Loader2, Search, Filter, Database } from 'lucide-react';
import { Button } from './ui';

export const Marketplace: React.FC = () => {
  /* What is a 'functional component'?
  -a special type of JavaScript function that returns JSX (HTML-like code for React)
  -bc it returns JSX, it's a reusable piece of UI that takes data and displays it
  -Must start with a Capital letter
  eg. This entire file defines 'Marketplace' component which returns services (unter anderem) in a nice format
  -React.FC means it's a React Functional Component
  -export means we can import 'Marketplace' in other files (eg. App.tsx) and use it there
  */

  const [services, setServices] = useState<Service[]>([]);

  //'services' is an array of services fetched from Firestore. Initially 'services' is an empty array ([])
  //'setServices' is the function to update 'services' array
  //<Service[]> means only 'Service' objects can go in the array, where 'Service' is defined in '../types'
  //'useState' is a React hook that adds 'services' to 'Marketplace' (add state to a component)
  //when 'services' is updated (with data fetched from Firestore), the app re-renders to display the updated services.

  /* What is a 'state'?
  -data that can change over time
  -when state changes, the component re-renders to reflect the new data
  -eg. 'services' array and 'loading'
  */

  /* What is a 'hook'?
  -a special React function that lets you do more with functional components
  -eg. 'useState' and 'useEffect'
   */
  const [loading, setLoading] = useState(true); //true = data is still on the way. false = data has arrived.
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

  useEffect(() => { //As soon as this page opens, go to Firebase, grab the data, and put it in the 'services' array
    const fetchServices = async () => {
      setLoading(true);
      try {
        //Create a base query: go to database 'db', find the collection named 'services', and find services with  active status
        let q = query(collection(db, 'services'), where('status', '==', 'active')); 
        
        //Refine the query: filter by category chosen by user
        if (category !== 'All Categories') {
          q = query(q, where('category', '==', category));
        }

        //Send query to Firebase and wait to get the results
        const querySnapshot = await getDocs(q); //pulls raw Firebase data from 'services' collection
        //querySnapshot is data in Firebase format.
        
        //Turns it into a clean JacaScript array
        let fetchedServices = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service));
        //Extract 'id' and 'data' and tell TypeScript to treat it as a 'Service' type
        //In Firestore, the data (price, title) lives in one place, but the ID lives in another
        //.map() merges them into one single object so your ServiceCard knows which ID to use for links or buttons.

        //Filter to remove services that were explicitly rejected by an admin
        fetchedServices = fetchedServices.filter(s => s.isApproved !== false);
        //.filter() is a JavaScript array method that creates a new array with only the items that pass a certain condition.
        //s => means iterate through each service (s) in the fetchedServices array
        //only keep the services where 'isApproved' is not false (ie. true or undefined)
        //'isApproved' is a field/property of 'Service'

        //Logic for search by client
        if (searchQuery) { //if searchQuery not empty
          const lowerQuery = searchQuery.toLowerCase();
          fetchedServices = fetchedServices.filter(s => 
            s.title.toLowerCase().includes(lowerQuery) || 
            s.description.toLowerCase().includes(lowerQuery)
          ); //It knows 'title' and 'description' from querySnapshot.docs.map line above
             //.includes() is a JavaScript string method that checks if a string contains a certain substring. It returns true or false.
             
             //we can't search parts of a word directly in Firebase
             //to be revised and improved with semantic search
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

        /*Note: Category and searchQuery work on different sides
        Category (Server-side) happens inside the query() function. 
        We tell Firebase: "Only send me the Music Production files." 
        This saves data because the computer only downloads exactly what it needs.
        
        SearchQuery (Client-side) happens after the data is already on the user's computer. 
        We use .filter() to search through the downloaded list.
        
        Why the difference?
        Firestore (the database) is very fast at "Categories," but it isn't smart enough to search for "parts" of a word inside a sentence. 
        So, we let the database handle the category and the user's computer handle the specific text search.*/

        setServices(fetchedServices); //put the fetched services into the 'services' array via setServices function
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'services');
      } finally { //finally block runs regardless of the result (whether the try block succeeded or the catch block caught an error)
        setLoading(false); //"I'm done fetching data"
      }
    };

    fetchServices(); //fetch every time the 'category', 'sortBy', or 'searchQuery' state changes (eg. user selects a different category, sorting option, or types in the search bar)
  }, [category, sortBy, searchQuery]);

  return ( 
    /*'Marketplace' returns this JSX, which is the HTML-like code that React uses to display the UI. 
    It displays:
    1. static UI elements for search bar, category filter, and sorting options
    2. services in a 'ServiceCard' template 
    
    How does JSX switch from Spinner to Services? (Component Lifecycle)
    -Mounting: When the component first loads, the loading state is set to true. Because the JSX is a "reflection" of the state, it displays the loading spinner.
    -Updating: 
      -State Update: Inside useEffect(), the data is fetched from Firebase. Once the data arrives, the code calls setLoading(false).
      -The Trigger: In React, changing a State variable acts like a signal. It tells React: "The data has changed, you need to redraw the screen."
      -The Re-render: React executes the Marketplace function again from top to bottom.
    -Unmounting: Spinner is removed, and Service Cards are displayed because JSX evaluates the code again, loading State is now false, the "path" in the logic changes

    Follow-up Question: if Marketplace is re-rendered, wouldn't "loading" state be reset to true again?
    -Initialization vs. Persistence: The true inside useState(true) is only the initial value. It is only used the very first time the component "mounts" (appears on screen).
    -The Memory Box: When a re-render happens, React recognizes the component. Instead of restarting, it looks into its internal memory and says: 
    "I already have a value for 'loading' in my storage. It was recently changed to 'false', so I will ignore the initial 'true' and provide the current 'false' instead."*/

    <div className="max-w-7xl mx-auto px-4 py-12">
      
      {/* static UI elements, not dependent on the fetched data and "loading" state */}
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
      
      {/*"loading" logic to fetch services from db */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          {/* if loading is true, show a spinner */}
          <Loader2 className="w-8 h-8 text-brand animate-spin" />
        </div>
      ) : services.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* if loading is false (finished loading), check if there are services to display*/}
          {services.map((service) => ( //for each service in 'services' array, display a ServiceCard with its info
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
          {/* if loading is false and there are no services */}
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
