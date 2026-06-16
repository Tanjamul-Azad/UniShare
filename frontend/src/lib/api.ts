import {
  MARKETPLACE_ITEMS,
  SUBSCRIPTION_GROUPS,
  REVIEWS,
  MOCK_USERS,
  VERIFICATION_REQUESTS,
} from "../data/mock";
import { apiClient } from "./apiClient";
import {
  MarketplaceItem,
  SubscriptionGroup,
  Review,
  MockUser,
  VerificationRequest,
  SellerProfileData,
  CreateMarketplaceListingInput,
  CreateSubscriptionGroupInput,
  VerificationSubmissionInput,
  LoginInput,
  RegisterInput,
  OrderSummary,
  OrderItem,
  OrderDetail,
  ReviewEntry,
  DashboardStats,
  NotificationEntry,
  AdminStats,
  BorrowRequest,
  TradeProposal,
  IncomingRequest,
  OutgoingRequest,
  RequestKind,
  RequestStatus,
  CommunityPost,
  CommunityComment,
  CommunityCategory,
  CommunityMediaType,
  CreateCommunityPostInput,
  CommunityReport,
  CommunityReportReason,
  CommunityReportStatus,
} from "./types";

export type {
  MarketplaceItem,
  SubscriptionGroup,
  Review,
  MockUser,
  VerificationRequest,
  SellerProfileData,
  CreateMarketplaceListingInput,
  CreateSubscriptionGroupInput,
  VerificationSubmissionInput,
  LoginInput,
  RegisterInput,
  OrderSummary,
  OrderItem,
  OrderDetail,
  ReviewEntry,
  DashboardStats,
  NotificationEntry,
  AdminStats,
  BorrowRequest,
  TradeProposal,
  IncomingRequest,
  OutgoingRequest,
  RequestKind,
  RequestStatus,
  CommunityPost,
  CommunityComment,
  CommunityCategory,
  CommunityMediaType,
  CreateCommunityPostInput,
  CommunityReport,
  CommunityReportReason,
  CommunityReportStatus,
};

/**
 * FEATURE FLAG: set USE_MOCK to false when connecting to the backend.
 */
const USE_MOCK = false;

const wait = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms));
const normalizeEmail = (value: string) => value.trim().toLowerCase();

// ── Auth functions (always hit the real backend) ──────────────────────────────

export async function loginUser(
  input: LoginInput & { requiredRole?: "user" | "admin" },
): Promise<{ user: MockUser; token: string }> {
  return apiClient<{ user: MockUser; token: string }>("/auth/login", {
    data: input,
  });
}

export async function registerUser(
  input: RegisterInput,
): Promise<{ user: MockUser; token: string }> {
  return apiClient<{ user: MockUser; token: string }>("/auth/register", {
    data: input,
  });
}

export async function socialLogin(
  provider: string,
  idToken: string,
  requiredRole?: "user" | "admin",
): Promise<{ user: MockUser; token: string }> {
  return apiClient<{ user: MockUser; token: string }>("/auth/social-login", {
    data: { provider, idToken, requiredRole },
  });
}

export async function updatePassword(password: string): Promise<{ message: string }> {
  return apiClient<{ message: string }>("/auth/update-password", {
    method: "POST",
    data: { password },
  });
}

export async function getCurrentUser(): Promise<MockUser> {
  return apiClient<MockUser>("/auth/me");
}

export async function requestPasswordReset(
  email: string,
): Promise<{ message: string }> {
  return apiClient<{ message: string }>("/auth/forgot-password", {
    data: { email },
  });
}

export async function resetPassword(
  token: string,
  password: string,
): Promise<{ message: string }> {
  return apiClient<{ message: string }>("/auth/reset-password", {
    data: { token, password },
  });
}

export async function getMarketplaceItems(): Promise<MarketplaceItem[]> {
  if (!USE_MOCK) {
    return apiClient<MarketplaceItem[]>("/marketplace/");
  }

  await wait();
  return MARKETPLACE_ITEMS as any;
}

