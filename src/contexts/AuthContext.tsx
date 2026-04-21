import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  auth, 
  onAuthStateChanged, 
  signInWithPopup, 
  googleProvider, 
  signOut, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  db, 
  doc, 
  getDoc, 
  setDoc,
  updateDoc,
  onSnapshot,
  handleFirestoreError,
  OperationType
} from '../firebase';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthReady: boolean;
  isSigningIn: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null;
    const ADMIN_EMAILS = [
      'theindiemarketplace@gmail.com',
      'chris@indiy.com',
      'theindiemarketplace@gmail.com'
    ];

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      if (firebaseUser) {
        // Listen to user document changes
        unsubscribeSnapshot = onSnapshot(doc(db, 'users', firebaseUser.uid), async (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data() as UserProfile;
            setUser(data);
            
            // Migration: Ensure admin emails always have the admin role even if record already existed
            if (ADMIN_EMAILS.includes(firebaseUser.email || '') && (data.role !== UserRole.ADMIN || !data.profileComplete)) {
              try {
                await updateDoc(doc(db, 'users', firebaseUser.uid), { 
                  role: UserRole.ADMIN,
                  profileComplete: true 
                });
              } catch (err) {
                console.error('Failed to migrate admin role:', err);
              }
            }
          } else {
            const isGlobalAdmin = ADMIN_EMAILS.includes(firebaseUser.email || '');
            // Create new user profile if it doesn't exist
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || 'Anonymous',
              role: isGlobalAdmin ? UserRole.ADMIN : UserRole.BUYER,
              photoURL: firebaseUser.photoURL || undefined,
              createdAt: Date.now(),
              profileComplete: isGlobalAdmin, // Admins don't need to be blocked by setup
            };
            try {
              await setDoc(doc(db, 'users', firebaseUser.uid), newProfile);
              // Snapshot listener will pick this up
            } catch (error) {
              handleFirestoreError(error, OperationType.CREATE, `users/${firebaseUser.uid}`);
            }
          }
          setLoading(false);
          setIsAuthReady(true);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
          setLoading(false);
          setIsAuthReady(true);
        });
      } else {
        setUser(null);
        setLoading(false);
        setIsAuthReady(true);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  const [isSigningIn, setIsSigningIn] = useState(false);

  const signIn = async () => {
    if (isSigningIn) return;
    setIsSigningIn(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      // Ignore cancelled-popup-request as it's usually just a double click or user closing the window
      if (error.code === 'auth/cancelled-popup-request') {
        console.warn('Sign-in popup request was cancelled by a newer request.');
        return;
      }
      if (error.code === 'auth/popup-closed-by-user') {
        console.warn('Sign-in popup was closed by the user.');
        return;
      }
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setIsSigningIn(true); // Keep it true for a bit to prevent rapid re-clicks
      setTimeout(() => setIsSigningIn(false), 2000);
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
      console.error('Email sign in error:', error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, pass);
      const newProfile: UserProfile = {
        uid: result.user.uid,
        email: email,
        displayName: name,
        role: UserRole.BUYER,
        createdAt: Date.now(),
        profileComplete: false,
      };
      await setDoc(doc(db, 'users', result.user.uid), newProfile);
    } catch (error) {
      console.error('Email sign up error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signInWithEmail, signUpWithEmail, logout, isAuthReady, isSigningIn }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
