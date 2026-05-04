import { motion } from "motion/react";
import { Package, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useApiQuery } from "../../hooks/useApiQuery";
import { getMarketplaceItems, deleteMarketplaceItem } from "../../lib/api";
import { MarketplaceItem } from "../../lib/types";
import QueryErrorState from "../../components/QueryErrorState";

export default function AdminListings() {
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: listings = [], isLoading, isError, refetch } = useApiQuery<MarketplaceItem[]>({
    queryKey: ["marketplace-items"],
    queryFn: getMarketplaceItems,
    errorMessage: "Could not load listings.",
  });

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this listing?")) return;
    setDeletingId(id);
    try {
      await deleteMarketplaceItem(id);
      await refetch();
    } catch (err) {
      console.error("Failed to delete item:", err);
      alert("Failed to delete item.");
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = listings.filter(
    (l) =>
      l.title.toLowerCase().includes(search.toLowerCase()) ||
      (l.seller || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Listings</h1>
          <p className="text-sm text-gray-500 mt-1">{listings.length} total marketplace listings</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search listings…"
            className="pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-200 bg-white w-52"
          />
        </div>
      </div>

      {isError && (
        <QueryErrorState title="Cannot load listings" message="There was a problem fetching marketplace listings." onRetry={() => void refetch()} />
      )}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_0.5fr] gap-4 px-5 py-3 text-xs font-bold uppercase tracking-wide text-gray-400 border-b border-gray-100">
          <span>Listing</span>
          <span>Seller</span>
          <span>Type</span>
          <span>Price</span>
          <span className="text-right">Actions</span>
        </div>

        {isLoading ? (
          <div className="p-5 space-y-3">
            {[1,2,3,4,5].map(i => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : filtered.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {filtered.map((item) => (
              <div key={item.id} className="grid grid-cols-[2fr_1.5fr_1fr_1fr_0.5fr] gap-4 px-5 py-4 items-center hover:bg-gray-50/50 transition-colors">
                <Link to={`/marketplace/${item.id}`} className="flex items-center gap-3 group">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                    {item.image ? (
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Package className="w-4 h-4 text-gray-400" /></div>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-gray-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">{item.title}</p>
                </Link>
                <p className="text-sm text-gray-600">{item.seller || "—"}</p>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize inline-flex w-fit ${
                  item.type === "sell" ? "bg-blue-50 text-blue-700" :
                  item.type === "barter" ? "bg-indigo-50 text-indigo-700" :
                  "bg-emerald-50 text-emerald-700"
                }`}>{item.type}</span>
                <p className="text-sm font-bold text-gray-900">
                  {item.type === "sell" ? `৳${item.price}` : item.type === "barter" ? "Barter" : "Free"}
                </p>
                <div className="text-right">
                   <button
                    onClick={() => void handleDelete(item.id)}
                    disabled={deletingId === item.id}
                    className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Delete listing"
                   >
                     <Trash2 className="w-4 h-4" />
                   </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No listings found.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
