import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc, getDocs, setDoc, collection, query, where, onSnapshot, getDocFromServer, addDoc, updateDoc, deleteDoc, arrayUnion, arrayRemove, orderBy, serverTimestamp, limit, writeBatch } from 'firebase/firestore';
import { listAll, getStorage, ref, uploadBytes, getDownloadURL, uploadBytesResumable, uploadString } from 'firebase/storage';

// Import the Firebase configuration
import firebaseConfig from '../firebase-applet-config.json';
export { firebaseConfig };

// Initialize Firebase SDK
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

// Error Handling Spec for Firestore Operations
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try { 
    // Test Connection to Firestore (storing structured data)
    // Check whether the app can access the 'services' collection
    const servicesRef = collection(db, 'services');
    const snapshot = await getDocs(query(servicesRef, limit(1))); 
    //without 'await', the next line will be executed before the data is fetched, causing an error. '
    
    console.log(`Firestore connection verified. Database is ${snapshot.empty ? 'empty' : 'not empty'}.`);
  } catch (error) {
    console.error("Firestore Connection Test Failed:", error);
  }

  try {
    // Test Connection to Firebase Storage (storing images, audio, etc.)
    const storageRoot = ref(storage, '/');
    const result = await listAll(storageRoot);
    
    // If the code reaches this line, the connection is successful
    console.log(`Firebase Storage connection verified. Bucket is ${result.items.length === 0 ? 'empty' : 'not empty'}.`);
  } catch (error) {
    console.error("Test for Firebase Storage Connection Failed, make sure 'allow read: if true' is temporarily set in your Firebase Storage security rules:", error);
  }
}
testConnection();

export { signInWithPopup, signOut, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, doc, getDoc, getDocs, setDoc, collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, arrayUnion, arrayRemove, orderBy, serverTimestamp, limit, ref, uploadBytes, getDownloadURL, uploadBytesResumable, uploadString, writeBatch };
