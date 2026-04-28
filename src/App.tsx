import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { Marketplace } from './components/Marketplace';
import { ProfileSetup } from './components/ProfileSetup';
import { ServiceDetails } from './components/ServiceDetails';
import { SellerProfile } from './components/SellerProfile';
import { SellerOnboarding } from './components/SellerOnboarding';
import { UserRole } from './types';
import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Loader2 } from 'lucide-react';

// Marketplace View
// Marketplace is now in its own component file

const Login = () => {
  //() => { 'arrow function' which defines a function
  const { signIn, signInWithEmail, user, loading, isSigningIn } = useAuth();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false); //to prevent multiple clicks on the sign in button while the sign in process is ongoing
  const navigate = useNavigate(); //React Router hook that allows you to programmatically navigate to different routes, eg. after successful login, navigate to the dashboard
  
  if (loading) return <div className="p-24 text-center">Loading...</div>;
  //

  if (user) return <Navigate to="/dashboard" replace />;
  //If user is already logged in, redirect to dashboard. This prevents logged in users from seeing the login page.

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await signInWithEmail(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-24">
      <div className="bg-bg-surface border border-border-subtle rounded-[2rem] p-8 md:p-12 shadow-2xl">
        <h1 className="text-3xl font-display font-bold mb-2 text-center">Welcome Back</h1>
        <p className="text-text-muted text-center mb-8">Sign in to your Indiy account</p>
        
        <button 
          onClick={signIn}
          disabled={isSigningIn}
          className="w-full glass hover:bg-white/10 py-3 rounded-full font-semibold flex items-center justify-center gap-3 mb-6 transition-all disabled:opacity-50"
        >
          {isSigningIn ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
          )}
          {isSigningIn ? 'Opening Google...' : 'Continue with Google'}
        </button>
        
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border-subtle"></div></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-bg-surface px-2 text-text-muted">Or continue with email</span></div>
        </div>

        <form onSubmit={handleEmailSignIn} className="space-y-4">
          {error && <div className="text-red-500 text-xs text-center">{error}</div>}
          <input 
            type="email" 
            placeholder="Email address" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-bg-elevated border border-border-subtle rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand/50" 
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full bg-bg-elevated border border-border-subtle rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand/50" 
          />
          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-brand hover:bg-brand-hover text-white py-3 rounded-full font-bold transition-all shadow-lg shadow-brand/20 disabled:opacity-50"
          >
            {isSubmitting ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
        
        <p className="mt-8 text-center text-sm text-text-muted">
          Don't have an account? <Link to="/signup" className="text-brand hover:underline">Create one</Link>
        </p>
      </div>
    </div>
  );
};

const SignUp = () => {
  const { signIn, signUpWithEmail, user, loading, isSigningIn } = useAuth();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [name, setName] = React.useState('');
  const [error, setError] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const navigate = useNavigate();
  
  if (loading) return <div className="p-24 text-center">Loading...</div>;
  if (user) return <Navigate to="/dashboard" replace />;

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await signUpWithEmail(email, password, name);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-24">
      <div className="bg-bg-surface border border-border-subtle rounded-[2rem] p-8 md:p-12 shadow-2xl">
        <h1 className="text-3xl font-display font-bold mb-2 text-center">Create Account</h1>
        <p className="text-text-muted text-center mb-8">Join the Indiy marketplace</p>
        
        <button 
          onClick={signIn}
          disabled={isSigningIn}
          className="w-full glass hover:bg-white/10 py-3 rounded-full font-semibold flex items-center justify-center gap-3 mb-6 transition-all disabled:opacity-50"
        >
          {isSigningIn ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
          )}
          {isSigningIn ? 'Opening Google...' : 'Continue with Google'}
        </button>
        
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border-subtle"></div></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-bg-surface px-2 text-text-muted">Or continue with email</span></div>
        </div>

        <form onSubmit={handleEmailSignUp} className="space-y-4">
          {error && <div className="text-red-500 text-xs text-center">{error}</div>}
          <input 
            type="text" 
            placeholder="Full Name" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full bg-bg-elevated border border-border-subtle rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand/50" 
          />
          <input 
            type="email" 
            placeholder="Email address" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-bg-elevated border border-border-subtle rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand/50" 
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full bg-bg-elevated border border-border-subtle rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand/50" 
          />
          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-brand hover:bg-brand-hover text-white py-3 rounded-full font-bold transition-all shadow-lg shadow-brand/20 disabled:opacity-50"
          >
            {isSubmitting ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
        
        <p className="mt-8 text-center text-sm text-text-muted">
          Already have an account? <Link to="/login" className="text-brand hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  );
};

const ProtectedRoute = ({ children, requireProfile = true }: { children: React.ReactNode, requireProfile?: boolean }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-24 text-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (requireProfile && !user.profileComplete) return <Navigate to="/profile-setup" replace />;
  return <>{children}</>;
};

export default function App() {
  return (
    <ErrorBoundary> {/*If any code below it breaks, this catches the error so the whole browser doesn't crash*/}
      <AuthProvider> 
        <Router> {/*listens to the browser URL (eg /marketplace) and renders the appropriate component */}
          <Layout> {/*contains Navbar and Footer which are always visible, but the content in between changes based on the route*/}
            <Routes> {/*switch statement eg. if URL is /marketplace, render the Marketplace component*/}
              <Route path="/" element={<LandingPage />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/service/:id" element={<ServiceDetails />} />
              <Route path="/seller/:sellerId" element={<SellerProfile />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/profile-setup" element={
                <ProtectedRoute requireProfile={false}>
                  <ProfileSetup />
                </ProtectedRoute>
              } />
              <Route path="/dashboard/*" element={
                <ProtectedRoute>
                  <DashboardWrapper />
                </ProtectedRoute>
              } />
              <Route path="/sell" element={<SellerOnboarding />} />
              <Route path="/support" element={<div className="p-20 text-center text-3xl font-display font-bold">Support Center Coming Soon</div>} />
              <Route path="/dashboard" element={<Navigate to="/dashboard/main" replace />} />
            </Routes>
          </Layout>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

const DashboardWrapper = () => {
  const { user } = useAuth();
  if (!user) return null;
  return <Dashboard role={user.role} />;
};

import { cn } from './lib/utils';
