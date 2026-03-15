/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { FavoritesProvider } from './context/FavoritesContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Home from './pages/Home';
import Marketplace from './pages/Marketplace';
import ItemDetail from './pages/ItemDetail';
import SellerProfile from './pages/SellerProfile';
import CoSubs from './pages/CoSubs';
import GroupDetail from './pages/GroupDetail';
import About from './pages/About';
import HowItWorks from './pages/HowItWorks';
import Auth from './pages/Auth';
import ForgotPassword from './pages/ForgotPassword';
import Profile from './pages/Profile';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import NewListing from './pages/NewListing';
import NewGroup from './pages/NewGroup';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <FavoritesProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="marketplace" element={<Marketplace />} />
                <Route path="marketplace/:id" element={<ItemDetail />} />
                <Route path="seller/:id" element={<SellerProfile />} />
                <Route path="co-subs" element={<CoSubs />} />
                <Route path="co-subs/:id" element={<GroupDetail />} />
                <Route path="about" element={<About />} />
                <Route path="how-it-works" element={<HowItWorks />} />
                <Route path="login" element={<Auth />} />
                <Route path="signup" element={<Auth />} />
                <Route path="forgot-password" element={<ForgotPassword />} />
                
                {/* Protected Routes */}
                <Route path="marketplace/new" element={<ProtectedRoute><NewListing /></ProtectedRoute>} />
                <Route path="co-subs/new" element={<ProtectedRoute><NewGroup /></ProtectedRoute>} />
                <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
                <Route path="checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />

                {/* Catch-all Route */}
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </FavoritesProvider>
      </SocketProvider>
    </AuthProvider>
  );
}
