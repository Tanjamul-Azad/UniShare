import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth, type UserRole } from "../context/AuthContext";
import PageLoader from "./PageLoader";

type ProtectedRouteProps = {
  children: React.ReactNode;
  requiredRole?: UserRole;
};

export default function ProtectedRoute({
  children,
  requiredRole,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <PageLoader />;
  }

  // 1. Not logged in -> Login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Logged in as Admin, but trying to access User Dashboard
  // We strictly separate Admin from personal dashboard per user request
  if (user.role === 'admin' && !requiredRole && location.pathname.startsWith('/dashboard')) {
    return <Navigate to="/admin" replace />;
  }

  // 3. Logged in as User, but trying to access Admin Portal
  if (requiredRole === 'admin' && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // 4. Required role mismatch (generic check)
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
