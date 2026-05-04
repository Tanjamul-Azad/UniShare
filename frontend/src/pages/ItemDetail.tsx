import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Archive, BadgeCheck, Heart, MessageSquare, RefreshCw, ShieldCheck, ShoppingCart, Star, Tag, Trash2, Pencil } from 'lucide-react';
import { cn } from '../lib/utils';
import ResponsiveImage from '../components/ResponsiveImage';
import BackButton from '../components/BackButton';
import ChatDrawer from '../components/ChatDrawer';
import { useFavorites } from '../context/FavoritesContext';
import { 
  addToCart, 
  deleteMarketplaceItem, 
  getCartPreviewItems, 
  getMarketplaceItemById, 
  updateMarketplaceItem, 
  submitBorrowRequest, 
  submitTradeProposal,
  type MarketplaceItem 
} from '../lib/api';
import { useApiQuery } from '../hooks/useApiQuery';
import QueryErrorState from '../components/QueryErrorState';
import { useAuth } from '../context/AuthContext';
import VerificationModal from '../components/VerificationModal';
import { useToast } from '../context/ToastContext';
import { useQueryClient } from '@tanstack/react-query';

export default function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { success, error: toastError } = useToast();
  const queryClient = useQueryClient();

  const [isAdding, setIsAdding] = React.useState(false);
  const [addError, setAddError] = React.useState<string | null>(null);
  const [ownerActionError, setOwnerActionError] = React.useState<string | null>(null);
  const [ownerActionPending, setOwnerActionPending] = React.useState(false);
  const [showVerificationModal, setShowVerificationModal] = React.useState(false);
  
  const [isBorrowing, setIsBorrowing] = React.useState(false);
  const [isTrading, setIsTrading] = React.useState(false);
  const [borrowError, setBorrowError] = React.useState<string | null>(null);
  const [tradeError, setTradeError] = React.useState<string | null>(null);
  const [tradeOffer, setTradeOffer] = React.useState('');
  const [showTradeModal, setShowTradeModal] = React.useState(false);
  const [isChatOpen, setIsChatOpen] = React.useState(false);

  const isVerified = user?.verificationStatus === 'verified' || user?.isVerified;

  const { data: item, isLoading: loading, isError, refetch } = useApiQuery<MarketplaceItem | undefined>({
    queryKey: ['marketplace-item', id],
    queryFn: () => (id ? getMarketplaceItemById(id) : Promise.resolve(undefined)),
    enabled: Boolean(id),
    errorMessage: 'Could not load item details.',
  });

  const { data: cartItems = [] } = useApiQuery<MarketplaceItem[]>({
    queryKey: ['cart-preview-items'],
    queryFn: getCartPreviewItems,
    enabled: Boolean(user && item),
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
    return <div className="text-center py-20 text-gray-500">Item not found</div>;
  }

  const isOwner = Boolean(item && user?.id && item.sellerId === user.id);
  const isInCart = Boolean(item && cartItems.some((cartItem) => cartItem.id === item.id));

  const handleAddToCart = async () => {
    if (!item || isAdding) {
      return;
    }
    if (isOwner || isInCart) {
      return;
    }
    if (!isVerified) {
      setShowVerificationModal(true);
      return;
    }
    setIsAdding(true);
    setAddError(null);
    try {
      await addToCart(item.id);
      success('Added to cart.');
      await queryClient.invalidateQueries({ queryKey: ['cart-preview-items'] });
    } catch (err: any) {
      setAddError(err?.message ?? 'Could not add to cart.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRequestBorrow = async () => {
    if (!item || isBorrowing) {
      return;
    }
    if (!isVerified) {
      setShowVerificationModal(true);
      return;
    }
    setIsBorrowing(true);
    setBorrowError(null);
    try {
      await submitBorrowRequest(item.id, `I would like to borrow ${item.title}`);
      success('Borrow request sent! The owner will review it.');
    } catch (err: any) {
      setBorrowError(err?.message ?? 'Could not send borrow request.');
    } finally {
      setIsBorrowing(false);
    }
  };

  const handleProposeTrade = async () => {
    if (!item || isTrading) {
      return;
    }
    if (!isVerified) {
      setShowVerificationModal(true);
      return;
    }
    setShowTradeModal(true);
  };

  const handleSubmitTrade = async () => {
    if (!item || isTrading || !tradeOffer.trim()) {
      return;
    }
    
    setIsTrading(true);
    setTradeError(null);
    try {
      await submitTradeProposal(item.id, tradeOffer);
      setTradeOffer('');
      setShowTradeModal(false);
      success('Trade proposal sent! The owner will review it.');
    } catch (err: any) {
      setTradeError(err?.message ?? 'Could not send trade proposal.');
    } finally {
      setIsTrading(false);
    }
  };

  const handleActionClick = (e: React.MouseEvent) => {
    if (!isVerified) {
      e.preventDefault();
      setShowVerificationModal(true);
      return;
    }

    if (isOwner) {
      return;
    }

    setIsChatOpen(true);
  };

  const handleMarkSold = async () => {
    if (!item || ownerActionPending) {
      return;
    }
    if (!window.confirm('Mark this listing as sold and hide it from the marketplace?')) {
      return;
    }
    setOwnerActionPending(true);
    setOwnerActionError(null);
    try {
      await updateMarketplaceItem(item.id, { isActive: false });
      success('Listing marked as sold.');
      navigate('/dashboard/listings');
    } catch (err: any) {
      setOwnerActionError(err?.message ?? 'Could not update listing status.');
    } finally {
      setOwnerActionPending(false);
    }
  };

  const handleDelete = async () => {
    if (!item || ownerActionPending) {
      return;
    }
    if (!window.confirm('Delete this listing? This removes it from the marketplace.')) {
      return;
    }
    setOwnerActionPending(true);
    setOwnerActionError(null);
    try {
      await deleteMarketplaceItem(item.id);
      success('Listing deleted.');
      navigate('/dashboard/listings');
    } catch (err: any) {
      setOwnerActionError(err?.message ?? 'Could not delete listing.');
    } finally {
      setOwnerActionPending(false);
    }
  };

  return (
    <>
      <VerificationModal 
        isOpen={showVerificationModal} 
        onClose={() => setShowVerificationModal(false)} 
      />
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 font-body"
      >
        <BackButton fallback="/marketplace" label="Back to Marketplace" className="mb-6" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            {loading ? (
              <div className="aspect-4/5 rounded-2xl bg-gray-100 animate-pulse"></div>
            ) : (
              <div className="aspect-4/5 rounded-2xl overflow-hidden bg-gray-50 border border-gray-200 relative group shadow-sm">
                <ResponsiveImage
                  src={item?.image}
                  alt={item?.title || 'Marketplace item'}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(min-width: 1024px) 40vw, 90vw"
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-4 right-4 z-10">
                  <button 
                    onClick={() => item && toggleFavorite(item.id)}
                    className="p-3 bg-white/90 backdrop-blur-md rounded-full text-gray-400 hover:text-rose-500 hover:scale-110 active:scale-95 transition-all shadow-sm"
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
                  <div className="h-6 bg-gray-100 rounded-full w-20"></div>
                  <div className="h-6 bg-gray-100 rounded-full w-24"></div>
                </div>
                <div className="h-10 bg-gray-100 rounded w-3/4 mb-4"></div>
                <div className="h-8 bg-gray-100 rounded w-1/4 mb-8"></div>
                
                <div className="space-y-2 mb-8">
                  <div className="h-4 bg-gray-100 rounded w-full"></div>
                  <div className="h-4 bg-gray-100 rounded w-full"></div>
                  <div className="h-4 bg-gray-100 rounded w-5/6"></div>
                </div>

                <div className="h-24 bg-gray-100 rounded-xl mb-8"></div>
                
                <div className="space-y-3 mt-auto">
                  <div className="h-14 bg-gray-100 rounded-xl w-full"></div>
                  <div className="h-14 bg-gray-100 rounded-xl w-full"></div>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5",
                      item?.type === 'sell' && "bg-indigo-50 text-indigo-700 border border-indigo-200",
                      item?.type === 'share' && "bg-emerald-50 text-emerald-700 border border-emerald-200",
                      item?.type === 'barter' && "bg-amber-50 text-amber-700 border border-amber-200"
                    )}>
                      {item?.type === 'sell' && <Tag className="w-3.5 h-3.5" />}
                      {item?.type === 'share' && <Heart className="w-3.5 h-3.5" />}
                      {item?.type === 'barter' && <RefreshCw className="w-3.5 h-3.5" />}
                      <span className="capitalize">{item?.type}</span>
                    </span>
                    <span className="px-3 py-1 bg-gray-50 text-gray-700 rounded-full text-xs font-semibold border border-gray-200">
                      {item?.category}
                    </span>
                    <span className="px-3 py-1 bg-gray-50 text-gray-700 rounded-full text-xs font-semibold border border-gray-200">
                      {item?.condition}
                    </span>
                  </div>
                  
                  <h1 className="text-3xl font-semibold text-gray-900 tracking-tight mb-3 font-display">
                    {item?.title}
                  </h1>
                  
                  <div className="mb-2">
                    {item?.type === 'sell' && (
                      <p className="text-3xl font-light text-gray-900">৳{item?.price.toFixed(2)}</p>
                    )}
                    {item?.type === 'share' && (
                      <p className="text-3xl font-light text-emerald-600">Free to Share</p>
                    )}
                    {item?.type === 'barter' && (
                      <div className="flex flex-col">
                        <p className="text-xl font-medium text-amber-600 flex items-center gap-2">
                          <RefreshCw className="w-5 h-5" /> Barter Request
                        </p>
                        <p className="text-gray-600 mt-1">
                          Looking for: <span className="font-medium text-gray-900">{item?.exchangeFor}</span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="prose prose-sm text-gray-600 mb-8 border-t border-gray-100 pt-6">
                  <p>{item?.description}</p>
                </div>

                {/* Seller Info */}
                <div className="bg-white rounded-2xl p-5 mb-8 border border-gray-200 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-semibold text-lg border border-indigo-100">
                      {item?.seller.charAt(0)}
                    </div>
                    <div>
                      <Link to={`/seller/${item?.sellerId}`} className="font-medium text-gray-900 hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                        {item?.seller}
                        {item?.isVerified && (
                          <BadgeCheck className="w-4 h-4 text-blue-500 fill-blue-50" />
                        )}
                      </Link>
                      <div className="flex items-center text-sm text-gray-500 mt-0.5">
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400 mr-1" />
                        <span>{item?.sellerRating} Rating</span>
                        <span className="mx-2">•</span>
                        {item?.isVerified ? (
                          <div className="flex items-center text-blue-600">
                            <ShieldCheck className="w-4 h-4 mr-1" />
                            <span className="font-medium">Verified Student</span>
                          </div>
                        ) : (
                          <div className="flex items-center text-gray-400">
                            <ShieldCheck className="w-4 h-4 mr-1" />
                            <span>Unverified User</span>
                          </div>
                        )}
                      </div>
                      {item?.sellerLastActive && (
                        <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          {item.sellerLastActive}
                        </p>
                      )}
                    </div>
                  </div>
                  {!isOwner && (
                    <button onClick={handleActionClick} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors">
                      <MessageSquare className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-auto space-y-3">
                  {addError && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                      {addError}
                    </div>
                  )}
                  {borrowError && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                      {borrowError}
                    </div>
                  )}
                  {tradeError && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                      {tradeError}
                    </div>
                  )}
                  {ownerActionError && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                      {ownerActionError}
                    </div>
                  )}

                  {isOwner && (
                    <div className="space-y-3">
                      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                        <p className="text-sm font-semibold text-gray-900">Your listing controls</p>
                        <p className="text-xs text-gray-500 mt-1">Views and interest update when buyers interact.</p>
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <Link
                            to={`/marketplace/new?edit=${item?.id}`}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                            Edit listing
                          </Link>
                          <button
                            onClick={handleMarkSold}
                            disabled={ownerActionPending}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60"
                          >
                            <Archive className="w-4 h-4" />
                            Mark sold
                          </button>
                          <button
                            onClick={handleDelete}
                            disabled={ownerActionPending}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-60"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {!isOwner && (
                    <div className="space-y-3">
                      {item?.type === 'sell' && (
                        <>
                          <div className="relative group">
                            <button
                              onClick={handleAddToCart}
                              disabled={isAdding || isInCart}
                              className="w-full py-4 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                              <ShoppingCart className="w-5 h-5" />
                              {isInCart ? 'In Cart' : isAdding ? 'Adding...' : 'Add to Cart'}
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <Link 
                              to="/checkout" 
                              onClick={handleActionClick}
                              className="w-full py-4 bg-white text-gray-900 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition-colors flex items-center justify-center shadow-sm"
                            >
                              Buy Now
                            </Link>
                            <button 
                              onClick={handleActionClick}
                              className="w-full py-4 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-xl font-medium hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2 shadow-sm"
                            >
                              <MessageSquare className="w-5 h-5" />
                              Message
                            </button>
                          </div>
                        </>
                      )}

                      {item?.type === 'share' && (
                        <button 
                          onClick={handleRequestBorrow} 
                          disabled={isBorrowing}
                          className="w-full py-4 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
                        >
                          <Heart className="w-5 h-5" />
                          {isBorrowing ? 'Requesting...' : 'Request to Borrow'}
                        </button>
                      )}

                      {item?.type === 'barter' && (
                        <button 
                          onClick={handleProposeTrade} 
                          disabled={isTrading}
                          className="w-full py-4 bg-amber-600 text-white rounded-xl font-medium hover:bg-amber-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
                        >
                          <RefreshCw className="w-5 h-5" />
                          {isTrading ? 'Proposing...' : 'Propose Trade'}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {!isOwner && (
                  <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="text-sm font-semibold text-gray-900">Plan the handoff</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Use chat to confirm delivery, pickup spot, or a fair price.
                    </p>
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button
                        onClick={handleActionClick}
                        className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Arrange pickup
                      </button>
                      <button
                        onClick={handleActionClick}
                        className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Request delivery
                      </button>
                      <button
                        onClick={handleActionClick}
                        className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Negotiate price
                      </button>
                    </div>
                  </div>
                )}

                <div className="mt-6 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                  <p className="text-sm font-medium text-emerald-900 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    UniShare Buyer Protection
                  </p>
                  <p className="text-xs text-emerald-700 mt-1">
                    {item?.type === 'sell' ? 'Your payment is held in escrow until you confirm receiving the item.' : 'Community safety guidelines apply. Always meet in public campus areas.'}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Trade Proposal Modal */}
        {showTradeModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-gray-200"
            >
              <div className="p-6 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Propose a Trade</h3>
                  <p className="text-sm text-gray-500 mt-1">Describe what you have to offer for <strong>{item?.title}</strong></p>
                </div>

                <textarea
                  value={tradeOffer}
                  onChange={(e) => setTradeOffer(e.target.value)}
                  placeholder="E.g., I can offer a used textbook on..., I have lab equipment like..., etc."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none resize-none"
                  rows={4}
                />

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowTradeModal(false)}
                    className="flex-1 py-2 px-4 text-gray-900 border border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitTrade}
                    disabled={isTrading || !tradeOffer.trim()}
                    className="flex-1 py-2 px-4 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isTrading ? 'Sending...' : 'Send Proposal'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
        {item && (
          <ChatDrawer
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
            recipientId={item.sellerId}
            recipientName={item.seller}
          />
        )}
      </motion.div>
    </>
  );
}
