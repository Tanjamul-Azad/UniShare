import React from 'react';
import { motion } from 'motion/react';
import { CreditCard, ShieldCheck, Lock, Smartphone, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { initiatePayment } from '../lib/api';

export default function Checkout() {
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(window.location.search);
  const paymentError = searchParams.get('error');
  const { sendNotification } = useSocket();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  if (user?.role === 'admin') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mb-5">
          <ShieldCheck className="w-7 h-7 text-indigo-600" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Admin accounts cannot checkout</h2>
        <p className="text-gray-500 text-sm">Administrators are not permitted to participate in marketplace activities.</p>
      </div>
    );
  }
  const [error, setError] = React.useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = React.useState<'card' | 'mobile'>('card');

  React.useEffect(() => {
    if (paymentError) setError(paymentError);
  }, [paymentError]);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const { url } = await initiatePayment(paymentMethod);
      window.location.href = url;
    } catch (err: any) {
      setError(err?.message ?? 'Payment could not be initiated. Please try again.');
      setIsSubmitting(false);
    }
  };

  const methods = [
    {
      id: 'card' as const,
      icon: CreditCard,
      label: 'Credit / Debit Card',
      description: 'Visa, Mastercard, Amex accepted',
    },
    {
      id: 'mobile' as const,
      icon: Smartphone,
      label: 'Mobile Banking',
      description: 'bKash, Nagad, Rocket',
      logos: ['/bkashlogo.webp', '/Nagad-Logo.wine.png', '/rocket.webp'],
      logoAlts: ['bKash', 'Nagad', 'Rocket'],
    },
  ] as const;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-lg mx-auto px-4 sm:px-6 py-10 sm:py-14"
    >
      <BackButton fallback="/cart" label="Back to Cart" className="mb-6" />

      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 tracking-tight">Checkout</h1>
        <p className="text-gray-500 mt-2 text-sm flex items-center justify-center gap-1.5">
          <Lock className="w-3.5 h-3.5" />
          Your payment is encrypted and secure
        </p>
      </div>

      <form onSubmit={handlePay} className="space-y-5">
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        {/* Payment method selector */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Payment Method</h2>
          </div>

          <div className="divide-y divide-gray-100">
            {methods.map((m) => {
              const { id, icon: Icon, label, description } = m;
              return (
                <label
                  key={id}
                  className={`flex items-center gap-4 px-5 py-4 cursor-pointer transition-colors ${
                    paymentMethod === id ? 'bg-indigo-50/60' : 'hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={id}
                    checked={paymentMethod === id}
                    onChange={() => setPaymentMethod(id)}
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    paymentMethod === id ? 'bg-indigo-600' : 'bg-gray-100'
                  }`}>
                    <Icon className={`w-4.5 h-4.5 ${paymentMethod === id ? 'text-white' : 'text-gray-500'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{description}</p>
                  </div>
                  {/* Logo row — only for methods that have logos */}
                  {'logos' in m && m.logos && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      {m.logos.map((src, i) => (
                        <img key={src} src={src} alt={m.logoAlts?.[i]} className="h-5 w-auto object-contain" />
                      ))}
                    </div>
                  )}
                </label>
              );
            })}
          </div>
        </div>

        {/* Info card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0 mt-0.5">
              <ShieldCheck className="w-4.5 h-4.5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {paymentMethod === 'card' ? 'Secure Card Payment' : 'Real-time Mobile Banking'}
              </p>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                {paymentMethod === 'card'
                  ? 'You will be taken to a secure payment page to complete your card transaction. We never store your card details.'
                  : 'Select your preferred provider (bKash, Nagad, or Rocket) on the next screen and complete your payment with your PIN.'}
              </p>
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-[15px] transition-all flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(79,70,229,0.35)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.45)] hover:-translate-y-0.5 active:translate-y-0"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31" strokeDashoffset="20" strokeLinecap="round"/>
              </svg>
              Connecting to gateway…
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              Proceed to Payment
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        <p className="text-[11px] text-center text-gray-400 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3 h-3 text-emerald-500" />
          PCI-DSS compliant · End-to-end encrypted · Powered by UniShare Pay
        </p>
      </form>
    </motion.div>
  );
}
