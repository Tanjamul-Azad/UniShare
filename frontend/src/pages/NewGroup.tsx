import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { ArrowLeft, ShieldCheck, Users, Key } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { createSubscriptionGroup } from '../lib/api';
import { emitToast } from '../lib/toastBus';
import { newGroupSchema } from '../lib/validation';

type GroupFieldErrors = Partial<Record<'service' | 'monthlyCost' | 'totalSpots' | 'duration' | 'description', string>>;

export default function NewGroup() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [listingType, setListingType] = useState<'share' | 'sublet'>('share');
  const [fieldErrors, setFieldErrors] = useState<GroupFieldErrors>({});

  const createGroupMutation = useMutation({
    mutationFn: createSubscriptionGroup,
    onSuccess: async (group) => {
      await queryClient.invalidateQueries({ queryKey: ['subscription-groups'] });
      await queryClient.invalidateQueries({ queryKey: ['subscription-group', group.id] });
      emitToast('Subscription listing created successfully.', 'success');
      navigate(`/co-subs/${group.id}`);
    },
    onError: () => {
      emitToast('Unable to create subscription listing. Please try again.', 'error');
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const service = String(formData.get('service') || '').trim();
    const monthlyCost = Number(formData.get('monthlyCost') || 0);
    const totalSpots = Number(formData.get('totalSpots') || 0);
    const duration = Number(formData.get('duration') || 0);
    const description = String(formData.get('description') || '').trim();

    const parsed = newGroupSchema.safeParse({
      service,
      listingType,
      monthlyCost,
      totalSpots: listingType === 'share' ? totalSpots : undefined,
      duration: listingType === 'sublet' ? duration : undefined,
      description,
    });

    if (!parsed.success) {
      const nextErrors: GroupFieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === 'string' && !(key in nextErrors)) {
          nextErrors[key as keyof GroupFieldErrors] = issue.message;
        }
      }
      setFieldErrors(nextErrors);
      emitToast('Please fix the highlighted fields.', 'error');
      return;
    }

    setFieldErrors({});
    createGroupMutation.mutate(parsed.data);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto py-8 px-4">
      <Link to="/co-subs" className="inline-flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Co-Subscriptions
      </Link>

      <div className="bg-white/80 dark:bg-[#1A1A2E]/80 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-white/10 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] relative overflow-hidden">
        {/* Decorative gradients */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-emerald-500 to-amber-500" />
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 font-['Plus_Jakarta_Sans']">List a Subscription</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8 font-['DM_Sans']">Share or sublet your digital subscriptions securely.</p>
        
        <form onSubmit={handleSubmit} className="space-y-8 relative z-10 font-['DM_Sans']">
          
          {/* Listing Type Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Listing Type</label>
            <div className="grid grid-cols-2 gap-4">
              {[
                { id: 'share', label: 'Share (Group Plan)', icon: Users, desc: 'Split the cost with others' },
                { id: 'sublet', label: 'Sublet', icon: Key, desc: 'Rent out your unused account' }
              ].map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setListingType(type.id as 'share' | 'sublet')}
                  className={cn(
                    "flex flex-col items-center justify-center gap-2 py-4 px-4 rounded-xl border-2 transition-all duration-200",
                    listingType === type.id 
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300" 
                      : "border-gray-200 dark:border-white/10 bg-transparent text-gray-600 dark:text-gray-400 hover:border-indigo-200 dark:hover:border-indigo-500/30"
                  )}
                >
                  <type.icon className="w-6 h-6 mb-1" />
                  <span className="text-sm font-semibold">{type.label}</span>
                  <span className="text-xs opacity-70">{type.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Service Name</label>
            <input name="service" type="text" required placeholder="e.g. Spotify Family, Netflix Premium, Adobe CC" className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white transition-all" />
            {fieldErrors.service && <p className="mt-1 text-xs text-rose-600">{fieldErrors.service}</p>}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {listingType === 'share' ? 'Total Monthly Cost ($)' : 'Monthly Sublet Price ($)'}
              </label>
              <input name="monthlyCost" type="number" required min="0" step="0.01" placeholder="0.00" className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white transition-all" />
              {fieldErrors.monthlyCost && <p className="mt-1 text-xs text-rose-600">{fieldErrors.monthlyCost}</p>}
            </div>
            {listingType === 'share' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Total Spots (Including you)</label>
                <input name="totalSpots" type="number" required min="2" max="10" placeholder="e.g. 4" className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white transition-all" />
                {fieldErrors.totalSpots && <p className="mt-1 text-xs text-rose-600">{fieldErrors.totalSpots}</p>}
              </motion.div>
            )}
            {listingType === 'sublet' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Duration (Months)</label>
                <input name="duration" type="number" required min="1" max="12" placeholder="e.g. 3" className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white transition-all" />
                {fieldErrors.duration && <p className="mt-1 text-xs text-rose-600">{fieldErrors.duration}</p>}
              </motion.div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Description & Rules</label>
            <textarea name="description" required rows={4} placeholder={listingType === 'share' ? "Explain how the account will be shared, rules for profiles, etc." : "Explain what is included, any restrictions, etc."} className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-gray-900 dark:text-white transition-all"></textarea>
            {fieldErrors.description && <p className="mt-1 text-xs text-rose-600">{fieldErrors.description}</p>}
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-500/10 p-4 rounded-xl border border-indigo-100 dark:border-indigo-500/20 flex gap-3 items-start">
            <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <p className="text-sm text-indigo-800 dark:text-indigo-200">
              <strong>Escrow Protection:</strong> Funds will be collected from members and held securely. You will receive the payout once {listingType === 'share' ? 'the group is full' : 'the sublet begins'} and you provide the access credentials.
            </p>
          </div>

          <button
            type="submit"
            disabled={createGroupMutation.isPending}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 disabled:opacity-60 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-200 transform hover:-translate-y-0.5"
          >
            {createGroupMutation.isPending
              ? 'Creating...'
              : listingType === 'share'
                ? 'Create Group Plan'
                : 'List Sublet'}
          </button>
        </form>
      </div>
    </motion.div>
  );
}
