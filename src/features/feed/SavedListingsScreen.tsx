import React from 'react';
import { useMarketplace } from '../../core/context/MarketplaceContext';
import { ListingCard } from './ListingCard';
import { Heart, PackageX } from 'lucide-react';
import { Listing } from '../../types';
import { FeedFilterBar } from './FeedFilterBar';
import { motion, AnimatePresence } from 'motion/react';
import { WidgetErrorBoundary } from '../../components/ErrorBoundary';

export const SavedListingsScreen: React.FC<{ onSelectListing: (listing: Listing) => void }> = ({ onSelectListing }) => {
  const { currentUser, filteredListings } = useMarketplace();

  const savedListings = filteredListings.filter((listing) => 
    currentUser?.savedListingIds?.includes(listing.id)
  );

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-0 pb-4 sm:pb-6 relative min-h-[80vh]">
      
      {/* Filter and Search Bar with Quick Refresh Action */}
      <div className="sticky top-0 z-30 -mx-3 sm:-mx-6 lg:-mx-8 px-3 sm:px-6 lg:px-8 bg-stone-50/95 backdrop-blur-xl pb-4 pt-2 shadow-[0_10px_20px_-15px_rgba(0,0,0,0.05)] border-b border-stone-200/50 mb-6">
        <FeedFilterBar />
      </div>

      <AnimatePresence mode="wait">
        {savedListings.length > 0 ? (
          <>
            <div className="mb-6 sm:mb-8 text-left">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-stone-900 leading-none flex items-center gap-3">
                <Heart className="w-10 h-10 lg:w-12 lg:h-12 text-brand-600 fill-brand-600" />
                <span>My Wishlist</span>
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-stone-500 max-w-md leading-relaxed">
                Items you've wishlisted for later.
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
                show: { opacity: 1, transition: { staggerChildren: 0.05 } }
              }}
            >
              {savedListings.map((listing) => (
                <motion.div
                  key={listing.id}
                  variants={{
                    hidden: { opacity: 0, y: 20, scale: 0.95 },
                    show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
                  }}
                >
                  <WidgetErrorBoundary>
                    <ListingCard listing={listing} onSelect={onSelectListing} />
                  </WidgetErrorBoundary>
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
            <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-400 mx-auto mb-4">
              <Heart className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-stone-900 mb-1">Your wishlist is empty</h3>
            <p className="text-xs text-stone-500 max-w-md mx-auto mb-4">
              Try exploring the feed and tapping the heart icon on any listing to save it here for quick access later.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
