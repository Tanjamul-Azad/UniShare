import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { ShieldAlert, X, BadgeCheck, GraduationCap, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VerificationModal({ isOpen, onClose }: VerificationModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          
          {/* Modal Container */}
          <div className="fixed inset-0 flex items-center justify-center p-4 z-[101] pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl pointer-events-auto relative"
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Icon Header */}
              <div className="bg-indigo-600 h-32 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                  <BadgeCheck className="w-48 h-48 absolute -top-10 -left-10 rotate-12" />
                  <GraduationCap className="w-48 h-48 absolute -bottom-10 -right-10 -rotate-12" />
                </div>
                <div className="relative bg-white p-4 rounded-2xl shadow-xl">
                  <ShieldAlert className="w-10 h-10 text-indigo-600" />
                </div>
              </div>

              {/* Content */}
              <div className="p-8 text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Verification Required</h3>
                <p className="text-gray-600 leading-relaxed mb-8">
                  To keep UniShare safe, you must verify your student status before you can post, buy, or trade items in the marketplace.
                </p>

                <div className="space-y-3">
                  <Link
                    to="/dashboard/settings"
                    onClick={onClose}
                    className="flex items-center justify-center gap-2 w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                  >
                    Start Verification <ArrowRight className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={onClose}
                    className="w-full py-3 text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    Maybe Later
                  </button>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100">
                  <div className="flex items-center justify-center gap-2 text-xs font-medium text-emerald-600">
                    <BadgeCheck className="w-4 h-4" />
                    Verified students get a badge & full access
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
