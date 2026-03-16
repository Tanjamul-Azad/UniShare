import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { Upload, ArrowLeft, BookOpen, PenTool, Monitor, Info } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { createMarketplaceListing } from '../lib/api';
import { emitToast } from '../lib/toastBus';
import { newListingSchema } from '../lib/validation';

type ListingFieldErrors = Partial<
  Record<'title' | 'condition' | 'description' | 'price' | 'exchangeFor', string>
>;

export default function NewListing() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [listingType, setListingType] = useState<'sell' | 'share' | 'barter'>('sell');
  const [category, setCategory] = useState('Books');
  const [fieldErrors, setFieldErrors] = useState<ListingFieldErrors>({});

  const createListingMutation = useMutation({
    mutationFn: createMarketplaceListing,
    onSuccess: async (item) => {
      await queryClient.invalidateQueries({ queryKey: ['marketplace-items'] });
      await queryClient.invalidateQueries({ queryKey: ['seller-profile', 'u-current'] });
      emitToast('Listing published successfully.', 'success');
      navigate(`/marketplace/${item.id}`);
    },
    onError: () => {
      emitToast('Unable to publish listing. Please try again.', 'error');
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const title = String(formData.get('title') || '').trim();
    const condition = String(formData.get('condition') || '').trim();
    const description = String(formData.get('description') || '').trim();
    const priceRaw = String(formData.get('price') || '0');
    const exchangeFor = String(formData.get('exchangeFor') || '').trim();

    const parsed = newListingSchema.safeParse({
      title,
      category,
      listingType,
      condition,
      description,
      price: Number(priceRaw),
      exchangeFor,
    });

    if (!parsed.success) {
      const nextErrors: ListingFieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === 'string' && !(key in nextErrors)) {
          nextErrors[key as keyof ListingFieldErrors] = issue.message;
        }
      }
      setFieldErrors(nextErrors);
      emitToast('Please fix the highlighted fields.', 'error');
      return;
    }

    setFieldErrors({});
    createListingMutation.mutate(parsed.data);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto py-8 px-4">
      <Link to="/marketplace" className="inline-flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Marketplace
      </Link>

      <div className="bg-white/80 dark:bg-[#1A1A2E]/80 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-white/10 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] relative overflow-hidden">
        {/* Decorative gradients */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-emerald-500 to-amber-500" />
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 font-['Plus_Jakarta_Sans']">List an Item</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8 font-['DM_Sans']">Share, sell, or barter your stationary, books, and electronics.</p>
        
        <form onSubmit={handleSubmit} className="space-y-8 relative z-10 font-['DM_Sans']">
          
          {/* Listing Type Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Listing Type</label>
            <div className="grid grid-cols-3 gap-4">
              {(['sell', 'share', 'barter'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setListingType(type)}
                  className={cn(
                    "py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all duration-200 capitalize",
                    listingType === type 
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300" 
                      : "border-gray-200 dark:border-white/10 bg-transparent text-gray-600 dark:text-gray-400 hover:border-indigo-200 dark:hover:border-indigo-500/30"
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Category Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Category</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { id: 'Books', icon: BookOpen },
                { id: 'Stationary', icon: PenTool },
                { id: 'Electronics', icon: Monitor },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={cn(
                    "flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all duration-200",
                    category === cat.id 
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" 
                      : "border-gray-200 dark:border-white/10 bg-transparent text-gray-600 dark:text-gray-400 hover:border-emerald-200 dark:hover:border-emerald-500/30"
                  )}
                >
                  <cat.icon className="w-4 h-4" />
                  {cat.id}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Title</label>
            <input name="title" type="text" required placeholder="e.g. Introduction to Algorithms, 3rd Edition" className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white transition-all" />
            {fieldErrors.title && <p className="mt-1 text-xs text-rose-600">{fieldErrors.title}</p>}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {listingType === 'sell' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Price ($)</label>
                <input name="price" type="number" required min="0" step="0.01" placeholder="0.00" className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white transition-all" />
                {fieldErrors.price && <p className="mt-1 text-xs text-rose-600">{fieldErrors.price}</p>}
              </motion.div>
            )}
            {listingType === 'barter' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="sm:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">What are you looking for in exchange?</label>
                <input name="exchangeFor" type="text" required placeholder="e.g. A good condition calculus textbook" className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white transition-all" />
                {fieldErrors.exchangeFor && <p className="mt-1 text-xs text-rose-600">{fieldErrors.exchangeFor}</p>}
              </motion.div>
            )}
            <div className={cn(listingType !== 'sell' && listingType !== 'barter' ? "sm:col-span-2" : "")}>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Condition</label>
              <select name="condition" className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white transition-all appearance-none">
                <option value="New">New</option>
                <option value="Like New">Like New</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Poor">Poor</option>
              </select>
              {fieldErrors.condition && <p className="mt-1 text-xs text-rose-600">{fieldErrors.condition}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Description</label>
            <textarea name="description" required rows={4} placeholder="Describe the item's condition, edition, any highlights or markings..." className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-gray-900 dark:text-white transition-all"></textarea>
            {fieldErrors.description && <p className="mt-1 text-xs text-rose-600">{fieldErrors.description}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Images</label>
            <div className="border-2 border-dashed border-gray-300 dark:border-white/20 rounded-xl p-8 text-center hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer group">
              <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <Upload className="w-6 h-6 text-indigo-500" />
              </div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Click to upload or drag and drop</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">PNG, JPG up to 5MB</p>
            </div>
          </div>

          {listingType === 'share' && (
            <div className="bg-emerald-50 dark:bg-emerald-500/10 p-4 rounded-xl border border-emerald-100 dark:border-emerald-500/20 flex gap-3 items-start">
              <Info className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-sm text-emerald-800 dark:text-emerald-200">
                <strong>Sharing is caring!</strong> You are listing this item for free. Other users will be able to request it from you.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={createListingMutation.isPending}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 disabled:opacity-60 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-200 transform hover:-translate-y-0.5"
          >
            {createListingMutation.isPending ? 'Publishing...' : 'Publish Listing'}
          </button>
        </form>
      </div>
    </motion.div>
  );
}
