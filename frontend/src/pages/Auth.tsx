import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, GraduationCap, Mail, Lock, ArrowRight, Building, User as UserIcon, CheckCircle2, Chrome, Github } from 'lucide-react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

type SocialProvider = 'google' | 'github';

export default function Auth() {
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(location.pathname !== '/signup');
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [university, setUniversity] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<SocialProvider | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  
  const navigate = useNavigate();
  const { login } = useAuth();

  // Update mode if URL changes
  useEffect(() => {
    setIsLogin(location.pathname !== '/signup');
    setError('');
    setIsSuccess(false);
    setSocialLoading(null);
    setFieldErrors({});
  }, [location.pathname]);

  // Get the page they were trying to visit, or default to dashboard
  const from = location.state?.from?.pathname || '/dashboard';

  const getDisplayNameFromEmail = (value: string) => {
    const [localPart] = value.split('@');
    if (!localPart) {
      return 'Member';
    }

    const normalized = localPart.replace(/[._-]+/g, ' ').trim();
    return normalized ? normalized.slice(0, 40) : 'Member';
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!email.trim()) {
      errors.email = 'Email is required.';
    } else if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      errors.email = 'Enter a valid email address.';
    }

    if (!password) {
      errors.password = 'Password is required.';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters.';
    }

    if (!isLogin) {
      if (!name.trim()) {
        errors.name = 'Full name is required.';
      }

      if (!confirmPassword) {
        errors.confirmPassword = 'Please confirm your password.';
      } else if (password !== confirmPassword) {
        errors.confirmPassword = 'Passwords do not match.';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const clearFieldError = (field: string) => {
    if (!fieldErrors[field]) {
      return;
    }
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleSocialAuth = (provider: SocialProvider) => {
    setError('');
    setFieldErrors({});
    setSocialLoading(provider);

    setTimeout(() => {
      const socialEmail = provider === 'google' ? 'member.google@unishare.app' : 'member.github@unishare.app';
      const providerName = provider === 'google' ? 'Google Member' : 'GitHub Member';

      login({
        id: `${provider}-${Math.random().toString(36).slice(2, 10)}`,
        name: providerName,
        email: socialEmail,
        joinedDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      });

      setSocialLoading(null);
      navigate(from, { replace: true });
    }, 700);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      setError('Please review the highlighted fields.');
      return;
    }
    
    if (!isLogin) {
      setIsLoading(true);
      // Simulate API call for signup
      setTimeout(() => {
        setIsLoading(false);
        setIsSuccess(true);
      }, 800);
      return;
    }

    setIsLoading(true);
    
    // Simulate API call for login
    setTimeout(() => {
      login({
        id: Math.random().toString(36).substring(7),
        name: isLogin ? getDisplayNameFromEmail(email) : name || getDisplayNameFromEmail(email),
        email: email,
        joinedDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      });
      
      setIsLoading(false);
      navigate(from, { replace: true });
    }, 800);
  };

  const toggleMode = () => {
    navigate(isLogin ? '/signup' : '/login', { replace: true, state: location.state });
  };

  if (isSuccess && !isLogin) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-body">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full space-y-8 bg-white dark:bg-gray-900 p-6 sm:p-10 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm text-center"
        >
          <div className="mx-auto h-20 w-20 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="h-10 w-10 text-emerald-500 dark:text-emerald-400" />
          </div>
          <h2 className="text-3xl font-semibold text-gray-900 dark:text-white tracking-tight mb-4 font-display">
            Verify your email
          </h2>
          <p className="text-gray-500 dark:text-gray-400 leading-relaxed mb-8">
            We've sent a verification link to <span className="font-medium text-gray-900 dark:text-white">{email}</span>. 
            Please check your inbox to verify and activate your account.
          </p>
          <div className="space-y-4">
            <button
              onClick={() => {
                setIsSuccess(false);
                navigate('/login');
              }}
              className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              Back to login
            </button>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Didn't receive the email? <button className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">Click to resend</button>
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-body">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8 bg-white dark:bg-gray-900 p-6 sm:p-10 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm"
      >
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-gray-900 dark:bg-indigo-600 rounded-xl flex items-center justify-center mb-4">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-semibold text-gray-900 dark:text-white tracking-tight font-display">
            {isLogin ? 'Welcome back' : 'Join UniShare'}
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {isLogin ? 'Enter your details to access your account.' : 'Create an account and start trading smarter.'}
          </p>
        </div>

        {!isLogin && (
          <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-xl p-4 flex gap-3 items-start">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
              <strong>Flexible registration.</strong> You can use any valid email address to create your UniShare account.
            </p>
          </div>
        )}

        {error && (
          <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm rounded-xl p-3 text-center">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => handleSocialAuth('google')}
            disabled={Boolean(socialLoading)}
            className="w-full inline-flex items-center justify-center gap-2.5 py-3 px-4 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-800 dark:text-gray-100 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {socialLoading === 'google' ? (
              <svg className="animate-spin h-4 w-4 text-gray-700 dark:text-gray-200" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
            ) : (
              <Chrome className="h-4 w-4" />
            )}
            {socialLoading === 'google' ? 'Connecting to Google...' : `${isLogin ? 'Continue' : 'Sign up'} with Google`}
          </button>

          <button
            type="button"
            onClick={() => handleSocialAuth('github')}
            disabled={Boolean(socialLoading)}
            className="w-full inline-flex items-center justify-center gap-2.5 py-3 px-4 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-800 dark:text-gray-100 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {socialLoading === 'github' ? (
              <svg className="animate-spin h-4 w-4 text-gray-700 dark:text-gray-200" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
            ) : (
              <Github className="h-4 w-4" />
            )}
            {socialLoading === 'github' ? 'Connecting to GitHub...' : `${isLogin ? 'Continue' : 'Sign up'} with GitHub`}
          </button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-200 dark:border-gray-700" />
          </div>
          <div className="relative flex justify-center text-xs uppercase tracking-wide">
            <span className="bg-white dark:bg-gray-900 px-2 text-gray-400">or continue with email</span>
          </div>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <UserIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    </div>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        clearFieldError('name');
                      }}
                      className={`appearance-none relative block w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800/50 border placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:border-transparent sm:text-sm transition-all ${fieldErrors.name ? 'border-rose-400 focus:ring-rose-400' : 'border-gray-300 dark:border-gray-700 focus:ring-indigo-500 dark:focus:ring-indigo-400'}`}
                      placeholder="Your full name"
                    />
                  </div>
                  {fieldErrors.name ? <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{fieldErrors.name}</p> : null}
                </div>
                <div>
                  <label htmlFor="university" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Institution (Optional)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    </div>
                    <input
                      id="university"
                      name="university"
                      type="text"
                      value={university}
                      onChange={(e) => setUniversity(e.target.value)}
                      className="appearance-none relative block w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent sm:text-sm transition-all"
                      placeholder="Campus, company, or organization"
                    />
                  </div>
                </div>
              </>
            )}
            <div>
              <label htmlFor="email-address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        clearFieldError('email');
                      }}
                  className={`appearance-none relative block w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800/50 border placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:border-transparent sm:text-sm transition-all ${fieldErrors.email ? 'border-rose-400 focus:ring-rose-400' : 'border-gray-300 dark:border-gray-700 focus:ring-indigo-500 dark:focus:ring-indigo-400'}`}
                  placeholder="you@example.com"
                />
              </div>
              {fieldErrors.email ? <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{fieldErrors.email}</p> : null}
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clearFieldError('password');
                    clearFieldError('confirmPassword');
                  }}
                  className={`appearance-none relative block w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800/50 border placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:border-transparent sm:text-sm transition-all ${fieldErrors.password ? 'border-rose-400 focus:ring-rose-400' : 'border-gray-300 dark:border-gray-700 focus:ring-indigo-500 dark:focus:ring-indigo-400'}`}
                  placeholder="••••••••"
                />
              </div>
              {fieldErrors.password ? <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{fieldErrors.password}</p> : null}
              {!fieldErrors.password && !isLogin ? (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Use at least 8 characters.</p>
              ) : null}
            </div>
            {!isLogin && (
              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    id="confirm-password"
                    name="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      clearFieldError('confirmPassword');
                    }}
                    className={`appearance-none relative block w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800/50 border placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:border-transparent sm:text-sm transition-all ${fieldErrors.confirmPassword ? 'border-rose-400 focus:ring-rose-400' : 'border-gray-300 dark:border-gray-700 focus:ring-indigo-500 dark:focus:ring-indigo-400'}`}
                    placeholder="••••••••"
                  />
                </div>
                {fieldErrors.confirmPassword ? <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{fieldErrors.confirmPassword}</p> : null}
              </div>
            )}
          </div>

          {isLogin && (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-700 rounded dark:bg-gray-800" />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">Remember me</label>
              </div>
              <div className="text-sm">
                <Link to="/forgot-password" className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 hover:underline">Forgot password?</Link>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || Boolean(socialLoading)}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              <>
                {isLogin ? 'Sign in' : 'Create account'}
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-6">
          <button 
            onClick={toggleMode}
            disabled={Boolean(socialLoading)}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium transition-colors"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
