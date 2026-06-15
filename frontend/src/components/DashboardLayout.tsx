import React, { useRef, useState, Suspense } from "react";
import {
  Users,
  Package,
  LayoutDashboard,
  ShoppingBag,
  Heart,
  Settings,
  LogOut,
  Camera,
  User,
  ShieldCheck,
  Bell,
  MessageSquare,
  Menu,
  X,
  ChevronRight,
  ArrowLeftRight,
} from "lucide-react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import PageLoader from "./PageLoader";
import ResponsiveImage from "./ResponsiveImage";
import { updateUserProfile, getIncomingRequests } from "../lib/api";
import { useApiQuery } from "../hooks/useApiQuery";

export default function DashboardLayout() {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();
  const { unreadNotificationsCount, unreadThreadCount } = useSocket();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Shares its cache key with the Requests panel, so it loads once.
  const { data: incomingRequests = [] } = useApiQuery({
    queryKey: ["incoming-requests"],
    queryFn: getIncomingRequests,
    staleTime: 30_000,
  });
  const pendingRequests = incomingRequests.filter(
    (r) => r.status === "pending",
  ).length;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) {
      return;
    }
    const reader = new FileReader();
    reader.onloadend = async () => {
      const avatar = reader.result as string;
      try {
        const updated = await updateUserProfile(user.id, { avatar });
        updateUser(updated as any);
      } catch (err) {
        console.error("Failed to upload avatar:", err);
      }
    };
    reader.readAsDataURL(file);
  };

  const verificationStatus =
    user?.verificationStatus ?? (user?.isVerified ? "verified" : "unverified");

  const verificationBadge = {
    verified: { label: "Verified", cls: "bg-emerald-100 text-emerald-700" },
    pending: { label: "Pending", cls: "bg-amber-100 text-amber-700" },
    rejected: { label: "Action needed", cls: "bg-rose-100 text-rose-700" },
    unverified: { label: "Unverified", cls: "bg-slate-100 text-slate-600" },
  }[verificationStatus] ?? { label: "Unverified", cls: "bg-slate-100 text-slate-600" };

  const navLinks = [
    {
      to: "/dashboard",
      label: "Overview",
      icon: LayoutDashboard,
      exact: true,
    },
    {
      to: "/dashboard/listings",
      label: "My Listings",
      icon: Package,
    },
    {
      to: "/dashboard/groups",
      label: "My Groups",
      icon: Users,
    },
    {
      to: "/dashboard/orders",
      label: "Order History",
      icon: ShoppingBag,
    },
    {
      to: "/dashboard/requests",
      label: "Requests",
      icon: ArrowLeftRight,
      badge: pendingRequests > 0 ? pendingRequests : undefined,
    },
    {
      to: "/dashboard/saved",
      label: "Saved Items",
      icon: Heart,
    },
  ];

  const secondaryLinks = [
    {
      to: "/notifications",
      label: "Notifications",
      icon: Bell,
      badge: unreadNotificationsCount > 0 ? unreadNotificationsCount : undefined,
    },
    {
      to: "/inbox",
      label: "Messages",
      icon: MessageSquare,
      badge: unreadThreadCount > 0 ? unreadThreadCount : undefined,
    },
    {
      to: "/dashboard/settings",
      label: "Settings",
      icon: Settings,
    },
    ...(user?.role === "admin"
      ? [{ to: "/admin", label: "Admin Portal", icon: ShieldCheck, badge: undefined }]
      : []),
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Profile Card */}
      <div className="px-4 pt-6 pb-4">
        <div
          className="group relative flex flex-col items-center text-center cursor-pointer rounded-2xl p-4 transition-all hover:bg-white/60"
          onClick={() => navigate("/profile")}
        >
          <div
            className="relative mb-3"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
          >
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white shadow-md ring-2 ring-indigo-100 flex items-center justify-center bg-indigo-50">
              {user?.avatar ? (
                <ResponsiveImage
                  src={user.avatar}
                  alt={user.name || "Member"}
                  className="w-full h-full object-cover"
                  sizes="80px"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <User className="w-8 h-8 text-indigo-300" />
              )}
            </div>
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
          </div>

          <h2 className="font-semibold text-gray-900 text-[15px] leading-tight">
            {user?.name || "Member"}
          </h2>
          <p className="text-xs text-gray-400 mt-0.5 truncate max-w-full">
            {user?.email || "you@example.com"}
          </p>

          <span
            className={`mt-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${verificationBadge.cls}`}
          >
            {verificationBadge.label}
          </span>

          <div className="absolute top-2 right-2 text-[10px] text-gray-300 opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
            <span>Profile</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4 border-t border-gray-100" />

      {/* Primary Nav */}
      <nav className="flex-1 overflow-y-auto px-3 pt-3 pb-2 space-y-0.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <p className="px-3 pt-1 pb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
          Dashboard
        </p>
        {navLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.exact}
            className={({ isActive }) =>
              `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`
            }
            onClick={() => setSidebarOpen(false)}
          >
            {({ isActive }) => (
              <>
                <link.icon
                  className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-gray-400 group-hover:text-gray-700"}`}
                />
                <span className="flex-1">{link.label}</span>
                {"badge" in link && link.badge !== undefined && link.badge > 0 && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-4.5 text-center ${
                      isActive ? "bg-white/25 text-white" : "bg-indigo-600 text-white"
                    }`}
                  >
                    {link.badge > 99 ? "99+" : link.badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}

        <p className="px-3 pt-4 pb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
          Activity
        </p>
        {secondaryLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={false}
            className={({ isActive }) =>
              `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`
            }
            onClick={() => setSidebarOpen(false)}
          >
            {({ isActive }) => (
              <>
                <link.icon
                  className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-gray-400 group-hover:text-gray-700"}`}
                />
                <span className="flex-1">{link.label}</span>
                {link.badge !== undefined && link.badge > 0 && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-4.5 text-center ${
                      isActive
                        ? "bg-white/25 text-white"
                        : "bg-indigo-600 text-white"
                    }`}
                  >
                    {link.badge > 99 ? "99+" : link.badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-6 pt-2 border-t border-gray-100 mt-2">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-all"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-50/50">
      {/* Mobile Header */}
      <div className="md:hidden sticky top-0 z-40 flex items-center justify-between px-4 h-14 bg-white border-b border-gray-200 shadow-sm">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Link to="/dashboard" className="text-sm font-bold text-gray-900">
          Dashboard
        </Link>
        <div className="relative">
          <Link to="/inbox" className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 block">
            <MessageSquare className="w-5 h-5" />
            {unreadThreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-indigo-600" />
            )}
          </Link>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div
            className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-3 right-3">
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <SidebarContent />
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex gap-6 items-start">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-60 lg:w-64 shrink-0 self-start sticky top-20 max-h-[calc(100vh-88px)] rounded-2xl bg-white border border-gray-200/80 shadow-sm overflow-hidden">
          <SidebarContent />
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}