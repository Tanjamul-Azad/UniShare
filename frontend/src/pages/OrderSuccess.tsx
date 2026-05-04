import React from "react";
import { motion } from "motion/react";
import {
  Bell,
  CheckCircle2,
  Package,
  MessageSquare,
  Printer,
  ArrowRight,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useApiQuery } from "../hooks/useApiQuery";
import { apiClient } from "../lib/apiClient";
import { useQueryClient } from "@tanstack/react-query";

export default function OrderSuccess() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId") || searchParams.get("tran_id");

  const queryClient = useQueryClient();

  const { data: order, isLoading } = useApiQuery<any>({
    queryKey: ["order", orderId],
    queryFn: () => apiClient(`/orders/${orderId}`),
    enabled: !!orderId,
  });

  React.useEffect(() => {
    // Invalidate cart items to clear them from UI
    queryClient.invalidateQueries({ queryKey: ["cart-preview-items"] });
    queryClient.invalidateQueries({ queryKey: ["marketplace-items"] }); // In case stock changed
  }, [queryClient]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const subtotal =
    order?.items?.reduce(
      (sum: number, item: any) => sum + (Number(item.priceAtPurchase) || 0),
      0,
    ) || 0;
  const total = order?.totalAmount || 0;
  const fee = order?.fee || 0;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "Pending";
    const d = new Date(dateStr);
    return isNaN(d.getTime())
      ? "Recently"
      : d.toLocaleDateString(undefined, { dateStyle: "long" });
  };

  return (
    <section className="relative isolate overflow-hidden py-10 sm:py-16">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_#f0fdf4_0,_transparent_45%),radial-gradient(circle_at_bottom_right,_#eef2ff_0,_transparent_45%)]" />

      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Invoice Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-8 bg-white rounded-3xl border border-emerald-100 shadow-xl shadow-emerald-900/5 overflow-hidden print:shadow-none print:border-none print-only-invoice"
          >
            {/* Invoice Header */}
            <div className="bg-emerald-500 p-8 text-white relative">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <CheckCircle2 className="w-32 h-32" />
              </div>
              <div className="flex justify-between items-start relative z-10">
                <div>
                  <div className="flex items-center gap-2 mb-4 bg-white/20 w-fit px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                    <CheckCircle2 className="w-3 h-3" /> Payment Successful
                  </div>
                  <h1 className="text-3xl font-bold">Invoice</h1>
                  <p className="text-emerald-100 mt-1">
                    Transaction Ref: {order?.id || "UNI-MOCK"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-emerald-100">Date</p>
                  <p className="font-bold">{formatDate(order?.createdAt)}</p>
                </div>
              </div>
            </div>

            {/* Bill To & Order Info */}
            <div className="p-8 border-b border-gray-100 grid grid-cols-2 gap-8">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                  Billed To
                </p>
                <p className="font-bold text-gray-900">
                  {order?.buyerName || "Anonymous User"}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  ID: {order?.buyerId}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Order Ref: {orderId}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                  UniShare Inc.
                </p>
                <p className="text-sm text-gray-500">
                  United International University
                </p>
                <p className="text-sm text-gray-500 mt-0.5">
                  Dhaka, Bangladesh
                </p>
              </div>
            </div>

            {/* Items Table */}
            <div className="p-8">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-100">
                    <th className="text-left font-semibold pb-4">
                      Description
                    </th>
                    <th className="text-right font-semibold pb-4">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {order?.items?.map((item: any) => (
                    <tr key={item.id}>
                      <td className="py-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-gray-900">
                              {item.title}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5 capitalize">
                              {item.type} • ID: {item.itemId}
                            </p>
                          </div>
                          <Link
                            to={`/inbox?participant=${item.sellerId}`}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors group relative"
                            title="Message Seller"
                          >
                            <MessageSquare className="w-4 h-4" />
                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              Message Seller
                            </span>
                          </Link>
                        </div>
                      </td>
                      <td className="py-4 text-right font-medium text-gray-900">
                        ৳{Number(item.priceAtPurchase).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-100">
                    <td className="pt-6 text-gray-500">Subtotal</td>
                    <td className="pt-6 text-right font-medium text-gray-900">
                      ৳{subtotal.toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 text-gray-500">Service Fee (5%)</td>
                    <td className="py-2 text-right font-medium text-gray-900">
                      ৳{Number(fee).toFixed(2)}
                    </td>
                  </tr>
                  <tr className="text-lg">
                    <td className="pt-4 font-bold text-gray-900">
                      Total Amount
                    </td>
                    <td className="pt-4 text-right font-bold text-indigo-600">
                      ৳{Number(total).toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 p-6 flex items-center justify-between print:hidden">
              <p className="text-xs text-gray-400">
                Thank you for sharing with UniShare.
              </p>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 text-indigo-600 font-bold text-xs hover:text-indigo-700"
              >
                <Printer className="w-3.5 h-3.5" /> PRINT INVOICE
              </button>
            </div>
          </motion.div>

          {/* Side Actions (Hidden on Print) */}
          <div className="lg:col-span-4 space-y-6 print:hidden">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm"
            >
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                What's Next?
              </h2>
              <ul className="space-y-4">
                <li className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      Seller Notified
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      We've alerted the seller(s). They will confirm your order
                      shortly.
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      Coordinate Handoff
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      You can message the seller directly to discuss how to
                      receive your items.
                    </p>
                  </div>
                </li>
              </ul>
              <div className="mt-6 flex flex-col gap-2">
                <Link
                  to="/profile?tab=purchases"
                  className="w-full py-3 bg-gray-900 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors"
                >
                  <Package className="w-4 h-4" /> Go to My Orders
                </Link>
                <Link
                  to="/inbox"
                  className="w-full py-3 border border-gray-200 text-gray-700 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
                >
                  <MessageSquare className="w-4 h-4" /> Open Chat Inbox
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-indigo-600 rounded-3xl p-6 text-white overflow-hidden relative"
            >
              <div className="relative z-10">
                <h3 className="font-bold text-lg mb-2">Buy more, Save more!</h3>
                <p className="text-indigo-100 text-sm mb-4">
                  Explore thousands of other listings on the UniShare
                  marketplace.
                </p>
                <Link
                  to="/marketplace"
                  className="inline-flex items-center gap-2 bg-white text-indigo-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-50"
                >
                  Marketplace <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="absolute -bottom-6 -right-6 opacity-20">
                <Package className="w-24 h-24 rotate-12" />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
