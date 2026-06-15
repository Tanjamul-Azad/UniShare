/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Suspense, lazy, type ReactNode } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { ToastProvider } from './context/ToastContext';
import PageLoader from './components/PageLoader';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

const Home = lazy(() => import('./pages/Home'));
const Marketplace = lazy(() => import('./pages/Marketplace'));
const ItemDetail = lazy(() => import('./pages/ItemDetail'));
const SellerProfile = lazy(() => import('./pages/SellerProfile'));
const CoSubs = lazy(() => import('./pages/CoSubs'));
const GroupDetail = lazy(() => import('./pages/GroupDetail'));
const Community = lazy(() => import('./pages/Community'));
const CommunityPost = lazy(() => import('./pages/CommunityPost'));
const About = lazy(() => import('./pages/About'));
const HowItWorks = lazy(() => import('./pages/HowItWorks'));
const Pricing = lazy(() => import('./pages/Pricing'));
const Blog = lazy(() => import('./pages/Blog'));
const Contact = lazy(() => import('./pages/Contact'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Terms = lazy(() => import('./pages/Terms'));
const Cookies = lazy(() => import('./pages/Cookies'));
const Auth = lazy(() => import('./pages/Auth'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const DashboardLayout = lazy(() => import('./components/DashboardLayout'));
const AdminLayout = lazy(() => import('./components/AdminLayout'));
const DashboardOverview = lazy(() => import('./pages/dashboard/Overview'));
const DashboardListings = lazy(() => import('./pages/dashboard/MyListings'));
const DashboardGroups = lazy(() => import('./pages/dashboard/MyGroups'));
const DashboardOrders = lazy(() => import('./pages/dashboard/OrderHistory'));
const DashboardRequests = lazy(() => import('./pages/dashboard/Requests'));
const DashboardSaved = lazy(() => import('./pages/dashboard/SavedItems'));
const DashboardSettings = lazy(() => import('./pages/dashboard/Settings'));
const AdminVerificationQueue = lazy(() => import('./pages/admin/VerificationQueue'));
const AdminManageUsers = lazy(() => import('./pages/admin/ManageUsers'));
const AdminOverview = lazy(() => import('./pages/admin/AdminOverview'));
const AdminListings = lazy(() => import('./pages/admin/AdminListings'));
const Profile = lazy(() => import('./pages/Profile'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const OrderSuccess = lazy(() => import('./pages/OrderSuccess'));
const MockGateway = lazy(() => import('./pages/MockGateway'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Inbox = lazy(() => import('./pages/Inbox'));
const NewListing = lazy(() => import('./pages/NewListing'));
const NewGroup = lazy(() => import('./pages/NewGroup'));
const NotFound = lazy(() => import('./pages/NotFound'));

function withPageLoader(element: ReactNode) {
  return <Suspense fallback={<PageLoader />}>{element}</Suspense>;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <SocketProvider>
          <FavoritesProvider>
            <HashRouter>
              <Routes>
                {/* Standalone full-page routes (no app shell) */}
                <Route path="/mock-gateway" element={withPageLoader(<MockGateway />)} />

                {/* Main app shell */}
                <Route path="/" element={<Layout />}>
                  <Route index element={withPageLoader(<Home />)} />
                  <Route path="marketplace" element={withPageLoader(<ProtectedRoute><Marketplace /></ProtectedRoute>)} />
                  <Route path="marketplace/:id" element={withPageLoader(<ProtectedRoute><ItemDetail /></ProtectedRoute>)} />
                  <Route path="seller/:id" element={withPageLoader(<ProtectedRoute><SellerProfile /></ProtectedRoute>)} />
                  <Route path="co-subs" element={withPageLoader(<ProtectedRoute><CoSubs /></ProtectedRoute>)} />
                  <Route path="co-subs/:id" element={withPageLoader(<ProtectedRoute><GroupDetail /></ProtectedRoute>)} />
                  <Route path="community" element={withPageLoader(<ProtectedRoute><Community /></ProtectedRoute>)} />
                  <Route path="community/:id" element={withPageLoader(<ProtectedRoute><CommunityPost /></ProtectedRoute>)} />
                  <Route path="about" element={withPageLoader(<About />)} />
                  <Route path="how-it-works" element={withPageLoader(<HowItWorks />)} />
                  <Route path="login" element={withPageLoader(<Auth />)} />
                  <Route path="signup" element={withPageLoader(<Auth />)} />
                  <Route path="forgot-password" element={withPageLoader(<ForgotPassword />)} />
                  <Route path="reset-password" element={withPageLoader(<ResetPassword />)} />
                  <Route path="pricing" element={withPageLoader(<Pricing />)} />
                  <Route path="blog" element={withPageLoader(<Blog />)} />
                  <Route path="contact" element={withPageLoader(<Contact />)} />
                  <Route path="privacy" element={withPageLoader(<Privacy />)} />
                  <Route path="terms" element={withPageLoader(<Terms />)} />
                  <Route path="cookies" element={withPageLoader(<Cookies />)} />
                  
                  {/* Protected Routes */}
                  <Route path="marketplace/new" element={withPageLoader(<ProtectedRoute><NewListing /></ProtectedRoute>)} />
                  <Route path="co-subs/new" element={withPageLoader(<ProtectedRoute><NewGroup /></ProtectedRoute>)} />
                  <Route path="dashboard" element={withPageLoader(<ProtectedRoute><DashboardLayout /></ProtectedRoute>)}>
                    <Route index element={<DashboardOverview />} />
                    <Route path="listings" element={<DashboardListings />} />
                    <Route path="groups" element={<DashboardGroups />} />
                    <Route path="orders" element={<DashboardOrders />} />
                    <Route path="requests" element={<DashboardRequests />} />
                    <Route path="saved" element={<DashboardSaved />} />
                    <Route path="settings" element={<DashboardSettings />} />
                  </Route>
                  <Route
                    path="admin"
                    element={withPageLoader(
                      <ProtectedRoute requiredRole="admin">
                        <AdminLayout />
                      </ProtectedRoute>
                    )}
                  >
                    <Route index element={<AdminOverview />} />
                    <Route path="verification" element={<AdminVerificationQueue />} />
                    <Route path="users" element={<AdminManageUsers />} />
                    <Route path="listings" element={<AdminListings />} />
                  </Route>
                  <Route path="profile" element={withPageLoader(<ProtectedRoute><Profile /></ProtectedRoute>)} />
                  <Route path="cart" element={withPageLoader(<ProtectedRoute><Cart /></ProtectedRoute>)} />
                  <Route path="checkout" element={withPageLoader(<ProtectedRoute><Checkout /></ProtectedRoute>)} />
                  <Route path="order-success" element={withPageLoader(<ProtectedRoute><OrderSuccess /></ProtectedRoute>)} />
                  <Route path="notifications" element={withPageLoader(<ProtectedRoute><Notifications /></ProtectedRoute>)} />
                  <Route path="inbox" element={withPageLoader(<ProtectedRoute><Inbox /></ProtectedRoute>)} />

                  {/* Catch-all Route */}
                  <Route path="*" element={withPageLoader(<NotFound />)} />
                </Route>
              </Routes>
            </HashRouter>
          </FavoritesProvider>
        </SocketProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
