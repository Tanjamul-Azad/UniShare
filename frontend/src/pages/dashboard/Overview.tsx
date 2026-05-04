import { motion } from "motion/react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell,
  Package,
  ShoppingBag,
  Star,
  Users,
  ShieldAlert,
  CheckCircle2,
  Clock,
  ArrowRight,
  MessageSquare,
  TrendingUp,
  Inbox,
  Sparkles,
  Plus,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { useFavorites } from "../../context/FavoritesContext";
import { useApiQuery } from "../../hooks/useApiQuery";
import { getDashboardStats, type DashboardStats } from "../../lib/api";

const ICON_MAP: Record<string, React.ElementType> = {
  order_update: ShoppingBag,
  message: MessageSquare,
  listing: Package,
  group: Users,
  verification: ShieldAlert,
};

function getNotifIcon(type: string) {
  return ICON_MAP[type] ?? Bell;
}

function relativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function Overview() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { unreadNotificationsCount, unreadThreadCount } = useSocket();
  const { favorites } = useFavorites();

  const { data: stats, isLoading } = useApiQuery<DashboardStats>({
    queryKey: ["dashboard-stats"],
    queryFn: getDashboardStats,
    errorMessage: "Could not load dashboard stats.",
  });

  const verificationStatus =
    user?.verificationStatus ?? (user?.isVerified ? "verified" : "unverified");

  const verificationConfig = {
    verified: {
      title: "UIU Verified",
      message: "Your account is verified.",
      action: "View status",
      icon: CheckCircle2,
      container: "from-emerald-50 border-emerald-200",
      iconBg: "bg-emerald-100 text-emerald-600",
      titleCls: "text-emerald-900",
      textCls: "text-emerald-700",
      actionCls: "bg-emerald-600 hover:bg-emerald-700 text-white",
    },
    pending: {
      title: "Verification Pending",
      message: "Your submission is in review.",
      action: "View submission",
      icon: Clock,
      container: "from-amber-50 border-amber-200",
      iconBg: "bg-amber-100 text-amber-600",
      titleCls: "text-amber-900",
      textCls: "text-amber-700",
      actionCls: "bg-amber-500 hover:bg-amber-600 text-white",
    },
    rejected: {
      title: "Action Required",
      message: user?.verificationNote || "Your verification needs attention.",
      action: "Review & resubmit",
      icon: ShieldAlert,
      container: "from-rose-50 border-rose-200",
      iconBg: "bg-rose-100 text-rose-600",
      titleCls: "text-rose-900",
      textCls: "text-rose-700",
      actionCls: "bg-rose-600 hover:bg-rose-700 text-white",
    },
    unverified: {
      title: "Get Verified",
      message: "Submit your UIU ID to unlock the full marketplace.",
      action: "Start verification",
      icon: Sparkles,
      container: "from-indigo-50 border-indigo-200",
      iconBg: "bg-indigo-100 text-indigo-600",
      titleCls: "text-indigo-900",
      textCls: "text-indigo-600",
      actionCls: "bg-indigo-600 hover:bg-indigo-700 text-white",
    },
  } as const;

  const vc = verificationConfig[verificationStatus as keyof typeof verificationConfig] ?? verificationConfig.unverified;
  const BannerIcon = vc.icon;

  const statCards = [
    {
      label: "My Listings",
      value: isLoading ? null : (stats?.listingsCount ?? 0),
      icon: Package,
      to: "/dashboard/listings",
      accent: "bg-violet-50 text-violet-600",
      ring: "ring-violet-100",
    },
    {
      label: "My Groups",
      value: isLoading ? null : (stats?.groupsCount ?? 0),
      icon: Users,
      to: "/dashboard/groups",
      accent: "bg-blue-50 text-blue-600",
      ring: "ring-blue-100",
    },
    {
      label: "Saved Items",
      value: favorites.size,
      icon: Star,
      to: "/dashboard/saved",
      accent: "bg-amber-50 text-amber-600",
      ring: "ring-amber-100",
    },
    {
      label: "Unread",
      value: unreadNotificationsCount,
      icon: Bell,
      to: "/notifications",
      accent: "bg-rose-50 text-rose-600",
      ring: "ring-rose-100",
    },
  ];

  const recentNotifications = stats?.recentNotifications ?? [];

  const quickActions = [
    {
      to: "/marketplace/new",
      label: "New Listing",
      desc: "Start selling",
      icon: Plus,
      accent: "bg-indigo-600 text-white",
    },
    {
      to: "/co-subs/new",
      label: "New Group",
      desc: "Co-subscribe",
      icon: Users,
      accent: "bg-violet-600 text-white",
    },
    {
      to: unreadThreadCount > 0 ? "/inbox" : "/marketplace",
      label: unreadThreadCount > 0 ? "Open Inbox" : "Marketplace",
      desc: unreadThreadCount > 0 ? `${unreadThreadCount} unread` : "Browse items",
      icon: unreadThreadCount > 0 ? Inbox : TrendingUp,
      accent: "bg-emerald-600 text-white",
    },
    {
      to: "/cart",
      label: "Cart",
      desc: "Checkout",
      icon: ShoppingBag,
      accent: "bg-amber-500 text-white",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {/* Verification Banner */}
      {verificationStatus !== 'verified' && (
        <div
          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border bg-linear-to-r ${vc.container} to-transparent p-4 sm:p-5`}
        >
          <div className="flex items-center gap-3.5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${vc.iconBg}`}>
              <BannerIcon className="w-5 h-5" />
            </div>
            <div>
              <p className={`font-semibold text-sm ${vc.titleCls}`}>{vc.title}</p>
              <p className={`text-xs mt-0.5 ${vc.textCls}`}>{vc.message}</p>
            </div>
          </div>
          <Link
            to="/dashboard/settings"
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-colors shrink-0 shadow-sm ${vc.actionCls}`}
          >
            {vc.action} <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Condensed Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Dashboard Overview
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Summary of your personal activity and notifications.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/marketplace/new"
            className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> New Listing
          </Link>
          <Link
            to="/co-subs/new"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Users className="w-4 h-4" /> New Group
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: i * 0.05 }}
          >
            <div
              onClick={() => navigate(card.to)}
              className="group cursor-pointer rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ring-4 ${card.accent} ${card.ring}`}>
                  <card.icon className="w-5 h-5" />
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-600 transition-colors" />
              </div>
              <p className="text-2xl font-bold text-gray-900 tabular-nums">
                {card.value === null ? (
                  <span className="inline-block w-8 h-6 bg-gray-100 rounded animate-pulse" />
                ) : (
                  card.value
                )}
              </p>
              <p className="text-xs font-medium text-gray-500 mt-0.5">{card.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Notifications — 2/3 width */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.2 }}
          className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 text-sm">Recent Notifications</h2>
            <Link
              to="/notifications"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-500 flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {isLoading ? (
            <div className="px-6 py-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gray-100 animate-pulse shrink-0" />
                  <div className="flex-1 space-y-1.5 pt-1">
                    <div className="h-3 w-1/3 bg-gray-100 rounded animate-pulse" />
                    <div className="h-3 w-2/3 bg-gray-100 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentNotifications.length > 0 ? (
            <ul className="divide-y divide-gray-50">
              {recentNotifications.map((n) => {
                const NIcon = getNotifIcon(n.type);
                return (
                  <li
                    key={n.id}
                    className={`flex items-start gap-4 px-6 py-4 hover:bg-gray-50/50 transition-colors ${!n.read ? "bg-indigo-50/30" : ""}`}
                  >
                    <div className={`mt-0.5 w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${!n.read ? "bg-indigo-100 text-indigo-600" : "bg-gray-100 text-gray-500"}`}>
                      <NIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-semibold leading-tight ${!n.read ? "text-gray-900" : "text-gray-700"}`}>
                          {n.title}
                        </p>
                        <span className="text-[11px] text-gray-400 whitespace-nowrap mt-0.5 shrink-0">
                          {relativeTime(n.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{n.message}</p>
                    </div>
                    {!n.read && (
                      <div className="mt-2 w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center px-6">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
                <Bell className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm font-semibold text-gray-700">No notifications yet</p>
              <p className="text-xs text-gray-400 mt-1">
                Activity from listings, groups, and orders will appear here.
              </p>
              <Link
                to="/marketplace/new"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-xs font-semibold text-white hover:bg-gray-800 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Post a Listing
              </Link>
            </div>
          )}
        </motion.div>

        {/* Quick Actions — 1/3 width */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.25 }}
          className="space-y-4"
        >
          {/* Quick Actions Card */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 text-sm">Quick Actions</h2>
            </div>
            <div className="p-4 grid grid-cols-2 gap-2.5">
              {quickActions.map((action) => (
                <div
                  key={action.label}
                  onClick={() => navigate(action.to)}
                  className="group cursor-pointer flex flex-col gap-3 rounded-xl p-3.5 bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-100"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-sm ${action.accent}`}>
                    <action.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-900">{action.label}</p>
                    <p className="text-[11px] text-gray-400">{action.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Orders Card */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 text-sm">Recent Orders</h2>
              <Link
                to="/dashboard/orders"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-500"
              >
                View all
              </Link>
            </div>
            {isLoading ? (
              <div className="px-5 py-4 space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : (stats?.recentActivity ?? []).length > 0 ? (
              <ul className="divide-y divide-gray-50">
                {(stats?.recentActivity ?? []).map((order) => (
                  <li key={order.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50/50">
                    <div>
                      <p className="text-xs font-semibold text-gray-900">
                        {order.itemCount} item{order.itemCount !== 1 ? "s" : ""}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5 capitalize">{order.status}</p>
                    </div>
                    <p className="text-sm font-bold text-gray-900">
                      ৳{Number(order.totalAmount).toFixed(0)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-5 py-6 text-center">
                <p className="text-xs text-gray-500">No orders yet</p>
                <Link
                  to="/marketplace"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-500"
                >
                  Browse marketplace <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