export async function getMarketplaceItemById(
  id: string,
): Promise<MarketplaceItem | undefined> {
  if (!USE_MOCK) {
    return apiClient<MarketplaceItem>(`/marketplace/${id}/`);
  }

  await wait();
  return MARKETPLACE_ITEMS.find((item) => item.id === id) as any;
}

export async function getMarketplaceItemsBySellerId(
  sellerId: string,
): Promise<MarketplaceItem[]> {
  if (!USE_MOCK) {
    return apiClient<MarketplaceItem[]>(`/marketplace/?seller=${sellerId}`);
  }

  await wait();
  return MARKETPLACE_ITEMS.filter((item) => item.sellerId === sellerId) as any;
}

export async function getSellerProfileById(
  sellerId: string,
): Promise<SellerProfileData | undefined> {
  if (!USE_MOCK) {
    return apiClient<SellerProfileData>(`/seller/${sellerId}`);
  }

  await wait();
  const items = MARKETPLACE_ITEMS.filter((item) => item.sellerId === sellerId);
  const primary = items[0];

  if (!primary) {
    return undefined;
  }

  return {
    sellerId,
    sellerName: primary.seller,
    sellerRating: primary.sellerRating,
    reviewsCount: primary.reviewsCount,
    sellerLastActive: primary.sellerLastActive,
    items: items as any,
  };
}

export async function getSubscriptionGroups(): Promise<SubscriptionGroup[]> {
  if (!USE_MOCK) {
    const res = await apiClient<any>("/co-subs/");
    if (Array.isArray(res)) return res as SubscriptionGroup[];
    if (res && Array.isArray(res.value)) return res.value as SubscriptionGroup[];
    throw new Error("Unexpected response shape from /co-subs/");
  }

  await wait();
  return SUBSCRIPTION_GROUPS as any;
}

export async function getSubscriptionGroupById(
  id: string,
): Promise<SubscriptionGroup | undefined> {
  if (!USE_MOCK) {
    return apiClient<SubscriptionGroup>(`/co-subs/${id}/`);
  }

  await wait();
  return SUBSCRIPTION_GROUPS.find((group) => group.id === id) as any;
}

export async function getCartPreviewItems(): Promise<MarketplaceItem[]> {
  if (!USE_MOCK) {
    return apiClient<MarketplaceItem[]>("/cart/");
  }

  await wait();
  return [MARKETPLACE_ITEMS[0], MARKETPLACE_ITEMS[1]] as any;
}

export async function updateMarketplaceItem(
  id: string,
  input: Partial<CreateMarketplaceListingInput>,
): Promise<MarketplaceItem> {
  if (!USE_MOCK) {
    return apiClient<MarketplaceItem>(`/marketplace/${id}/`, {
      method: "PUT",
      data: input,
    });
  }

  await wait();
  const idx = MARKETPLACE_ITEMS.findIndex((item) => item.id === id);
  if (idx > -1) {
    (MARKETPLACE_ITEMS[idx] as any) = { ...MARKETPLACE_ITEMS[idx], ...input };
    return MARKETPLACE_ITEMS[idx] as any;
  }
  throw new Error("Item not found");
}

export async function deleteMarketplaceItem(id: string): Promise<void> {
  if (!USE_MOCK) {
    await apiClient<void>(`/marketplace/${id}/`, { method: "DELETE" });
    return;
  }

  await wait();
  const idx = MARKETPLACE_ITEMS.findIndex((item) => item.id === id);
  if (idx > -1) {
    MARKETPLACE_ITEMS.splice(idx, 1);
  }
}

