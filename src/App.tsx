import { AdminDashboard } from './features/admin/AdminDashboard';
import { ErrorBoundary } from './components/ErrorBoundary';
import React, { useState, Suspense, lazy } from 'react';
import { MarketplaceProvider, useMarketplace } from './core/context/MarketplaceContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { ToastNotification } from './components/ToastNotification';
import { LaunchScreen } from './components/LaunchScreen';
import { SavedListingsScreen } from './features/feed/SavedListingsScreen';

const FeedScreen = lazy(() => import('./features/feed/FeedScreen').then(m => ({ default: m.FeedScreen })));
const LedgerDashboard = lazy(() => import('./features/transactions/LedgerDashboard').then(m => ({ default: m.LedgerDashboard })));
import { ListingDetailModal } from './features/listing/ListingDetailModal';
import { CreateListingModal } from './features/listing/CreateListingModal';
import { MakeOfferBottomSheet } from './features/offer/MakeOfferBottomSheet';
import { CheckoutLedgerModal } from './features/transactions/CheckoutLedgerModal';
import { KycVerificationModal } from './features/kyc/KycVerificationModal';
import { AuthGateModal } from './features/auth/AuthGateModal';
const UserProfileModal = lazy(() => import('./features/profile/UserProfileModal').then(m => ({ default: m.UserProfileModal })));
import { LegalPagesModal } from './features/legal/LegalPagesModal';
import { LocationPickerModal } from './features/location/LocationPickerModal';
import { DisputeModal } from './features/dispute/DisputeModal';
import { FloatingIconsBackground } from './components/FloatingIconsBackground';
import { PolicyPage } from './pages/PolicyPage';
import { Listing } from './types';
import { AnimatePresence, motion } from 'motion/react';

const MainMarketplaceApp: React.FC = () => {
  if (window.location.pathname.startsWith('/policies/')) {
    return <PolicyPage />;
  }
  const { activeModal, setActiveModal, selectedListing, setSelectedListing } = useMarketplace();
  const [currentTab, setCurrentTab] = useState<'FEED' | 'ORDERS' | 'SAVED'>('FEED');

  return (
    <div className="h-[100dvh] bg-stone-50 text-stone-900 flex flex-col font-sans selection:bg-brand-700 selection:text-white relative overflow-hidden">
      {/* Background Animation Layer */}
      <FloatingIconsBackground />

      {/* Animated App Launch Screen */}
      <LaunchScreen minDuration={1600} />

      {/* Top Header */}
      <Header currentTab={currentTab} setCurrentTab={setCurrentTab as any} />

      {/* Main View Area */}
      <main id="main-scroll-container" className="flex-1 overflow-y-auto pb-28 md:pb-8 relative scroll-smooth">
        <AnimatePresence mode="wait">
          {currentTab === 'FEED' && (
            <motion.div
              key="FEED"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, type: "spring", bounce: 0.2 }}
            >
              <Suspense fallback={<div className="p-8 text-center text-stone-500 animate-pulse">Loading Feed...</div>}>
                <FeedScreen onSelectListing={(listing) => setSelectedListing(listing)} />
              </Suspense>
            </motion.div>
          )}
          {currentTab === 'SAVED' && (
            <motion.div
              key="SAVED"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, type: "spring", bounce: 0.2 }}
              className="h-full"
            >
              <SavedListingsScreen onSelectListing={(listing) => setSelectedListing(listing)} />
            </motion.div>
          )}
          {currentTab === 'ORDERS' && (
            <motion.div
              key="ORDERS"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3, type: "spring", bounce: 0.2 }}
            >
              <Suspense fallback={<div className="p-8 text-center text-stone-500 animate-pulse">Loading Ledger...</div>}>
                <LedgerDashboard />
              </Suspense>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation for Mobile */}
      <BottomNav currentTab={currentTab} setCurrentTab={setCurrentTab as any} />

      {/* Modals & Sheets */}
      <AnimatePresence mode="wait">
        {selectedListing && (
          <ListingDetailModal key="LISTING_DETAIL" listing={selectedListing} onClose={() => setSelectedListing(null)} />
        )}
        {activeModal === "CREATE_LISTING" && <CreateListingModal key="CREATE_LISTING" />}
        {activeModal === "CHECKOUT" && <CheckoutLedgerModal key="CHECKOUT" />}
        {activeModal === "LOCATION_PICKER" && <LocationPickerModal key="LOCATION_PICKER" />}
        {activeModal === "LOCATION_PICKER_ADD" && <LocationPickerModal key="LOCATION_PICKER_ADD" />}
        {activeModal === "PROFILE" && (
          <Suspense fallback={<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"><div className="w-8 h-8 rounded-full border-4 border-white/20 border-t-white animate-spin"></div></div>}>
            <UserProfileModal key="PROFILE" />
          </Suspense>
        )}
      </AnimatePresence>
      <MakeOfferBottomSheet />
      <KycVerificationModal />
      <AuthGateModal />
      <LegalPagesModal />
      <DisputeModal />
      <ToastNotification />
    </div>
  );
};

export default function App() {
  const isAdminSubdomain = window.location.hostname.startsWith('admin.') || window.location.search.includes('admin=true');

  if (isAdminSubdomain) {
    return (
      <ErrorBoundary>
        <MarketplaceProvider>
          <AdminDashboard />
          <AuthGateModal />
          <ToastNotification />
        </MarketplaceProvider>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <MarketplaceProvider>
        <MainMarketplaceApp />
      </MarketplaceProvider>
    </ErrorBoundary>
  );
}
