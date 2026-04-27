import React from 'react';
import { Star, Clock, ShieldCheck, CheckCircle2, Heart, Download } from 'lucide-react';
import { Button, Card } from './ui';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { db, doc, updateDoc, arrayUnion, arrayRemove, handleFirestoreError, OperationType } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { SellerAvatar } from './SellerAvatar';

interface ServiceCardProps { 
/*interface ...Props (properties) defines what data a component ('ServiceCard') needs
so it can be passed to another component ('Marketplace')*/
  id: string;
  sellerId: string;
  title: string;
  sellerName: string;
  sellerAvatar?: string;
  sellerVerified?: boolean;
  price: number;
  rating: number;
  reviews: number;
  images: string[];
  category: string;
  isFree?: boolean;
  downloadUrl?: string;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
//ServiceCardProps is a Type Argument ("Generic")
//By having it, the component "ServiceCard" expects props that match the ServiceCardProps interface defined above
  id,
  sellerId,
  title,
  sellerName,
  sellerAvatar,
  sellerVerified,
  price,
  rating,
  reviews,
  images,
  category,
  isFree,
  downloadUrl,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isFavorited = user?.favorites?.includes(id);
  const image = images?.[0] || `https://picsum.photos/seed/${id}/400/300`;

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        favorites: isFavorited ? arrayRemove(id) : arrayUnion(id)
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  return (
    <Card 
      className="group cursor-pointer hover:border-brand/30 transition-all duration-300"
      onClick={() => navigate(`/service/${id}`)}
    >
      <div className="aspect-[4/3] relative overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          <span className="px-2 py-1 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider text-white border border-white/10">
            {category}
          </span>
          {downloadUrl && (
            <span className="px-2 py-1 rounded-md bg-brand/80 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider text-white border border-white/10 flex items-center gap-1">
              <Download className="w-2.5 h-2.5" />
              Instant Download
            </span>
          )}
        </div>
        <button 
          onClick={toggleFavorite}
          className={cn(
            "absolute top-3 right-3 p-2 rounded-full backdrop-blur-md border transition-all duration-300",
            isFavorited 
              ? "bg-brand/20 border-brand/50 text-brand" 
              : "bg-black/40 border-white/10 text-white hover:bg-black/60"
          )}
        >
          <Heart className={cn("w-4 h-4", isFavorited && "fill-brand")} />
        </button>
      </div>
      <div className="p-5">
        <div 
          className="flex items-center gap-2 mb-2 hover:opacity-80 transition-opacity cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            const slug = sellerName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
            navigate(`/seller/${slug}`);
          }}
        >
          <SellerAvatar 
            sellerId={sellerId} 
            sellerName={sellerName}
            fallbackAvatar={sellerAvatar}
            className="w-5 h-5"
          />
          <span className="text-xs text-text-secondary hover:text-brand transition-colors">{sellerName}</span>
          {sellerVerified && <CheckCircle2 className="w-3 h-3 text-brand" />}
        </div>
        <h3 className="font-bold text-sm mb-3 line-clamp-2 group-hover:text-brand transition-colors leading-snug">
          {title}
        </h3>
        <div className="flex items-center gap-1 mb-4">
          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
          <span className="text-xs font-bold">{rating}</span>
          <span className="text-xs text-text-muted">({reviews})</span>
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-border-subtle">
          <div className="flex flex-col">
            <span className="text-[10px] text-text-muted uppercase font-bold tracking-tighter">
              {isFree ? 'Get it now' : 'Starting at'}
            </span>
            <span className="text-lg font-display font-bold text-brand">
              {isFree ? 'FREE' : `$${price.toFixed(2)}`}
            </span>
          </div>
          <Button size="sm" variant="secondary" className="rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
            View
          </Button>
        </div>
      </div>
    </Card>
  );
};