export async function createMarketplaceListing(
  input: CreateMarketplaceListingInput,
): Promise<MarketplaceItem> {
  if (!USE_MOCK) {
    return apiClient<MarketplaceItem>("/marketplace/", { data: input });
  }

  await wait(300);

  const item: any = {
    id: `${Date.now()}`,
    title: input.title,
    type: input.listingType,
    price: input.listingType === "sell" ? (input.price ?? 0) : 0,
    exchangeFor: input.listingType === "barter" ? input.exchangeFor : undefined,
    condition: input.condition,
    category: input.category,
    seller: "Account Owner",
    sellerId: "u-current",
    isVerified: true,
    sellerRating: 4.9,
    reviewsCount: 0,
    description: input.description,
    image:
      input.imageUrl || "https://images.unsplash.com/photo-1517842645767-c639042777db?q=80&w=800&auto=format&fit=crop",
    sellerLastActive: "Active Now",
  };

  MARKETPLACE_ITEMS.unshift(item);
  return item;
}

export async function createSubscriptionGroup(
  input: CreateSubscriptionGroupInput,
): Promise<SubscriptionGroup> {
  if (!USE_MOCK) {
    return apiClient<SubscriptionGroup>("/co-subs/", { data: input });
  }

  await wait(300);

  const group: any = {
    id: `${Date.now()}`,
    service: input.service,
    type: input.listingType,
    totalPrice: input.monthlyCost,
    pricePerMonth:
      input.listingType === "share"
        ? Number(
            (input.monthlyCost / Math.max(input.totalSpots ?? 2, 1)).toFixed(2),
          )
        : input.monthlyCost,
    totalSpots: input.listingType === "share" ? (input.totalSpots ?? 2) : 1,
    filledSpots: input.listingType === "share" ? 1 : 0,
    owner: "Account Owner",
    ownerId: "u-current",
    isVerified: true,
    icon: "Users",
    description: input.description,
    duration: input.listingType === "sublet" ? input.duration : undefined,
  };

  SUBSCRIPTION_GROUPS.unshift(group);
  return group;
}

export async function getMockUserByEmail(
  email: string,
): Promise<MockUser | undefined> {
  if (!USE_MOCK) {
    return apiClient<MockUser>(
      `/users/by-email/?email=${encodeURIComponent(email)}`,
    );
  }

  await wait();
  const normalized = normalizeEmail(email);
  return MOCK_USERS.find(
    (user) =>
      normalizeEmail(user.email) === normalized ||
      normalizeEmail(user.uiuEmail ?? "") === normalized,
  ) as any;
}

export async function getAllUsers(): Promise<MockUser[]> {
  if (!USE_MOCK) {
    return apiClient<MockUser[]>("/users/");
  }

  await wait();
  return [...MOCK_USERS] as any;
}

export async function deleteUser(id: string): Promise<void> {
  if (!USE_MOCK) {
    await apiClient<void>(`/users/${id}`, { method: "DELETE" });
    return;
  }

  await wait();
  const idx = MOCK_USERS.findIndex((u) => u.id === id);
  if (idx > -1) {
    MOCK_USERS.splice(idx, 1);
  }
}

export async function updateUserRole(
  id: string,
  role: "user" | "admin",
): Promise<MockUser> {
  if (!USE_MOCK) {
    return apiClient<MockUser>(`/users/${id}/role`, {
      method: "PATCH",
      data: { role },
    });
  }

  await wait();
  const user = MOCK_USERS.find((u) => u.id === id);
  if (user) {
    (user as any).role = role;
    return user as any;
  }
  throw new Error("User not found");
}

