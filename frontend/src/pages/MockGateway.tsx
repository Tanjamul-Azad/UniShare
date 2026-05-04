import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CreditCard, Smartphone, ShieldCheck, Lock, ArrowRight,
  CheckCircle, XCircle, ChevronRight, BookOpen, X,
  Phone, Key, Hash, Shield
} from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';

type Tab = 'card' | 'mobile';
type Stage = 
  | 'select' 
  | 'card-form' 
  | 'mobile-select' 
  | 'mobile-phone' 
  | 'mobile-otp' 
  | 'mobile-pin' 
  | 'processing' 
  | 'done';

const MobileProviders = [
  { id: 'bkash',  label: 'bKash',  logo: '/bkashlogo.webp',       color: '#E2136E', secondary: '#FADEEA' },
  { id: 'nagad',  label: 'Nagad',  logo: '/Nagad-Logo.wine.png',  color: '#F05824', secondary: '#FDECE6' },
  { id: 'rocket', label: 'Rocket', logo: '/rocket.webp',           color: '#8B0054', secondary: '#F5E6EF' },
];

const spring = { type: 'spring' as const, stiffness: 340, damping: 30 };

export default function PaymentGateway() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const tranId = searchParams.get('tran_id') ?? 'N/A';
  const rawTotal = parseFloat(searchParams.get('total') ?? '0');
  const total = rawTotal.toLocaleString('en-BD', { minimumFractionDigits: 2 });

  const [tab, setTab] = React.useState<Tab>('card');
  const [stage, setStage] = React.useState<Stage>('select');
  const [selectedProvider, setSelectedProvider] = React.useState<string | null>(null);
  const [agreed, setAgreed] = React.useState(false);
  const [outcome, setOutcome] = React.useState<'success' | 'fail' | null>(null);

  // Form states
  const [phone, setPhone] = React.useState('');
  const [otp, setOtp] = React.useState('');
  const [pin, setPin] = React.useState('');
  
  const provider = MobileProviders.find(p => p.id === selectedProvider);

  // Sync with checkout selection
  React.useEffect(() => {
    const preferred = searchParams.get('method');
    if (preferred === 'mobile') {
      setTab('mobile');
      setStage('mobile-select');
    } else if (preferred === 'card') {
      setTab('card');
      setStage('card-form');
    }
  }, [searchParams]);

  // Card fields
  const [cardNum,  setCardNum]  = React.useState('');
  const [expiry,   setExpiry]   = React.useState('');
  const [cvv,      setCvv]      = React.useState('');
  const [name,     setName]     = React.useState('');

  const formatCard = (v: string) =>
    v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  const formatExpiry = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 4);
    return d.length >= 3 ? `${d.slice(0, 2)} / ${d.slice(2)}` : d;
  };

  const fireCallback = (result: 'success' | 'fail') => {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = `/api/payment/${result}`;

    const f = (n: string, v: string) => {
      const i = document.createElement('input');
      i.type = 'hidden'; i.name = n; i.value = v;
      form.appendChild(i);
    };
    f('tran_id', tranId);
    f('val_id', 'MOCK_VAL_' + Math.random().toString(36).slice(2, 9).toUpperCase());
    document.body.appendChild(form);
    form.submit();
  };

  const handlePay = () => {
    if (tab === 'card') {
      setStage('processing');
      setTimeout(() => {
        setOutcome('success');
        setStage('done');
        setTimeout(() => fireCallback('success'), 1600);
      }, 2000);
    } else {
      setStage('mobile-phone');
    }
  };

  const nextStage = () => {
    if (stage === 'mobile-phone') setStage('mobile-otp');
    else if (stage === 'mobile-otp') setStage('mobile-pin');
    else if (stage === 'mobile-pin') {
      setStage('processing');
      setTimeout(() => {
        setOutcome('success');
        setStage('done');
        setTimeout(() => fireCallback('success'), 1600);
      }, 1500);
    }
  };

  /* ── Header ──────────────────────────────────────── */
  const Header = () => (
    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm">
          <BookOpen className="w-4 h-4 text-white" />
        </div>
        <div>
          <span className="font-bold text-sm text-gray-900 tracking-tight">UniShare</span>
          <span className="ml-1.5 text-[10px] font-semibold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded-full uppercase tracking-wide">Pay</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
          <Lock className="w-3 h-3" />
          <span className="text-[10px] font-bold uppercase tracking-wide">256-bit SSL</span>
        </div>
        <button
          onClick={() => navigate('/checkout')}
          className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  const OrderStrip = () => (
    <div className="mx-6 mt-4 mb-1 px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-between">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-0.5">Transaction</p>
        <p className="font-mono text-xs font-medium text-gray-600">{tranId}</p>
      </div>
      <div className="text-right">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-0.5">Total</p>
        <p className="text-lg font-bold text-gray-900">৳&thinsp;{total}</p>
      </div>
    </div>
  );

  const TabBar = () => (
    <div className="flex mx-6 mt-4 rounded-xl bg-gray-100 p-1 gap-1">
      {([
        { key: 'card',   label: 'Card Payment',    Icon: CreditCard  },
        { key: 'mobile', label: 'Mobile Banking',  Icon: Smartphone  },
      ] as const).map(({ key, label, Icon }) => (
        <button
          key={key}
          disabled={stage !== 'select' && stage !== 'card-form' && stage !== 'mobile-select'}
          onClick={() => { setTab(key); setStage(key === 'card' ? 'card-form' : 'mobile-select'); setSelectedProvider(null); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[13px] font-semibold transition-all duration-200 ${
            tab === key
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700 disabled:opacity-50'
          }`}
        >
          <Icon className="w-3.5 h-3.5" />
          {label}
        </button>
      ))}
    </div>
  );

  /* ── Stages ───────────────────────────────────────── */

  const CardForm = () => (
    <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="space-y-3 px-6 mt-4">
      <div className="relative">
        <input
          className="w-full h-12 rounded-xl border border-gray-200 bg-white px-4 pr-16 text-sm font-mono placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          placeholder="Card number"
          value={cardNum}
          onChange={e => setCardNum(formatCard(e.target.value))}
        />
        <CreditCard className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-200" />
      </div>
      <div className="flex gap-3">
        <input
          className="flex-1 h-12 rounded-xl border border-gray-200 bg-white px-4 text-sm font-mono placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          placeholder="MM / YY"
          value={expiry}
          onChange={e => setExpiry(formatExpiry(e.target.value))}
        />
        <input
          className="w-28 h-12 rounded-xl border border-gray-200 bg-white px-4 text-sm font-mono placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          placeholder="CVV"
          type="password"
          value={cvv}
          onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
        />
      </div>
      <input
        className="w-full h-12 rounded-xl border border-gray-200 bg-white px-4 text-sm placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
        placeholder="Name on card"
        value={name}
        onChange={e => setName(e.target.value)}
      />
    </motion.div>
  );

  const MobileGrid = () => (
    <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="px-6 mt-4">
      <p className="text-xs font-semibold text-gray-500 mb-3 text-center">Select your wallet provider</p>
      <div className="grid grid-cols-3 gap-3">
        {MobileProviders.map(p => (
          <button
            key={p.id}
            onClick={() => setSelectedProvider(p.id)}
            className={`relative h-20 rounded-xl border-2 flex items-center justify-center transition-all duration-200 overflow-hidden ${
              selectedProvider === p.id
                ? 'border-indigo-500 bg-indigo-50/30'
                : 'border-gray-100 hover:border-gray-200 bg-gray-50'
            }`}
          >
            <img src={p.logo} alt={p.label} className="w-full h-full object-contain p-3" />
            {selectedProvider === p.id && (
              <div className="absolute top-1 right-1">
                <CheckCircle className="w-4 h-4 text-indigo-500 fill-white" />
              </div>
            )}
          </button>
        ))}
      </div>
    </motion.div>
  );

  const MobilePhoneStage = () => (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="px-6 mt-6">
      <div className="flex flex-col items-center mb-6">
        <div className="w-16 h-16 rounded-2xl bg-white shadow-md border border-gray-100 flex items-center justify-center mb-3">
          <img src={provider?.logo} alt={provider?.label} className="w-10 h-10 object-contain" />
        </div>
        <h3 className="text-sm font-bold text-gray-900">Enter your {provider?.label} Account</h3>
      </div>
      <div className="relative">
        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          autoFocus
          className="w-full h-14 rounded-2xl border-2 border-gray-100 bg-white pl-11 pr-4 text-lg font-bold tracking-[0.2em] placeholder:font-normal placeholder:tracking-normal focus:outline-none focus:border-indigo-500 transition-all"
          placeholder="01XXXXXXXXX"
          value={phone}
          maxLength={11}
          onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
        />
      </div>
      <p className="mt-4 text-[11px] text-gray-400 text-center leading-relaxed">
        By continuing, you agree to the terms of {provider?.label} and UniShare.
      </p>
    </motion.div>
  );

  const MobileOtpStage = () => (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="px-6 mt-6">
      <div className="flex flex-col items-center mb-6">
        <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
          <Shield className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-gray-900">OTP Verification</h3>
        <p className="text-xs text-gray-500 mt-1">Sent to {phone.slice(0,3)}***{phone.slice(-2)}</p>
      </div>
      <div className="relative">
        <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          autoFocus
          className="w-full h-14 rounded-2xl border-2 border-gray-100 bg-white pl-11 pr-4 text-2xl font-black tracking-[0.5em] placeholder:font-normal placeholder:tracking-normal text-center focus:outline-none focus:border-indigo-500 transition-all"
          placeholder="000000"
          value={otp}
          maxLength={6}
          onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
        />
      </div>
      <div className="mt-4 flex justify-between items-center px-1">
        <p className="text-[11px] text-gray-400">Didn't receive code?</p>
        <button className="text-[11px] font-bold text-indigo-600 hover:underline">Resend OTP</button>
      </div>
    </motion.div>
  );

  const MobilePinStage = () => (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="px-6 mt-6">
      <div className="flex flex-col items-center mb-6">
        <div className="w-12 h-12 rounded-full bg-gray-50 text-gray-600 flex items-center justify-center mb-3">
          <Key className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-gray-900">Enter PIN</h3>
        <p className="text-xs text-gray-500 mt-1">Enter your secret {provider?.label} PIN</p>
      </div>
      <input
        autoFocus
        type="password"
        className="w-full h-14 rounded-2xl border-2 border-gray-100 bg-white px-4 text-3xl font-black tracking-[1em] text-center focus:outline-none focus:border-indigo-500 transition-all"
        placeholder="••••"
        value={pin}
        maxLength={4}
        onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
      />
      <div className="mt-8 flex items-center gap-2 justify-center py-2 px-4 bg-emerald-50 rounded-xl">
        <ShieldCheck className="w-4 h-4 text-emerald-600" />
        <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">End-to-End Encrypted</p>
      </div>
    </motion.div>
  );

  const FooterActions = () => {
    const isMobileFlow = stage.startsWith('mobile-') && stage !== 'mobile-select';
    
    let canProceed = false;
    let label = `Pay ৳${total}`;
    let onClick = handlePay;

    if (tab === 'card') {
      canProceed = cardNum.replace(/\s/g,'').length === 16 && expiry.length >= 4 && agreed;
    } else if (stage === 'mobile-select') {
      canProceed = !!selectedProvider && agreed;
    } else if (stage === 'mobile-phone') {
      canProceed = phone.length === 11;
      label = 'Continue';
      onClick = nextStage;
    } else if (stage === 'mobile-otp') {
      canProceed = otp.length === 6;
      label = 'Verify';
      onClick = nextStage;
    } else if (stage === 'mobile-pin') {
      canProceed = pin.length >= 4;
      label = 'Confirm Payment';
      onClick = nextStage;
    }

    return (
      <div className="px-6 pb-6 mt-6 space-y-4">
        {stage === 'select' || stage === 'card-form' || stage === 'mobile-select' ? (
          <label className="flex items-start gap-3 cursor-pointer group">
            <div
              onClick={() => setAgreed(!agreed)}
              className={`mt-0.5 w-5 h-5 shrink-0 rounded-md border-2 flex items-center justify-center transition-all ${
                agreed ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 group-hover:border-indigo-400'
              }`}
            >
              {agreed && <CheckCircle className="w-3 h-3 text-white" strokeWidth={2.5} />}
            </div>
            <span className="text-[12px] text-gray-500 leading-relaxed select-none">
              I authorise UniShare to charge{' '}
              <span className="font-semibold text-gray-800">৳&thinsp;{total}</span> from my account and agree to the Terms.
            </span>
          </label>
        ) : null}

        <button
          onClick={onClick}
          disabled={!canProceed}
          style={isMobileFlow ? { backgroundColor: provider?.color } : {}}
          className={`w-full h-13 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all duration-200 ${
            canProceed
              ? 'bg-indigo-600 hover:opacity-90 text-white shadow-lg active:scale-[0.98]'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isMobileFlow ? <ShieldCheck className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          {label}
          {canProceed && <ChevronRight className="w-4 h-4" />}
        </button>
        
        {isMobileFlow && (
          <button 
            onClick={() => setStage('mobile-select')}
            className="w-full text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors"
          >
            Cancel and go back
          </button>
        )}
      </div>
    );
  };

  const Processing = () => (
    <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center gap-5 z-10 rounded-2xl">
      <motion.div 
        animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="w-16 h-16 rounded-full border-4 border-indigo-100 border-t-indigo-600"
      />
      <div className="text-center">
        <p className="font-bold text-gray-900 text-sm">Processing Transaction</p>
        <p className="text-xs text-gray-400 mt-1">Securing your payment...</p>
      </div>
    </div>
  );

  const Done = () => (
    <div className="absolute inset-0 bg-white flex flex-col items-center justify-center gap-6 z-10 rounded-2xl px-8">
      {outcome === 'success' ? (
        <>
          <motion.div 
            initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} 
            className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center"
          >
            <CheckCircle className="w-10 h-10 text-emerald-600" strokeWidth={2.5} />
          </motion.div>
          <div className="text-center">
            <h2 className="text-xl font-black text-gray-900">Payment Confirmed!</h2>
            <p className="text-sm text-gray-500 mt-2">Your order is being processed.</p>
          </div>
          <div className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <div className="flex justify-between text-xs mb-2">
              <span className="text-gray-400 font-bold uppercase tracking-wider">Ref Number</span>
              <span className="text-gray-900 font-mono">#US{Math.random().toString(36).slice(2,8).toUpperCase()}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400 font-bold uppercase tracking-wider">Status</span>
              <span className="text-emerald-600 font-bold">Success</span>
            </div>
          </div>
        </>
      ) : (
        <>
          <XCircle className="w-20 h-20 text-rose-500" strokeWidth={1.5} />
          <p className="text-lg font-bold">Payment Failed</p>
        </>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-slate-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[420px] bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 relative overflow-hidden"
      >
        <AnimatePresence>
          {stage === 'processing' && <Processing />}
          {stage === 'done' && <Done />}
        </AnimatePresence>

        <Header />
        <OrderStrip />
        
        <AnimatePresence mode="wait">
          {stage === 'card-form' && <CardForm key="card" />}
          {stage === 'mobile-select' && (
            <div key="mobile-select">
              <TabBar />
              <MobileGrid />
            </div>
          )}
          {stage === 'mobile-phone' && <MobilePhoneStage key="phone" />}
          {stage === 'mobile-otp'   && <MobileOtpStage key="otp" />}
          {stage === 'mobile-pin'   && <MobilePinStage key="pin" />}
        </AnimatePresence>

        <FooterActions />

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            PCI-DSS Compliant & Secured
          </p>
        </div>
      </motion.div>
    </div>
  );
}
