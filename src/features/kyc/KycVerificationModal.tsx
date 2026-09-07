import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, AlertCircle, CheckCircle2, X, Lock, Clock, AlertTriangle } from 'lucide-react';
import { useMarketplace } from '../../core/context/MarketplaceContext';
import { getApiBaseUrl } from '../../config';

import { auth } from '../../lib/firebase';

export const KycVerificationModal: React.FC = () => {
  const { activeModal, setActiveModal, currentUser, showToast, refreshFeedData } = useMarketplace();
  const [step, setStep] = useState<'ID_INPUT' | 'OTP_INPUT'>('ID_INPUT');
  const [isInitializing, setIsInitializing] = useState(false);
  const [aadhaar, setAadhaar] = useState('');
  const [otp, setOtp] = useState('');
  const [refId, setRefId] = useState('');

  if (activeModal !== 'KYC') return null;

  

  if (!currentUser) {
    return (
      
      <div className="fixed inset-0 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" onClick={() => setActiveModal(null)} />
        <div className="relative bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl flex flex-col items-center">
          <ShieldCheck className="w-12 h-12 text-brand-500 mb-4" />
          <h2 className="text-xl font-bold mb-2">Login Required</h2>
          <p className="text-center text-stone-500 mb-6">Please login first to verify your identity.</p>
          <button onClick={() => setActiveModal('AUTH')} className="w-full py-3 bg-brand-600 text-white font-bold rounded-xl">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const handleGenerateOtp = async () => {
    if (aadhaar.length !== 12) {
      return showToast('Please enter a valid 12-digit Aadhaar number');
    }

    setIsInitializing(true);
    try {
      const idToken = await auth.currentUser?.getIdToken() || '';
      const res = await fetch(`${getApiBaseUrl()}/api/kyc/aadhaar/otp/generate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
          'x-trega-client': 'trega-web-app'
        },
        body: JSON.stringify({ userId: currentUser.id, aadhaarNumber: aadhaar })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate OTP');
      
      setRefId(data.ref_id);
      setStep('OTP_INPUT');
      showToast('OTP sent to your Aadhaar-linked mobile number');
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Error generating OTP');
    } finally {
      setIsInitializing(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 6) {
      return showToast('Please enter a valid OTP');
    }

    setIsInitializing(true);
    try {
      const idToken = await auth.currentUser?.getIdToken() || '';
      const res = await fetch(`${getApiBaseUrl()}/api/kyc/aadhaar/otp/verify`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
          'x-trega-client': 'trega-web-app'
        },
        body: JSON.stringify({ userId: currentUser.id, ref_id: refId, otp, aadhaarNumber: aadhaar })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to verify OTP');
      
      showToast('Identity verified successfully!');
      setActiveModal(null);
      setTimeout(() => refreshFeedData(), 2000);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Invalid OTP');
    } finally {
      setIsInitializing(false);
    }
  };

  const renderStatus = () => {
    if (currentUser.kycStatus === 'APPROVED') {
      return (
        <div className="flex flex-col items-center text-center py-6">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-stone-900 mb-2">You are Verified!</h3>
          <p className="text-stone-500 text-sm mb-6">Your identity has been successfully verified. You can now list items and interact freely on Trega.</p>
          <button onClick={() => setActiveModal(null)} className="px-6 py-3 bg-stone-900 text-white font-bold rounded-xl w-full">
            Continue to Trega
          </button>
        </div>
      );
    }
    
    if (currentUser.kycStatus === 'PENDING_REVIEW') {
      return (
        <div className="flex flex-col items-center text-center py-6">
          <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4 animate-pulse">
            <Clock className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-stone-900 mb-2">Verification in Progress</h3>
          <p className="text-stone-500 text-sm mb-6">Your documents are currently being reviewed. This usually takes just a few minutes. We will notify you once approved.</p>
          <button onClick={() => setActiveModal(null)} className="px-6 py-3 bg-stone-200 text-stone-900 font-bold rounded-xl w-full">
            Close
          </button>
        </div>
      );
    }

    if (currentUser.kycStatus === 'REJECTED') {
      return (
        <div className="flex flex-col items-center text-center py-6">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-stone-900 mb-2">Verification Failed</h3>
          <p className="text-stone-500 text-sm mb-4">We could not verify your identity.</p>
          <button onClick={() => setStep('ID_INPUT')} className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl w-full transition-colors flex items-center justify-center gap-2">
            Retry Verification
          </button>
        </div>
      );
    }

    if (step === 'OTP_INPUT') {
      return (
        <>
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto bg-brand-100 text-brand-600 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-stone-900 mb-2">Enter OTP</h2>
            <p className="text-stone-500 text-sm">
              We sent a 6-digit OTP to the mobile number linked with your Aadhaar.
            </p>
          </div>
          
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">OTP</label>
              <input 
                type="text" 
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all text-center text-2xl tracking-[0.5em] font-mono"
                placeholder="000000"
              />
            </div>
          </div>
          
          <button 
            onClick={handleVerifyOtp} 
            disabled={isInitializing || otp.length < 6}
            className="w-full py-4 bg-brand-600 hover:bg-brand-700 active:scale-[0.98] text-white font-bold text-base rounded-2xl shadow-lg shadow-brand-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isInitializing ? 'Verifying...' : 'Verify OTP'}
          </button>
          
          <button 
            onClick={() => setStep('ID_INPUT')}
            className="w-full mt-3 py-3 bg-transparent text-stone-500 hover:text-stone-700 font-medium text-sm rounded-xl transition-all"
          >
            Change Aadhaar Number
          </button>
        </>
      );
    }

    return (
      <>
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto bg-brand-100 text-brand-600 rounded-full flex items-center justify-center mb-4">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-stone-900 mb-2">Verify Your Identity</h2>
          <p className="text-stone-500 text-sm">
            To ensure a safe community, Trega requires all users to verify their identity before buying or selling.
          </p>
        </div>
        
        <div className="bg-stone-50 p-4 rounded-2xl mb-6 space-y-3">
          <div className="flex items-start gap-3">
             <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
             <p className="text-sm text-stone-700">Quick 2-minute automated process</p>
          </div>
          <div className="flex items-start gap-3">
             <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
             <p className="text-sm text-stone-700">Have your Aadhaar card ready</p>
          </div>
          <div className="flex items-start gap-3">
             <Lock className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
             <p className="text-sm text-stone-700">End-to-end encrypted & completely secure</p>
          </div>
        </div>
        
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Aadhaar Number</label>
            <input 
              type="text" 
              maxLength={12}
              value={aadhaar}
              onChange={(e) => setAadhaar(e.target.value.replace(/[^0-9]/g, ''))}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all font-mono"
              placeholder="1234 5678 9012"
            />
          </div>
        </div>
        
        <button 
          onClick={handleGenerateOtp} 
          disabled={isInitializing || aadhaar.length !== 12}
          className="w-full py-4 bg-brand-600 hover:bg-brand-700 active:scale-[0.98] text-white font-bold text-base rounded-2xl shadow-lg shadow-brand-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {isInitializing ? (
            'Connecting...'
          ) : (
             <>Request OTP <ShieldCheck className="w-5 h-5" /></>
          )}
        </button>
      </>
    );
  };

  return (
  <AnimatePresence>
    {activeModal === 'KYC' && (
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed inset-0 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] z-50 flex flex-col items-center justify-center bg-stone-50 overflow-hidden shadow-[0_-20px_60px_-15px_rgba(0,0,0,0.2)] md:rounded-t-[40px] md:top-10 md:inset-x-20">
        <div className="relative w-full max-w-md bg-white rounded-3xl border border-stone-200 shadow-2xl flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-stone-400" />
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Secured by Bulkpe</span>
            </div>
            <button 
              onClick={() => setActiveModal(null)}
              className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {/* Scrollable Body */}
          <div className="p-6 overflow-y-auto">
            {renderStatus()}
          </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
  );
};