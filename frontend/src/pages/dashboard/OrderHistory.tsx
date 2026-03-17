import React from "react";
import { motion } from "motion/react";
import { ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";

export default function OrderHistory() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">Order History</h3>
      <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-100 border-dashed">
        <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h4 className="text-gray-900 font-medium mb-1">No past orders found</h4>
        <p className="text-gray-500 text-sm mb-4">When you buy items, they will appear here.</p>
        <Link to="/marketplace" className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 shadow-sm">Browse Marketplace</Link>
      </div>
    </motion.div>
  );
}
