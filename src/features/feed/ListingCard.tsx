import React from 'react';
import { Eye, ShieldCheck, Tag, Heart, ArrowUpRight, Video } from 'lucide-react';
import { Listing } from '../../types';
import { useMarketplace } from '../../core/context/MarketplaceContext';
import { TrustBadge } from '../kyc/TrustBadge';
import { DistanceBadge } from '../location/DistanceBadge';

interface ListingCardProps {
 listing: Listing;
 onSelect: (listing: Listing) => void;
}

export const ListingCard: React.FC<ListingCardProps> = ({ listing, onSelect }) => {
 const { flags, setModalPayload, setActiveModal, currentUser, toggleSavedListing } = useMarketplace();
  const isSaved = currentUser?.savedListingIds?.includes(listing.id) || false;
  const isReserved = listing.reservedUntil && listing.reservedUntil > Date.now();

 const discountPercent =
 listing.originalPrice && listing.originalPrice > listing.price
 ? Math.round(((listing.originalPrice - listing.price) / listing.originalPrice) * 100)
 : null;

 const conditionLabels: Record<string, { label: string; bg: string; text: string }> = {
 BRAND_NEW: { label: 'Brand New', bg: 'bg-transparent border border-brand-600', text: 'text-brand-700' },
 LIKE_NEW: { label: 'Like New', bg: 'bg-transparent border border-brand-600', text: 'text-brand-700' },
 EXCELLENT: { label: 'Excellent', bg: 'bg-transparent border border-sky-600', text: 'text-sky-700' },
 GOOD: { label: 'Good', bg: 'bg-transparent border border-stone-400', text: 'text-stone-700' },
 FAIR: { label: 'Fair Condition', bg: 'bg-transparent border border-amber-600', text: 'text-amber-700' },
 };

 const cond = conditionLabels[listing.condition] || conditionLabels.GOOD;

 return (
 <div
 onClick={() => onSelect(listing)}
 className="group bg-transparent flex flex-col cursor-pointer"
 >
 {/* Image container */}
 <div className="relative aspect-[4/5] bg-stone-50 overflow-hidden rounded-2xl border border-stone-100">
        <img
 src={listing.images[0] || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80'}
 alt={listing.title}
 referrerPolicy="no-referrer"
 className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
 />

 {/* Condition tag */}
 <div className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 flex flex-col gap-1 items-start">
 <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded-full border shadow-2xs ${cond.bg} ${cond.text}`}>
 {cond.label}
 </span>
 {listing.originalBillIncluded && (
 <span className="text-[8px] sm:text-[9px] font-semibold bg-white text-stone-700 px-1 sm:px-1.5 py-0.5 rounded-full border border-stone-200 shadow-2xs">
 Bill Included
 </span>
 )}
 </div>

 {/* Discount Badge */}
 {discountPercent && (
 <div className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 bg-transparent border border-brand-700 text-brand-800 hover:bg-brand-50 text-[9px] sm:text-[11px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded-full shadow-xs">
 {discountPercent}% OFF
 </div>
 )}

 {/* In-App Camera Video Badge */}
 {listing.videoUrl && (
 <div className="absolute bottom-2 left-2 sm:bottom-2.5 sm:left-2.5 bg-brand-600 text-white border border-brand-500 text-[9px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-md">
 <Video className="w-3 h-3 text-white" />
 <span>Video Verified</span>
 </div>
 )}

 
        {/* Wishlist Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleSavedListing(listing.id);
          }}
          className="absolute bottom-2 right-2 sm:bottom-2.5 sm:right-2.5 p-1.5 sm:p-2 bg-white/80 backdrop-blur-md hover:bg-white text-stone-500 rounded-full shadow-sm transition-colors z-10"
        >
          <Heart className={`w-3 h-3 sm:w-4 sm:h-4 ${isSaved ? 'fill-brand-500 text-brand-500' : 'text-stone-600'}`} />
        </button>

        {/* Quick view / sold overlay */}
 {isReserved && !listing.isSold && (
          <div className="absolute top-2 left-2 z-10 bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-sm">
            Pending Checkout
          </div>
        )}
        {listing.isSold && (
 <div className="absolute inset-0 bg-stone-900 flex items-center justify-center">
 <span className="bg-rose-600 text-white text-[10px] sm:text-xs font-bold px-2.5 sm:px-3 py-1 rounded-full uppercase tracking-wider">
 Sold Out
 </span>
 </div>
 )}
 </div>

 {/* Content */}
 <div className="pt-2.5 sm:pt-3 flex-1 flex flex-col justify-between">
 <div>
 {/* Location & Proximity */}
 <div className="mb-1 sm:mb-1.5 flex items-center justify-between text-xs">
 <DistanceBadge lat={listing.lat} lng={listing.lng} locationName={listing.locationName} size="sm" />
 </div>

 {/* Title */}
 <h3 className="text-xs sm:text-[13px] font-semibold text-stone-800 line-clamp-2 leading-tight group-hover:text-brand-700 transition-colors">
 {listing.title}
 </h3>
 </div>

 <div className="mt-1.5 sm:mt-2 flex items-end justify-between gap-1">
 <div className="min-w-0 flex-1">
 <div className="flex items-baseline gap-1 sm:gap-1.5 flex-wrap">
 <span className="text-base sm:text-lg font-black text-brand-700 font-display">
 ₹{listing.price.toLocaleString('en-IN')}
 </span>
 {listing.originalPrice && (
 <span className="text-[10px] sm:text-xs text-stone-400 line-through font-medium">
 ₹{listing.originalPrice.toLocaleString('en-IN')}
 </span>
 )}
 </div>
 
 {/* Seller profile / KYC verification */}
 <div className="mt-1 flex items-center gap-1 sm:gap-1.5">
 <img
 src={listing.seller.avatar}
 alt={listing.seller.name}
 className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full object-cover border border-stone-200 shrink-0"
 />
 <span className="text-[10px] sm:text-[11px] text-stone-600 font-medium truncate max-w-[55px] sm:max-w-[100px]">
 {listing.seller.name.split(' ')[0]}
 </span>
 <TrustBadge isVerified={listing.seller.isKycVerified} kycType={listing.seller.kycType} size="sm" />
 </div>
 </div>

 <button
 type="button"
 onClick={(e) => {
 e.stopPropagation();
 onSelect(listing);
 }}
 className="p-1.5 sm:p-2 rounded-full bg-transparent border border-brand-200 hover:bg-brand-50 text-brand-700 transition-colors shrink-0 cursor-pointer"
 title="View Details"
 >
 <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
 </button>
 </div>
 </div>
 </div>
 );
};
