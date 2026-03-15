import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { User, Package, ShoppingBag, Users, LogOut, Settings, Camera, Calendar, Heart } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import { MARKETPLACE_ITEMS, SUBSCRIPTION_GROUPS } from '../data/mock';

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();
  const { favorites, toggleFavorite } = useFavorites();
  const [activeTab, setActiveTab] = useState('profile');
  
  // Profile edit state
  const [editName, setEditName] = useState(user?.name || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSaveProfile = () => {
    updateUser({ name: editName });
    // In a real app, you would also save this to your backend
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateUser({ avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  // Mock data filtering based on user name (in a real app, use user ID)
  const myListings = MARKETPLACE_ITEMS.filter(item => item.seller === user?.name || item.seller === 'Jane Doe');
  const myGroups = SUBSCRIPTION_GROUPS.filter(group => group.owner === user?.name || group.owner === 'Jane Doe');
  const savedItems = MARKETPLACE_ITEMS.filter(item => favorites.has(item.id));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto py-8 flex flex-col md:flex-row gap-8"
    >
      {/* Sidebar */}
      <div className="w-full md:w-64 space-y-2 shrink-0">
        <div className="bg-white p-6 rounded-3xl border border-gray-200 mb-6 text-center shadow-sm">
          <div className="relative w-24 h-24 mx-auto mb-4 group">
            <div className="w-24 h-24 bg-gray-100 rounded-full overflow-hidden flex items-center justify-center border-2 border-white shadow-sm">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-gray-400" />
              )}
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center text-white shadow-sm hover:bg-gray-800 transition-colors"
            >
              <Camera className="w-4 h-4" />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              accept="image/*" 
              className="hidden" 
            />
          </div>
          <h2 className="font-semibold text-gray-900 text-lg">{user?.name || 'Student'}</h2>
          <p className="text-sm text-gray-500 mb-3">{user?.email || 'student@university.edu'}</p>
          
          {user?.joinedDate && (
            <div className="flex items-center justify-center gap-1.5 text-xs text-gray-500 bg-gray-50 py-1.5 rounded-full">
              <Calendar className="w-3.5 h-3.5" />
              <span>Joined {user.joinedDate}</span>
            </div>
          )}
        </div>
        
        <nav className="space-y-1">
          <button onClick={() => setActiveTab('profile')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'profile' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
            <Settings className="w-4 h-4" /> Profile Settings
          </button>
          <button onClick={() => setActiveTab('orders')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'orders' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
            <ShoppingBag className="w-4 h-4" /> My Orders
          </button>
          <button onClick={() => setActiveTab('listings')} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'listings' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
            <div className="flex items-center gap-3">
              <Package className="w-4 h-4" /> My Listings
            </div>
            {myListings.length > 0 && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === 'listings' ? 'bg-white/20' : 'bg-gray-200'}`}>
                {myListings.length}
              </span>
            )}
          </button>
          <button onClick={() => setActiveTab('groups')} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'groups' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
            <div className="flex items-center gap-3">
              <Users className="w-4 h-4" /> My Groups
            </div>
            {myGroups.length > 0 && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === 'groups' ? 'bg-white/20' : 'bg-gray-200'}`}>
                {myGroups.length}
              </span>
            )}
          </button>
          <button onClick={() => setActiveTab('saved')} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'saved' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
            <div className="flex items-center gap-3">
              <Heart className="w-4 h-4" /> Saved Items
            </div>
          </button>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors mt-4">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 bg-white rounded-3xl border border-gray-200 p-8 shadow-sm">
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900">Profile Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input 
                  type="text" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">University Email</label>
                <input 
                  type="email" 
                  value={user?.email || ''} 
                  disabled 
                  className="w-full px-4 py-2 border border-gray-200 bg-gray-50 text-gray-500 rounded-xl outline-none" 
                />
                <p className="text-xs text-gray-500 mt-1.5">Your university email cannot be changed.</p>
              </div>
            </div>
            <button 
              onClick={handleSaveProfile}
              className="px-6 py-2.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors shadow-sm"
            >
              Save Changes
            </button>
          </div>
        )}

        {activeTab === 'orders' && (
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Order History</h3>
            <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-100 border-dashed">
              <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h4 className="text-gray-900 font-medium mb-1">No past orders found</h4>
              <p className="text-gray-500 text-sm mb-4">When you buy items, they will appear here.</p>
              <Link to="/marketplace" className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm">
                Browse Marketplace
              </Link>
            </div>
          </div>
        )}

        {activeTab === 'listings' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">My Listings</h3>
              <Link to="/marketplace/new" className="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors shadow-sm">
                List Item
              </Link>
            </div>
            
            {myListings.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {myListings.map(item => (
                  <div key={item.id} className="border border-gray-200 rounded-2xl overflow-hidden group">
                    <div className="aspect-square bg-gray-100 relative">
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-medium text-gray-700">
                        Active
                      </div>
                    </div>
                    <div className="p-4">
                      <h4 className="font-medium text-gray-900 line-clamp-1 mb-1">{item.title}</h4>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-900">${item.price}</span>
                        <Link to={`/marketplace/${item.id}`} className="text-sm text-blue-600 hover:text-blue-700 font-medium">View</Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-100 border-dashed">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h4 className="text-gray-900 font-medium mb-1">You haven't listed any items yet</h4>
                <p className="text-gray-500 text-sm mb-4">Got textbooks or stationary you don't need? Sell them here.</p>
                <Link to="/marketplace/new" className="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors shadow-sm">
                  List Your First Item
                </Link>
              </div>
            )}
          </div>
        )}

        {activeTab === 'groups' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">My Groups</h3>
              <Link to="/co-subs/new" className="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors shadow-sm">
                Create Group
              </Link>
            </div>
            
            {myGroups.length > 0 ? (
              <div className="space-y-4">
                {myGroups.map(group => (
                  <div key={group.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-2xl hover:border-gray-300 transition-colors">
                    <div>
                      <h4 className="font-medium text-gray-900">{group.service}</h4>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {group.filledSpots} of {group.totalSpots} spots filled • ${group.pricePerMonth}/mo
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full border border-emerald-100">
                        Active
                      </span>
                      <Link to={`/co-subs/${group.id}`} className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors">
                        Manage
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-100 border-dashed">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h4 className="text-gray-900 font-medium mb-1">You are not part of any groups</h4>
                <p className="text-gray-500 text-sm mb-4">Join a group to save money on subscriptions, or start your own.</p>
                <div className="flex items-center justify-center gap-3">
                  <Link to="/co-subs" className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm">
                    Browse Groups
                  </Link>
                  <Link to="/co-subs/new" className="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors shadow-sm">
                    Create Group
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'saved' && (
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Saved Items</h3>
            
            {savedItems.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedItems.map(item => (
                  <div key={item.id} className="border border-gray-200 rounded-2xl overflow-hidden group">
                    <div className="aspect-square bg-gray-100 relative">
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          toggleFavorite(item.id);
                        }}
                        className="absolute bottom-2 right-2 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-sm hover:scale-110 transition-transform z-10"
                      >
                        <Heart className="w-4 h-4 fill-rose-500 text-rose-500 transition-colors" />
                      </button>
                    </div>
                    <div className="p-4">
                      <h4 className="font-medium text-gray-900 line-clamp-1 mb-1">{item.title}</h4>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-900">${item.price}</span>
                        <Link to={`/marketplace/${item.id}`} className="text-sm text-blue-600 hover:text-blue-700 font-medium">View</Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-100 border-dashed">
                <Heart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h4 className="text-gray-900 font-medium mb-1">No saved items</h4>
                <p className="text-gray-500 text-sm mb-4">Items you favorite will appear here.</p>
                <Link to="/marketplace" className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm">
                  Browse Marketplace
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
