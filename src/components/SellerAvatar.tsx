import React, { useEffect, useState } from 'react';
import { db, doc, getDoc } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';

interface SellerAvatarProps {
  sellerId: string;
  sellerName: string;
  className?: string;
  fallbackAvatar?: string;
}

// Global cache for seller avatars to avoid redundant fetches in lists
const avatarCache: Record<string, string> = {};

export const SellerAvatar: React.FC<SellerAvatarProps> = ({ 
  sellerId, 
  sellerName, 
  className,
  fallbackAvatar 
}) => {
  const { user } = useAuth();
  const [avatar, setAvatar] = useState<string | null>(avatarCache[sellerId] || fallbackAvatar || null);

  useEffect(() => {
    // 1. If it's the current user, priority is their local state (real-time match)
    if (user && user.uid === sellerId) {
      const currentPic = user.photoURL || (user as any).avatar;
      if (currentPic) {
        setAvatar(currentPic);
        return;
      }
    }

    // 2. If we already have a cached URL and it's not a fallback, we're good
    if (avatarCache[sellerId]) {
      setAvatar(avatarCache[sellerId]);
      return;
    }

    // 3. Fetch from Firestore for other users
    const fetchAvatar = async () => {
      try {
        const sellerRef = doc(db, 'users', sellerId);
        const sellerSnap = await getDoc(sellerRef);
        
        if (sellerSnap.exists()) {
          const data = sellerSnap.data();
          const pic = data.photoURL || data.avatar;
          if (pic) {
            avatarCache[sellerId] = pic;
            setAvatar(pic);
            return;
          }
        }
        
        // Try fallback to seller_profiles if users collection is sparse
        const profileRef = doc(db, 'seller_profiles', sellerId);
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists()) {
          const data = profileSnap.data();
          if (data.avatar) {
            avatarCache[sellerId] = data.avatar;
            setAvatar(data.avatar);
          }
        }
      } catch (err) {
        console.error('Error resolving seller avatar:', err);
      }
    };

    fetchAvatar();
  }, [sellerId, user]);

  const finalSrc = avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${sellerName}`;

  return (
    <div className={cn("rounded-full bg-bg-elevated border border-border-subtle overflow-hidden", className)}>
      <img 
        src={finalSrc} 
        alt={sellerName} 
        className="w-full h-full object-cover"
        referrerPolicy="no-referrer"
      />
    </div>
  );
};