export async function submitVerificationRequest(
  input: VerificationSubmissionInput,
): Promise<{
  user: MockUser;
  request: VerificationRequest;
}> {
  if (!USE_MOCK) {
    return apiClient<{ user: MockUser; request: VerificationRequest }>(
      "/verifications/submit/",
      {
        data: input,
      },
    );
  }

  await wait(400);

  const normalizedEmail = normalizeEmail(input.email);
  const existingIndex = MOCK_USERS.findIndex(
    (user) => normalizeEmail(user.email) === normalizedEmail,
  );
  const existingUser =
    existingIndex >= 0 ? MOCK_USERS[existingIndex] : undefined;
  const userId = existingUser ? existingUser.id : `u-${Date.now()}`;
  const submittedAt = new Date().toISOString();

  const nextUser: any = {
    id: userId,
    name: input.name,
    email: input.email,
    role: (existingUser?.role ?? "user") as "user" | "admin",
    uiuEmail: input.uiuEmail,
    uiuIdNumber: input.uiuIdNumber,
    uiuIdImage: input.uiuIdImage,
    verificationStatus: "pending",
    isVerified: false,
    verificationSubmittedAt: submittedAt,
    joinedDate:
      existingUser?.joinedDate ??
      new Date().toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      }),
  };

  if (existingIndex >= 0) {
    MOCK_USERS[existingIndex] = {
      ...MOCK_USERS[existingIndex],
      ...nextUser,
      verificationReviewedAt: undefined,
      verificationNote: undefined,
      isVerified: false,
    };
  } else {
    MOCK_USERS.unshift({ ...nextUser, isVerified: false });
  }

  const request: any = {
    id: `vr-${Date.now()}`,
    userId,
    name: input.name,
    email: input.email,
    uiuEmail: input.uiuEmail,
    uiuIdNumber: input.uiuIdNumber,
    uiuIdImage: input.uiuIdImage,
    status: "pending",
    submittedAt,
  };

  VERIFICATION_REQUESTS.unshift(request);
  return {
    user: existingIndex >= 0 ? (MOCK_USERS[existingIndex] as any) : (MOCK_USERS[0] as any),
    request,
  };
}

export async function getVerificationRequests(): Promise<
  VerificationRequest[]
> {
  if (!USE_MOCK) {
    return apiClient<VerificationRequest[]>("/verifications/");
  }

  await wait();
  return [...VERIFICATION_REQUESTS].sort((a, b) => {
    if (a.status === "pending" && b.status !== "pending") {
      return -1;
    }
    if (a.status !== "pending" && b.status === "pending") {
      return 1;
    }
    return (
      new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );
  }) as any;
}

export async function approveVerificationRequest(
  requestId: string,
  adminNote?: string,
): Promise<{
  request?: VerificationRequest;
  user?: MockUser;
}> {
  if (!USE_MOCK) {
    return apiClient<{ request?: VerificationRequest; user?: MockUser }>(
      `/verifications/${requestId}/approve/`,
      {
        data: { adminNote },
      },
    );
  }

  await wait(300);
  const request = VERIFICATION_REQUESTS.find((item) => item.id === requestId);
  if (!request) {
    return {};
  }

  (request as any).status = "approved";
  (request as any).reviewedAt = new Date().toISOString();
  (request as any).adminNote = adminNote || undefined;

  const user = MOCK_USERS.find((entry) => entry.id === (request as any).userId);
  if (user) {
    (user as any).verificationStatus = "verified";
    (user as any).isVerified = true;
    (user as any).verificationReviewedAt = (request as any).reviewedAt;
    (user as any).verificationNote = undefined;
  }

  return { request: request as any, user: user as any };
}

export async function rejectVerificationRequest(
  requestId: string,
  adminNote?: string,
): Promise<{
  request?: VerificationRequest;
  user?: MockUser;
}> {
  if (!USE_MOCK) {
    return apiClient<{ request?: VerificationRequest; user?: MockUser }>(
      `/verifications/${requestId}/reject/`,
      {
        data: { adminNote },
      },
    );
  }

  await wait(300);
  const request = VERIFICATION_REQUESTS.find((item) => item.id === requestId);
  if (!request) {
    return {};
  }

  (request as any).status = "rejected";
  (request as any).reviewedAt = new Date().toISOString();
  (request as any).adminNote =
    adminNote || "Please review and resubmit your verification.";

  const user = MOCK_USERS.find((entry) => entry.id === (request as any).userId);
  if (user) {
    (user as any).verificationStatus = "rejected";
    (user as any).isVerified = false;
    (user as any).verificationReviewedAt = (request as any).reviewedAt;
    (user as any).verificationNote = (request as any).adminNote;
  }

  return { request: request as any, user: user as any };
}

