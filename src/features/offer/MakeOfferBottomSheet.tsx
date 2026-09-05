import React, { useState } from 'react';
import {
 BadgePercent,
 X,
 Send,
 Sparkles,
 AlertCircle,
 ArrowRight,
 ShieldAlert,
 ShieldCheck,
 Lock,
 Check,
 CheckCircle2,
 XCircle,
} from 'lucide-react';
import { Listing } from '../../types';
import { useMarketplace } from '../../core/context/MarketplaceContext';

export const MakeOfferBottomSheet: React.FC = () => {
 const {
 activeModal,
 setActiveModal,
 modalPayload,
 flags,
 makeOffer,
 respondToOffer,
 markAsSold, reserveListing,
 offers,
 showToast,
 currentUser,
 isGuest,
 isUserKycVerified,
 switchUserPersona,
 setModalPayload,
 } = useMarketplace();

 const listing: Listing | null = modalPayload;

 const [customPrice, setCustomPrice] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
 const [viewMode, setViewMode] = useState<'MAKE_OFFER' | 'REVIEW_OFFERS'>('MAKE_OFFER');

 if (activeModal !== 'MAKE_OFFER' || !listing) return null;

 const isSeller = currentUser && (listing.seller.id === currentUser.id || listing.seller.name === currentUser.name);
 const incomingOffers = offers.filter((o) => o.listingId === listing.id);

 const handleAcceptOffer = (offerId: string, offeredPrice: number, buyerId: string, buyerName: string) => {
    respondToOffer(offerId, 'ACCEPTED');
    reserveListing(listing.id, buyerId);
    showToast(`Offer of ₹${offeredPrice} accepted! The item is reserved for 12 hours for the buyer to complete checkout.`);
  };

 const handleDeclineOffer = (offerId: string) => {
 respondToOffer(offerId, 'REJECTED');
 showToast('Offer declined');
 };

 // Fallback when Offer flag is disabled
 if (!flags.isOfferEnabled) {
 return (
 <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center bg-stone-900/60 backdrop-blur-sm overflow-hidden">
 <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-sm border border-stone-200 text-center">
 <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-4 text-stone-500">
 <BadgePercent className="w-6 h-6" />
 </div>
 <h3 className="text-lg font-bold text-stone-900 mb-2">Price Negotiations Disabled</h3>
 <p className="text-sm text-stone-600 mb-6">
 Make an Offer negotiation is currently disabled by runtime feature flag (<code className="text-xs bg-stone-100 px-1 py-0.5 rounded text-amber-700">FEATURE_OFFER_ENABLED: false</code>).
 All listings enforce fixed-price "Buy Now" checkout.
 </p>
 <button
 onClick={() => setActiveModal(null)}
 className="w-full py-2.5 px-4 bg-stone-900 hover:bg-stone-800 text-white text-sm font-semibold rounded-xl transition-all"
 >
 Close
 </button>
 </div>
 </div>
 );
 }

 // Authentication & KYC Guard: Restrict making offers if user's KYC status is not 'Verified'
 if (!isUserKycVerified) {
 const isPendingReview = currentUser?.kycStatus === 'PENDING_REVIEW';
 const isRejected = currentUser?.kycStatus === 'REJECTED';

 return (
 <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-900 animate-in fade-in duration-200">
 <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-sm border border-stone-100 relative">
 <button
 onClick={() => setActiveModal(null)}
 className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-100 transition-colors"
 >
 <X className="w-5 h-5" />
 </button>

 <div className="text-center mb-5">
 <div className="w-13 h-13 rounded-2xl bg-transparent border border-amber-300 text-amber-600 flex items-center justify-center mx-auto mb-3 shadow-sm shadow-amber-500/20">
 <ShieldAlert className="w-7 h-7" />
 </div>
 <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full mb-2 border border-amber-300">
 <Lock className="w-3 h-3" />
 <span>KYC Verification Required</span>
 </div>
 <h2 className="text-xl font-extrabold text-stone-900 font-display">
 Didit Verification Required to Make Offers
 </h2>
 <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto leading-relaxed">
 To eliminate fake offers and protect sellers, price negotiations require a <strong>Verified Didit KYC</strong> status.
 </p>
 </div>

 {/* Listing target preview */}
 <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-2xl border border-stone-200 mb-4">
 <img
 src={listing.images[0]}
 alt={listing.title}
 className="w-11 h-11 rounded-xl object-cover border border-stone-200"
 />
 <div className="flex-1 min-w-0">
 <h4 className="text-xs font-bold text-stone-900 truncate">{listing.title}</h4>
 <p className="text-xs font-extrabold text-brand-600 mt-0.5 font-display">
 Listed at ₹{listing.price.toLocaleString('en-IN')} by {listing.seller.name}
 </p>
 </div>
 </div>

 {/* Current Status Pill */}
 <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 mb-5 text-left">
 <div className="flex items-center justify-between text-xs mb-1">
 <span className="font-semibold text-stone-600">Your Account Status:</span>
 {!currentUser ? (
 <span className="font-bold text-stone-600 bg-stone-200 px-2 py-0.5 rounded-md text-[11px]">
 Not Signed In
 </span>
 ) : isPendingReview ? (
 <span className="font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md text-[11px]">
 ⏳ KYC Incomplete
 </span>
 ) : isRejected ? (
 <span className="font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md text-[11px]">
 KYC Rejected
 </span>
 ) : (
 <span className="font-bold text-brand-700 bg-brand-100 px-2 py-0.5 rounded-md text-[11px]">
 Unverified Account
 </span>
 )}
 </div>
 <p className="text-[11px] text-stone-500 leading-snug mt-1">
 {!currentUser
 ? 'Sign in with your phone number and verify your Identity via Didit to make offers.'
 : isPendingReview
 ? 'Your KYC is incomplete. Please verify your Identity via Didit.'
 : isRejected
 ? 'Your previous Didit verification failed. Please try again with a valid document.'
 : 'Verify your Identity with Didit to send binding purchase offers to local sellers.'}
 </p>
 </div>

 {/* Action CTAs */}
 <div className="space-y-2.5">
 {!currentUser ? (
 <button
 type="button"
 onClick={() => setActiveModal('AUTH')}
 className="w-full py-3 px-4 bg-transparent border border-brand-600 text-brand-700 hover:bg-brand-50 font-bold text-xs rounded-xl shadow-sm shadow-brand-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
 >
 <span>Sign In with Mobile OTP</span>
 <ArrowRight className="w-4 h-4" />
 </button>
 ) : (
 <button
 type="button"
 onClick={() => setActiveModal('KYC')}
 className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
 >
 <ShieldCheck className="w-4 h-4" />
 <span>
 {isRejected
 ? 'Retry Didit KYC'
 : 'Verify PAN with Didit'}
 </span>
 </button>
 )}

 <button
 type="button"
 onClick={() => setActiveModal(null)}
 className="w-full py-2 text-stone-500 hover:text-stone-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
 >
 Cancel
 </button>
 </div>
 </div>
 </div>
 );
 }

 const DISCOUNT_CHIPS = [
 { label: '5% Off', rate: 0.95 },
 { label: '10% Off', rate: 0.90 },
 { label: '15% Off', rate: 0.85 },
 { label: '20% Off', rate: 0.80 },
 ];

 const handleChipClick = (rate: number) => {
 const calculated = Number((listing.price * rate).toFixed(2));
 setCustomPrice(calculated.toString());
 };

 const handleSubmitOffer = (e: React.FormEvent) => {
 e.preventDefault();
 if (!isUserKycVerified) {
 showToast('Access Denied: Aadhaar KYC must be Verified before making price offers.');
 setActiveModal('KYC');
 return;
 }
 const offered = Number(parseFloat(customPrice).toFixed(2));
 if (!offered || offered <= 0) {
 showToast('Please specify a valid offer price');
 return;
 }
 if (offered > listing.price * 1.5) {
 showToast('Offer price is unusually high');
 return;
 }

 setIsSubmitting(true);
 setTimeout(() => {
 setIsSubmitting(false);
 makeOffer(listing.id, offered, '');
 setActiveModal(null);
 }, 600);
 };

 return (
 <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-900 ">
 <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-sm border border-stone-100 relative animate-in slide-in-from-bottom-5 duration-200">
 <button
 onClick={() => setActiveModal(null)}
 className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-100 transition-colors"
 >
 <X className="w-5 h-5" />
 </button>

 {/* Header */}
 <div className="flex items-center gap-3 mb-4">
 <div className="w-10 h-10 rounded-xl bg-transparent border border-brand-300 flex items-center justify-center text-brand-600">
 <BadgePercent className="w-5 h-5" />
 </div>
 <div className="flex-1">
 <h2 className="text-lg font-bold text-stone-900 font-display">
 {isSeller ? 'Review Received Offers' : 'Make a Price Offer'}
 </h2>
 <p className="text-xs text-stone-500">
 {isSeller
 ? 'Review buyer offers, accept to trigger escrow & mark listing as sold'
 : `Propose a fair price to ${listing.seller.name}`}
 </p>
 </div>
 </div>

 {/* Mode Switcher Tabs if seller or incoming offers exist */}
 

 {/* Listing preview pill */}
 <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-2xl border border-stone-100 mb-4">
 <img
 src={listing.images[0]}
 alt={listing.title}
 className="w-12 h-12 rounded-xl object-cover border border-stone-200"
 />
 <div className="flex-1 min-w-0">
 <h4 className="text-xs font-bold text-stone-900 truncate">{listing.title}</h4>
 <p className="text-xs font-extrabold text-brand-600 mt-0.5 font-display">
 Listed at ₹{listing.price.toLocaleString('en-IN')}
 </p>
 </div>
 </div>

 {isSeller ? (
 <div className="space-y-3">
 <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider">
 Received Buyer Offers ({incomingOffers.length})
 </h3>

 {incomingOffers.length === 0 ? (
 <div className="p-8 text-center bg-stone-50 rounded-2xl border border-stone-200">
 <BadgePercent className="w-8 h-8 text-stone-400 mx-auto mb-2" />
 <p className="text-xs font-bold text-stone-700">No incoming offers yet</p>
 <p className="text-[11px] text-stone-500 mt-0.5">
 When buyers propose custom prices for this item, they will appear here.
 </p>
 </div>
 ) : (
 <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
 {incomingOffers.map((off) => {
 const isExpired = listing?.reservedUntil && listing.reservedUntil < Date.now() && off.status === 'ACCEPTED';
            const isAccepted = off.status === 'ACCEPTED' && !isExpired;
            const isRejected = off.status === 'REJECTED';
            const isPending = off.status === 'PENDING';

 return (
 <div
 key={off.id}
 className="p-3.5 bg-white rounded-2xl border border-stone-200 shadow-xs space-y-2.5"
 >
 <div className="flex items-start justify-between gap-2">
 <div>
 <div className="flex items-center gap-1.5">
 <span className="text-xs font-bold text-stone-900">{off.buyerName}</span>
 <span className="text-[10px] font-semibold text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded">
 {off.createdAt}
 </span>
 </div>
 
 </div>
 <div className="text-right">
 <span className="text-sm font-extrabold text-brand-700 font-display block">
 ₹{off.offeredPrice.toLocaleString('en-IN')}
 </span>
 <span className="text-[10px] text-stone-500 font-medium">
 ({Math.round(((listing.price - off.offeredPrice) / listing.price) * 100)}% off)
 </span>
 </div>
 </div>

 <div className="flex items-center justify-between pt-2 border-t border-stone-100">
 <div>
 {isExpired ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-lg border border-stone-200">
                    Expired (Unpaid)
                  </span>
                ) : isAccepted ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Accepted & Escrow Ready
                  </span>
                ) : isRejected ? (
 <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200">
 <XCircle className="w-3.5 h-3.5" /> Declined
 </span>
 ) : (
 <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
 Pending Review
 </span>
 )}
 </div>

 {isPending && (
 <div className="flex items-center gap-2">
 <button
 type="button"
 onClick={() => handleDeclineOffer(off.id)}
 className="px-3 py-1.5 border border-stone-200 hover:bg-stone-100 text-stone-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
 >
 Decline
 </button>
 <button
 type="button"
 onClick={() => handleAcceptOffer(off.id, off.offeredPrice, off.buyerId, off.buyerName)}
 className="px-3.5 py-1.5 bg-transparent border border-emerald-600 text-emerald-700 hover:bg-emerald-50 text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1 cursor-pointer"
 >
 <Check className="w-3.5 h-3.5" />
 <span>Accept Offer</span>
 </button>
 </div>
 )}
 </div>
 </div>
 );
 })}
 </div>
 )}
 </div>
 ) : (
 <form onSubmit={handleSubmitOffer} className="space-y-4">
 {/* Quick Percentage Chips */}
 <div>
 <label className="block text-xs font-semibold text-stone-700 mb-1.5">Quick Negotiation Suggestions</label>
 <div className="grid grid-cols-4 gap-2">
 {DISCOUNT_CHIPS.map((chip) => {
 const targetPrice = Number((listing.price * chip.rate).toFixed(2));
 const isSelected = customPrice === targetPrice.toString();
 return (
 <button
 key={chip.label}
 type="button"
 onClick={() => handleChipClick(chip.rate)}
 className={`py-2 px-2 rounded-xl border text-center transition-all cursor-pointer ${
 isSelected
 ? 'border-brand-500 bg-brand-50 text-brand-950 font-bold shadow-xs'
 : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold'
 }`}
 >
 <div className="text-[11px] text-stone-500">{chip.label}</div>
 <div className="text-xs font-extrabold text-stone-900 font-display">₹{targetPrice}</div>
 </button>
 );
 })}
 </div>
 </div>

 {/* Custom Price Input */}
 <div>
 <label className="block text-xs font-semibold text-stone-700 mb-1">Your Proposed Offer (₹) *</label>
 <div className="relative">
 <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-stone-400 text-lg">₹</span>
 <input
 type="number"
 value={customPrice}
 onChange={(e) => setCustomPrice(e.target.value)}
 placeholder={Number((listing.price * 0.9).toFixed(2)).toString()}
 className="w-full pl-10 pr-4 py-3 text-lg font-extrabold border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 font-display"
 required
 />
 </div>
 </div>

 <div className="p-3 bg-transparent border border-brand-300 rounded-xl text-[11px] text-brand-950 flex items-start gap-2">
 <Sparkles className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
 <span>
 <strong>Binding Price Proposal:</strong> When the seller accepts your offer, you can complete the order at this agreed price with virtual escrow protection and delivery.
 </span>
 </div>

 <div className="flex gap-3 pt-2">
 <button
 type="button"
 onClick={() => setActiveModal(null)}
 className="flex-1 py-3 px-4 border border-stone-200 hover:bg-stone-50 text-stone-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
 >
 Cancel
 </button>
 <button
 type="submit"
 disabled={isSubmitting || !customPrice}
 className="flex-[2] py-3 px-4 bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs rounded-xl shadow-sm shadow-brand-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
 >
 {isSubmitting ? (
 <>
 <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
 Sending Offer...
 </>
 ) : (
 <>
 <span>Send Offer to Seller</span>
 <Send className="w-3.5 h-3.5" />
 </>
 )}
 </button>
 </div>
 </form>
 )}
 </div>
 </div>
 );
};
