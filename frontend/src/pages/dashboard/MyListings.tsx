import React from "react";
import { motion } from "motion/react";
import { Archive, Edit3, Package, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useApiQuery } from "../../hooks/useApiQuery";
import {
  deleteMarketplaceItem,
  getMarketplaceItems,
  updateMarketplaceItem,
  type MarketplaceItem,
} from "../../lib/api";
import ResponsiveImage from "../../components/ResponsiveImage";

export default function MyListings() {
  const { user } = useAuth();
  
  const [actionId, setActionId] = React.useState<string | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);

  const { data: marketplaceItems = [], refetch } = useApiQuery<MarketplaceItem[]>({
    queryKey: ["marketplace-items"],
    queryFn: getMarketplaceItems,
  });

  const myListings = marketplaceItems.filter((item) => item.sellerId === user?.id);

  const handleMarkSold = async (itemId: string) => {
    if (!window.confirm("Mark this listing as sold and hide it from the marketplace?")) {
      return;
    }
    setActionId(itemId);
    setActionError(null);
    try {
      await updateMarketplaceItem(itemId, { isActive: false });
      await refetch();
    } catch (err: any) {
      setActionError(err?.message ?? "Could not update listing status.");
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!window.confirm("Delete this listing? This removes it from the marketplace.")) {
      return;
    }
    setActionId(itemId);
    setActionError(null);
    try {
      await deleteMarketplaceItem(itemId);
      await refetch();
    } catch (err: any) {
      setActionError(err?.message ?? "Could not delete listing.");
    } finally {
      setActionId(null);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">My Listings</h3>
        <Link to="/marketplace/new" className="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors shadow-sm">
          List Item
        </Link>
      </div>
      {actionError && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {actionError}
        </div>
      )}
      {myListings.length > 0 ? (
        <div className="space-y-4">
          {myListings.map(item => (
            <div key={item.id} className="border border-gray-200 rounded-2xl overflow-hidden bg-white">
              <div className="flex flex-col sm:flex-row">
                <div className="sm:w-40 sm:shrink-0">
                  <div className="aspect-square sm:aspect-4/5 bg-gray-100 relative">
                    <ResponsiveImage
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      sizes="(min-width: 1024px) 220px, (min-width: 640px) 180px, 90vw"
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-medium text-gray-700">Active</div>
                  </div>
                </div>
                <div className="flex-1 p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="font-semibold text-gray-900 line-clamp-1">{item.title}</h4>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.description || "No description provided."}</p>
                      <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                        <span className="font-semibold text-gray-900">৳{item.price}</span>
                        <span>{item.condition}</span>
                        <span>{item.category}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link to={`/marketplace/${item.id}`} className="text-sm text-blue-600 hover:text-blue-700 font-medium">View</Link>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">{item.reviewsCount} interactions</span>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Link
                      to={`/marketplace/new?edit=${item.id}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 text-sm text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => void handleMarkSold(item.id)}
                      disabled={actionId === item.id}
                      className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 text-sm text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-colors disabled:opacity-60"
                    >
                      <Archive className="w-4 h-4" />
                      Sold
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(item.id)}
                      disabled={actionId === item.id}
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1 text-sm text-rose-600 hover:text-rose-700 hover:border-rose-300 transition-colors disabled:opacity-60"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-100 border-dashed">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h4 className="text-gray-900 font-medium mb-1">You haven't listed any items yet</h4>
          <p className="text-gray-500 text-sm mb-4">Got textbooks or stationery you no longer need? List them here.</p>
          <Link to="/marketplace/new" className="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors shadow-sm">List Your First Item</Link>
        </div>
      )}
    </motion.div>
  );
}
