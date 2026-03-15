import React from 'react';
import { motion } from 'motion/react';
import { CreditCard, ShieldCheck, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

export default function Checkout() {
  const navigate = useNavigate();
  const { sendNotification } = useSocket();
  const { user } = useAuth();

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Trigger order update notification
    if (user) {
      sendNotification(user.id, 'order_update', 'Order Confirmed', 'Your payment was successful and your order is being processed.');
    }

    // Mock successful payment
    navigate('/profile');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-semibold text-gray-900">Secure Checkout</h1>
        <p className="text-gray-500 mt-2 flex items-center justify-center gap-2">
          <Lock className="w-4 h-4" /> Payments are encrypted and secure
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm">
        <form onSubmit={handlePay} className="space-y-8">
          {/* Payment Method */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Method</h3>
            <div className="space-y-4">
              <div className="border border-gray-900 rounded-xl p-4 flex items-center gap-3 bg-gray-50">
                <input type="radio" name="payment" defaultChecked className="w-4 h-4 text-gray-900 focus:ring-gray-900" />
                <CreditCard className="w-5 h-5 text-gray-700" />
                <span className="font-medium text-gray-900">Credit or Debit Card</span>
              </div>
            </div>
          </div>

          {/* Card Details */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
              <input type="text" required placeholder="0000 0000 0000 0000" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none font-mono" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                <input type="text" required placeholder="MM/YY" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none font-mono" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CVC</label>
                <input type="text" required placeholder="123" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none font-mono" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name on Card</label>
              <input type="text" required placeholder="Jane Doe" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none" />
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6">
            <button type="submit" className="w-full py-4 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 text-lg">
              Pay Now
            </button>
            <p className="text-xs text-center text-gray-500 mt-4 flex items-center justify-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-500" /> Powered by Stripe
            </p>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