export async function updateUserProfile(
  userId: string,
  input: Partial<{
    name: string;
    phone: string;
    address: string;
    bio: string;
    university: string;
    major: string;
    graduationYear: string;
    avatar: string;
  }>,
): Promise<MockUser> {
  return apiClient<MockUser>(`/users/${userId}`, { method: "PUT", data: input });
}

export async function submitVerification(
  userId: string,
  input: {
    uiuEmail: string;
    uiuIdNumber: string;
    uiuIdImage: string;
  },
): Promise<MockUser> {
  return apiClient<MockUser>(`/users/${userId}/verify`, { method: "POST", data: input });
}

export async function addToCart(itemId: string): Promise<void> {
  await apiClient<void>("/cart/", { method: "POST", data: { itemId } });
}

export async function removeFromCart(itemId: string): Promise<void> {
  await apiClient<void>(`/cart/${itemId}`, { method: "DELETE" });
}

export async function createOrder(): Promise<{
  orderId: string;
  total: number;
  fee: number;
  subtotal: number;
  itemCount: number;
}> {
  return apiClient<{
    orderId: string;
    total: number;
    fee: number;
    subtotal: number;
    itemCount: number;
  }>("/orders/", { method: "POST" });
}

export async function initiatePayment(method?: string): Promise<{ url: string }> {
  return apiClient<{ url: string }>("/payment/init", { 
    method: "POST",
    data: { method }
  });
}

export async function getOrders(): Promise<OrderSummary[]> {
  const orders = await apiClient<
    {
      id: string;
      total_amount?: string | number;
      totalAmount?: string | number;
      fee?: string | number;
      status: string;
      created_at?: string;
      createdAt?: string;
      item_count?: string | number;
      itemCount?: string | number;
      items?: {
        id?: string | null;
        title?: string | null;
      }[];
    }[]
  >("/orders/");
  return orders.map((order) => ({
    id: order.id,
    totalAmount: Number(order.total_amount ?? order.totalAmount ?? 0),
    fee: Number(order.fee ?? 0),
    status: order.status,
    createdAt: (order.created_at ?? order.createdAt) || new Date().toISOString(),
    itemCount: Number(order.item_count ?? order.itemCount ?? 0),
    items: (order.items ?? [])
      .filter((item) => item?.id)
      .map((item) => ({
        id: String(item.id),
        title: item.title ?? undefined,
        status: (item as any).status,
        sellerNote: (item as any).sellerNote,
      })),
  }));
}

export async function getOrderById(orderId: string): Promise<OrderDetail> {
  const order = await apiClient<{
    id: string;
    total_amount?: string | number;
    totalAmount?: string | number;
    fee?: string | number;
    status: string;
    created_at?: string;
    createdAt?: string;
    items: {
      id: string;
      item_id?: string;
      itemId?: string;
      title?: string;
      type?: string;
      image_url?: string;
      image?: string;
      price_at_purchase?: string | number;
      priceAtPurchase?: string | number;
    }[];
  }>(`/orders/${orderId}`);
  return {
    id: order.id,
    totalAmount: Number(order.total_amount ?? order.totalAmount ?? 0),
    fee: Number(order.fee ?? 0),
    status: order.status,
    createdAt: (order.created_at ?? order.createdAt) || new Date().toISOString(),
    items: (order.items ?? []).map((item) => ({
      id: item.id,
      itemId: (item.item_id ?? item.itemId) || '',
      title: item.title,
      type: item.type,
      image: item.image_url ?? item.image,
      priceAtPurchase: Number(item.price_at_purchase ?? item.priceAtPurchase ?? 0),
    })),
  };
}

export async function getSales(): Promise<any[]> {
  return apiClient<any[]>("/orders/sales");
}

