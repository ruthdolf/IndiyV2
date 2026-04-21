export enum UserRole {
  BUYER = 'buyer',
  SELLER = 'seller',
  ADMIN = 'admin',
  OPERATIONS = 'operations',
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  photoURL?: string;
  avatar?: string;
  createdAt: number;
  favorites?: string[];
  
  // New profile fields
  firstName?: string;
  lastName?: string;
  isRealNamePublic?: boolean;
  username?: string;
  country?: string;
  city?: string;
  musicJobs?: string[];
  profileComplete?: boolean;
  verified?: boolean;
}

export type ServiceStatus = 'active' | 'paused' | 'deleted';

export interface Service {
  id: string;
  sellerId: string;
  sellerName?: string;
  sellerAvatar?: string;
  sellerVerified?: boolean;
  title: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  videoUrl?: string;
  createdAt: number;
  status: ServiceStatus;
  rating?: number;
  reviewsCount?: number;
  
  // Admin & Instant access fields
  isFree?: boolean;
  downloadUrl?: string; // Link to the ebook/software
  isApproved?: boolean;
  rejectionReason?: string;
}

export interface Order {
  id: string;
  buyerId: string;
  sellerId: string;
  serviceId: string;
  amount: number;
  status: 'pending' | 'active' | 'completed' | 'disputed' | 'cancelled';
  createdAt: number;
}

export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  description: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  createdAt: number;
  category: 'dispute' | 'billing' | 'technical' | 'spam' | 'other';
}
