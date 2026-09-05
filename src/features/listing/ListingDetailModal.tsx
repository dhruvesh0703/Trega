import ReactPlayer from 'react-player';
import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
 X,
 ShieldCheck,
 MapPin,
 Clock,
 Sparkles,
 HelpCircle,
 BadgePercent,
 CheckCircle2,
 XCircle,
 Lock,
 Truck,
 ArrowRight, ArrowLeft,
 AlertCircle,
 Share2, Heart,
 Check,
 Video,
 Camera,
 Play,
 IndianRupee,
} from 'lucide-react';
import { Listing } from '../../types';
import { useMarketplace } from '../../core/context/MarketplaceContext';
import { TrustBadge } from '../kyc/TrustBadge';
import { DistanceBadge } from '../location/DistanceBadge';
import { ListingQaSection } from '../qa/ListingQaSection';

interface ListingDetailModalProps {
 listing: Listing | null;
 onClose: () => void;
}

export const ListingDetailModal: React.FC<ListingDetailModalProps> = ({ listing, onClose }) => {
 const {
 flags,
 setActiveModal,
 setModalPayload,
 offers,
 respondToOffer,
 currentUser,
 openMakeOffer,
    showToast,
    toggleSavedListing,
  } = useMarketplace();

 // Media Gallery Active Tab: 'VIDEO' or image index (0, 1, 2...)
 const [activeMediaType, setActiveMediaType] = useState<'VIDEO' | 'IMAGE'>('IMAGE');
 const [activeImageIdx, setActiveImageIdx] = useState(0);
 const [isImageFullScreen, setIsImageFullScreen] = useState(false);
 const [isCopied, setIsCopied] = useState(false);

  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (activeMediaType === 'IMAGE' && listing && listing.images.length > 1) {
      if (isLeftSwipe) {
        setActiveImageIdx((prev) => (prev === listing.images.length - 1 ? 0 : prev + 1));
      } else if (isRightSwipe) {
        setActiveImageIdx((prev) => (prev === 0 ? listing.images.length - 1 : prev - 1));
      }
    }
  };

 React.useEffect(() => {
 setActiveMediaType('IMAGE');
 setActiveImageIdx(0);
 }, [listing?.id]);


 if (!listing) return null;

 const discountPercent =
 listing.originalPrice && listing.originalPrice > listing.price
 ? Math.round(((listing.originalPrice - listing.price) / listing.originalPrice) * 100)
 : null;

 const isOwner = currentUser?.id === listing.seller.id;
  const isReserved = listing.reservedUntil && listing.reservedUntil > Date.now();
  const isReservedForMe = isReserved && currentUser?.id === listing.reservedForBuyerId;
 const incomingOffers = offers.filter((o) => o.listingId === listing.id);

 // Check if current user has an offer on this listing
 const isSaved = currentUser?.savedListingIds?.includes(listing.id) || false;

  const existingOffer = offers.find(
 (o) => o.listingId === listing.id && (currentUser ? o.buyerId === currentUser.id : false)
 );

 const handleMakeOffer = () => {
 openMakeOffer(listing);
 };

 const handleProceedToOrder = () => {
 // Pass listing and the accepted offer price to checkout
 setModalPayload({
 ...listing,
 price: existingOffer && existingOffer.status === 'ACCEPTED' ? existingOffer.offeredPrice : listing.price,
 acceptedOffer: existingOffer,
 });
 setActiveModal('CHECKOUT');
 };

 const handleScrollToQa = () => {
 const qaElement = document.getElementById('listing-qa-section');
 if (qaElement) {
 qaElement.scrollIntoView({ behavior: 'smooth' });
 }
 };

 const handleShareListing = async () => {
 const shareTitle = `${listing.title} | Trega`;
 const shareText = `Check out this listing on Trega: ${listing.title} for ₹${listing.price.toLocaleString('en-IN')} in ${listing.locationName}!`;
 const shareUrl = window.location.href;

 const shareData = {
 title: shareTitle,
 text: shareText,
 url: shareUrl,
 };

 if (navigator.share) {
 try {
 await navigator.share(shareData);
 showToast('Listing shared successfully!');
 } catch (err: any) {
 if (err.name !== 'AbortError') {
 // Fallback to clipboard if sharing failed for reasons other than user abort
 try {
 await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
 setIsCopied(true);
 setTimeout(() => setIsCopied(false), 2000);
 showToast('Listing link copied to clipboard!');
 } catch {
 showToast('Could not share or copy link.');
 }
 }
 }
 } else {
 // Fallback for browsers without Web Share API
 try {
 await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
 setIsCopied(true);
 setTimeout(() => setIsCopied(false), 2000);
 showToast('Listing details & link copied to clipboard!');
 } catch {
 showToast('Clipboard access unavailable.');
 }
 }
 };

 const isOfferAccepted = existingOffer && existingOffer.status === 'ACCEPTED' && isReservedForMe;
 const isOfferPending = existingOffer && existingOffer.status === 'PENDING';
 const sellerUpi = listing.sellerUpiId || listing.seller.upiId;

 return (
 <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed inset-0 z-50 flex flex-col bg-stone-50 overflow-hidden shadow-[0_-20px_60px_-15px_rgba(0,0,0,0.2)] md:rounded-t-[40px] md:top-10 md:inset-x-20">
 <div className="flex flex-col w-full h-full relative max-w-4xl mx-auto bg-white overflow-hidden shadow-2xl">
 {/* Header Bar */}
        <div className="sticky top-0 z-20 px-4 sm:px-6 py-4 flex items-center justify-between gap-3 bg-white/80 backdrop-blur-xl border-b border-stone-100 shadow-sm">
          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
            <button
              onClick={onClose}
              id="close-listing-modal-btn"
              className="p-2 sm:p-2.5 text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-full transition-colors cursor-pointer flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 flex-1 min-w-0">
               <span className="text-[10px] sm:text-[11px] font-bold text-brand-700 bg-brand-50 border border-brand-200 px-3 py-1 rounded-full uppercase tracking-wider whitespace-nowrap w-fit shrink-0">
                 {listing.category.replace(/_/g, ' ')}
               </span>
               <div className="hidden sm:block w-1.5 h-1.5 rounded-full bg-stone-300 shrink-0" />
               <div className="flex-1 min-w-0 truncate">
                 <DistanceBadge lat={listing.lat} lng={listing.lng} locationName={listing.locationName} />
               </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* Web Share Button */}
            <button
              type="button"
              id="share-listing-header-btn"
              onClick={handleShareListing}
              className="flex items-center gap-2 px-4 py-2 sm:py-2.5 bg-white hover:bg-stone-50 text-stone-700 hover:text-stone-900 rounded-full text-xs font-bold transition-all border border-stone-200 cursor-pointer shadow-sm"
              title="Share listing with friends"
            >
              {isCopied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 text-stone-500" />
                  <span className="hidden sm:inline">Share</span>
                </>
              )}
            </button>
            {/* Wishlist Toggle */}
            <motion.button
              type="button"
              whileTap={{ scale: 0.8 }}
              onClick={() => toggleSavedListing(listing.id)}
              className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 bg-white hover:bg-stone-50 text-stone-700 hover:text-brand-600 rounded-full transition-all border border-stone-200 cursor-pointer shadow-sm"
              title={isSaved ? "Remove from Saved" : "Save for later"}
            >
              <motion.div
                initial={false}
                animate={isSaved ? { scale: [1, 1.3, 1] } : { scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${isSaved ? 'fill-brand-500 text-brand-500' : 'text-stone-500'}`} />
              </motion.div>
            </motion.button>

          </div>
        </div>

        {/* Scrollable Content */}
 <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
 {/* Media Gallery Section with In-App Video & Photo tabs */}
 <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
 {/* Main Media Display */}
 <div className="md:col-span-8 aspect-square md:aspect-[4/3] w-full max-h-[50vh] md:max-h-[400px] rounded-2xl overflow-hidden bg-stone-50 border border-stone-200 relative flex items-center justify-center group">
 {activeMediaType === 'VIDEO' && listing.videoUrl ? (
                 <div className="absolute inset-0 w-full h-full bg-black">
                  <video
                    key={listing.videoUrl}
                    src={listing.videoUrl}
                    controls
                    playsInline
                    className="w-full h-full object-contain bg-black"
                  />
                </div>
 ) : (
               <>
                <img
                  src={listing.images[activeImageIdx] || listing.images[0]}
                  alt={listing.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain cursor-pointer hover:opacity-95 transition-opacity"
                  onClick={() => setIsImageFullScreen(true)}
                  onTouchStart={onTouchStart}
                  onTouchMove={onTouchMove}
                  onTouchEnd={onTouchEnd}
                />
                
                {/* Carousel Controls */}
                {listing.images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveImageIdx((prev) => (prev === 0 ? listing.images.length - 1 : prev - 1));
                      }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur text-stone-700 hover:text-brand-600 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10 hidden md:flex"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveImageIdx((prev) => (prev === listing.images.length - 1 ? 0 : prev + 1));
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur text-stone-700 hover:text-brand-600 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10 hidden md:flex"
                    >
                      <ArrowRight className="w-5 h-5" />
                    </button>
                    
                    {/* Mobile swipe indicators (dots) */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 md:hidden z-10">
                      {listing.images.map((_, idx) => (
                        <div 
                          key={idx}
                          className={`w-1.5 h-1.5 rounded-full ${activeImageIdx === idx ? 'bg-white' : 'bg-white/50'}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
 )}

 {/* Discount Badge */}
 {discountPercent && (
 <span className="absolute top-3 left-3 bg-brand-500 text-white font-extrabold text-xs px-2.5 py-1 rounded-full shadow-sm z-10">
 {discountPercent}% OFF MRP
 </span>
 )}

 {/* In-App Camera Verified Badge */}
 <div className="absolute top-3 right-3 bg-stone-900 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 border border-white z-10">
 <ShieldCheck className="w-3.5 h-3.5 text-brand-400" />
 <span>In-App Camera Verified</span>
 </div>

 <div className="absolute bottom-3 left-3 bg-stone-900 text-white text-[11px] font-bold px-3 py-1 rounded-lg flex items-center gap-1.5 border border-white z-10">
 <Truck className="w-3.5 h-3.5 text-brand-400" />
 <span>Local delivery Available</span>
 </div>
 </div>

 {/* Media Selector Strip (Video + Photos) */}
 <div className="md:col-span-4 flex md:flex-col gap-2.5 overflow-x-auto md:overflow-y-auto px-1 pt-1 hide-scrollbar">
 {/* Mandatory Video Thumbnail Tab */}
              {listing.videoUrl && (
              <button
                type="button"
                onClick={() => setActiveMediaType('VIDEO')}
                className={`relative p-2 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-center md:justify-start gap-2 shrink-0 md:w-auto w-20 md:h-auto h-16 ${
                  activeMediaType === 'VIDEO' ? 'border-brand-500 bg-brand-50 text-brand-950 ring-2 ring-brand-500' : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                }`}
              >
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-brand-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Video className="w-4 h-4 md:w-5 md:h-5" />
                </div>
                <div className="hidden md:block min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold truncate">Live Video</span>
                    <span className="text-[9px] font-extrabold px-1 py-0.5 bg-brand-200 text-brand-900 rounded">PROVED</span>
                  </div>
                  <p className="text-[10px] text-stone-500 truncate">In-app recorded</p>
                </div>
                <span className="absolute bottom-1 right-1 bg-brand-900 text-white text-[8px] font-bold px-1 rounded md:hidden">
                  Video
                </span>
              </button>
)}

              {/* Photo Thumbnails */}
 {listing.images.map((img, idx) => (
 <button
 key={idx}
 type="button"
 onClick={() => {
 setActiveMediaType('IMAGE');
 setActiveImageIdx(idx);
 }}
 className={`aspect-[4/3] w-20 md:w-auto md:h-16 rounded-xl overflow-hidden border-2 transition-all cursor-pointer relative shrink-0 ${
 activeMediaType === 'IMAGE' && activeImageIdx === idx
 ? 'border-brand-600 ring-2 ring-brand-600'
 : 'border-stone-200 opacity-75 hover:opacity-100'
 }`}
 >
 <img src={img} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
 <span className="absolute bottom-1 right-1 bg-stone-900 text-white text-[8px] font-bold px-1 rounded">
 Photo {idx + 1}
 </span>
 </button>
 ))}
 </div>
 </div>

 {/* Pricing & Title */}
 <div>
 <div className="flex items-start justify-between gap-3 flex-wrap">
 <div className="flex items-baseline gap-3 flex-wrap">
 <span className="text-3xl font-extrabold text-stone-900 font-display">
 ₹{listing.price.toLocaleString('en-IN')}
 </span>
 {listing.originalPrice && (
 <span className="text-base text-stone-400 line-through">
 ₹{listing.originalPrice.toLocaleString('en-IN')}
 </span>
 )}
 {listing.isNegotiable && (
 <span className="text-xs font-bold text-stone-700 bg-transparent border border-stone-300 px-2 py-0.5 rounded-md">
 Price Negotiable
 </span>
 )}
 </div>

 {/* In-content secondary share pill */}
 <button
 type="button"
 onClick={handleShareListing}
 className="inline-flex sm:hidden items-center gap-1 px-2.5 py-1 text-xs font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-lg border border-stone-200 cursor-pointer"
 >
 <Share2 className="w-3 h-3 text-brand-600" />
 <span>Share</span>
 </button>
 </div>
 <h1 className="text-xl font-bold text-stone-900 mt-2">{listing.title}</h1>
 <div className="flex items-center gap-4 text-xs text-stone-500 mt-2 flex-wrap">
 <span className="flex items-center gap-1">
 <MapPin className="w-3.5 h-3.5 text-stone-400" />
 {listing.locationName} ({listing.locationArea})
 </span>
 <span className="flex items-center gap-1">
 <Clock className="w-3.5 h-3.5 text-stone-400" />
 Posted {listing.createdAt}
 </span>
 </div>
 </div>

 {/* Seller Profile & Verified Payout Section */}
 <div className="bg-stone-50 rounded-2xl p-4 sm:p-5 border border-stone-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
 <div className="flex items-center gap-3.5">
 <img
 src={listing.seller.avatar}
 alt={listing.seller.name}
 className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-xs"
 />
 <div>
 <div className="flex items-center gap-2">
 <h4 className="text-sm font-bold text-stone-900">{listing.seller.name}</h4>
 <TrustBadge
 isVerified={listing.seller.isKycVerified}
 kycType={listing.seller.kycType}
 
 collegeOrArea={listing.seller.collegeOrArea}
 />
 </div>
 <p className="text-xs text-stone-500 mt-0.5">
 {listing.seller.collegeOrArea} • {listing.seller.completedOrders} verified orders completed
 </p>
 <div className="flex items-center gap-2 mt-1.5 flex-wrap">
 
 {sellerUpi && (currentUser?.isAdmin || currentUser?.id === listing.seller.id) && (
 <span className="text-[10px] font-mono font-semibold text-stone-700 bg-transparent border border-stone-300 px-2 py-0.5 rounded-md flex items-center gap-1">
 <IndianRupee className="w-2.5 h-2.5" />
 <span>Payout UPI: {sellerUpi}</span>
 </span>
 )}
 </div>
 </div>
 </div>

 {!isOwner && (
 <div className="flex items-center gap-2 w-full sm:w-auto">
 <button
 type="button"
 onClick={handleScrollToQa}
 className="flex-1 sm:flex-none px-4 py-2.5 bg-transparent border border-brand-600 text-brand-700 hover:bg-brand-50 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
 >
 <HelpCircle className="w-4 h-4" />
 <span>Ask a Public Question</span>
 </button>
 </div>
 )}
 </div>

 {/* Offer & Order Workflow Status Card */}
 {existingOffer && (
 <div
 className={`p-4 rounded-2xl border ${
 isOfferAccepted
 ? 'bg-brand-50 border-brand-200 text-brand-950'
 : isOfferPending
 ? 'bg-amber-50 border-amber-200 text-amber-950'
 : 'bg-stone-50 border-stone-200 text-stone-900'
 }`}
 >
 <div className="flex items-start justify-between gap-3">
 <div className="flex items-start gap-2.5">
 {isReserved && !isReservedForMe && !isOwner ? (
                <div className="py-2.5 px-4 bg-amber-50 text-amber-700 rounded-xl text-xs font-bold border border-amber-200 flex items-center gap-1.5 shrink-0">
                  <Lock className="w-4 h-4" />
                  <span>Pending Checkout</span>
                </div>
              ) : isOfferAccepted ? (
 <CheckCircle2 className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
 ) : (
 <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
 )}
 <div>
 <h4 className="text-xs font-bold">
 {isOfferAccepted
 ? `Seller Accepted Your Offer of ₹${existingOffer.offeredPrice.toLocaleString('en-IN')}!`
 : isOfferPending
 ? `⏳ Offer of ₹${existingOffer.offeredPrice.toLocaleString('en-IN')} Sent — Awaiting Seller Response`
 : `Offer Status: ${existingOffer.status}`}
 </h4>
 <p className="text-xs mt-0.5 opacity-90">
 {isOfferAccepted
 ? 'You can now proceed to complete the order with Virtual Escrow protection.'
 : isOfferPending
 ? 'The seller has received your price proposal. Once accepted, the order button will activate for checkout.'
 : 'You may submit a revised offer to proceed.'}
 </p>
 </div>
 </div>
 {isOfferAccepted && (
 <span className="text-xs font-black text-brand-700 bg-white px-2.5 py-1 rounded-lg border border-brand-300 shrink-0">
 ₹{existingOffer.offeredPrice}
 </span>
 )}
 </div>
 </div>
 )}

 {/* Item Description & Specs */}
 <div className="space-y-4">
 <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">Item Details</h3>
 <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-line">
 {listing.description}
 </p>

 <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
 <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
 <span className="text-[10px] uppercase font-bold text-stone-400 block">Condition</span>
 <span className="text-xs font-bold text-stone-800">
 {listing.condition.replace('_', ' ')}
 </span>
 </div>
 <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
 <span className="text-[10px] uppercase font-bold text-stone-400 block">Media Proof</span>
 <span className="text-xs font-bold text-brand-700 flex items-center gap-1">
 <CheckCircle2 className="w-3.5 h-3.5" />
 <span>1 Video + Photos</span>
 </span>
 </div>
 <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
 <span className="text-[10px] uppercase font-bold text-stone-400 block">Original Bill</span>
 <span className="text-xs font-bold text-stone-800">
 {listing.originalBillIncluded ? 'Included' : 'Not Available'}
 </span>
 </div>
 </div>
 </div>

 {/* Incoming Offers (Owner Only) */}
 {isOwner && (
 <div id="owner-offers-section" className="border-t border-stone-100 pt-6 space-y-4">
 <div className="flex items-center justify-between">
 <h3 className="font-display font-black text-lg text-stone-900 flex items-center gap-2">
 <BadgePercent className="w-5 h-5 text-brand-500" />
 <span>Incoming Offers</span>
 <span className="text-xs font-bold px-2 py-0.5 bg-stone-100 text-stone-700 rounded-full">
 {incomingOffers.length}
 </span>
 </h3>
 </div>

 {incomingOffers.length === 0 ? (
 <div className="p-4 bg-transparent border border-stone-200 rounded-2xl text-center">
 <p className="text-xs text-stone-500">No offers received yet. Buyers can send price proposals on your listing.</p>
 </div>
 ) : (
 <div className="space-y-3">
 {incomingOffers.map(offer => (
 <div key={offer.id} className="p-4 bg-white border border-stone-200 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div className="flex items-center gap-3">
 <img src={offer.buyerAvatar} alt={offer.buyerName} className="w-10 h-10 rounded-full object-cover border border-stone-200 shrink-0" />
 <div>
 <div className="flex items-center gap-2">
 <p className="text-sm font-bold text-stone-900">{offer.buyerName}</p>
 <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${offer.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-800' : offer.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>
 {offer.status}
 </span>
 </div>
 <p className="text-xs text-stone-500 mt-0.5">{offer.message || 'Sent an offer proposal'}</p>
 </div>
 </div>

 <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100">
 <div className="text-left sm:text-right">
 <span className="text-[10px] text-stone-400 block font-semibold uppercase">Offered Price</span>
 <p className="text-lg font-black text-brand-600 font-display">₹{offer.offeredPrice.toLocaleString('en-IN')}</p>
 </div>

 {offer.status === 'PENDING' ? (
 <div className="flex items-center gap-2">
 <button
 type="button"
 onClick={() => respondToOffer(offer.id, 'ACCEPTED')}
 className="px-3.5 py-2 bg-transparent border border-emerald-600 text-emerald-700 hover:bg-emerald-50 text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
 >
 <CheckCircle2 className="w-4 h-4" />
 <span>Accept Offer</span>
 </button>
 <button
 type="button"
 onClick={() => respondToOffer(offer.id, 'REJECTED')}
 className="px-3 py-2 bg-stone-100 hover:bg-rose-100 text-stone-700 hover:text-rose-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer shrink-0"
 >
 <XCircle className="w-4 h-4" />
 <span>Decline</span>
 </button>
 </div>
 ) : (
 <div className="text-xs font-bold text-stone-500">
 {offer.status === 'ACCEPTED' && (
 <span className="text-emerald-700 bg-transparent px-3 py-1.5 rounded-xl border border-emerald-500 inline-flex items-center gap-1">
 <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
 <span>Accepted</span>
 </span>
 )}
 {offer.status === 'REJECTED' && (
 <span className="text-rose-700 bg-transparent px-3 py-1.5 rounded-xl border border-rose-500 inline-flex items-center gap-1">
 <XCircle className="w-3.5 h-3.5 text-rose-600" />
 <span>Declined</span>
 </span>
 )}
 </div>
 )}
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 )}

 {/* Public Q&A Section */}
 <div id="listing-qa-section" className="border-t border-stone-100 pt-6">
 <ListingQaSection listing={listing} />
 </div>
 </div>

 {/* Sticky Action Footer */}
 <div className="p-4 px-6 border-t border-stone-100 bg-white flex items-center justify-between gap-4">
 <div>
 <span className="text-[10px] uppercase font-bold text-stone-400 block">Final Price</span>
 <span className="text-xl font-black text-stone-900 font-display">
 ₹
 {(isOfferAccepted && existingOffer ? existingOffer.offeredPrice : listing.price).toLocaleString(
 'en-IN'
 )}
 </span>
 </div>

 {listing.isSold ? (
 <div className="py-2.5 px-4 bg-stone-100 text-stone-600 rounded-xl text-xs font-bold border border-stone-200 flex items-center gap-1.5 shrink-0">
 <XCircle className="w-4 h-4 text-rose-500" />
 <span>Item Sold Out</span>
 </div>
 ) : isOwner ? null : (
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => toggleSavedListing(listing.id)}
                className="w-11 h-11 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 hover:text-brand-600 rounded-xl flex items-center justify-center transition-colors shrink-0 shadow-sm"
                title={isSaved ? "Remove from Saved" : "Save for later"}
              >
                <Heart className={`w-5 h-5 ${isSaved ? 'fill-brand-500 text-brand-500' : 'text-stone-500'}`} />
              </button>
 {isOfferAccepted ? (
 <button
 type="button"
 onClick={handleProceedToOrder}
 className="px-4 py-3 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-xl shadow-sm shadow-brand-500/20 transition-all flex items-center gap-2 cursor-pointer min-h-[44px] whitespace-nowrap"
 >
 <Lock className="w-4 h-4 shrink-0" />
 <span>Pay and Order (₹{existingOffer?.offeredPrice})</span>
 <ArrowRight className="w-4 h-4 shrink-0" />
 </button>
 ) : (
 <button
 type="button"
 onClick={handleMakeOffer}
 className="px-4 py-3 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-xl shadow-sm shadow-brand-500/20 transition-all flex items-center gap-2 cursor-pointer min-h-[44px] whitespace-nowrap"
 >
 <BadgePercent className="w-4 h-4 shrink-0" />
 <span>{existingOffer ? 'Update Price Offer' : 'Negotiate / Make Offer'}</span>
 </button>
 )}
 </div>
 )}
 </div>
 </div>

 {/* Full-Screen Image Viewer Modal */}
 {isImageFullScreen && (
 <div className="fixed inset-0 z-[60] bg-black flex items-center justify-center">
 <button
 onClick={() => setIsImageFullScreen(false)}
 className="absolute top-6 right-6 p-3 bg-stone-900 hover:bg-stone-800 text-white rounded-full transition-colors z-10 cursor-pointer"
 >
 <X className="w-6 h-6" />
 </button>
 
 <div className="w-full max-w-5xl h-full p-4 flex flex-col items-center justify-center">
               <img
                src={listing.images[activeImageIdx] || listing.images[0]}
                alt={listing.title}
                referrerPolicy="no-referrer"
                className="max-w-full max-h-full object-contain cursor-pointer"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
              />
              {/* Fullscreen Carousel Controls */}
              {listing.images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImageIdx((prev) => (prev === 0 ? listing.images.length - 1 : prev - 1));
                    }}
                    className="absolute left-6 top-1/2 -translate-y-1/2 p-3 bg-stone-800/80 hover:bg-stone-700 text-white rounded-full shadow-xl transition-all z-10 hidden sm:flex"
                  >
                    <ArrowLeft className="w-6 h-6" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImageIdx((prev) => (prev === listing.images.length - 1 ? 0 : prev + 1));
                    }}
                    className="absolute right-6 top-1/2 -translate-y-1/2 p-3 bg-stone-800/80 hover:bg-stone-700 text-white rounded-full shadow-xl transition-all z-10 hidden sm:flex"
                  >
                    <ArrowRight className="w-6 h-6" />
                  </button>
                </>
              )}
 
 {/* Optional: Gallery Indicators for full screen */}
 {listing.images.length > 1 && (
 <div className="absolute bottom-8 flex gap-2">
 {listing.images.map((_, idx) => (
 <button
 key={idx}
 onClick={() => setActiveImageIdx(idx)}
 className={`w-2.5 h-2.5 rounded-full transition-all ${activeImageIdx === idx ? 'bg-white scale-125' : 'bg-white hover:bg-white'}`}
 />
 ))}
 </div>
 )}
 </div>
 </div>
 )}
 </motion.div>
  );
};
