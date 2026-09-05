import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PackageX, RefreshCw, ArrowDown, Sparkles, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { Listing } from '../../types';
import { useMarketplace } from '../../core/context/MarketplaceContext';
import { triggerHaptic } from '../../lib/haptics';
import { ListingCard } from './ListingCard';
import { WidgetErrorBoundary } from '../../components/ErrorBoundary';
import { FeedFilterBar } from './FeedFilterBar';
import { BannerLoop } from '../../components/BannerLoop';
import { FeedFallbackBanner } from './FeedFallbackBanner';
import { FeedSkeletonLoader } from './FeedSkeletonLoader';

interface FeedScreenProps {
 onSelectListing: (listing: Listing) => void;
}

const PULL_THRESHOLD = 70; // px to trigger refresh
const MAX_PULL_DISTANCE = 110;

export const FeedScreen: React.FC<FeedScreenProps> = ({ onSelectListing }) => {
 const {
 flags,
 filteredListings,
 isFeedLoading,
 setActiveModal,
 openCreateListing,
 refreshFeedData,
 showToast,
 currentUser,
 } = useMarketplace();

 // Pull-to-refresh state
 const [pullDistance, setPullDistance] = useState(0);
 const [isPulling, setIsPulling] = useState(false);
 const [isRefreshing, setIsRefreshing] = useState(false);
 const [justRefreshed, setJustRefreshed] = useState(false);
  const thresholdCrossedRef = useRef(false);

 const startYRef = useRef(0);
 const isTouchActiveRef = useRef(false);
 const containerRef = useRef<HTMLDivElement>(null);

 const handleTouchStart = (e: React.TouchEvent) => {
    thresholdCrossedRef.current = false;
 // Only allow pull-to-refresh if user is at the very top of the window / page
 const scroller = document.getElementById('main-scroll-container');
    const currentScrollTop = scroller ? scroller.scrollTop : window.scrollY;
    if (currentScrollTop > 5) return;
 startYRef.current = e.touches[0].clientY;
 isTouchActiveRef.current = true;
 setIsPulling(true);
 };

 
  const handleTouchMove = (e: React.TouchEvent) => {
    const scroller = document.getElementById('main-scroll-container');
    const currentScrollTop = scroller ? scroller.scrollTop : window.scrollY;
    if (!isTouchActiveRef.current || isRefreshing || currentScrollTop > 5) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startYRef.current;

    if (diff > 0) {
      // Apply rubber-band damping
      const damping = 0.45;
      const pull = Math.min(diff * damping, MAX_PULL_DISTANCE);
      setPullDistance(pull);
      
      if (pull >= PULL_THRESHOLD && !thresholdCrossedRef.current) {
        thresholdCrossedRef.current = true;
        triggerHaptic('medium');
      } else if (pull < PULL_THRESHOLD && thresholdCrossedRef.current) {
        thresholdCrossedRef.current = false;
      }
    }
  };


 const handleTouchEnd = async () => {
 if (!isTouchActiveRef.current) return;
 isTouchActiveRef.current = false;
 setIsPulling(false);

 if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
 triggerRefresh();
 } else {
 setPullDistance(0);
 }
 };

 const triggerRefresh = useCallback(async () => {
 setIsRefreshing(true);
 setPullDistance(PULL_THRESHOLD * 0.8);
 try {
 await refreshFeedData();
 setJustRefreshed(true);
      triggerHaptic('success');
      showToast('Feed updated with latest Local Area listings');
 setTimeout(() => setJustRefreshed(false), 2000);
 } catch (e) {
 console.warn('Feed refresh error:', e);
 } finally {
 setIsRefreshing(false);
 setPullDistance(0);
 }
 }, [refreshFeedData, showToast]);

 // If Feed Flag is disabled, render fallback maintenance screen per PRD
 if (!flags.isFeedEnabled) {
 return <FeedFallbackBanner />;
 }

 const pullProgress = Math.min(pullDistance / PULL_THRESHOLD, 1);
 const isThresholdMet = pullDistance >= PULL_THRESHOLD;

 return (
 <div
 ref={containerRef}
 onTouchStart={handleTouchStart}
 onTouchMove={handleTouchMove}
 onTouchEnd={handleTouchEnd}
 className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-0 pb-4 sm:pb-6 relative min-h-[80vh]"
 >
 {/* Mobile / Tablet Pull-to-Refresh Indicator Banner */}
 <div
 className="w-full flex items-center justify-center overflow-hidden transition-all duration-200 pointer-events-none"
 style={{
 height: isRefreshing || isPulling ? `${pullDistance}px` : justRefreshed ? '38px' : '0px',
 opacity: pullDistance > 10 || isRefreshing || justRefreshed ? 1 : 0,
 }}
 >
 <div className="flex items-center gap-2.5 px-4 py-1.5 bg-transparent border border-brand-300 text-brand-900 rounded-full text-xs font-semibold shadow-xs">
 {justRefreshed ? (
 <>
 <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0" />
 <span className="text-brand-800 font-bold">Updated with latest data</span>
 </>
 ) : isRefreshing ? (
 <>
 <RefreshCw className="w-4 h-4 text-brand-600 animate-spin shrink-0" />
 <span>Syncing latest Local Area listings...</span>
 </>
 ) : isThresholdMet ? (
 <>
 <Sparkles className="w-4 h-4 text-brand-500 animate-bounce shrink-0" />
 <span className="text-brand-900 font-bold">Release to refresh feed</span>
 </>
 ) : (
 <>
 <ArrowDown
 className="w-4 h-4 text-brand-600 shrink-0 transition-transform"
 style={{ transform: `rotate(${pullProgress * 180}deg)` }}
 />
 <span className="text-stone-600 font-medium">Pull down to refresh</span>
 </>
 )}
 </div>
 </div>

 {/* KYC Status Action Banner for Rejected Users */}
 {currentUser?.kycStatus === 'REJECTED' && (
 <div className="mb-4 p-4 bg-transparent border border-rose-300 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
 <div className="flex items-start gap-3">
 <div className="p-2 bg-rose-100 text-rose-700 rounded-xl shrink-0 mt-0.5">
 <AlertTriangle className="w-5 h-5" />
 </div>
 <div>
 <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider">
 Aadhaar KYC Rejected — Listing Creation Blocked
 </h4>
 <p className="text-xs text-rose-800 font-medium mt-0.5 leading-relaxed">
 Your Aadhaar verification was rejected by moderators. You cannot post items or submit offers until re-verified.
 {currentUser.kycRejectionReason && (
 <span className="block text-rose-900 font-bold mt-1 bg-rose-100 px-2 py-0.5 rounded border border-rose-200 text-[11px] inline-block">
 Reason: "{currentUser.kycRejectionReason}"
 </span>
 )}
 </p>
 </div>
 </div>
 <button
 type="button"
 onClick={() => setActiveModal('KYC')}
 className="px-3.5 py-2 bg-transparent border border-rose-600 text-rose-700 hover:bg-rose-50 text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0 shadow-xs"
 >
 Re-Upload Documents
 </button>
 </div>
 )}

      {/* Filter and Search Bar with Quick Refresh Action */}
 <div className="sticky top-0 z-30 -mx-3 sm:-mx-6 lg:-mx-8 px-3 sm:px-6 lg:px-8 bg-stone-50/95 backdrop-blur-xl pb-4 pt-2 shadow-[0_10px_20px_-15px_rgba(0,0,0,0.05)] border-b border-stone-200/50">
        <FeedFilterBar />
      </div>

       {/* Promotional Loop Banner */}
      <div className="-mx-3 sm:-mx-6 lg:-mx-8 mb-6">
        <BannerLoop />
      </div>

 {/* Loading Skeleton or Grid of items */}
 <AnimatePresence mode="wait">
 {isFeedLoading ? (
 <FeedSkeletonLoader key="skeleton" count={8} />
 ) : filteredListings.length > 0 ? (
      <>
        <div className="mb-6 sm:mb-8 text-left">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-stone-900 leading-none">
            Exclusive ones<br />
            <span className="italic text-brand-700">locally.</span>
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-stone-500 max-w-md leading-relaxed">
            A handful of pieces you can't buy anywhere else in the city, curated for the community.
          </p>
        </div>

        <motion.div
          key="grid"
 className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-6 sm:gap-x-5 sm:gap-y-10"
 initial="hidden"
 animate="show"
 exit={{ opacity: 0, scale: 0.95 }}
 variants={{
 hidden: { opacity: 0 },
 show: {
 opacity: 1,
 transition: {
 staggerChildren: 0.05,
 }
 }
 }}
 >
 {filteredListings.map((listing) => (
 <motion.div
 key={listing.id}
 variants={{
 hidden: { opacity: 0, y: 20, scale: 0.95 },
 show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
 }}
 >
 <WidgetErrorBoundary><ListingCard listing={listing} onSelect={onSelectListing} /></WidgetErrorBoundary>
 </motion.div>
 ))}
 </motion.div>
      </>
    ) : (
      <motion.div
        key="empty-state"
 initial={{ opacity: 0, scale: 0.95 }}
 animate={{ opacity: 1, scale: 1 }}
 exit={{ opacity: 0, scale: 0.95 }}
 transition={{ duration: 0.3 }}
 className="py-16 text-center bg-white rounded-3xl border border-stone-200 p-8 shadow-xs"
 >
 <div className="w-14 h-14 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto mb-3">
 <PackageX className="w-7 h-7" />
 </div>
 <h3 className="text-base font-bold text-stone-900 mb-1">No Listings Found in this Radius</h3>
 <p className="text-xs text-stone-500 max-w-md mx-auto mb-4">
 Try increasing your discovery radius or changing the category filter to explore other local neighborhoods.
 </p>
 <div className="flex flex-wrap justify-center gap-2">
 <button
 onClick={() => setActiveModal('LOCATION_PICKER')}
 className="px-4 py-2 bg-[#f09257] hover:opacity-90 text-white text-xs font-semibold rounded-xl transition-all"
 >
 Expand Discovery Radius
 </button>
 {flags.isListingEnabled && (
 <button
 onClick={openCreateListing}
 className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold rounded-xl transition-all shadow-sm shadow-brand-500/20"
 >
 Post First Item Here
 </button>
 )}
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 );
};
