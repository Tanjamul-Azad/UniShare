import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { MARKETPLACE_ITEMS } from '../data/mock';
import { Filter, Plus, Search, X, Heart } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useFavorites } from '../context/FavoritesContext';

export default function Marketplace() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const { isFavorite, toggleFavorite } = useFavorites();
  
  const handleToggleFavorite = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(id);
  };
  // Update URL when search query changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setSearchQuery(newQuery);
    if (newQuery) {
      setSearchParams({ q: newQuery });
    } else {
      setSearchParams({});
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchParams({});
  };
  
  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCondition, setSelectedCondition] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100]);

  const categories = ['All', 'Books', 'Stationary', 'Electronics', 'Dorm Essentials'];
  const conditions = ['All', 'New', 'Like New', 'Good', 'Fair'];
  const types = ['All', 'Sell', 'Share', 'Barter'];

  useEffect(() => {
    // Simulate API fetch delay
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const filteredItems = useMemo(() => {
    return MARKETPLACE_ITEMS.filter((item) => {
      // Search filter
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            item.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Category filter
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      
      // Condition filter
      const matchesCondition = selectedCondition === 'All' || item.condition === selectedCondition;

      // Type filter
      const matchesType = selectedType === 'All' || (item.type && item.type.toLowerCase() === selectedType.toLowerCase());
      
      // Price filter
      const matchesPrice = item.price >= priceRange[0] && item.price <= priceRange[1];

      return matchesSearch && matchesCategory && matchesCondition && matchesType && matchesPrice;
    });
  }, [searchQuery, selectedCategory, selectedCondition, selectedType, priceRange]);

  const resetFilters = () => {
    setSelectedCategory('All');
    setSelectedCondition('All');
    setSelectedType('All');
    setPriceRange([0, 100]);
  };

  const activeFilterCount = (selectedCategory !== 'All' ? 1 : 0) + 
                            (selectedCondition !== 'All' ? 1 : 0) + 
                            (selectedType !== 'All' ? 1 : 0) + 
                            (priceRange[0] > 0 || priceRange[1] < 100 ? 1 : 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight font-display">Marketplace</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 font-body">Buy, share, and barter study materials with peers.</p>
        </div>
        <div className="flex items-center gap-3 font-body">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors shadow-sm border",
              showFilters || activeFilterCount > 0
                ? "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white" 
                : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50"
            )}
          >
            <Filter className="w-4 h-4" />
            Filters {activeFilterCount > 0 && <span className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs rounded-full w-5 h-5 flex items-center justify-center">{activeFilterCount}</span>}
          </button>
          <Link to="/marketplace/new" className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-full text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm">
            <Plus className="w-4 h-4" />
            List Item
          </Link>
        </div>
      </div>

      {/* Search and Filters Area */}
      <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-4 font-body">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="What are you looking for?"
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-500/50 transition-all focus:bg-white dark:focus:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
          />
          {searchQuery && (
            <button 
              onClick={clearSearch}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {showFilters && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="pt-4 border-t border-gray-100 dark:border-gray-800 grid grid-cols-1 md:grid-cols-4 gap-6"
          >
            {/* Type Filter */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Listing Type</label>
              <div className="flex flex-wrap gap-2">
                {types.map(type => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                      selectedType === type 
                        ? "bg-indigo-600 text-white" 
                        : "bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Category</label>
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                      selectedCategory === cat 
                        ? "bg-indigo-600 text-white" 
                        : "bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Condition Filter */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Condition</label>
              <div className="flex flex-wrap gap-2">
                {conditions.map(cond => (
                  <button
                    key={cond}
                    onClick={() => setSelectedCondition(cond)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                      selectedCondition === cond 
                        ? "bg-indigo-600 text-white" 
                        : "bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                    )}
                  >
                    {cond}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range Filter */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Price Range</label>
                <span className="text-sm font-medium text-gray-900 dark:text-white">${priceRange[0]} - ${priceRange[1]}</span>
              </div>
              <div className="flex items-center gap-4">
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={priceRange[1]} 
                  onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                  className="w-full accent-indigo-600"
                />
              </div>
              {activeFilterCount > 0 && (
                <button 
                  onClick={resetFilters}
                  className="mt-4 text-sm text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 font-medium transition-colors"
                >
                  Reset Filters
                </button>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 font-body">
        {loading ? (
          // Skeleton Loaders
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col h-full animate-pulse">
              <div className="aspect-[4/5] rounded-2xl bg-gray-200 dark:bg-gray-800 mb-4 w-full"></div>
              <div className="space-y-2 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/4"></div>
                </div>
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/3 mt-auto pt-1"></div>
              </div>
            </div>
          ))
        ) : filteredItems.length > 0 ? (
          // Actual Content
          filteredItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
            >
              <Link to={`/marketplace/${item.id}`} className="group cursor-pointer flex flex-col h-full">
                <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 mb-4 relative border border-gray-200/50 dark:border-gray-700/50">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-3 left-3 px-2.5 py-1 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-full text-xs font-medium text-gray-700 dark:text-gray-300 shadow-sm">
                    {item.condition}
                  </div>
                  {item.type && (
                    <div className={cn(
                      "absolute top-3 right-3 px-2.5 py-1 backdrop-blur-sm rounded-full text-xs font-medium shadow-sm capitalize",
                      item.type === 'sell' ? "bg-indigo-100/90 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300" :
                      item.type === 'share' ? "bg-emerald-100/90 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300" :
                      "bg-amber-100/90 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300"
                    )}>
                      {item.type}
                    </div>
                  )}
                  <button
                    onClick={(e) => handleToggleFavorite(e, item.id)}
                    className="absolute bottom-3 right-3 p-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-full shadow-sm hover:scale-110 transition-transform z-10"
                  >
                    <Heart 
                      className={cn(
                        "w-4 h-4 transition-colors",
                        isFavorite(item.id) ? "fill-rose-500 text-rose-500" : "text-gray-400 dark:text-gray-500"
                      )} 
                    />
                  </button>
                </div>
                <div className="space-y-1 flex-1 flex flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-medium text-gray-900 dark:text-white leading-tight line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{item.title}</h3>
                    <span className="font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                      {item.type === 'sell' ? `$${item.price}` : 
                       item.type === 'share' ? 'Free' : 'Barter'}
                    </span>
                  </div>
                  <div className="mt-auto pt-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400">{item.category} • {item.seller}</p>
                    {item.sellerLastActive && (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        {item.sellerLastActive}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))
        ) : (
          // Empty State
          <div className="col-span-full py-20 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No items found</h3>
            <p className="text-gray-500 dark:text-gray-400">Try adjusting your search or filters to find what you're looking for.</p>
            {activeFilterCount > 0 && (
              <button 
                onClick={resetFilters}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-full text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
