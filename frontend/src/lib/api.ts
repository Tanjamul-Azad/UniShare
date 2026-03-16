import { MARKETPLACE_ITEMS, SUBSCRIPTION_GROUPS, REVIEWS } from '../data/mock';

export type MarketplaceItem = (typeof MARKETPLACE_ITEMS)[number];
export type SubscriptionGroup = (typeof SUBSCRIPTION_GROUPS)[number];
export type Review = (typeof REVIEWS)[number];

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
  listingType: 'sell' | 'share' | 'barter';
  condition: string;
  description: string;
  price?: number;
  exchangeFor?: string;
};

export type CreateSubscriptionGroupInput = {
  service: string;
  listingType: 'share' | 'sublet';
  monthlyCost: number;
  totalSpots?: number;
  duration?: number;
  description: string;
};

const wait = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getMarketplaceItems(): Promise<MarketplaceItem[]> {
  await wait();
  return MARKETPLACE_ITEMS;
}

export async function getMarketplaceItemById(id: string): Promise<MarketplaceItem | undefined> {
  await wait();
  return MARKETPLACE_ITEMS.find((item) => item.id === id);
}

export async function getMarketplaceItemsBySellerId(sellerId: string): Promise<MarketplaceItem[]> {
  await wait();
  return MARKETPLACE_ITEMS.filter((item) => item.sellerId === sellerId);
}

export async function getSellerProfileById(sellerId: string): Promise<SellerProfileData | undefined> {
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
    items,
  };
}

export async function getSubscriptionGroups(): Promise<SubscriptionGroup[]> {
  await wait();
  return SUBSCRIPTION_GROUPS;
}

export async function getSubscriptionGroupById(id: string): Promise<SubscriptionGroup | undefined> {
  await wait();
  return SUBSCRIPTION_GROUPS.find((group) => group.id === id);
}

export async function getCartPreviewItems(): Promise<MarketplaceItem[]> {
  await wait();
  return [MARKETPLACE_ITEMS[0], MARKETPLACE_ITEMS[1]];
}

export async function createMarketplaceListing(
  input: CreateMarketplaceListingInput
): Promise<MarketplaceItem> {
  await wait(300);

  const item: MarketplaceItem = {
    id: `${Date.now()}`,
    title: input.title,
    type: input.listingType,
    price: input.listingType === 'sell' ? input.price ?? 0 : 0,
    exchangeFor: input.listingType === 'barter' ? input.exchangeFor : undefined,
    condition: input.condition,
    category: input.category,
    seller: 'Account Owner',
    sellerId: 'u-current',
    sellerRating: 4.9,
    reviewsCount: 0,
    description: input.description,
    image:
      'https://images.unsplash.com/photo-1517842645767-c639042777db?q=80&w=800&auto=format&fit=crop',
    sellerLastActive: 'Active Now',
  };

  MARKETPLACE_ITEMS.unshift(item);
  return item;
}

export async function createSubscriptionGroup(
  input: CreateSubscriptionGroupInput
): Promise<SubscriptionGroup> {
  await wait(300);

  const group: SubscriptionGroup = {
    id: `${Date.now()}`,
    service: input.service,
    type: input.listingType,
    totalPrice: input.monthlyCost,
    pricePerMonth:
      input.listingType === 'share'
        ? Number((input.monthlyCost / Math.max(input.totalSpots ?? 2, 1)).toFixed(2))
        : input.monthlyCost,
    totalSpots: input.listingType === 'share' ? input.totalSpots ?? 2 : 1,
    filledSpots: input.listingType === 'share' ? 1 : 0,
    owner: 'Account Owner',
    icon: 'Users',
    description: input.description,
    duration: input.listingType === 'sublet' ? input.duration : undefined,
  };

  SUBSCRIPTION_GROUPS.unshift(group);
  return group;
}
