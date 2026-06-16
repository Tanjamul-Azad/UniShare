import { Suspense, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LogOut, ShieldCheck, Users, ClipboardList,
  ChevronRight, BarChart3, X, Menu, User, Flag,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import ResponsiveImage from "./ResponsiveImage";
import PageLoader from "./PageLoader";

const navLinks = [
  { to: "/admin", label: "Overview", icon: BarChart3, exact: true },
  { to: "/admin/verification", label: "Verification Queue", icon: ShieldCheck },
  { to: "/admin/users", label: "Manage Users", icon: Users },
  { to: "/admin/listings", label: "All Listings", icon: ClipboardList },
  { to: "/admin/reports", label: "Community Reports", icon: Flag },
];

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200 text-gray-900">
      {/* Brand */}
      <div className="px-5 pt-6 pb-4 border-b border-gray-50">
        <Link to="/admin" className="flex items-center gap-2.5 group" onClick={onClose}>
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold tracking-tight text-gray-900">Admin Portal</p>
            <p className="text-[10px] text-gray-500 font-medium">UniShare Control</p>
          </div>
        </Link>
      </div>

      {/* Admin Profile */}
      <div
        className="mx-3 mt-4 rounded-xl bg-gray-50 border border-gray-100 px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={() => { navigate("/profile"); onClose?.(); }}
      >
        <div className="w-9 h-9 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center shrink-0 overflow-hidden">
          {user?.avatar ? (
            <ResponsiveImage src={user.avatar} alt={user.name || "Admin"} className="w-full h-full object-cover" sizes="36px" loading="lazy" decoding="async" />
          ) : (
            <User className="w-4 h-4 text-indigo-600" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 leading-tight truncate">{user?.name || "Admin"}</p>
          <p className="text-[11px] text-gray-500 truncate">{user?.email}</p>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 pt-4 pb-3 space-y-1">
        <p className="px-3 pt-1 pb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">Management</p>
        {navLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.exact}
            onClick={onClose}
            className={({ isActive }) =>
              `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-200/50"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <link.icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-gray-400 group-hover:text-indigo-600"}`} />
                {link.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-5 pt-2 border-t border-gray-100 space-y-1 mt-auto">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-full min-h-[calc(100vh-4rem)] bg-gray-50">
      {/* Mobile drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)}>
          <div className="absolute left-0 top-0 bottom-0 w-64 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-3 right-3 z-10 p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <SidebarContent onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 xl:w-64 shrink-0 self-start sticky top-[64px] max-h-[calc(100vh-64px)] overflow-hidden rounded-r-2xl shadow-xl">
        <SidebarContent />
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100">
          <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-bold text-gray-900">Admin Portal</span>
          </div>
        </div>

        <div className="p-5 sm:p-8">
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
