import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db, doc, updateDoc, collection, query, where, getDocs, handleFirestoreError, OperationType } from '../firebase';
import { MUSIC_JOBS, COUNTRIES } from '../constants';
import { Card } from './ui';
import { Check, X, Loader2, Globe, Lock, Music, Search, ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';

export const ProfileSetup: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isRealNamePublic, setIsRealNamePublic] = useState(false);
  const [username, setUsername] = useState('');
  const [country, setCountry] = useState('');
  const [countrySearch, setCountrySearch] = useState('');
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const countryDropdownRef = useRef<HTMLDivElement>(null);
  const [city, setCity] = useState('');
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [jobSearch, setJobSearch] = useState('');
  
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const filteredJobs = MUSIC_JOBS.filter(job => 
    job.toLowerCase().includes(jobSearch.toLowerCase())
  );

  const filteredCountries = COUNTRIES.filter(c => 
    c.toLowerCase().includes(countrySearch.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target as Node)) {
        setIsCountryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
    if (user?.profileComplete) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (username.length < 3) {
      setUsernameStatus('idle');
      return;
    }

    const checkUsername = async () => {
      setUsernameStatus('checking');
      try {
        const q = query(collection(db, 'users'), where('username', '==', username.toLowerCase()));
        const querySnapshot = await getDocs(q);
        
        // Check if the username is taken by someone else
        const isTaken = querySnapshot.docs.some(doc => doc.id !== user?.uid);
        setUsernameStatus(isTaken ? 'taken' : 'available');
      } catch (err) {
        console.error('Error checking username:', err);
        setUsernameStatus('idle');
      }
    };

    const timeoutId = setTimeout(checkUsername, 500);
    return () => clearTimeout(timeoutId);
  }, [username, user?.uid]);

  const toggleJob = (job: string) => {
    setSelectedJobs(prev => 
      prev.includes(job) ? prev.filter(j => j !== job) : [...prev, job]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (usernameStatus !== 'available') {
      setError('Please choose a valid username');
      return;
    }
    if (!firstName || !lastName || !country || !city || selectedJobs.length === 0) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        firstName,
        lastName,
        isRealNamePublic,
        username: username.toLowerCase(),
        country,
        city,
        musicJobs: selectedJobs,
        profileComplete: true,
      });
      navigate('/dashboard');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
      setError('Failed to update profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-24 text-center">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <Card className="p-8 md:p-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-display font-bold mb-2">Complete Your Profile</h1>
          <p className="text-text-muted">Tell us a bit more about yourself to unlock the full Indiy experience.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {error && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm text-center">{error}</div>}

          {/* Real Name */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-bold uppercase tracking-widest text-text-muted">Real Name</label>
              <button
                type="button"
                onClick={() => setIsRealNamePublic(!isRealNamePublic)}
                className={cn(
                  "px-3 py-1 rounded-full border transition-all flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider",
                  isRealNamePublic 
                    ? "bg-brand/10 border-brand text-brand" 
                    : "bg-bg-elevated border-border-subtle text-text-muted"
                )}
              >
                {isRealNamePublic ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                {isRealNamePublic ? 'Public' : 'Private'}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input 
                type="text" 
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First Name"
                required
                className="bg-bg-elevated border border-border-subtle rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand/50" 
              />
              <input 
                type="text" 
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last Name"
                required
                className="bg-bg-elevated border border-border-subtle rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand/50" 
              />
            </div>
            <p className="text-[10px] text-text-muted italic">
              {isRealNamePublic 
                ? "Your real name will be visible to everyone on the platform." 
                : "Your real name will only be visible to you and the Indiy team."}
            </p>
          </div>

          {/* Username */}
          <div className="space-y-4">
            <label className="block text-sm font-bold uppercase tracking-widest text-text-muted">Username</label>
            <div className="relative">
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                placeholder="Choose a unique username"
                required
                className="w-full bg-bg-elevated border border-border-subtle rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand/50" 
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                {usernameStatus === 'checking' && <Loader2 className="w-4 h-4 animate-spin text-brand" />}
                {usernameStatus === 'available' && <Check className="w-4 h-4 text-green-500" />}
                {usernameStatus === 'taken' && <X className="w-4 h-4 text-red-500" />}
              </div>
            </div>
            {usernameStatus === 'taken' && <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest">Username is already taken</p>}
            {usernameStatus === 'available' && <p className="text-[10px] text-green-500 font-bold uppercase tracking-widest">Username is available</p>}
          </div>

          {/* Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <label className="block text-sm font-bold uppercase tracking-widest text-text-muted">Country</label>
              <div className="relative" ref={countryDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                  className="w-full bg-bg-elevated border border-border-subtle rounded-xl px-4 py-3 text-sm text-left focus:outline-none focus:border-brand/50 flex justify-between items-center"
                >
                  <span className={country ? "text-text-primary" : "text-text-muted"}>
                    {country || "Select Country"}
                  </span>
                  <ChevronDown className={cn("w-4 h-4 text-text-muted transition-transform", isCountryDropdownOpen && "rotate-180")} />
                </button>

                {isCountryDropdownOpen && (
                  <div className="absolute z-50 w-full mt-2 bg-bg-elevated border border-border-subtle rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                    <div className="p-2 border-bottom border-border-subtle bg-bg-elevated/50 backdrop-blur-md sticky top-0">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-text-muted" />
                        <input
                          type="text"
                          autoFocus
                          value={countrySearch}
                          onChange={(e) => setCountrySearch(e.target.value)}
                          placeholder="Search countries..."
                          className="w-full bg-bg-elevated border border-border-subtle rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-brand/50"
                        />
                      </div>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {filteredCountries.length > 0 ? (
                        filteredCountries.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => {
                              setCountry(c);
                              setIsCountryDropdownOpen(false);
                              setCountrySearch('');
                            }}
                            className={cn(
                              "w-full text-left px-4 py-2.5 text-sm hover:bg-brand/10 hover:text-brand transition-colors",
                              country === c && "bg-brand/5 text-brand font-bold"
                            )}
                          >
                            {c}
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-4 text-center text-xs text-text-muted">
                          No countries found
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-4">
              <label className="block text-sm font-bold uppercase tracking-widest text-text-muted">City</label>
              <input 
                type="text" 
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Your city"
                required
                className="w-full bg-bg-elevated border border-border-subtle rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand/50" 
              />
            </div>
          </div>

          {/* What am I */}
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <label className="block text-sm font-bold uppercase tracking-widest text-text-muted flex items-center gap-2">
                <Music className="w-4 h-4" /> What am I?
              </label>
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-text-muted group-focus-within:text-brand transition-colors" />
                <input 
                  type="text"
                  value={jobSearch}
                  onChange={(e) => setJobSearch(e.target.value)}
                  placeholder="Search roles..."
                  className="bg-bg-elevated border border-border-subtle rounded-full pl-9 pr-4 py-1.5 text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:border-brand/50 w-full md:w-48"
                />
              </div>
            </div>
            <p className="text-xs text-text-muted">Select all that apply to you in the music industry.</p>
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-4 bg-bg-elevated rounded-2xl border border-border-subtle">
              {filteredJobs.length > 0 ? (
                filteredJobs.map(job => (
                  <button
                    key={job}
                    type="button"
                    onClick={() => toggleJob(job)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all",
                      selectedJobs.includes(job) 
                        ? "bg-brand text-white shadow-lg shadow-brand/20" 
                        : "bg-white/5 text-text-muted hover:text-text-primary border border-white/5"
                    )}
                  >
                    {job}
                  </button>
                ))
              ) : (
                <p className="text-[10px] text-text-muted uppercase tracking-widest p-4 w-full text-center">No matching roles found</p>
              )}
            </div>
            {selectedJobs.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {selectedJobs.map(job => (
                  <span key={job} className="bg-brand/10 text-brand px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-tighter flex items-center gap-1">
                    {job}
                    <X className="w-2 h-2 cursor-pointer" onClick={() => toggleJob(job)} />
                  </span>
                ))}
              </div>
            )}
          </div>

          <button 
            type="submit"
            disabled={isSubmitting || usernameStatus !== 'available'}
            className="w-full bg-brand hover:bg-brand-hover text-white py-4 rounded-full font-bold transition-all shadow-xl shadow-brand/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
            {isSubmitting ? 'Saving Profile...' : 'Complete Setup'}
          </button>
        </form>
      </Card>
    </div>
  );
};
