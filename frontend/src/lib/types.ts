export interface MarketplaceItem {
  id: string;
  title: string;
  type: 'sell' | 'share' | 'barter';
  price: number;
  condition: string;
  category: string;
  seller: string;
  sellerId: string;
  isVerified: boolean;
  sellerRating: number;
  reviewsCount: number;
  description: string;
  image: string;
  sellerLastActive: string;
  exchangeFor?: string;
}

export interface SubscriptionGroup {
  id: string;
  service: string;
  type: 'share' | 'sublet';
  totalPrice: number;
  pricePerMonth: number;
  totalSpots: number;
  filledSpots: number;
  owner: string;
  ownerId: string;
  isVerified: boolean;
  icon: string;
  description: string;
  duration?: number;
}

export interface Review {
  id: string;
  targetId: string;
  targetType: string;
  author: string;
  authorId: string;
  rating: number;
  comment: string;
  date: string;
}

export interface MockUser {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  verificationStatus: 'verified' | 'pending' | 'rejected' | 'unverified';
  isVerified: boolean;
  uiuEmail?: string;
  uiuIdNumber?: string;
  uiuIdImage?: string;
  verificationSubmittedAt?: string;
  verificationReviewedAt?: string;
  verificationNote?: string;
  joinedDate: string;
  bio?: string;
  address?: string;
  phone?: string;
  university?: string;
  major?: string;
  graduationYear?: string;
  avatar?: string;
}

export interface VerificationRequest {
  id: string;
  userId: string;
  name: string;
  email: string;
  uiuEmail: string;
  uiuIdNumber: string;
  uiuIdImage: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
  adminNote?: string;
}

export type SellerProfileData = {
  sellerId: string;
  sellerName: string;
  sellerRating: number;
  reviewsCount: number;
  sellerLastActive?: string;
  items: MarketplaceItem[];
};

export type CreateMarketplaceListingInput = {
  title: string;
  category: string;
  listingType: "sell" | "share" | "barter";
  condition: string;
  description: string;
  price?: number;
  exchangeFor?: string;
  imageUrl?: string;
  isActive?: boolean;
};

export type CreateSubscriptionGroupInput = {
  service: string;
  listingType: "share" | "sublet";
  monthlyCost: number;
  totalSpots?: number;
  duration?: number;
  description: string;
};

export type VerificationSubmissionInput = {
  name: string;
  email: string;
  uiuEmail: string;
  uiuIdNumber: string;
  uiuIdImage: string;
};

export type LoginInput = { email: string; password: string };
export type RegisterInput = {
  name: string;
  email: string;
  password: string;
  uiuEmail?: string;
  uiuIdNumber?: string;
  uiuIdImage?: string;
};

export type OrderSummary = {
  id: string;
  totalAmount: number;
  fee: number;
  status: string;
  createdAt: string;
  itemCount: number;
  items?: Array<{
    id: string;
    title?: string;
    status?: string;
    sellerNote?: string;
  }>;
};

export type OrderItem = {
  id: string;
  itemId: string;
  sellerId?: string;
  title?: string;
  type?: string;
  image?: string;
  priceAtPurchase: number;
};

export type OrderDetail = {
  id: string;
  totalAmount: number;
  fee: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
};

export type ReviewEntry = {
  id: string;
  reviewerId: string;
  reviewerName: string;
  reviewerAvatar?: string;
  sellerId: string;
  itemId?: string;
  itemTitle?: string;
  rating: number;
  comment?: string;
  createdAt: string;
};

export type DashboardStats = {
  listingsCount: number;
  groupsCount: number;
  ordersCount: number;
  savedCount: number;
  unreadMessages: number;
  unreadNotifications: number;
  recentNotifications: {
    id: string;
    type: string;
    title: string;
    message: string;
    read: boolean;
    linkUrl?: string;
    createdAt: string;
  }[];
  recentActivity: {
    id: string;
    totalAmount: number;
    status: string;
    createdAt: string;
    itemCount: number;
  }[];
  globalStats?: {
    totalUsers: number;
    totalListings: number;
    pendingVerifications: number;
  };
};

export type NotificationEntry = {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  linkUrl?: string;
  createdAt: string;
};

export interface AdminStats {
  totalUsers: number;
  verifiedUsers: number;
  pendingVerifications: number;
  rejectedVerifications: number;
  totalListings: number;
  recentVerifications: VerificationRequest[];
  recentListings: MarketplaceItem[];
  recentUsers: MockUser[];
}

export type BorrowRequest = {
  id: string;
  requesterId: string;
  itemId: string;
  status: 'pending' | 'approved' | 'rejected' | 'borrowed' | 'returned';
  message?: string;
  createdAt: string;
  reviewedAt?: string;
};

export type TradeProposal = {
  id: string;
  proposerId: string;
  itemId: string;
  offerDescription: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  createdAt: string;
  reviewedAt?: string;
};
