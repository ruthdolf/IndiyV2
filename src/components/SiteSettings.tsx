import React from 'react';
import { Card, Button, Input } from './ui';
import { Upload, Image as ImageIcon, CheckCircle2, AlertCircle, Info, Loader2 } from 'lucide-react';
import { db, storage, ref, uploadBytes, uploadString, uploadBytesResumable, getDownloadURL, doc, setDoc, getDoc, collection, addDoc, handleFirestoreError, OperationType } from '../firebase';
import imageCompression from 'browser-image-compression';

export const SiteSettings: React.FC = () => {
  const [loading, setLoading] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [logoUrl, setLogoUrl] = React.useState<string | null>(null);
  const [siteName, setSiteName] = React.useState('');
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'site'));
        if (settingsDoc.exists()) {
          const data = settingsDoc.data();
          setLogoUrl(data.logoUrl || null);
          setSiteName(data.siteName || '');
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic validation
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (PNG, JPG, SVG).');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      // 1. Compress image
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 800,
        useWebWorker: false,
      };
      
      console.log('Compressing logo...');
      let fileToUpload: File | Blob = file;
      try {
        fileToUpload = await imageCompression(file, options);
        console.log('Logo compressed');
      } catch (compressErr) {
        console.warn('Compression failed, using original file:', compressErr);
      }

      // 2. Convert to base64 (more reliable in some iframe environments)
      console.log('Converting to base64...');
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(fileToUpload);
      });
      const base64Data = await base64Promise;
      console.log('Base64 conversion complete');

      // 3. Upload to Firebase Storage using uploadString
      const storageRef = ref(storage, `site/logo_${Date.now()}`);
      console.log('Starting upload to:', storageRef.fullPath);
      
      setUploadProgress(10);
      
      // Extract base64 part
      const base64String = base64Data.split(',')[1];
      const metadata = { contentType: fileToUpload.type };
      
      await uploadString(storageRef, base64String, 'base64', metadata);
      console.log('Upload complete');
      setUploadProgress(100);
      
      const url = await getDownloadURL(storageRef);
      setLogoUrl(url);
      setUploading(false);
      setUploadProgress(0);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Full upload error:', err);
      setError(`Upload failed: ${err.message || 'Unknown error'}`);
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      await setDoc(doc(db, 'settings', 'site'), {
        logoUrl,
        siteName,
        updatedAt: Date.now()
      }, { merge: true });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings/site');
      setError('Failed to save settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleSeedData = async () => {
    if (!window.confirm('This will add 4 dummy sellers and 8 dummy services to your database. Continue?')) return;
    
    setLoading(true);
    setError(null);
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
          joinedAt: Date.now() - 1000 * 60 * 60 * 24 * 30, // 30 days ago
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
          joinedAt: Date.now() - 1000 * 60 * 60 * 24 * 60, // 60 days ago
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
          joinedAt: Date.now() - 1000 * 60 * 60 * 24 * 15, // 15 days ago
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
          joinedAt: Date.now() - 1000 * 60 * 60 * 24 * 45, // 45 days ago
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
          createdAt: Date.now()
        }
      ];

      // Seed Sellers
      for (const seller of dummySellers) {
        const { uid, ...sellerData } = seller;
        // Add to users collection
        await setDoc(doc(db, 'users', uid), {
          uid,
          displayName: sellerData.displayName,
          email: sellerData.email,
          avatar: sellerData.avatar,
          role: sellerData.role,
          profileComplete: sellerData.profileComplete,
          createdAt: sellerData.joinedAt
        }, { merge: true });

        // Add to seller_profiles collection
        // Pass the full seller object to include uid
        await setDoc(doc(db, 'seller_profiles', uid), seller, { merge: true });
      }

      // Seed Services
      for (const service of dummyServices) {
        const serviceRef = doc(collection(db, 'services'));
        await setDoc(serviceRef, {
          ...service,
          id: serviceRef.id
        });
      }

      setSuccess(true);
      alert('Dummy data seeded successfully!');
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error seeding data:', err);
      setError('Failed to seed dummy data.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !logoUrl) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-brand/30 border-t-brand rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-display font-bold mb-2">Site Settings</h1>
        <p className="text-text-muted">Manage global marketplace configuration and branding.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-8">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-brand" />
              Branding
            </h3>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Marketplace Name</label>
                <Input 
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  placeholder="e.g. Indiy Marketplace"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Site Logo</label>
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  <div className="w-32 h-32 rounded-2xl bg-bg-elevated border border-border-subtle flex items-center justify-center overflow-hidden relative group">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Site Logo" className="w-full h-full object-contain p-4" referrerPolicy="no-referrer" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-text-muted" />
                    )}
                    {uploading && (
                      <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center p-4">
                        <div className="w-full bg-white/20 h-1 rounded-full overflow-hidden mb-2">
                          <div 
                            className="h-full bg-brand transition-all duration-300" 
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-white uppercase tracking-widest">
                          {Math.round(uploadProgress)}%
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-grow space-y-4">
                    <div className="flex gap-3">
                      <Button 
                        variant="outline" 
                        className="relative overflow-hidden"
                        isLoading={uploading}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload New Logo
                        <input 
                          type="file" 
                          className="absolute inset-0 opacity-0 cursor-pointer" 
                          onChange={handleLogoUpload}
                          accept="image/*"
                        />
                      </Button>
                      {logoUrl && (
                        <Button variant="ghost" onClick={() => setLogoUrl(null)} className="text-red-400 hover:text-red-300">
                          Remove
                        </Button>
                      )}
                    </div>
                    
                    <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 flex gap-3">
                      <Info className="w-5 h-5 text-blue-400 shrink-0" />
                      <div className="text-xs text-text-muted leading-relaxed">
                        <p className="font-bold text-blue-400 mb-1 uppercase tracking-wider">Preferred Dimensions</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Recommended size: <span className="text-text-primary">512px x 128px</span> (Landscape)</li>
                          <li>Aspect ratio: <span className="text-text-primary">4:1</span> or <span className="text-text-primary">3:1</span></li>
                          <li>Format: <span className="text-text-primary">Transparent PNG</span> or <span className="text-text-primary">SVG</span> preferred</li>
                          <li>Max file size: <span className="text-text-primary">2MB</span></li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-border-subtle flex items-center justify-between">
              <div className="flex items-center gap-2">
                {success && (
                  <span className="text-green-400 text-sm flex items-center gap-1 animate-in fade-in slide-in-from-left-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Settings saved successfully
                  </span>
                )}
                {error && (
                  <span className="text-red-400 text-sm flex items-center gap-1 animate-in fade-in slide-in-from-left-2">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </span>
                )}
              </div>
              <Button onClick={handleSaveSettings} isLoading={loading}>
                Save Changes
              </Button>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6 bg-brand/5 border-brand/10">
            <h4 className="font-bold mb-3 flex items-center gap-2">
              <Info className="w-4 h-4 text-brand" />
              Admin Instructions
            </h4>
            <p className="text-sm text-text-secondary leading-relaxed">
              Changes made here will be reflected across the entire platform in real-time. 
              The logo is used in the navigation bar, footer, and email templates.
            </p>
          </Card>

          <Card className="p-6 border-red-500/20 bg-red-500/5">
            <h4 className="font-bold mb-3 text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Database Tools
            </h4>
            <p className="text-xs text-text-muted mb-4">
              Use these tools to populate your marketplace with realistic dummy data for testing and demonstration.
            </p>
            <Button 
              variant="outline" 
              className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
              onClick={handleSeedData}
              isLoading={loading}
            >
              Seed Dummy Data
            </Button>
          </Card>

          <Card className="p-6">
            <h4 className="font-bold mb-4">Preview</h4>
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-bg-elevated border border-border-subtle">
                <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-3">Navbar Preview</p>
                <div className="h-12 bg-bg-surface border border-border-subtle rounded-lg flex items-center px-4">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo Preview" className="h-6 object-contain" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="h-6 w-24 bg-white/5 rounded" />
                  )}
                </div>
              </div>
              
              <div className="p-4 rounded-xl bg-bg-elevated border border-border-subtle">
                <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-3">Footer Preview</p>
                <div className="bg-bg-surface border border-border-subtle rounded-lg p-4">
                   {logoUrl ? (
                    <img src={logoUrl} alt="Logo Preview" className="h-8 object-contain mb-2" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="h-8 w-32 bg-white/5 rounded mb-2" />
                  )}
                  <div className="h-2 w-full bg-white/5 rounded mb-1" />
                  <div className="h-2 w-2/3 bg-white/5 rounded" />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
