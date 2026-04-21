import React, { useState, useEffect } from 'react';
import { Card, Button, Input } from './ui';
import { Upload, User, CheckCircle2, AlertCircle, Info, Loader2, Camera } from 'lucide-react';
import { db, storage, ref, uploadBytes, uploadString, uploadBytesResumable, getDownloadURL, doc, updateDoc, getDoc, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import imageCompression from 'browser-image-compression';
import { cn } from '../lib/utils';

export const ProfileSettings: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [uploadStatus, setUploadStatus] = useState<string>('');

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      setLoading(true);
      try {
        // Fetch from users collection
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setDisplayName(userData.displayName || '');
          setAvatarUrl(userData.avatar || userData.photoURL || null);
        }

        // Fetch from seller_profiles if exists
        const sellerDoc = await getDoc(doc(db, 'seller_profiles', user.uid));
        if (sellerDoc.exists()) {
          const sellerData = sellerDoc.data();
          setBio(sellerData.bio || '');
          if (sellerData.avatar) setAvatarUrl(sellerData.avatar);
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file.');
      return;
    }

    setUploading(true);
    setUploadProgress(10);
    setUploadStatus('Reading...');
    setError(null);

    try {
      console.log('Avatar Start:', file.name, file.size);
      
      // 1. Optimize
      let processedBlob: Blob = file;
      try {
        setUploadStatus('Optimizing...');
        setUploadProgress(30);
        
        // Better quality for storage
        processedBlob = await imageCompression(file, {
          maxSizeMB: 0.2,
          maxWidthOrHeight: 500,
          useWebWorker: false,
        });
        
        console.log('Avatar optimized:', processedBlob.size);
      } catch (err) {
        console.warn('Compression failed, using original', err);
      }

      // 2. Upload to Storage
      setUploadStatus('Uploading...');
      setUploadProgress(60);
      
      const storagePath = `avatars/${user.uid}/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, storagePath);
      
      const snapshot = await uploadBytes(storageRef, processedBlob);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // 3. Save to Firestore (Instant)
      setUploadStatus('Saving...');
      setUploadProgress(85);
      
      const userRef = doc(db, 'users', user.uid);
      const sellerRef = doc(db, 'seller_profiles', user.uid);
      
      // Update both possible names for compatibility
      const updates = { 
        avatar: downloadURL,
        photoURL: downloadURL 
      };
      
      await updateDoc(userRef, updates);
      
      try {
        const sellerDoc = await getDoc(sellerRef);
        if (sellerDoc.exists()) {
          await updateDoc(sellerRef, updates);
        }
      } catch (e) {
        console.warn('Seller profile update skipped', e);
      }
      
      setAvatarUrl(downloadURL);
      setUploadProgress(100);
      setUploadStatus('Done!');
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Avatar failure:', err);
      setError(`Failed: ${err.message || 'Check your image type'}`);
    } finally {
      setTimeout(() => {
        setUploading(false);
        setUploadStatus('');
        setUploadProgress(0);
      }, 1000);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const updates: any = { displayName };
      if (avatarUrl) updates.avatar = avatarUrl;
      
      await updateDoc(doc(db, 'users', user.uid), updates);
      
      const sellerDoc = await getDoc(doc(db, 'seller_profiles', user.uid));
      if (sellerDoc.exists()) {
        await updateDoc(doc(db, 'seller_profiles', user.uid), {
          displayName,
          bio,
          avatar: avatarUrl
        });
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
      setError('Failed to save profile.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !displayName) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-display font-bold mb-2">Profile Settings</h1>
        <p className="text-text-muted">Manage your public profile and account information.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-8">
            <div className="space-y-8">
              {/* Avatar Section */}
              <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-full bg-bg-elevated border-4 border-bg-surface overflow-hidden shadow-xl">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-brand/10 text-brand">
                        <User className="w-12 h-12" />
                      </div>
                    )}
                    {uploading && (
                      <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center p-2">
                        <div className="w-full bg-white/20 h-1 rounded-full overflow-hidden mb-1">
                          <div 
                            className="h-full bg-brand transition-all duration-300" 
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                        <span className="text-[8px] font-bold text-white uppercase tracking-widest text-center px-1">
                          {uploadStatus || `${Math.round(uploadProgress)}%`}
                        </span>
                      </div>
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 p-2 bg-brand text-white rounded-full cursor-pointer shadow-lg hover:bg-brand-hover transition-all group-hover:scale-110">
                    <Camera className="w-4 h-4" />
                    <input 
                      type="file" 
                      className="hidden" 
                      onChange={handleAvatarUpload}
                      accept="image/*"
                    />
                  </label>
                </div>

                <div className="flex-grow space-y-4 text-center md:text-left">
                  <div>
                    <h3 className="text-xl font-bold">Profile Picture</h3>
                    <p className="text-sm text-text-muted">Upload a professional photo or logo. JPG, PNG or GIF.</p>
                  </div>
                  <div className="flex flex-wrap justify-center md:justify-start gap-3">
                    <Button 
                      variant="outline" 
                      className="relative overflow-hidden"
                      isLoading={uploading}
                      onClick={() => document.getElementById('avatar-input')?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Change Photo
                    </Button>
                    <input 
                      id="avatar-input"
                      type="file" 
                      className="hidden" 
                      onChange={handleAvatarUpload}
                      accept="image/*"
                    />
                    {avatarUrl && (
                      <Button variant="ghost" onClick={() => setAvatarUrl(null)} className="text-red-400 hover:text-red-300">
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-6 pt-8 border-t border-border-subtle">
                <div>
                  <label className="block text-sm font-bold uppercase tracking-widest text-text-muted mb-2">Display Name</label>
                  <Input 
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your public name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold uppercase tracking-widest text-text-muted mb-2">Professional Bio</label>
                  <textarea 
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell the world about your expertise..."
                    className="w-full h-32 bg-bg-elevated border border-border-subtle rounded-2xl p-4 text-sm focus:outline-none focus:border-brand/50 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-border-subtle flex items-center justify-between">
              <div className="flex items-center gap-2">
                {success && (
                  <span className="text-green-400 text-sm flex items-center gap-1 animate-in fade-in slide-in-from-left-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Profile updated successfully
                  </span>
                )}
                {error && (
                  <span className="text-red-400 text-sm flex items-center gap-1 animate-in fade-in slide-in-from-left-2">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </span>
                )}
              </div>
              <Button onClick={handleSaveProfile} isLoading={loading}>
                Save Changes
              </Button>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6 bg-brand/5 border-brand/10">
            <h4 className="font-bold mb-3 flex items-center gap-2">
              <Info className="w-4 h-4 text-brand" />
              Public Profile
            </h4>
            <p className="text-sm text-text-secondary leading-relaxed">
              Your display name and bio will be visible on your seller profile and service listings. 
              Keep it professional to attract more buyers.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};
