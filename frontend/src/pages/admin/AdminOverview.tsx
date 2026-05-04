import { motion } from "motion/react";
import { Link } from "react-router-dom";
import {
  Users, Package, ShieldCheck, ClipboardList,
  ArrowRight, Clock, CheckCircle2, XCircle, TrendingUp,
} from "lucide-react";
import { useApiQuery } from "../../hooks/useApiQuery";
import { getAdminStats } from "../../lib/api";
import { AdminStats } from "../../lib/types";

function relTime(ts?: string) {
  if (!ts || Number.isNaN(Date.parse(ts))) {
    return "Time unknown";
  }
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function AdminOverview() {
  const { data: stats, isLoading, isError } = useApiQuery<AdminStats>({
    queryKey: ["admin-stats"],
    queryFn: getAdminStats,
    errorMessage: "Could not load admin stats.",
  });

  const statCards = [
    {
      label: "Total Users",
      value: stats?.totalUsers ?? 0,
      icon: Users,
      to: "/admin/users",
      accent: "bg-blue-500",
      bg: "bg-blue-50 text-blue-700",
    },
    {
      label: "Pending Verification",
      value: stats?.pendingVerifications ?? 0,
      icon: Clock,
      to: "/admin/verification",
      accent: "bg-amber-500",
      bg: "bg-amber-50 text-amber-700",
    },
    {
      label: "Verified Accounts",
      value: stats?.verifiedUsers ?? 0,
      icon: CheckCircle2,
      to: "/admin/verification",
      accent: "bg-emerald-500",
      bg: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Active Listings",
      value: stats?.totalListings ?? 0,
      icon: Package,
      to: "/admin/listings",
      accent: "bg-indigo-500",
      bg: "bg-indigo-50 text-indigo-700",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-1">Admin Portal</p>
          <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
          <p className="text-sm text-gray-500 mt-1">Platform activity and key metrics at a glance.</p>
        </div>
        <Link
          to="/admin/verification"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <ShieldCheck className="w-4 h-4" />
          Review Queue
          {(stats?.pendingVerifications ?? 0) > 0 && (
            <span className="bg-white text-indigo-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {stats?.pendingVerifications}
            </span>
          )}
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Link
              to={card.to}
              className="group block bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.bg}`}>
                  <card.icon className="w-5 h-5" />
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-600 transition-colors" />
              </div>
              <p className="text-2xl font-bold text-gray-900 tabular-nums">
                {isLoading ? (
                  <span className="inline-block w-8 h-6 bg-gray-100 rounded animate-pulse" />
                ) : (
                  card.value
                )}
              </p>
              <p className="text-xs font-medium text-gray-500 mt-0.5">{card.label}</p>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Pending Verifications */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-bold text-gray-900">Pending Verifications</h2>
              {(stats?.pendingVerifications ?? 0) > 0 && (
                <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{stats?.pendingVerifications}</span>
              )}
            </div>
            <Link to="/admin/verification" className="text-xs font-semibold text-indigo-600 hover:text-indigo-500 flex items-center gap-1">
              Review all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {isLoading ? (
            <div className="px-6 py-4 space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : (stats?.recentVerifications.filter(v => v.status === 'pending').length ?? 0) > 0 ? (
            <ul className="divide-y divide-gray-50">
              {(stats?.recentVerifications.filter(v => v.status === 'pending') ?? []).slice(0, 5).map((r) => {
                const initials = (r.name || r.email || "U")
                  .split(" ")
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((part) => part[0]?.toUpperCase())
                  .join("");

                return (
                <li key={r.id} className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50/50">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold shrink-0">
                      {initials || "U"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{r.name || "Unnamed"}</p>
                      <p className="text-xs text-gray-400 truncate">{r.uiuEmail || r.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-gray-400">{relTime(r.submittedAt)}</span>
                    <Link
                      to="/admin/verification"
                      className="text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 px-3 py-1 rounded-lg transition-colors"
                    >
                      Review
                    </Link>
                  </div>
                </li>
                );
              })}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-2" />
              <p className="text-sm font-semibold text-gray-700">All caught up!</p>
              <p className="text-xs text-gray-400 mt-0.5">No pending verifications.</p>
            </div>
          )}
        </div>

        {/* Recent Users */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" />
              <h2 className="text-sm font-bold text-gray-900">Recent Users</h2>
            </div>
            <Link to="/admin/users" className="text-xs font-semibold text-indigo-600 hover:text-indigo-500 flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {isLoading ? (
            <div className="px-6 py-4 space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : (stats?.recentUsers.length ?? 0) > 0 ? (
            <ul className="divide-y divide-gray-50">
              {(stats?.recentUsers ?? []).map((u) => (
                <li key={u.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50/50">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0">
                    {(u.name || "U").charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{u.name}</p>
                    <p className="text-xs text-gray-400 truncate">{u.email}</p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border capitalize ${
                    u.verificationStatus === "verified"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : u.verificationStatus === "pending"
                      ? "border-amber-200 bg-amber-50 text-amber-700"
                      : u.verificationStatus === "rejected"
                      ? "border-rose-200 bg-rose-50 text-rose-700"
                      : "border-gray-200 bg-gray-50 text-gray-600"
                  }`}>
                    {u.verificationStatus || "unverified"}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex items-center justify-center py-10">
              <p className="text-sm text-gray-400">No users found.</p>
            </div>
          )}
        </div>

        {/* Verification Stats */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-gray-900">Verification Summary</h2>
          </div>
          <div className="space-y-4">
            {[
              { label: "Approved", count: stats?.verifiedUsers ?? 0, total: stats?.totalUsers ?? 0, icon: CheckCircle2, color: "bg-emerald-500", textColor: "text-emerald-700" },
              { label: "Pending",  count: stats?.pendingVerifications ?? 0,  total: stats?.totalUsers ?? 0, icon: Clock,         color: "bg-amber-500",   textColor: "text-amber-700"   },
              { label: "Rejected", count: stats?.rejectedVerifications ?? 0, total: stats?.totalUsers ?? 0, icon: XCircle,       color: "bg-rose-500",    textColor: "text-rose-700"    },
            ].map((item) => {
              const pct = item.total === 0 ? 0 : Math.round((item.count / item.total) * 100);
              return (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <item.icon className={`w-3.5 h-3.5 ${item.textColor}`} />
                      <span className="text-xs font-semibold text-gray-700">{item.label}</span>
                    </div>
                    <span className="text-xs font-bold text-gray-900">{item.count}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Listings */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-indigo-500" />
              <h2 className="text-sm font-bold text-gray-900">Recent Listings</h2>
            </div>
            <Link to="/admin/listings" className="text-xs font-semibold text-indigo-600 hover:text-indigo-500 flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {isLoading ? (
            <div className="px-6 py-4 space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : (stats?.recentListings.length ?? 0) > 0 ? (
            <ul className="divide-y divide-gray-50">
              {(stats?.recentListings ?? []).map((item) => (
                <li key={item.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50/50">
                  <div className="w-9 h-9 rounded-xl bg-gray-100 shrink-0 overflow-hidden">
                    {item.image ? (
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-4 h-4 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{item.title}</p>
                    <p className="text-xs text-gray-400">{item.seller || "Unknown"}</p>
                  </div>
                  <p className="text-sm font-bold text-gray-900 shrink-0">৳{item.price || "—"}</p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex items-center justify-center py-10 text-center">
               <p className="text-sm text-gray-400">No listings found.</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