export async function confirmOrderItem(
  itemId: string,
  note?: string,
  status?: string,
): Promise<void> {
  await apiClient<void>(`/orders/items/${itemId}/confirm`, {
    method: "PATCH",
    data: { note, status },
  });
}

export async function getReviewsBySellerId(
  sellerId: string,
): Promise<ReviewEntry[]> {
  return apiClient<ReviewEntry[]>(`/reviews/?seller=${sellerId}`);
}

export async function submitReview(input: {
  sellerId: string;
  itemId?: string;
  rating: number;
  comment?: string;
}): Promise<ReviewEntry> {
  return apiClient<ReviewEntry>("/reviews/", { method: "POST", data: input });
}

export async function addFavorite(itemId: string): Promise<void> {
  await apiClient<void>("/favorites/", { method: "POST", data: { itemId } });
}

export async function removeFavorite(itemId: string): Promise<void> {
  await apiClient<void>(`/favorites/${itemId}`, { method: "DELETE" });
}

export async function joinSubscriptionGroup(
  groupId: string,
): Promise<SubscriptionGroup> {
  return apiClient<SubscriptionGroup>(`/co-subs/${groupId}/join`, {
    method: "POST",
  });
}

export async function leaveSubscriptionGroup(
  groupId: string,
): Promise<SubscriptionGroup> {
  return apiClient<SubscriptionGroup>(`/co-subs/${groupId}/leave`, {
    method: "DELETE",
  });
}

export async function submitBorrowRequest(
  itemId: string,
  message?: string,
): Promise<BorrowRequest> {
  return apiClient<BorrowRequest>("/borrow-requests/", {
    method: "POST",
    data: { itemId, message },
  });
}

export async function submitTradeProposal(
  itemId: string,
  offerDescription: string,
): Promise<TradeProposal> {
  return apiClient<TradeProposal>("/trade-proposals/", {
    method: "POST",
    data: { itemId, offerDescription },
  });
}

const byPendingThenNewest = (
  a: { status: string; createdAt: string },
  b: { status: string; createdAt: string },
) => {
  if (a.status === "pending" && b.status !== "pending") return -1;
  if (a.status !== "pending" && b.status === "pending") return 1;
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
};

// Borrow/trade requests received on my own listings (as the owner).
export async function getIncomingRequests(): Promise<IncomingRequest[]> {
  const [borrow, trade] = await Promise.all([
    apiClient<any[]>("/borrow-requests/incoming"),
    apiClient<any[]>("/trade-proposals/incoming"),
  ]);
  return [
    ...borrow.map((r) => ({ ...r, kind: "borrow" as RequestKind })),
    ...trade.map((r) => ({ ...r, kind: "trade" as RequestKind })),
  ].sort(byPendingThenNewest) as IncomingRequest[];
}

// Borrow/trade requests I have sent to other members (as the requester).
export async function getMyRequests(): Promise<OutgoingRequest[]> {
  const [borrow, trade] = await Promise.all([
    apiClient<any[]>("/borrow-requests/"),
    apiClient<any[]>("/trade-proposals/"),
  ]);
  return [
    ...borrow.map((r) => ({ ...r, kind: "borrow" as RequestKind })),
    ...trade.map((r) => ({ ...r, kind: "trade" as RequestKind })),
  ].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  ) as OutgoingRequest[];
}

// Status transitions an item owner can drive on an incoming request.
export type RequestAction =
  | "approved"
  | "rejected"
  | "borrowed"
  | "returned"
  | "completed";

// Owner advances the lifecycle of an incoming borrow/trade request.
export async function reviewRequest(
  kind: RequestKind,
  id: string,
  status: RequestAction,
): Promise<{ id: string; status: string; reviewedAt: string }> {
  const path =
    kind === "borrow" ? `/borrow-requests/${id}` : `/trade-proposals/${id}`;
  return apiClient(path, { method: "PATCH", data: { status } });
}

