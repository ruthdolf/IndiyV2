import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  MessageSquare, 
  ExternalLink, 
  Loader2, 
  Search, 
  Filter, 
  ShieldCheck, 
  Sparkles, 
  User, 
  Send,
  Calendar,
  Phone,
  Clock,
  Briefcase,
  ChevronRight,
  Info,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { Button, Card } from './ui';
import { 
  db, 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  setDoc, 
  handleFirestoreError, 
  OperationType,
  onSnapshot,
  writeBatch
} from '../firebase';
import { cn } from '../lib/utils';
import { UserRole } from '../types';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getOrCreateConversation } from '../services/messagingService';
import { format } from 'date-fns';

export const AdminReviewQueue = () => {
  const { user: adminUser } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [feedback, setFeedback] = useState('');
  const [updating, setUpdating] = useState(false);
  const [contacting, setContacting] = useState(false);

  const fetchApplications = async () => {
    setLoading(true);
    setError(null);
    try {
      const q = query(collection(db, 'seller_applications'), where('status', '==', 'pending'));
      const snapshot = await getDocs(q);
      const apps = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setApplications(apps);
    } catch (err: any) {
      console.error("Manual fetch error:", err);
      setError(err.message || "Failed to fetch applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const q = query(collection(db, 'seller_applications'), where('status', '==', 'pending'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const apps = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setApplications(apps);
      setLoading(false);
      setError(null);
    }, (error) => {
      console.error("Error fetching applications:", error);
      setError("Sync error: " + error.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAction = async (status: 'approved' | 'rejected' | 'needs-info') => {
    if (!selectedApp) return;
    setUpdating(true);
    setError(null);
    
    try {
      const batch = writeBatch(db);
      
      // 1. Update application status and feedback
      const appRef = doc(db, 'seller_applications', selectedApp.id);
      batch.update(appRef, { 
        status, 
        adminFeedback: feedback,
        updatedAt: Date.now()
      });

      // 2. If approved, create/update seller profile and set user role
      if (status === 'approved') {
        const profileRef = doc(db, 'seller_profiles', selectedApp.userId);
        batch.set(profileRef, {
          uid: selectedApp.userId,
          displayName: selectedApp.displayName,
          bio: selectedApp.bio,
          skills: selectedApp.skills || [],
          verified: true,
          slug: selectedApp.slug || selectedApp.displayName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, ''),
          joinedAt: Date.now(),
        }, { merge: true });

        const userRef = doc(db, 'users', selectedApp.userId);
        batch.update(userRef, { 
          role: UserRole.SELLER,
          verified: true 
        });
      }

      await batch.commit();

      // UI will update automatically via onSnapshot
      setSelectedApp(null);
      setFeedback('');
    } catch (error: any) {
      console.error("Action error:", error);
      setError("Action failed: " + (error.message || "Unknown error"));
      try {
        handleFirestoreError(error, OperationType.UPDATE, `seller_applications/${selectedApp.id}`);
      } catch (e) {}
    } finally {
      setUpdating(false);
    }
  };

  const handleContactApplicant = async () => {
    if (!selectedApp || !adminUser) return;
    setContacting(true);
    try {
      // Create a mock user object for the applicant for the messaging service
      const applicantUser = {
        uid: selectedApp.userId,
        displayName: selectedApp.displayName,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedApp.displayName}`
      };
      
      const conversationId = await getOrCreateConversation(adminUser as any, applicantUser as any);
      navigate('/dashboard/messages', { state: { activeId: conversationId } });
    } catch (error) {
      console.error('Error contacting applicant:', error);
    } finally {
      setContacting(false);
    }
  };

  const handleScheduleCall = async () => {
    if (!selectedApp || !adminUser) return;
    setContacting(true);
    try {
      const applicantUser = {
        uid: selectedApp.userId,
        displayName: selectedApp.displayName,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedApp.displayName}`
      };
      
      const conversationId = await getOrCreateConversation(adminUser as any, applicantUser as any);
      // Logic for sending a pre-filled "Schedule Call" message could go here
      // For now, just taking them to the chat with a specific intent
      navigate('/dashboard/messages', { 
        state: { 
          activeId: conversationId,
          initialMessage: `Hi ${selectedApp.displayName}, I'd like to schedule a quick 15-minute onboarding call to discuss your application for the Indiy marketplace. When would work best for you?`
        } 
      });
    } catch (error) {
      console.error('Error scheduling call:', error);
    } finally {
      setContacting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-700 pb-12">
      {/* Header Section - More Spacing, Cleaner Alignment */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 border-b border-border-subtle pb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-display font-bold tracking-tight">Review Queue</h1>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-brand/10 border border-brand/20 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
              <span className="text-[10px] font-bold text-brand uppercase tracking-widest">{applications.length} Pending</span>
            </div>
          </div>
          <p className="text-text-muted text-lg max-w-2xl">Curate the next generation of Indiy talent. Verify credentials, review portfolios, and maintain platform integrity.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchApplications}
            disabled={loading}
            className="h-11 px-5 border-border-strong hover:bg-white/5 gap-3 rounded-2xl transition-all"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            <span className="text-xs font-bold uppercase tracking-wider">Sync Database</span>
          </Button>
          
          <div className="h-11 flex items-center bg-bg-elevated border border-border-subtle rounded-2xl px-4 focus-within:border-brand/50 transition-all w-full md:w-80 group">
            <Search className="w-4 h-4 text-text-muted group-focus-within:text-brand mr-3" />
            <input 
              type="text" 
              placeholder="Search talent, skills, or UID..." 
              className="bg-transparent border-none outline-none text-sm w-full placeholder:text-text-muted/50"
            />
          </div>
          
          <Button variant="outline" className="h-11 px-5 border-border-strong hover:bg-white/5 gap-3 rounded-2xl transition-all">
            <Filter className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Filters</span>
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-3xl text-red-500 text-sm flex items-center gap-4 animate-in slide-in-from-top-4 shadow-2xl shadow-red-500/5">
          <div className="w-10 h-10 rounded-2xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-base">System Integrity Warning</p>
            <p className="text-xs opacity-80 font-mono">{error}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setError(null)} className="h-10 w-10 p-0 rounded-xl hover:bg-red-500/20">
            <XCircle className="w-5 h-5" />
          </Button>
        </div>
      )}

      {/* Main Content Area - Full width with better proportions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 min-h-[700px]">
        {/* Master List - More detailed and spaced cards */}
        <div className="lg:col-span-4 space-y-4 overflow-y-auto max-h-[800px] pr-2 custom-scrollbar">
          <div className="flex items-center justify-between px-2 mb-4">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-[0.2em]">Applicant Pipeline</h3>
          </div>
          
          {applications.length === 0 ? (
            <div className="h-[400px] flex flex-col items-center justify-center p-12 text-center bg-bg-surface/30 rounded-[2.5rem] border border-dashed border-border-subtle">
              <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6 text-green-500 shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold">Queue is Clear</h3>
              <p className="text-sm text-text-muted mt-2 max-w-[200px]">All applications have been successfully processed.</p>
            </div>
          ) : (
            applications.map(app => (
              <button 
                key={app.id} 
                className={cn(
                  "w-full group rounded-[2rem] border transition-all text-left overflow-hidden relative",
                  selectedApp?.id === app.id 
                    ? "bg-brand/10 border-brand shadow-2xl shadow-brand/10" 
                    : "bg-bg-surface/50 border-border-subtle hover:border-brand/30 hover:bg-bg-elevated/50"
                )}
                onClick={() => setSelectedApp(app)}
              >
                <div className="p-6 flex items-center gap-5">
                   <div className={cn(
                    "w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center text-xl font-bold transition-all duration-500",
                    selectedApp?.id === app.id ? "bg-brand text-white scale-110 rotate-3" : "bg-bg-elevated text-brand border border-border-subtle group-hover:scale-105"
                  )}>
                    {app.displayName[0]}
                  </div>
                  
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold truncate group-hover:text-brand transition-colors">{app.displayName}</h4>
                      <Clock className={cn("w-3.5 h-3.5 transition-colors", selectedApp?.id === app.id ? "text-brand" : "text-text-muted")} />
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-mono text-text-muted px-2 py-0.5 bg-bg-elevated rounded border border-border-subtle">
                        #{app.userId.slice(-6).toUpperCase()}
                      </span>
                      <span className="text-[10px] text-text-muted flex items-center gap-1 font-medium">
                        {format(app.createdAt, 'MMM d')}
                      </span>
                    </div>
                  </div>
                  
                  <ChevronRight className={cn(
                    "w-5 h-5 self-center transition-all duration-300",
                    selectedApp?.id === app.id ? "rotate-90 text-brand" : "text-text-muted opacity-0 group-hover:opacity-100 group-hover:translate-x-1"
                  )} />
                </div>
                
                {selectedApp?.id === app.id && (
                  <div className="h-1 bg-brand w-full absolute bottom-0 left-0 animate-in slide-in-from-left duration-500" />
                )}
              </button>
            ))
          )}
        </div>

        {/* Detail View - Now much more expansive and integrated */}
        <div className="lg:col-span-8">
          {selectedApp ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-700">
              {/* Profile Header Card */}
              <Card className="p-10 bg-bg-surface border-border-subtle relative overflow-hidden rounded-[3rem]">
                <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
                  <ShieldCheck className="w-64 h-64 text-brand transform rotate-12" />
                </div>
                
                <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-10">
                  <div className="flex items-center gap-8">
                    <div className="relative group">
                      <div className="w-28 h-28 bg-brand/10 rounded-[2.5rem] flex items-center justify-center text-brand text-4xl font-bold border border-brand/20 shadow-2xl shadow-brand/10 group-hover:scale-105 transition-transform duration-500">
                        {selectedApp.displayName[0]}
                      </div>
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-yellow-500 border-4 border-bg-surface flex items-center justify-center">
                        <Clock className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-4">
                        <h2 className="text-4xl font-display font-bold tracking-tight">{selectedApp.displayName}</h2>
                        <div className="px-4 py-1 rounded-full bg-yellow-500/10 text-yellow-500 text-[10px] font-bold uppercase tracking-[0.2em] border border-yellow-500/20">
                          Pending Approval
                        </div>
                      </div>
                      <div className="flex items-center gap-6 text-sm text-text-muted font-medium">
                        <span className="flex items-center gap-2 bg-bg-elevated px-3 py-1 rounded-xl border border-border-subtle">
                          <User className="w-3.5 h-3.5 text-brand" />
                          <span className="font-mono text-[10px] uppercase">{selectedApp.userId}</span>
                        </span>
                        <span className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-brand" />
                          Submitted {format(selectedApp.createdAt, 'MMMM do, yyyy')}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 w-full md:w-auto">
                    <a 
                      href={selectedApp.portfolioUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex-1 md:flex-none h-14 px-8 inline-flex items-center justify-center gap-3 bg-white text-black hover:bg-white/90 rounded-[1.25rem] font-bold transition-all shadow-xl shadow-brand/10 group"
                    >
                      <ExternalLink className="w-5 h-5" />
                      View Portfolio
                    </a>
                  </div>
                </div>
              </Card>

              {/* Application Content Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Information Column */}
                <div className="space-y-8">
                  {/* Summary Section */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-6 bg-bg-surface/50 rounded-3xl border border-border-subtle group hover:border-brand/30 transition-colors">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-xl bg-brand/10 flex items-center justify-center text-brand">
                          <Briefcase className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Sector</span>
                      </div>
                      <p className="text-xl font-bold">Creative Arts</p>
                      <p className="text-[10px] text-brand uppercase font-bold mt-1 tracking-wider">High Demand</p>
                    </div>
                    
                    <div className="p-6 bg-bg-surface/50 rounded-3xl border border-border-subtle group hover:border-brand/30 transition-colors">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Verification</span>
                      </div>
                      <p className="text-xl font-bold">Tier 01</p>
                      <p className="text-[10px] text-blue-400 uppercase font-bold mt-1 tracking-wider">Manual Intake</p>
                    </div>
                  </div>

                  {/* Bio Section */}
                  <section className="p-8 bg-bg-surface/50 border border-border-subtle rounded-[2.5rem] relative group hover:bg-bg-elevated/20 transition-all">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <Sparkles className="w-4 h-4 text-brand" />
                        <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest">Professional Narrative</h3>
                      </div>
                      <Info className="w-4 h-4 text-text-muted/30 group-hover:text-brand transition-colors" />
                    </div>
                    <p className="text-base text-text-secondary leading-relaxed font-medium italic opacity-95 relative z-10">
                      "{selectedApp.bio}"
                    </p>
                    <div className="absolute -bottom-4 -right-4 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                      <Sparkles className="w-32 h-32 text-brand" />
                    </div>
                  </section>

                  {/* Skills/Expertise */}
                  <section className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-lg bg-brand/10 flex items-center justify-center text-brand">
                        <ChevronRight className="w-3.5 h-3.5 mr-[-1px]" />
                      </div>
                      <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest">Skill Matrix</h3>
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                      {selectedApp.skills.map((skill: string) => (
                        <span key={skill} className="px-5 py-2.5 bg-bg-elevated text-text-primary rounded-2xl text-[11px] font-bold border border-border-subtle hover:border-brand/50 hover:bg-brand/5 transition-all">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </section>
                </div>

                {/* Review/Action Column */}
                <div className="space-y-8">
                  {/* Admin Interaction Station */}
                  <div className="p-8 bg-brand/5 border border-brand/20 rounded-[3rem] space-y-8 flex flex-col h-full shadow-2xl shadow-brand/5 backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-white text-[10px] font-bold shadow-lg shadow-brand/20">
                          HQ
                        </div>
                        <h3 className="text-xs font-bold text-brand uppercase tracking-widest">Internal Assessment</h3>
                      </div>
                      <div className="flex gap-1">
                        {[1, 2, 3].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-brand/30" />)}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <p className="text-[11px] text-text-muted font-medium px-1">
                        Verify the candidate's portfolio quality and community fit. Use feedback to inform them of next steps or potential improvements.
                      </p>
                      <textarea 
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Internal notes or applicant instructions..."
                        className="w-full h-40 bg-bg-surface/50 border border-border-subtle rounded-3xl p-5 text-sm focus:outline-none focus:border-brand/50 transition-all placeholder:text-text-muted/30 resize-none font-medium text-text-primary"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <Button 
                        className="w-full h-16 bg-brand hover:bg-brand-hover text-white rounded-2xl shadow-2xl shadow-brand/20 font-bold text-lg group overflow-hidden relative"
                        onClick={() => handleAction('approved')}
                        isLoading={updating}
                      >
                        <span className="relative z-10 flex items-center justify-center">
                          <CheckCircle2 className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform" />
                          Approve Applicant
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:animate-shimmer" />
                      </Button>
                      
                      <div className="grid grid-cols-2 gap-4 h-14">
                        <Button 
                          variant="outline" 
                          className="rounded-2xl border-border-strong hover:bg-white/5 font-bold text-xs uppercase tracking-widest"
                          onClick={() => handleAction('needs-info')}
                          isLoading={updating}
                        >
                          Request Info
                        </Button>
                        <Button 
                          variant="outline" 
                          className="rounded-2xl border-red-500/30 text-red-500 hover:bg-red-500/10 font-bold text-xs uppercase tracking-widest"
                          onClick={() => handleAction('rejected')}
                          isLoading={updating}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>

                    <div className="relative flex items-center gap-4 py-2">
                      <div className="h-[1px] flex-1 bg-border-subtle" />
                      <span className="text-[9px] font-bold text-text-muted uppercase tracking-[0.3em]">Communication</span>
                      <div className="h-[1px] flex-1 bg-border-subtle" />
                    </div>

                    <div className="flex gap-4">
                      <Button 
                        variant="ghost" 
                        className="flex-1 h-14 rounded-2xl bg-bg-elevated border border-border-subtle text-text-primary hover:bg-white/5 text-[11px] font-bold gap-3 uppercase tracking-widest"
                        onClick={handleContactApplicant}
                        isLoading={contacting}
                      >
                        <MessageSquare className="w-4 h-4 text-brand" />
                        Chat
                      </Button>
                      <Button 
                        variant="ghost" 
                        className="flex-1 h-14 rounded-2xl bg-bg-elevated border border-border-subtle text-text-primary hover:bg-white/5 text-[11px] font-bold gap-3 uppercase tracking-widest"
                        onClick={handleScheduleCall}
                        isLoading={contacting}
                      >
                        <Phone className="w-4 h-4 text-brand" />
                        Call
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[600px] flex flex-col items-center justify-center text-center p-20 bg-bg-surface/10 rounded-[4rem] border-2 border-dashed border-border-subtle/30 animate-pulse relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-br from-brand/5 via-transparent to-brand/5 pointer-events-none" />
              <div className="w-40 h-40 bg-bg-elevated rounded-full flex items-center justify-center mb-10 text-text-muted shadow-2xl relative z-10">
                <ShieldCheck className="w-20 h-20 opacity-10" />
              </div>
              <h3 className="text-3xl font-display font-bold mb-4 relative z-10">Mission Control</h3>
              <p className="text-text-muted max-w-sm leading-relaxed text-lg relative z-10">
                Select an applicant from the pipeline to begin the deep-review process and onboarding flow.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
