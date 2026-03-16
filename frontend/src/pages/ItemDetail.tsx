import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Star, ShieldCheck, ShoppingCart, ArrowLeft, MessageSquare, Tag, RefreshCw, Heart } from 'lucide-react';
import { cn } from '../lib/utils';
import { useFavorites } from '../context/FavoritesContext';
import { getMarketplaceItemById, type MarketplaceItem } from '../lib/api';
import { useApiQuery } from '../hooks/useApiQuery';
import QueryErrorState from '../components/QueryErrorState';

export default function ItemDetail() {
  const { id } = useParams();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { data: item, isLoading: loading, isError, refetch } = useApiQuery<MarketplaceItem | undefined>({
    queryKey: ['marketplace-item', id],
    queryFn: () => (id ? getMarketplaceItemById(id) : Promise.resolve(undefined)),
    enabled: Boolean(id),
    errorMessage: 'Could not load item details.',
  });

  if (isError) {
    return (
      <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <QueryErrorState
          title="Item details are unavailable"
          message="We could not load this item right now."
          onRetry={() => {
            void refetch();
          }}
        />
      </div>
    );
  }

  if (!loading && !item) {
    return <div className="text-center py-20 text-gray-500 dark:text-gray-400">Item not found</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 font-body"
    >
      <Link to="/marketplace" className="inline-flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Marketplace
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Image Gallery */}
        <div className="space-y-4">
          {loading ? (
            <div className="aspect-4/5 rounded-3xl bg-gray-200 dark:bg-gray-800 animate-pulse"></div>
          ) : (
            <div className="aspect-4/5 rounded-3xl overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-800 relative group">
              <img 
                src={item?.image} 
                alt={item?.title} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-4 right-4 z-10">
                <button 
                  onClick={() => item && toggleFavorite(item.id)}
                  className="p-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-full text-gray-600 dark:text-gray-300 hover:scale-110 transition-transform shadow-sm"
                >
                  <Heart className={cn("w-5 h-5 transition-colors", item && isFavorite(item.id) ? "fill-rose-500 text-rose-500" : "")} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col">
          {loading ? (
            <div className="animate-pulse">
              <div className="flex gap-2 mb-4">
                <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded-full w-20"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded-full w-24"></div>
              </div>
              <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded w-3/4 mb-4"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/4 mb-8"></div>
              
              <div className="space-y-2 mb-8">
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-5/6"></div>
              </div>

              <div className="h-24 bg-gray-200 dark:bg-gray-800 rounded-2xl mb-8"></div>
              
              <div className="space-y-3 mt-auto">
                <div className="h-14 bg-gray-200 dark:bg-gray-800 rounded-xl w-full"></div>
                <div className="h-14 bg-gray-200 dark:bg-gray-800 rounded-xl w-full"></div>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5",
                    item?.type === 'sell' && "bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/20",
                    item?.type === 'share' && "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20",
                    item?.type === 'barter' && "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20"
                  )}>
                    {item?.type === 'sell' && <Tag className="w-3.5 h-3.5" />}
                    {item?.type === 'share' && <Heart className="w-3.5 h-3.5" />}
                    {item?.type === 'barter' && <RefreshCw className="w-3.5 h-3.5" />}
                    <span className="capitalize">{item?.type}</span>
                  </span>
                  <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-xs font-medium border border-gray-200 dark:border-gray-700">
                    {item?.category}
                  </span>
                  <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-xs font-medium border border-gray-200 dark:border-gray-700">
                    {item?.condition}
                  </span>
                </div>
                
                <h1 className="text-3xl font-semibold text-gray-900 dark:text-white tracking-tight mb-3 font-display">
                  {item?.title}
                </h1>
                
                <div className="mb-2">
                  {item?.type === 'sell' && (
                    <p className="text-3xl font-light text-indigo-600 dark:text-indigo-400">${item?.price.toFixed(2)}</p>
                  )}
                  {item?.type === 'share' && (
                    <p className="text-3xl font-light text-emerald-600 dark:text-emerald-400">Free to Share</p>
                  )}
                  {item?.type === 'barter' && (
                    <div className="flex flex-col">
                      <p className="text-xl font-medium text-amber-600 dark:text-amber-400 flex items-center gap-2">
                        <RefreshCw className="w-5 h-5" /> Barter Request
                      </p>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Looking for: <span className="font-medium text-gray-900 dark:text-white">{item?.exchangeFor}</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="prose prose-sm text-gray-600 dark:text-gray-400 mb-8">
                <p>{item?.description}</p>
              </div>

              {/* Seller Info */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 mb-8 border border-gray-200 dark:border-gray-800 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-semibold text-lg border border-indigo-200 dark:border-indigo-800">
                    {item?.seller.charAt(0)}
                  </div>
                  <div>
                    <Link to={`/seller/${item?.sellerId}`} className="font-medium text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                      {item?.seller}
                    </Link>
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400 mr-1" />
                      <span>{item?.sellerRating} Rating</span>
                      <span className="mx-2">•</span>
                      <ShieldCheck className="w-4 h-4 text-emerald-500 mr-1" />
                      <span>Verified Student</span>
                    </div>
                    {item?.sellerLastActive && (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        {item.sellerLastActive}
                      </p>
                    )}
                  </div>
                </div>
                <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-full transition-colors">
                  <MessageSquare className="w-5 h-5" />
                </button>
              </div>

              {/* Actions */}
              <div className="mt-auto space-y-3">
                {item?.type === 'sell' && (
                  <>
                    <Link to="/cart" className="w-full py-4 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-sm">
                      <ShoppingCart className="w-5 h-5" />
                      Add to Cart
                    </Link>
                    <Link to="/checkout" className="w-full py-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-center">
                      Buy Now
                    </Link>
                  </>
                )}
                
                {item?.type === 'share' && (
                  <button className="w-full py-4 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 shadow-sm">
                    <Heart className="w-5 h-5" />
                    Request to Borrow
                  </button>
                )}

                {item?.type === 'barter' && (
                  <button className="w-full py-4 bg-amber-600 text-white rounded-xl font-medium hover:bg-amber-700 transition-colors flex items-center justify-center gap-2 shadow-sm">
                    <RefreshCw className="w-5 h-5" />
                    Propose Trade
                  </button>
                )}
              </div>
              
              <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4 flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" /> 
                {item?.type === 'sell' ? 'Secure payment via Stripe. Funds held until delivery.' : 'Protected by UniShare Trust & Safety guidelines.'}
              </p>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
