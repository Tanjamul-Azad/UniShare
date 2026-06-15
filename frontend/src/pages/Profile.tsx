import { useRef, useState } from "react";
import { motion } from "motion/react";
import { useAuth } from "../context/AuthContext";
import { 
  Bell, 
  Check, 
  ExternalLink, 
  Package, 
  Star, 
  User, 
  LogOut, 
  ShieldCheck, 
  AlertCircle, 
  Clock,
  ShoppingBag,
  Camera,
  Edit3,
  X,
  MapPin,
  GraduationCap,
  Calendar,
  BookOpen,
  Phone,
  Mail,
  BadgeCheck,
  ShieldAlert
} from "lucide-react";
import { useApiQuery } from "../hooks/useApiQuery";
import { useQueryClient } from "@tanstack/react-query";
import { getMarketplaceItems, updateUserProfile, confirmOrderItem } from "../lib/api";
import { MarketplaceItem } from "../lib/types";
import { Link } from "react-router-dom";
import BackButton from "../components/BackButton";
import ResponsiveImage from "../components/ResponsiveImage";

// ── Inline edit field ──────────────────────────────────────────────
function EditableField({
  label, value, onSave, type = "text", multiline = false, placeholder,
}: {
  label: string; value: string; onSave: (v: string) => Promise<void>;
  type?: string; multiline?: boolean; placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (draft === value) { setEditing(false); return; }
    setSaving(true);
    await onSave(draft);
    setSaving(false);
    setEditing(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-semibold uppercase tracking-widest text-gray-400">{label}</label>
        {!editing && (
          <button onClick={() => { setDraft(value); setEditing(true); }} className="text-gray-400 hover:text-indigo-600 transition-colors p-0.5 rounded">
            <Edit3 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {editing ? (
        <div className="flex items-start gap-2">
          {multiline ? (
            <textarea
              autoFocus
              rows={3}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={placeholder}
              className="flex-1 border border-indigo-300 rounded-xl px-3 py-2 text-sm text-gray-800 outline-none resize-none focus:ring-2 focus:ring-indigo-200"
            />
          ) : (
            <input
              autoFocus type={type} value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={placeholder}
              className="flex-1 border border-indigo-300 rounded-xl px-3 py-2 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-indigo-200"
            />
          )}
          <div className="flex flex-col gap-1 mt-1">
            <button onClick={handleSave} disabled={saving} className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              <Check className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setEditing(false)} className="p-1.5 bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-800 min-h-[1.5rem]">{value || <span className="text-gray-400 italic">Not set</span>}</p>
      )}
    </div>
  );
}

const VERIFICATION_CONFIG = {
  verified:   { label: "Verified",       icon: BadgeCheck, cls: "bg-emerald-50 border-emerald-200 text-emerald-700" },
  pending:    { label: "Pending Review",  icon: Clock,      cls: "bg-amber-50 border-amber-200 text-amber-700"   },
  rejected:   { label: "Action Needed",  icon: ShieldAlert, cls: "bg-rose-50 border-rose-200 text-rose-700"    },
  unverified: { label: "Unverified",      icon: ShieldAlert, cls: "bg-gray-50 border-gray-200 text-gray-600"   },
} as const;

export default function Profile() {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const { data: marketplaceItems = [] } = useApiQuery<MarketplaceItem[]>({
    queryKey: ["marketplace-items"],
    queryFn: getMarketplaceItems,
  });

  const { data: orders = [] } = useApiQuery<any[]>({
    queryKey: ["orders"],
    queryFn: () => import("../lib/api").then(m => m.getOrders()),
  });

  const { data: sales = [] } = useApiQuery<any[]>({
    queryKey: ["sales"],
    queryFn: () => import("../lib/api").then(m => m.getSales()),
  });

  const [activeTab, setActiveTab] = useState<"listings" | "orders" | "sales">("listings");

  const myListings = marketplaceItems.filter((item) => item.seller === user?.name || item.sellerId === user?.id);

  const verStatus = user?.verificationStatus ?? (user?.isVerified ? "verified" : "unverified");
  const verConfig = VERIFICATION_CONFIG[verStatus as keyof typeof VERIFICATION_CONFIG] ?? VERIFICATION_CONFIG.unverified;
  const VerIcon = verConfig.icon;

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const avatar = reader.result as string;
      setSaving(true);
      try {
        const updated = await updateUserProfile(user.id, { avatar });
        updateUser(updated as any);
      } finally { setSaving(false); }
    };
    reader.readAsDataURL(file);
  };

  const makeFieldSaver = (field: string) => async (value: string) => {
    if (!user) return;
    const updated = await updateUserProfile(user.id, { [field]: value });
    updateUser(updated as any);
  };

  if (!user) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <BackButton fallback="/dashboard" className="mb-2" />

      {/* ── Hero Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
      >
        {/* Cover */}
        <div className="h-40 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-400 relative">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_50%,white,transparent_60%)]" />
        </div>

        <div className="px-6 sm:px-8 pb-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-16 mb-6 gap-4">
            {/* Avatar */}
            <div
              className="relative w-28 h-28 rounded-full border-4 border-white shadow-md cursor-pointer group shrink-0"
              onClick={() => fileInputRef.current?.click()}
            >
              {user.avatar ? (
                <ResponsiveImage
                  src={user.avatar}
                  alt={user.name}
                  className="w-full h-full rounded-full object-cover"
                  sizes="112px"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-indigo-100 flex items-center justify-center">
                  <User className="w-10 h-10 text-indigo-400" />
                </div>
              )}
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-6 h-6 text-white" />
              </div>
              {saving && (
                <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 mb-2">
              <Link
                to="/dashboard/settings"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors shadow-sm"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit Profile
              </Link>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors"
              >
                Dashboard
              </Link>
            </div>
          </div>

          {/* Identity */}
          <div className="space-y-2 mb-6">
            <div className="flex items-center flex-wrap gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{user.name || "Member"}</h1>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${verConfig.cls}`}>
                <VerIcon className="w-3.5 h-3.5" />
                {verConfig.label}
              </span>
            </div>
            <p className="text-gray-500 text-sm">{user.bio || "No bio yet."}</p>
          </div>

          {/* Meta chips */}
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-500">
            {user.email && (
              <span className="flex items-center gap-1.5"><Mail className="w-4 h-4 text-gray-400" />{user.email}</span>
            )}
            {user.phone && (
              <span className="flex items-center gap-1.5"><Phone className="w-4 h-4 text-gray-400" />{user.phone}</span>
            )}
            {user.university && (
              <span className="flex items-center gap-1.5"><GraduationCap className="w-4 h-4 text-gray-400" />{user.university}</span>
            )}
            {user.major && (
              <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-gray-400" />{user.major}</span>
            )}
            {user.graduationYear && (
              <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-gray-400" />Class of {user.graduationYear}</span>
            )}
            {user.address && (
              <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-gray-400" />{user.address}</span>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── Info + Listings Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Edit Info */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="lg:col-span-1 space-y-4"
        >
          {/* Basic Info */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
            <h2 className="text-sm font-bold text-gray-900 tracking-tight">Basic Information</h2>
            <EditableField label="Full Name" value={user.name || ""} onSave={makeFieldSaver("name")} placeholder="Your full name" />
            <EditableField label="Phone" value={user.phone || ""} onSave={makeFieldSaver("phone")} type="tel" placeholder="+880 1xxx xxxxxx" />
            <EditableField label="Address" value={user.address || ""} onSave={makeFieldSaver("address")} placeholder="Your campus address" />
            <EditableField label="Bio" value={user.bio || ""} onSave={makeFieldSaver("bio")} multiline placeholder="Tell others about yourself..." />
          </div>

          {/* Academic */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
            <h2 className="text-sm font-bold text-gray-900 tracking-tight">Academic Details</h2>
            <EditableField label="University" value={user.university || ""} onSave={makeFieldSaver("university")} placeholder="e.g. UIU" />
            <EditableField label="Major / Department" value={user.major || ""} onSave={makeFieldSaver("major")} placeholder="e.g. Computer Science" />
            <EditableField label="Graduation Year" value={user.graduationYear || ""} onSave={makeFieldSaver("graduationYear")} placeholder="e.g. 2026" />
          </div>

          {/* Verification */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-sm font-bold text-gray-900 tracking-tight mb-4">UIU Verification</h2>
            <div className={`flex items-center gap-3 p-3 rounded-xl border ${verConfig.cls} mb-4`}>
              <VerIcon className="w-5 h-5 shrink-0" />
              <div>
                <p className="text-xs font-semibold">{verConfig.label}</p>
                {verStatus === "rejected" && user.verificationNote && (
                  <p className="text-xs mt-0.5 opacity-80">Note: {user.verificationNote}</p>
                )}
              </div>
            </div>
            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex justify-between"><span className="text-gray-400 font-medium">UIU Email</span><span>{user.uiuEmail || "—"}</span></div>
              <div className="flex justify-between"><span className="text-gray-400 font-medium">ID Number</span><span>{user.uiuIdNumber || "—"}</span></div>
              <div className="flex justify-between"><span className="text-gray-400 font-medium">ID Card</span><span>{user.uiuIdImage ? "Uploaded ✓" : "—"}</span></div>
            </div>
            {(verStatus === "unverified" || verStatus === "rejected") && (
              <Link to="/dashboard/settings" className="mt-4 block text-center py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition-colors">
                {verStatus === "rejected" ? "Resubmit Verification" : "Start Verification"}
              </Link>
            )}
          </div>
        </motion.div>

        {/* Content Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="lg:col-span-2 space-y-6"
        >
          {/* Tab Headers */}
          <div className="flex items-center gap-6 border-b border-gray-200 px-2">
            {[
              { id: 'listings',  label: 'My Listings', icon: Package },
              { id: 'orders',    label: 'Order History', icon: ShoppingBag },
              { id: 'sales',     label: 'Sales History', icon: Check },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 pb-4 text-sm font-bold transition-all relative ${
                  activeTab === tab.id ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
                )}
              </button>
            ))}
          </div>

          {activeTab === 'listings' && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-gray-500" />
                  <h2 className="text-sm font-bold text-gray-900">My Listings</h2>
                  <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{myListings.length}</span>
                </div>
                <Link to="/marketplace/new" className="text-xs font-semibold text-indigo-600 hover:text-indigo-500 flex items-center gap-1">
                  Add New <ExternalLink className="w-3 h-3" />
                </Link>
              </div>

              {myListings.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-gray-100">
                  {myListings.map((item) => (
                    <Link
                      key={item.id}
                      to={`/marketplace/${item.id}`}
                      className="group bg-white p-4 hover:bg-indigo-50/40 transition-colors"
                    >
                      <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden mb-3 relative">
                        {item.image ? (
                          <ResponsiveImage
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="180px"
                            loading="lazy"
                            decoding="async"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-8 h-8 text-gray-300" />
                          </div>
                        )}
                        <div className="absolute top-2 left-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                            item.type === 'sell' ? 'bg-blue-100 text-blue-700' :
                            item.type === 'barter' ? 'bg-purple-100 text-purple-700' :
                            'bg-emerald-100 text-emerald-700'
                          }`}>{item.type}</span>
                        </div>
                      </div>
                      <h3 className="text-xs font-semibold text-gray-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">{item.title}</h3>
                      <p className="text-sm font-bold text-gray-900 mt-0.5">
                        {item.type === 'sell' ? `৳${item.price}` : item.type === 'barter' ? 'Barter' : 'Free'}
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptyState icon={Star} title="No listings yet" description="Start selling or sharing your textbooks, gadgets, and subscriptions." action={{ to: '/marketplace/new', label: 'Post First Listing' }} />
              )}
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-4">
              {orders.length > 0 ? (
                orders.map((order) => (
                  <div key={order.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-4 bg-gray-50/50 border-b border-gray-100">
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Order ID</p>
                        <p className="text-sm font-bold text-gray-900">{order.id}</p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          order.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 
                          order.status === 'shipped' ? 'bg-blue-100 text-blue-700' : 
                          order.status === 'delivered' ? 'bg-indigo-100 text-indigo-700' : 
                          order.status === 'pending' ? 'bg-amber-100 text-amber-700' : 
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {order.status}
                        </span>
                        <p className="text-[10px] text-gray-400 mt-1">{new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <div className="space-y-3 mb-6">
                        {order.items?.map((item: any) => (
                          <div key={item.id} className="flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-center group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-colors">
                                <Package className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{item.title}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className={`text-[10px] font-bold uppercase tracking-wider ${
                                    item.status === 'confirmed' ? 'text-emerald-600' : 
                                    item.status === 'shipped' ? 'text-blue-600' : 
                                    item.status === 'delivered' ? 'text-indigo-600' : 
                                    'text-amber-600'
                                  }`}>{item.status || 'processing'}</span>
                                  {item.sellerNote && (
                                    <span className="text-[10px] text-gray-400 italic">
                                      • Note: {item.sellerNote}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <p className="text-sm font-bold text-gray-900">Total Paid: ৳{order.totalAmount}</p>
                        <Link to={`/order-success?orderId=${order.id}`} className="text-xs font-bold text-indigo-600 hover:text-indigo-500 flex items-center gap-1">
                          View Invoice <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState icon={ShoppingBag} title="No orders found" description="When you purchase items, they will appear here with their payment status." action={{ to: '/marketplace', label: 'Explore Marketplace' }} />
              )}
            </div>
          )}

          {activeTab === 'sales' && (
            <div className="space-y-4">
              {sales.length > 0 ? (
                sales.map((sale) => (
                  <div key={sale.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                        {sale.image_url ? <img src={sale.image_url} className="w-full h-full object-cover" /> : <Package className="w-6 h-6 text-gray-300 m-3" />}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900">{sale.title}</h4>
                        <p className="text-xs text-gray-500 mt-0.5">Sold to {sale.buyer_name} • ৳{sale.price_at_purchase}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          sale.status === 'delivered' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                          sale.status === 'shipped' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                          sale.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 
                          'bg-amber-50 text-amber-700 border border-amber-100'
                        }`}>
                          {sale.status}
                        </span>
                        <p className="text-[10px] text-gray-400 mt-1">{new Date(sale.created_at).toLocaleDateString()}</p>
                      </div>
                      
                      {sale.status !== 'delivered' && (
                        <button
                          onClick={async () => {
                            const nextStatusMap: Record<string, string> = {
                              'processing': 'confirmed',
                              'confirmed': 'shipped',
                              'shipped': 'delivered'
                            };
                            const nextStatus = nextStatusMap[sale.status] || 'confirmed';
                            
                            if (!confirm(`Mark this order as ${nextStatus}?`)) return;
                            try {
                              await confirmOrderItem(
                                sale.id,
                                `Order ${nextStatus} via UniShare.`,
                                nextStatus,
                              );
                              await queryClient.invalidateQueries({ queryKey: ["sales"] });
                            } catch (e) { alert("Failed to update status"); }
                          }}
                          className={`px-3 py-1.5 text-white text-[10px] font-bold rounded-lg transition-colors ${
                            sale.status === 'processing' ? 'bg-emerald-600 hover:bg-emerald-700' :
                            sale.status === 'confirmed' ? 'bg-blue-600 hover:bg-blue-700' :
                            'bg-indigo-600 hover:bg-indigo-700'
                          }`}
                        >
                          {sale.status === 'processing' ? 'Confirm' : 
                           sale.status === 'confirmed' ? 'Ship' : 'Deliver'}
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState icon={Check} title="No sales history" description="Items you sell will appear here." action={{ to: '/marketplace/new', label: 'Start Selling' }} />
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, description, action }: { icon: any, title: string, description: string, action: { to: string, label: string } }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-6 bg-white rounded-2xl border border-gray-200 shadow-sm">
      <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-gray-300" />
      </div>
      <p className="text-sm font-semibold text-gray-700">{title}</p>
      <p className="text-xs text-gray-400 mt-1 max-w-52 leading-relaxed">{description}</p>
      <Link to={action.to} className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors shadow-sm">
        {action.label}
      </Link>
    </div>
  );
}
