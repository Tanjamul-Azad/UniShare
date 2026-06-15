import React, { useState } from "react";
import { motion } from "motion/react";
import { Lock, KeyRound, CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { resetPassword } from "../lib/api";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setIsLoading(true);
    try {
      await resetPassword(token, password);
      setDone(true);
      setTimeout(() => navigate("/login", { replace: true }), 2200);
    } catch (err: any) {
      setError(err?.message ?? "Could not reset your password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl border border-gray-200 shadow-sm"
      >
        {done ? (
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
            <h2 className="text-3xl font-semibold text-gray-900 tracking-tight mb-3">
              Password updated
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed mb-8">
              You can now sign in with your new password. Redirecting you to login…
            </p>
            <Link
              to="/login"
              className="w-full flex justify-center py-3 px-4 border border-gray-200 text-sm font-medium rounded-xl text-gray-900 bg-white hover:bg-gray-50 transition-colors"
            >
              Go to login
            </Link>
          </div>
        ) : !token ? (
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Invalid reset link</h2>
            <p className="text-sm text-gray-500 mb-8">
              This link is missing its token. Please request a new reset link.
            </p>
            <Link
              to="/forgot-password"
              className="inline-flex items-center justify-center py-3 px-4 rounded-xl text-white bg-gray-900 hover:bg-gray-800 text-sm font-medium transition-colors"
            >
              Request new link
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center">
              <div className="mx-auto h-12 w-12 bg-gray-900 rounded-xl flex items-center justify-center mb-4">
                <KeyRound className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-3xl font-semibold text-gray-900 tracking-tight">
                Set a new password
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                Choose a strong password you don't use elsewhere.
              </p>
            </div>

            {error && (
              <div className="mt-6 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-600 text-center">
                {error}
              </div>
            )}

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none relative block w-full pl-10 pr-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent sm:text-sm transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    id="confirm"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="appearance-none relative block w-full pl-10 pr-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent sm:text-sm transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !password || !confirm}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  "Updating…"
                ) : (
                  <>
                    Reset password
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="text-center mt-6">
              <Link
                to="/login"
                className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to login
              </Link>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
