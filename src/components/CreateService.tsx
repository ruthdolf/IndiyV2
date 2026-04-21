import React, { useState, useCallback } from 'react';
import { db, collection, addDoc, handleFirestoreError, OperationType, storage, ref, uploadBytes, uploadString, uploadBytesResumable, getDownloadURL, firebaseConfig } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Service, ServiceStatus } from '../types';
import { Card } from './ui';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, X, Loader2, Image as ImageIcon, Upload, Video, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { cn } from '../lib/utils';
import { useDropzone } from 'react-dropzone';
import imageCompression from 'browser-image-compression';

interface UploadProgress {
  [key: string]: number;
}

export const CreateService: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [isFree, setIsFree] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [logs, setLogs] = useState<{ id: string, message: string, type: 'info' | 'success' | 'error' | 'progress' | 'network', timestamp: number }[]>([]);

  const addLog = (message: string, type: 'info' | 'success' | 'error' | 'progress' | 'network' = 'info') => {
    setLogs(prev => [{ id: Math.random().toString(36).substr(2, 9), message, type, timestamp: Date.now() }, ...prev].slice(0, 10));
  };
  const [category, setCategory] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [downloadFileName, setDownloadFileName] = useState<string | null>(null);
  
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress>({});

  const onDropImages = useCallback(async (acceptedFiles: File[]) => {
    if (images.length + acceptedFiles.length > 10) {
      setError('Maximum 10 images allowed');
      return;
    }

    setUploading(true);
    setError('');
    addLog(`Processing ${acceptedFiles.length} image(s)...`, 'info');

    try {
      const urls: string[] = [];
      const totalFiles = acceptedFiles.length;
      
      for (let i = 0; i < totalFiles; i++) {
        const file = acceptedFiles[i];
        addLog(`Optimizing ${file.name}...`, 'progress');
        
        // 1. Local Processing
        setProgress(prev => ({ ...prev, [file.name]: 20 }));
        
        let processedBlob: Blob = file;
        try {
          // Compress for better performance
          processedBlob = await imageCompression(file, {
            maxSizeMB: 0.5,
            maxWidthOrHeight: 1920,
            useWebWorker: false 
          });
          addLog(`Compression complete: ${file.name}`, 'success');
        } catch (compressErr) {
          addLog(`Direct upload for ${file.name} (compression skipped)`, 'info');
          console.warn('Compression skipped', compressErr);
        }
        
        setProgress(prev => ({ ...prev, [file.name]: 40 }));

        // 2. Upload to Storage
        addLog(`Uploading to Cloud: ${file.name}`, 'network');
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
        const storagePath = `services/${user?.uid}/images/${Date.now()}_${sanitizedName}`;
        const storageRef = ref(storage, storagePath);
        
        const snapshot = await uploadBytes(storageRef, processedBlob);
        const downloadURL = await getDownloadURL(snapshot.ref);
        
        urls.push(downloadURL);
        addLog(`Upload complete: ${file.name}`, 'success');
        setProgress(prev => ({ ...prev, [file.name]: 100 }));
      }

      setImages((prev) => [...prev, ...urls]);
      addLog(`Linked ${urls.length} images to your listing.`, 'success');
    } catch (err: any) {
      addLog(`Image failure: ${err.message}`, 'error');
      console.error('Image upload failure:', err);
      setError(`Failed: ${err.message || 'Image upload interrupted.'}`);
    } finally {
      setUploading(false);
      setTimeout(() => setProgress({}), 2000);
    }
  }, [images, user, storage]);
  const onDropVideo = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    
    if (file.size > 50 * 1024 * 1024) {
      setError('Video must be smaller than 50MB');
      return;
    }

    setUploading(true);
    setError('');
    addLog('Initiating video handshake...', 'network');

    if (!user) {
      addLog('Auth failure', 'error');
      setError('You must be signed in to upload videos.');
      setUploading(false);
      return;
    }

    try {
      // Sanitize
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const storagePath = `services/${user.uid}/videos/${Date.now()}_${sanitizedName}`;
      
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      addLog(`File: ${sanitizedName} (${fileSizeMB}MB)`, 'info');
      addLog(`Connecting to Storage...`, 'network');
      
      const storageRef = ref(storage, storagePath);
      
      // Use uploadBytes directly
      const snapshot = await uploadBytes(storageRef, file);
      
      addLog(`Binary stream complete.`, 'success');
      setProgress(prev => ({ ...prev, [file.name]: 90 }));

      const downloadURL = await getDownloadURL(snapshot.ref);
      setVideoUrl(downloadURL);
      addLog('Video successfully linked.', 'success');
      setProgress(prev => ({ ...prev, [file.name]: 100 }));
    } catch (err: any) {
      if (err.code === 'storage/unauthorized') {
        addLog(`PERMISSION DENIED: Storage Rules mismatch. Sync rules in Firebase Console.`, 'error');
        setError(`Security Error: Storage Rules in Console are blocking this upload.`);
      } else {
        addLog(`Video Failure: ${err.message}`, 'error');
        setError(`Upload Status: ${err.message}`);
      }
      console.error('Video upload failure:', err);
    } finally {
      setUploading(false);
      setTimeout(() => setProgress({}), 2000);
    }
  }, [user]);

  const onDropDownloadableFile = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    
    if (file.size > 100 * 1024 * 1024) {
      setError('Downloadable file must be smaller than 100MB');
      return;
    }

    setUploading(true);
    setError('');
    addLog('Initiating file handshake...', 'network');

    if (!user) {
      addLog('Auth failure', 'error');
      setError('You must be signed in to upload files.');
      setUploading(false);
      return;
    }

    try {
      // Sanitize
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const storagePath = `services/${user.uid}/downloads/${Date.now()}_${sanitizedName}`;
      
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      addLog(`File: ${sanitizedName} (${fileSizeMB}MB)`, 'info');
      addLog(`Connecting as: ${user.email} (${user.uid})`, 'network');
      
      const storageRef = ref(storage, storagePath);
      
      const snapshot = await uploadBytes(storageRef, file);

      addLog(`Binary stream complete.`, 'success');
      setProgress(prev => ({ ...prev, [file.name]: 90 }));

      const downloadURL = await getDownloadURL(snapshot.ref);
      setDownloadUrl(downloadURL);
      setDownloadFileName(file.name);
      addLog('File successfully hosted.', 'success');
      setProgress(prev => ({ ...prev, [file.name]: 100 }));
    } catch (err: any) {
      if (err.code === 'storage/unauthorized') {
        addLog(`PERMISSION DENIED: You must update your Storage Rules in the Firebase Console.`, 'error');
        setError(`Security Error: Please sync your Storage Rules in the Firebase Console.`);
      } else {
        addLog(`File Failure: ${err.message}`, 'error');
        setError(`Upload Status: ${err.message}`);
      }
      console.error('File upload failure:', err);
    } finally {
      setUploading(false);
      setTimeout(() => setProgress({}), 2000);
    }
  }, [user]);

  const { getRootProps: getImgRootProps, getInputProps: getImgInputProps, isDragActive: isImgDragActive } = useDropzone({
    onDrop: onDropImages,
    accept: { 'image/*': [] },
    disabled: uploading || images.length >= 10
  });

  const { getRootProps: getVidRootProps, getInputProps: getVidInputProps, isDragActive: isVidDragActive } = useDropzone({
    onDrop: onDropVideo,
    accept: { 'video/*': [] },
    maxFiles: 1,
    disabled: uploading || !!videoUrl
  });

  const { getRootProps: getFileRootProps, getInputProps: getFileInputProps, isDragActive: isFileDragActive } = useDropzone({
    onDrop: onDropDownloadableFile,
    maxFiles: 1,
    disabled: uploading || !!downloadUrl
  });

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const removeVideo = () => {
    setVideoUrl(undefined);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    
    // Safety check: ensure we don't submit if already busy
    if (isSubmitting || uploading) return;

    if (!user) {
      setError('You must be logged in to create a service.');
      return;
    }

    const trimmedTitle = title.trim();
    const trimmedDesc = description.trim();

    // Validation
    if (!trimmedTitle) {
      setError('Service Title is required.');
      return;
    }
    if (trimmedTitle.length > 100) {
      setError('Title must be under 100 characters.');
      return;
    }
    if (!trimmedDesc) {
      setError('Description is required.');
      return;
    }
    if (trimmedDesc.length > 2000) {
      setError('Description is too long (Max 2000 characters).');
      return;
    }
    if (!isFree && (!price || price <= 0)) {
      setError('Price must be at least $1 if not free.');
      return;
    }
    if (!category) {
      setError('Please select a category.');
      return;
    }
    if (images.length === 0) {
      setError('Please upload at least one image.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const newService: Omit<Service, 'id'> = {
        sellerId: user.uid,
        sellerName: user.displayName || 'Anonymous',
        sellerAvatar: user.photoURL || undefined,
        sellerVerified: user.verified || false,
        title: trimmedTitle,
        description: trimmedDesc,
        price: isFree ? 0 : price,
        isFree,
        downloadUrl: downloadUrl.trim() || undefined,
        category,
        images,
        videoUrl: videoUrl || null,
        createdAt: Date.now(),
        status: 'active' as ServiceStatus,
        isApproved: false, // Services start as pending approval
      };

      await addDoc(collection(db, 'services'), newService);
      navigate('/dashboard/services');
    } catch (err: any) {
      console.error('Submission failed:', err);
      const isSizeError = err?.message?.includes('maximum document size');
      const isPermissionError = err?.code === 'permission-denied' || err?.message?.includes('insufficient permissions');
      
      if (isSizeError) {
        setError('The total size of your images is too large for the database. Please remove 1-2 images.');
      } else if (isPermissionError) {
        setError('Database rejected our post. This usually means a field (like Title or Price) violates a rule. Please double-check your inputs.');
      } else {
        setError(`Failed to save: ${err.message || 'Unknown error'}`);
      }

      try {
        handleFirestoreError(err, OperationType.CREATE, 'services');
      } catch (logErr) {
        // Silently catch the re-throw
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <button 
        onClick={() => navigate('/dashboard/services')}
        className="flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors mb-8 font-bold uppercase tracking-widest text-xs"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Services
      </button>

      <div className="mb-10">
        <h1 className="text-3xl font-display font-bold mb-2">Create New Service</h1>
        <p className="text-text-muted">Fill in the details below to list your service on the Indiy marketplace.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            <Card className="p-8 space-y-6">
              <h3 className="text-xl font-bold mb-4">Basic Information</h3>
              <div className="space-y-4">
                <label className="block text-sm font-bold uppercase tracking-widest text-text-muted">Service Title</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Professional Mixing & Mastering"
                  className="w-full bg-bg-elevated border border-border-subtle rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand/50" 
                />
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-bold uppercase tracking-widest text-text-muted">Description</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your service in detail..."
                  rows={6}
                  className="w-full bg-bg-elevated border border-border-subtle rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand/50 resize-none" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-bold uppercase tracking-widest text-text-muted">Price ($)</label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted group-hover:text-brand transition-colors">Free</span>
                      <div 
                        onClick={() => setIsFree(!isFree)}
                        className={cn(
                          "w-8 h-4 rounded-full relative transition-colors",
                          isFree ? "bg-brand" : "bg-bg-elevated border border-border-subtle"
                        )}
                      >
                        <div className={cn(
                          "absolute top-0.5 w-3 h-3 rounded-full transition-all",
                          isFree ? "right-0.5 bg-white" : "left-0.5 bg-text-muted"
                        )} />
                      </div>
                    </label>
                  </div>
                  <input 
                    type="number" 
                    value={isFree ? 0 : price}
                    disabled={isFree}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    placeholder="0.00"
                    min="1"
                    className="w-full bg-bg-elevated border border-border-subtle rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand/50 disabled:opacity-50" 
                  />
                </div>
                <div className="space-y-4">
                  <label className="block text-sm font-bold uppercase tracking-widest text-text-muted">Category</label>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-bg-elevated border border-border-subtle rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand/50"
                  >
                    <option value="">Select Category</option>
                    <option value="Production">Production</option>
                    <option value="Mixing & Mastering">Mixing & Mastering</option>
                    <option value="Vocals">Vocals</option>
                    <option value="Instruments">Instruments</option>
                    <option value="Songwriting">Songwriting</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Design">Design</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-border-subtle">
                <label className="block text-sm font-bold uppercase tracking-widest text-text-muted">Instant Download File (Optional)</label>
                <div className="relative">
                  {!downloadUrl ? (
                    <div 
                      {...getFileRootProps()} 
                      className={cn(
                        "border-2 border-dashed rounded-2xl p-6 transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-2",
                        isFileDragActive ? "border-brand bg-brand/5" : "border-border-subtle hover:border-brand/50",
                        uploading && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <input {...getFileInputProps()} />
                      <Plus className="w-6 h-6 text-text-muted" />
                      <div>
                        <p className="text-xs font-bold">Upload software, eBooks, or stems</p>
                        <p className="text-[10px] text-text-muted mt-1">Stamina for files up to 100MB</p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-green-500/5 rounded-2xl border border-green-500/20 flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-text-primary truncate max-w-[200px]">
                            {downloadFileName || 'File uploaded successfully'}
                          </p>
                          <p className="text-[10px] text-text-muted">Buyers will receive this instantly after payment</p>
                        </div>
                      </div>
                      <button 
                        type="button"
                        onClick={() => {
                          setDownloadUrl('');
                          setDownloadFileName(null);
                        }}
                        className="p-1.5 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  
                  <div className="mt-2 p-3 bg-blue-500/5 rounded-xl border border-blue-500/10 flex gap-3">
                    <Info className="w-4 h-4 text-blue-400 shrink-0" />
                    <p className="text-[10px] text-text-secondary leading-relaxed">
                      For eBooks or software. Buyers get instant access after payment (or immediately if free).
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-8">
            <Card className="p-8 space-y-6">
              <h3 className="text-xl font-bold mb-4">Images & Media</h3>
              
              {/* Image Upload */}
              <div className="space-y-4">
                <label className="block text-sm font-bold uppercase tracking-widest text-text-muted">Service Images (Max 10)</label>
                <div 
                  {...getImgRootProps()} 
                  className={cn(
                    "border-2 border-dashed rounded-2xl p-8 transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-3",
                    isImgDragActive ? "border-brand bg-brand/5" : "border-border-subtle hover:border-brand/50",
                    (uploading || images.length >= 10) && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <input {...getImgInputProps()} />
                  <div className="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center text-brand">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Click or drag images here</p>
                    <p className="text-xs text-text-muted mt-1">PNG, JPG up to 10MB (will be compressed)</p>
                  </div>
                </div>

                {/* Image Progress */}
                {Object.entries(progress).map(([name, p]) => (
                  <div key={name} className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-text-muted">
                      <span className="truncate max-w-[150px]">{name}</span>
                      <span>
                        {p < 40 ? 'Shrinking...' : p < 95 ? 'Processing...' : 'Ready'} {Math.round(p)}%
                      </span>
                    </div>
                    <div className="h-1 w-full bg-bg-elevated rounded-full overflow-hidden">
                      <div className="h-full bg-brand transition-all duration-300" style={{ width: `${p}%` }} />
                    </div>
                  </div>
                ))}

                <div className="grid grid-cols-3 gap-3">
                  {images.map((img, index) => (
                    <div key={index} className="aspect-square relative rounded-xl overflow-hidden bg-bg-elevated border border-border-subtle group">
                      <img 
                        src={img} 
                        alt={`Service ${index}`} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <button 
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 p-1 bg-black/50 backdrop-blur-md rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Video Upload */}
              <div className="space-y-4">
                <label className="block text-sm font-bold uppercase tracking-widest text-text-muted">Service Video (Optional)</label>
                {!videoUrl ? (
                  <div 
                    {...getVidRootProps()} 
                    className={cn(
                      "border-2 border-dashed rounded-2xl p-6 transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-2",
                      isVidDragActive ? "border-brand bg-brand/5" : "border-border-subtle hover:border-brand/50",
                      uploading && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <input {...getVidInputProps()} />
                    <Video className="w-6 h-6 text-text-muted" />
                    <p className="text-xs font-bold">Add a video showcase (Max 50MB)</p>
                  </div>
                ) : (
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-border-subtle group">
                    <video src={videoUrl} className="w-full h-full object-contain" controls />
                    <button 
                      type="button"
                      onClick={removeVideo}
                      className="absolute top-2 right-2 p-1.5 bg-black/50 backdrop-blur-md rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-1 bg-green-500/20 backdrop-blur-md border border-green-500/30 rounded-lg text-green-500 text-[10px] font-bold uppercase tracking-widest">
                      <CheckCircle2 className="w-3 h-3" /> Video Uploaded
                    </div>
                  </div>
                )}
              </div>

              <p className="text-[10px] text-text-muted italic">High-quality media significantly increases your chances of getting hired.</p>
            </Card>

            <div className="space-y-4 pt-4">
              {/* Status Console - Technical/Verbatim design */}
              {(uploading || logs.length > 0) && (
                <div className="bg-[#151619] border border-white/5 rounded-2xl overflow-hidden font-mono text-[10px] shadow-2xl">
                  <div className="bg-white/5 px-4 py-2 border-b border-white/5 flex items-center justify-between">
                    <span className="text-text-muted uppercase tracking-widest font-bold">System Status Log</span>
                    <button onClick={() => setLogs([])} className="hover:text-white transition-colors">Clear</button>
                  </div>
                  <div className="p-4 space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar">
                    {logs.map((log) => (
                      <div key={log.id} className="flex gap-3">
                        <span className="text-text-muted opacity-30">[{new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                        <span className={cn(
                          "font-medium",
                          log.type === 'success' ? "text-green-400" :
                          log.type === 'error' ? "text-red-400" :
                          log.type === 'network' ? "text-blue-400 font-bold" :
                          "text-text-muted"
                        )}>
                          {log.message}
                        </span>
                      </div>
                    ))}
                    {uploading && (
                      <div className="flex items-center gap-2 text-brand animate-pulse mt-2">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Awaiting Bucket Response...</span>
                      </div>
                    )}
                  </div>
                  {/* Progress Bars */}
                  {Object.entries(progress).map(([name, p]) => (
                    <div key={name} className="px-4 py-3 bg-white/[0.02] border-t border-white/5">
                      <div className="flex justify-between items-center mb-1.5 italic text-text-muted">
                        <span className="truncate max-w-[200px]">{name}</span>
                        <span>{p}%</span>
                      </div>
                      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-brand transition-all duration-300 ease-out"
                          style={{ width: `${p}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm flex flex-col gap-3 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      <p className="font-medium">Upload Error</p>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setError('')} 
                      className="p-1 hover:bg-red-500/10 rounded-full transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="bg-black/20 p-3 rounded-lg overflow-auto max-h-32">
                    <pre className="text-[10px] font-mono whitespace-pre-wrap">{error}</pre>
                  </div>
                </div>
              )}

              <button 
                type="button"
                onClick={(e) => handleSubmit(e)}
                disabled={isSubmitting || uploading}
                className={cn(
                  "w-full py-4 rounded-full font-bold transition-all shadow-xl flex items-center justify-center gap-2",
                  (isSubmitting || uploading) 
                    ? "bg-bg-elevated text-text-muted cursor-not-allowed opacity-50" 
                    : "bg-brand hover:bg-brand-hover text-white shadow-brand/20 active:scale-[0.98]"
                )}
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                {isSubmitting 
                  ? 'Creating Service...' 
                  : uploading 
                    ? (
                      <span className="flex items-center gap-2">
                        {Object.values(progress).length > 0 && Math.max(...Object.values(progress)) > 0 ? (
                          `Uploading (${Math.max(...Object.values(progress))}%)`
                        ) : 'Media Processing...'}
                      </span>
                    )
                    : 'Publish Service'}
              </button>
              
              {uploading && (
                <p className="text-[10px] text-center text-text-muted mt-2">
                  Please wait while your media is processed. 
                  {Object.values(progress).some(p => p > 0 && p < 100) && (
                    <button 
                      onClick={() => setUploading(false)} 
                      className="ml-2 text-brand hover:underline underline-offset-4"
                    >
                      Stuck? Reset
                    </button>
                  )}
                </p>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