export async function getDashboardStats(): Promise<DashboardStats> {
  return apiClient<DashboardStats>("/dashboard/stats");
}

export async function getNotificationsREST(
  limit = 50,
  offset = 0,
): Promise<{ notifications: NotificationEntry[]; total: number }> {
  return apiClient<{ notifications: NotificationEntry[]; total: number }>(
    `/notifications/?limit=${limit}&offset=${offset}`,
  );
}

export async function markNotificationReadREST(id: string): Promise<void> {
  await apiClient<void>(`/notifications/${id}/read`, { method: "PATCH" });
}

export async function markAllNotificationsReadREST(): Promise<void> {
  await apiClient<void>("/notifications/read-all", { method: "PATCH" });
}

export async function getAdminStats(): Promise<AdminStats> {
  return apiClient<AdminStats>("/admin/stats");
}

// ── Community feed ─────────────────────────────────────────────────────────

export type CommunityFeedParams = {
  category?: CommunityCategory;
  urgent?: boolean;
  mine?: boolean;
  q?: string;
  limit?: number;
  offset?: number;
};

export async function getCommunityFeed(
  params: CommunityFeedParams = {},
): Promise<CommunityPost[]> {
  const qs = new URLSearchParams();
  if (params.category) qs.set("category", params.category);
  if (params.urgent) qs.set("urgent", "1");
  if (params.mine) qs.set("mine", "1");
  if (params.q) qs.set("q", params.q);
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.offset) qs.set("offset", String(params.offset));
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return apiClient<CommunityPost[]>(`/community/${suffix}`);
}

export async function getCommunityPost(id: string): Promise<CommunityPost> {
  return apiClient<CommunityPost>(`/community/${id}`);
}

export async function createCommunityPost(
  input: CreateCommunityPostInput,
): Promise<CommunityPost> {
  return apiClient<CommunityPost>("/community/", { data: input });
}

export async function deleteCommunityPost(id: string): Promise<void> {
  await apiClient<void>(`/community/${id}`, { method: "DELETE" });
}

export async function toggleCommunityLike(
  id: string,
): Promise<{ liked: boolean; likeCount: number }> {
  return apiClient(`/community/${id}/like`, { method: "POST" });
}

export async function resolveCommunityPost(
  id: string,
  resolved: boolean,
): Promise<CommunityPost> {
  return apiClient<CommunityPost>(`/community/${id}/resolve`, {
    method: "PATCH",
    data: { resolved },
  });
}

export async function getCommunityComments(
  id: string,
): Promise<CommunityComment[]> {
  return apiClient<CommunityComment[]>(`/community/${id}/comments`);
}

export async function addCommunityComment(
  id: string,
  content: string,
): Promise<CommunityComment> {
  return apiClient<CommunityComment>(`/community/${id}/comments`, {
    data: { content },
  });
}

export async function deleteCommunityComment(commentId: string): Promise<void> {
  await apiClient<void>(`/community/comments/${commentId}`, {
    method: "DELETE",
  });
}

export async function reportCommunityPost(
  postId: string,
  reason: CommunityReportReason,
  description?: string,
): Promise<{ message: string }> {
  return apiClient<{ message: string }>(`/community/${postId}/report`, {
    method: "POST",
    data: { reason, description },
  });
}

export async function getAdminReports(): Promise<CommunityReport[]> {
  return apiClient<CommunityReport[]>("/admin/reports");
}

export async function resolveAdminReport(
  reportId: string,
  action: "dismissed" | "banned" | "restricted",
): Promise<CommunityReport> {
  return apiClient<CommunityReport>(`/admin/reports/${reportId}`, {
    method: "PATCH",
    data: { action },
  });
}

export async function updateUserAccountStatus(
  userId: string,
  status: "active" | "banned" | "restricted",
): Promise<{ id: string; accountStatus: string }> {
  return apiClient<{ id: string; accountStatus: string }>(`/admin/users/${userId}/status`, {
    method: "PATCH",
    data: { status },
  });
}
