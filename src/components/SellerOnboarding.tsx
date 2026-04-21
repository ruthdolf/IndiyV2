import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Loader2, Send, Briefcase, Link as LinkIcon, User, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button, Card } from './ui';
import { useAuth } from '../contexts/AuthContext';
import { 
  db, 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  doc, 
  setDoc, 
  handleFirestoreError, 
  OperationType,
  onSnapshot,
  orderBy,
  limit
} from '../firebase';
import { cn } from '../lib/utils';
import { UserRole } from '../types';

export const SellerOnboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [existingApp, setExistingApp] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    bio: '',
    portfolioUrl: '',
    skills: '',
  });

  // Redirect if already a seller
  useEffect(() => {
    if (user?.role === UserRole.SELLER) {
      // Small delay to let them see the success if they just got approved
      const timer = setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [user?.role, navigate]);

  useEffect(() => {
    if (!user) return;
    
    // Sort by createdAt desc and limit to 1 to always get the most relevant application
    const q = query(
      collection(db, 'seller_applications'), 
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(1)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const appData = snapshot.docs[0].data();
        setExistingApp(appData);
        setStep(3);
      }
    }, (error) => {
      console.warn("Error watching application (usually index related):", error);
      // Fallback to basic query if index isn't ready
      const qFallback = query(collection(db, 'seller_applications'), where('userId', '==', user.uid));
      onSnapshot(qFallback, (s) => {
        if (!s.empty) {
          // Sort manually in memory if index fails
          const docs = s.docs.map(d => d.data()).sort((a, b) => b.createdAt - a.createdAt);
          setExistingApp(docs[0]);
          setStep(3);
        }
      });
    });

    return () => unsubscribe();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (formData.bio.length < 100) {
      alert("Please provide a bio with at least 100 characters.");
      return;
    }
    
    setLoading(true);
    try {
      const displayName = user.displayName || 'Anonymous User';
      const slug = displayName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
      
      const appData = {
        id: crypto.randomUUID(),
        userId: user.uid,
        displayName,
        slug,
        bio: formData.bio,
        portfolioUrl: formData.portfolioUrl,
        skills: formData.skills.split(',').map(s => s.trim()).filter(s => s !== ''),
        status: 'pending',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      // 1. Create application
      const appRef = doc(db, 'seller_applications', appData.id);
      await setDoc(appRef, appData);
      
      // 2. Create/Update unverified seller profile with slug
      const profileRef = doc(db, 'seller_profiles', user.uid);
      await setDoc(profileRef, {
        uid: user.uid,
        displayName,
        avatar: user.photoURL || undefined,
        slug,
        bio: formData.bio,
        skills: formData.skills.split(',').map(s => s.trim()).filter(s => s !== ''),
        verified: false,
        joinedAt: Date.now(),
      }, { merge: true });

      setExistingApp(appData);
      setStep(3);
    } catch (error: any) {
      console.error("Submission error:", error);
      let message = "Failed to submit application. Please try again.";
      if (error?.message?.includes('permission-denied') || error?.message?.includes('insufficient permissions')) {
        message = "Permission denied. Please ensure your profile is complete and you are logged in.";
      }
      alert(message);
      // Still call handleFirestoreError for logging purposes if needed, 
      // but we already alerted the user.
      try {
        handleFirestoreError(error, OperationType.CREATE, 'seller_applications');
      } catch (e) {
        // handleFirestoreError re-throws, we catch it here to avoid unhandled rejection
      }
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-24 px-4 text-center">
        <h2 className="text-3xl font-display font-bold mb-4">Join as a Seller</h2>
        <p className="text-text-muted mb-8">Please sign in to start your application process.</p>
        <Button onClick={() => navigate('/login')} className="w-full">Sign In to Apply</Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {/* Progress Bar */}
      <div className="flex items-center justify-between mb-12 px-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all",
              step >= i ? "bg-brand text-white shadow-lg shadow-brand/20" : "bg-bg-elevated text-text-muted border border-border-subtle"
            )}>
              {step > i ? <CheckCircle2 className="w-6 h-6" /> : i}
            </div>
            {i < 3 && (
              <div className={cn(
                "h-1 flex-1 mx-4 rounded-full",
                step > i ? "bg-brand" : "bg-border-subtle"
              )} />
            )}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="text-center">
            <h1 className="text-4xl font-display font-bold mb-4 tracking-tight">Become an Indie Seller</h1>
            <p className="text-text-muted text-lg">We're looking for top-tier creative talent to join our curated marketplace.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 text-center space-y-4">
              <div className="w-12 h-12 bg-brand/10 rounded-2xl flex items-center justify-center mx-auto text-brand">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold">Quality First</h3>
              <p className="text-xs text-text-muted">Our team reviews every application to maintain high standards.</p>
            </Card>
            <Card className="p-6 text-center space-y-4">
              <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto text-blue-400">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-bold">Expert Support</h3>
              <p className="text-xs text-text-muted">We help you optimize your services for maximum visibility.</p>
            </Card>
            <Card className="p-6 text-center space-y-4">
              <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto text-green-400">
                <Briefcase className="w-6 h-6" />
              </div>
              <h3 className="font-bold">Global Reach</h3>
              <p className="text-xs text-text-muted">Connect with buyers from all over the world.</p>
            </Card>
          </div>

          <Card className="p-8 space-y-6">
            <h2 className="text-xl font-bold">What to expect:</h2>
            <ul className="space-y-4">
              <li className="flex items-start gap-4">
                <div className="mt-1 p-1 bg-brand/20 rounded-full text-brand"><ArrowRight className="w-3 h-3" /></div>
                <p className="text-text-secondary">Fill out your professional profile and portfolio.</p>
              </li>
              <li className="flex items-start gap-4">
                <div className="mt-1 p-1 bg-brand/20 rounded-full text-brand"><ArrowRight className="w-3 h-3" /></div>
                <p className="text-text-secondary">Our curation team will review your work (usually within 48 hours).</p>
              </li>
              <li className="flex items-start gap-4">
                <div className="mt-1 p-1 bg-brand/20 rounded-full text-brand"><ArrowRight className="w-3 h-3" /></div>
                <p className="text-text-secondary">Once approved, you'll get a verified badge and can post your first service.</p>
              </li>
            </ul>
            <Button onClick={() => setStep(2)} className="w-full py-6 text-lg">Start Application</Button>
          </Card>
        </div>
      )}

      {step === 2 && (
        <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="text-center">
            <h1 className="text-3xl font-display font-bold mb-2">Tell us about yourself</h1>
            <p className="text-text-muted">Help our team understand your expertise and style.</p>
          </div>

          <Card className="p-8 space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold flex items-center gap-2">
                <User className="w-4 h-4 text-brand" />
                Professional Bio
              </label>
              <textarea 
                required
                value={formData.bio}
                onChange={(e) => setFormData({...formData, bio: e.target.value})}
                placeholder="Describe your experience, style, and what you offer..."
                className="w-full h-32 bg-bg-elevated border border-border-subtle rounded-2xl p-4 text-sm focus:outline-none focus:border-brand/50 transition-all"
              />
              <p className="text-[10px] text-text-muted">Minimum 100 characters. Be specific about your niche.</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-brand" />
                Portfolio Link
              </label>
              <input 
                type="url"
                required
                value={formData.portfolioUrl}
                onChange={(e) => setFormData({...formData, portfolioUrl: e.target.value})}
                placeholder="https://behance.net/yourname or your website"
                className="w-full bg-bg-elevated border border-border-subtle rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-brand/50 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand" />
                Skills (comma separated)
              </label>
              <input 
                type="text"
                required
                value={formData.skills}
                onChange={(e) => setFormData({...formData, skills: e.target.value})}
                placeholder="Music Production, Mixing, Mastering..."
                className="w-full bg-bg-elevated border border-border-subtle rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-brand/50 transition-all"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1 py-4">Back</Button>
              <Button type="submit" className="flex-2 py-4 shadow-lg shadow-brand/20" isLoading={loading}>
                Submit Application
                <Send className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </Card>
        </form>
      )}

      {step === 3 && existingApp && (
        <div className="space-y-8 animate-in zoom-in-95 duration-500">
          <div className="text-center">
            <div className={cn(
              "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 transition-all duration-700",
              existingApp.status === 'approved' ? "bg-green-500/20 text-green-500 scale-110 shadow-xl shadow-green-500/20" : "bg-brand/10 text-brand"
            )}>
              {existingApp.status === 'approved' ? <CheckCircle2 className="w-10 h-10" /> : <Send className="w-10 h-10" />}
            </div>
            <h1 className="text-3xl font-display font-bold mb-2">
              {(existingApp.status === 'approved' || user?.role === UserRole.SELLER) ? "Welcome to Indiy!" : "Application Submitted!"}
            </h1>
            <p className="text-text-muted">
              {(existingApp.status === 'approved' || user?.role === UserRole.SELLER) 
                ? "Your application has been accepted. You're ready to start selling." 
                : "Our team is currently reviewing your profile."}
            </p>
          </div>

          <Card className="p-8 space-y-6">
            <div className="flex items-center justify-between pb-6 border-b border-border-subtle">
              <span className="text-sm font-bold text-text-muted uppercase tracking-widest">Status</span>
              <span className={cn(
                "px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider",
                (existingApp.status === 'pending' && user?.role !== UserRole.SELLER) ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20" :
                (existingApp.status === 'approved' || user?.role === UserRole.SELLER) ? "bg-green-500/10 text-green-500 border border-green-500/20" :
                "bg-red-500/10 text-red-500 border border-red-500/20"
              )}>
                {(existingApp.status === 'approved' || user?.role === UserRole.SELLER) ? 'approved' : existingApp.status}
              </span>
            </div>

            {(existingApp.status === 'approved' || user?.role === UserRole.SELLER) ? (
              <div className="space-y-6 py-4">
                <div className="p-6 bg-green-500/5 border border-green-500/10 rounded-3xl space-y-4">
                  <div className="flex items-center gap-3 text-green-500">
                    <Sparkles className="w-5 h-5" />
                    <h3 className="font-bold">Next Phase: Selling</h3>
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    You now have full access to your Seller Dashboard. You can start creating your service listings and connecting with buyers immediately.
                  </p>
                  <ul className="space-y-2 text-xs text-text-muted italic">
                    <li className="flex items-center gap-2">• Verified Badge has been added to your profile</li>
                    <li className="flex items-center gap-2">• Service creation is now enabled</li>
                    <li className="flex items-center gap-2">• Marketplace visibility is active</li>
                  </ul>
                </div>

                <Button onClick={() => navigate('/dashboard')} className="w-full py-6 text-lg shadow-xl shadow-brand/20 group">
                  Go to Seller Dashboard
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="font-bold">Next Steps:</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-bg-elevated flex items-center justify-center text-xs font-bold border border-border-subtle">1</div>
                    <div>
                      <p className="font-bold text-sm">Review Process</p>
                      <p className="text-xs text-text-muted">We check your portfolio and bio to ensure it matches our quality standards.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-bg-elevated flex items-center justify-center text-xs font-bold border border-border-subtle">2</div>
                    <div>
                      <p className="font-bold text-sm">Feedback & Support</p>
                      <p className="text-xs text-text-muted">If we need more info or have suggestions for your bio, we'll let you know here.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-bg-elevated flex items-center justify-center text-xs font-bold border border-border-subtle">3</div>
                    <div>
                      <p className="font-bold text-sm">Start Selling</p>
                      <p className="text-xs text-text-muted">Once approved, you'll be able to create your first service listing.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {existingApp.adminFeedback && (
              <div className="p-6 bg-blue-500/10 border border-blue-500/20 rounded-2xl space-y-2">
                <h4 className="text-sm font-bold text-blue-400 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Team Feedback
                </h4>
                <p className="text-sm text-text-secondary italic">"{existingApp.adminFeedback}"</p>
              </div>
            )}

            <Button variant="outline" onClick={() => navigate('/marketplace')} className="w-full py-4">
              Explore Marketplace
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
};
