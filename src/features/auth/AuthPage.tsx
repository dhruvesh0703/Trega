import React, { useState, useEffect, useRef } from 'react';
import {
 Phone,
 ShieldCheck,
 ArrowRight,
 User as UserIcon,
 MapPin,
 RefreshCw,
 CheckCircle2,
 AlertCircle,
 X,
 KeyRound,
 Navigation,
} from 'lucide-react';
import { useMarketplace } from '../../core/context/MarketplaceContext';
import { RecaptchaVerifier, auth, db } from '../../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { ConfirmationResult } from 'firebase/auth';
import { TregaLogo } from '../../components/TregaLogo';

interface AuthPageProps {
 onSuccess?: () => void;
 onCancel?: () => void;
 isModal?: boolean;
}

export const AuthPage: React.FC<AuthPageProps> = ({
 onSuccess,
 onCancel,
 isModal = false,
}) => {
 const {
 userLocation,
 fetchLiveLocation,
 isLocating,
 sendFirebasePhoneOtp,
 verifyFirebasePhoneOtp,
 showToast,
 } = useMarketplace();

 const [step, setStep] = useState<'PHONE_INPUT' | 'OTP_INPUT' | 'PROFILE_SETUP'>('PHONE_INPUT');
 const [authMode, setAuthMode] = useState<'SIGN_IN' | 'SIGN_UP'>('SIGN_IN');
 const [profileName, setProfileName] = useState('');
  const [email, setEmail] = useState('');

 // Form Fields
 const [phoneNumber, setPhoneNumber] = useState('');

 // OTP Verification
 const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
 const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
 const [isLoading, setIsLoading] = useState(false);
 const [errorMessage, setErrorMessage] = useState<string | null>(null);
 const [resendTimer, setResendTimer] = useState(30);

 // Recaptcha verifier reference
 const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
 const recaptchaContainerRef = useRef<HTMLDivElement>(null);
 const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

 // Setup reCAPTCHA safely
 useEffect(() => {
 let isMounted = true;

 try {
 const container = recaptchaContainerRef.current || document.getElementById('recaptcha-container');
 if (!recaptchaVerifierRef.current && container) {
 recaptchaVerifierRef.current = new RecaptchaVerifier(
 auth,
 container,
 {
 size: 'invisible',
 callback: () => {
 // reCAPTCHA solved
 },
 'expired-callback': () => {
 if (isMounted) {
 setErrorMessage('Verification expired. Please try sending OTP again.');
 }
 },
 }
 );
 }
 } catch (e: any) {
 console.debug('Recaptcha init info:', e);
 }

 return () => {
 isMounted = false;
 if (recaptchaVerifierRef.current) {
 try {
 const recaptcha = recaptchaVerifierRef.current;
 recaptchaVerifierRef.current = null;
 recaptcha.clear();
 } catch (e) {
 // ignore sync cleanup errors on unmount
 }
 }
 };
 }, []);

 // Timer countdown for OTP resend
 useEffect(() => {
 if (step === 'OTP_INPUT' && resendTimer > 0) {
 const interval = setInterval(() => {
 setResendTimer((prev) => prev - 1);
 }, 1000);
 return () => clearInterval(interval);
 }
 }, [step, resendTimer]);

 const handleSendOtp = async (e: React.FormEvent) => {
 e.preventDefault();
 setErrorMessage(null);

 const cleanPhone = phoneNumber.replace(/\D/g, '');
 if (cleanPhone.length < 10) {
 setErrorMessage('Please enter a valid 10-digit mobile number.');
 return;
 }

 setIsLoading(true);

 const fullInternationalNumber = `+91${cleanPhone.slice(-10)}`;

 try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('phone', '==', fullInternationalNumber));
      const querySnapshot = await getDocs(q);
      const userExists = !querySnapshot.empty;
      let hasRealName = false;
      
      if (userExists) {
         const existingData = querySnapshot.docs[0].data();
         if (existingData.name && existingData.name.trim() !== '' && existingData.name !== 'Local Resident') {
             hasRealName = true;
         }
      }

      if (authMode === 'SIGN_UP' && hasRealName) {
        setErrorMessage('You already have an account. Please switch to Sign In.');
        setIsLoading(false);
        return;
      }
      
      if (authMode === 'SIGN_IN' && !hasRealName) {
        setErrorMessage('Account not found. Please switch to Create Account.');
        setIsLoading(false);
        return;
      }

      if (!recaptchaVerifierRef.current) {
 const container = recaptchaContainerRef.current || document.getElementById('recaptcha-container');
 if (container) {
 recaptchaVerifierRef.current = new RecaptchaVerifier(
 auth,
 container,
 {
 size: 'invisible',
 }
 );
 }
 }

 const confResult = recaptchaVerifierRef.current
 ? await sendFirebasePhoneOtp(
 fullInternationalNumber,
 recaptchaVerifierRef.current
 )
 : null;

 setConfirmationResult(confResult);
 setStep('OTP_INPUT');
 setResendTimer(30);
 setIsLoading(false);

 if (confResult) {
 showToast(`Verification code sent to ${fullInternationalNumber}`);
 }
 } catch (err: any) {
 console.error('SMS dispatch:', err);
 setErrorMessage(err.message || 'Failed to send SMS. Please try again.');
 setIsLoading(false);
 }
 };

 const handleOtpChange = (index: number, val: string) => {
 if (val.length > 1) {
 const pasted = val.replace(/\D/g, '').slice(0, 6).split('');
 const newDigits = [...otpDigits];
 pasted.forEach((d, i) => {
 if (i < 6) newDigits[i] = d;
 });
 setOtpDigits(newDigits);
 const nextEmpty = newDigits.findIndex((d) => !d);
 if (nextEmpty !== -1 && otpInputRefs.current[nextEmpty]) {
 otpInputRefs.current[nextEmpty]?.focus();
 } else if (otpInputRefs.current[5]) {
 otpInputRefs.current[5]?.focus();
 }
 return;
 }

 const newDigits = [...otpDigits];
 newDigits[index] = val.replace(/\D/g, '').slice(0, 1);
 setOtpDigits(newDigits);

 if (val && index < 5 && otpInputRefs.current[index + 1]) {
 otpInputRefs.current[index + 1]?.focus();
 }
 };

 const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
 if (e.key === 'Backspace' && !otpDigits[index] && index > 0 && otpInputRefs.current[index - 1]) {
 otpInputRefs.current[index - 1]?.focus();
 }
 };

 const { updateUserProfile, currentUser, continueAsGuest, setActiveModal } = useMarketplace();

 const handleProfileSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!profileName.trim()) return;
 setIsLoading(true);
 await updateUserProfile({ name: profileName.trim(), email: email.trim() });
 setIsLoading(false);
 if (onSuccess) onSuccess();
 };

 const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);
    const fullCode = otpDigits.join('');
    if (fullCode.length !== 6) {
      setErrorMessage('Please enter a 6-digit code.');
      setIsLoading(false);
      return;
    }
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    try {
      const { user, isNewUser } = await verifyFirebasePhoneOtp(confirmationResult, fullCode, {
        localityName: userLocation.name,
        locationId: userLocation.id,
        phoneNumber: `+91 ${cleanPhone}`,
        isSignUp: authMode === 'SIGN_UP',
      });
      setIsLoading(false);
      if (isNewUser) {
        setStep('PROFILE_SETUP'); // First time user: ask for profile name
      } else {
        showToast(`Welcome back, ${user.name}!`);
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      setIsLoading(false);
      if (err.message?.includes('You already have an account') || err.message?.includes('Account not found')) {
        setStep('PHONE_INPUT');
        setOtpDigits(['', '', '', '', '', '']);
      }
      setErrorMessage(
        err.message || 'Invalid verification code. Please check your SMS code or click Resend.'
      );
    }
  };
  return (
 <div
 className={`w-full ${
 isModal ? 'max-w-lg mx-auto' : 'max-w-xl mx-auto my-6 px-4'
 }`}
 >
 {/* reCAPTCHA container */}
 <div id="recaptcha-container" ref={recaptchaContainerRef}></div>

 <div className="bg-white rounded-[24px] border border-stone-200 shadow-sm shadow-stone-900/20 overflow-hidden">
 {/* Header */}
 <div className="p-6 sm:p-7 bg-white text-stone-900 relative border-b border-stone-100">
 {onCancel && (
 <button
 onClick={onCancel}
 className="absolute top-5 right-5 p-2 text-stone-400 hover:text-stone-900 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
 >
 <X className="w-5 h-5" />
 </button>
 )}

 <div className="flex items-center gap-3">
 <div className="p-2 rounded-xl bg-white border border-stone-100 flex items-center justify-center shrink-0 shadow-sm">
 <TregaLogo variant="mark" size="sm" color="#8B3A1C" />
 </div>
 <div>
 <h2 className="text-xl font-bold text-stone-900 tracking-tight font-display">
 Login to Trega
 </h2>
 <p className="text-xs text-stone-500 font-medium">
 Hyperlocal Marketplace
 </p>
 </div>
 </div>
 </div>

 {/* Body Content */}
 <div className="p-6 sm:p-7 space-y-5">
 {errorMessage && (
 <div className="p-3.5 bg-transparent border border-rose-300 rounded-xl flex items-start gap-2.5 text-xs text-rose-900">
 <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
 <div className="flex-1 font-medium">{errorMessage}</div>
 </div>
 )}

 {step === 'PROFILE_SETUP' ? (
 <form onSubmit={handleProfileSubmit} className="space-y-4">
 <div>
 <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
 Your Full Name <span className="text-rose-500">*</span>
 </label>
 <input
 type="text"
 required
 value={profileName}
 onChange={(e) => setProfileName(e.target.value)}
 placeholder="e.g. Rahul Sharma"
 className="w-full px-4 py-3 bg-transparent border border-stone-300 rounded-xl text-sm font-bold text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-brand-700 focus:bg-white"
 />
 </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5 mt-4">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. rahul@example.com"
                className="w-full px-4 py-3 bg-transparent border border-stone-300 rounded-xl text-sm font-bold text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-brand-700 focus:bg-white"
              />
            </div>
 <button
 type="submit"
 disabled={isLoading || !profileName.trim() || !email.trim()}
 className="w-full py-3 px-5 bg-brand-700 hover:bg-brand-800 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
 >
 {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
 <span>Complete Setup</span>
 </button>
 </form>
 ) : step === 'PHONE_INPUT' ? (
 <form onSubmit={handleSendOtp} className="space-y-4">
 {/* Mode Selector Tabs */}
 <div className="flex bg-stone-100 p-1 rounded-xl border border-stone-200 mb-2">
 <button
 type="button"
 onClick={() => setAuthMode('SIGN_IN')}
 className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
 authMode === 'SIGN_IN'
 ? 'bg-white text-stone-900 shadow-xs border border-stone-200'
 : 'text-stone-500 hover:text-stone-800'
 }`}
 >
 Sign In
 </button>
 <button
 type="button"
 onClick={() => setAuthMode('SIGN_UP')}
 className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
 authMode === 'SIGN_UP'
 ? 'bg-white text-stone-900 shadow-xs border border-stone-200'
 : 'text-stone-500 hover:text-stone-800'
 }`}
 >
 Create Account
 </button>
 </div>

 {/* Mobile Number Input */}
 <div>
 <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
 Mobile Number <span className="text-rose-500">*</span>
 </label>
 <div className="flex items-center">
 <div className="px-3.5 py-2.5 bg-stone-100 border border-r-0 border-stone-200 rounded-l-xl text-xs font-bold text-stone-700 flex items-center gap-1.5">
 <span>+91</span>
 </div>
 <input
 type="tel"
 required
 maxLength={10}
 value={phoneNumber}
 onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
 placeholder="98900 12345"
 className="flex-1 px-3.5 py-2.5 bg-transparent border border-stone-300 rounded-r-xl text-sm font-bold text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-brand-700 focus:bg-white"
 />
 </div>
 </div>

 {/* Submit Button */}
 <button
 type="submit"
 disabled={isLoading || phoneNumber.replace(/\D/g, '').length < 10}
 className="w-full py-3 px-5 bg-brand-700 hover:bg-brand-800 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
 >
 {isLoading ? (
 <>
 <RefreshCw className="w-4 h-4 animate-spin" />
 <span>Sending Code...</span>
 </>
 ) : (
 <>
 <span>Continue with Phone Number</span>
 <ArrowRight className="w-4 h-4" />
 </>
 )}
 </button>
              <div className="pt-2 text-center">
                <span className="text-xs text-stone-500">Just looking around?</span>
                <button
                  type="button"
                  onClick={() => {
                    continueAsGuest();
                    if (onCancel) onCancel();
                  }}
                  className="ml-2 text-xs font-bold text-brand-700 hover:underline cursor-pointer"
                >
                  Continue as Guest
                </button>
              </div>
 </form>
 ) : (
 <form onSubmit={handleVerifyOtp} className="space-y-5">
 <div className="p-3.5 bg-transparent border border-stone-300 rounded-2xl flex items-center justify-between">
 <div className="flex items-center gap-2.5">
 <div className="w-8 h-8 rounded-lg bg-transparent border border-brand-300 text-brand-700 border border-brand-200 flex items-center justify-center font-bold">
 <KeyRound className="w-4 h-4" />
 </div>
 <div>
 <h4 className="text-xs font-bold text-stone-900">
 Code Sent to +91 {phoneNumber.replace(/\D/g, '')}
 </h4>
 <p className="text-[11px] text-stone-500">Enter 6-digit SMS OTP</p>
 </div>
 </div>
 <button
 type="button"
 onClick={() => {
 setStep('PHONE_INPUT');
 setOtpDigits(['', '', '', '', '', '']);
 }}
 className="text-xs font-bold text-brand-700 hover:underline cursor-pointer"
 >
 Change
 </button>
 </div>

 {/* 6 Digit Input */}
 <div>
 <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2 text-center">
 Verification Code
 </label>
 <div className="flex items-center justify-center gap-1.5 sm:gap-2">
 {otpDigits.map((digit, idx) => (
 <input
 key={idx}
 ref={(el) => { if (el) otpInputRefs.current[idx] = el; }}
 type="text"
 inputMode="numeric"
 maxLength={1}
 value={digit}
 onChange={(e) => handleOtpChange(idx, e.target.value)}
 onKeyDown={(e) => handleOtpKeyDown(idx, e)}
 className="w-9 h-11 sm:w-11 sm:h-13 text-center text-lg font-bold text-stone-900 bg-stone-50 border border-stone-300 focus:border-brand-700 focus:bg-white rounded-xl focus:outline-none transition-all"
 />
 ))}
 </div>
 </div>

 <div className="text-center text-xs text-stone-500">
 {resendTimer > 0 ? (
 <span>Resend code in {resendTimer}s</span>
 ) : (
 <button
 type="button"
 onClick={handleSendOtp}
 className="font-bold text-brand-700 hover:underline cursor-pointer"
 >
 Resend SMS Code
 </button>
 )}
 </div>

 <button
 type="submit"
 disabled={isLoading || otpDigits.join('').length !== 6}
 className="w-full py-3 px-5 bg-brand-700 hover:bg-brand-800 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
 >
 {isLoading ? (
 <>
 <RefreshCw className="w-4 h-4 animate-spin" />
 <span>Verifying...</span>
 </>
 ) : (
 <>
 <CheckCircle2 className="w-4 h-4" />
 <span>Verify & Login</span>
 </>
 )}
 </button>
 </form>
 )}

 <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center gap-2 text-xs text-stone-600">
 <ShieldCheck className="w-4 h-4 text-brand-600 shrink-0" />
 <span>Secure mobile authentication for local residents.</span>
 </div>
 </div>
 </div>
 </div>
 );
};
