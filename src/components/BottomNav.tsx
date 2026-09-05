import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import {
 Compass,
 Plus,
 ReceiptText,
 Sliders,
 ShieldCheck,
 User,
  Heart,
} from 'lucide-react';
import { useMarketplace } from '../core/context/MarketplaceContext';
import { triggerHaptic } from '../lib/haptics';

interface BottomNavProps {
 currentTab: string;
 setCurrentTab: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, setCurrentTab }) => {
 const { flags, currentUser, setActiveModal, openCreateListing } = useMarketplace();

 const [isVisible, setIsVisible] = useState(true);
 const lastScrollY = useRef(0);

 useEffect(() => {
   const scrollContainer = document.getElementById('main-scroll-container');
   if (!scrollContainer) return;

   const handleScroll = () => {
     const currentScrollY = scrollContainer.scrollTop;
     
     if (currentScrollY < 50) {
       setIsVisible(true);
       lastScrollY.current = currentScrollY;
       return;
     }

     if (currentScrollY > lastScrollY.current + 8) {
       setIsVisible(false);
     } else if (currentScrollY < lastScrollY.current - 8) {
       setIsVisible(true);
     }
     
     lastScrollY.current = currentScrollY;
   };

   scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
   return () => scrollContainer.removeEventListener('scroll', handleScroll);
 }, []);

 return (
 <>
 {/* Floating Action Button (FAB) for Listing Products - Placed outside above the bottom 3 menu in the corner */}
 {flags.isListingEnabled && (
 <motion.div 
  className="md:hidden fixed bottom-[100px] right-4 z-50"
  animate={{ y: isVisible ? 0 : 70 }}
  initial={false}
  transition={{ type: "spring", stiffness: 300, damping: 25 }}
 >

 <button
 type="button"
 id="mobile-fab-list-product"
 onClick={() => { triggerHaptic('medium'); openCreateListing(); }}
 className="flex items-center gap-1.5 py-3 px-4 bg-brand-700 hover:bg-brand-800 active:scale-95 text-white font-extrabold text-xs rounded-full shadow-lg shadow-brand-900/20 border border-brand-600 transition-all cursor-pointer min-h-[44px] relative overflow-hidden group"
 title="List a new product in Local Area"
 >
 <Plus className="w-4 h-4 stroke-[3] relative z-10 group-hover:rotate-90 transition-transform duration-300" />
              <span className="tracking-wide relative z-10">List Product</span>
              <motion.div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12" animate={{ x: ["-100%", "200%"] }} transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut", repeatDelay: 1.5 }} />
 </button>
      
</motion.div>
 )}

 {/* Bottom 3-Menu Navigation Bar */}
 <motion.div 
  className="md:hidden fixed bottom-6 left-4 right-4 z-40 bg-white/75 backdrop-blur-3xl border border-white/60 rounded-3xl px-2 py-2 shadow-[0_16px_32px_-12px_rgba(0,0,0,0.15)]"
  animate={{ y: isVisible ? 0 : 120, opacity: isVisible ? 1 : 0 }}
  initial={false}
  transition={{ type: "spring", stiffness: 300, damping: 25 }}
 >
 <div className="grid grid-cols-3 items-center max-w-md mx-auto">
 {/* 1. Feed / Explore Tab */}
 <button
 type="button"
 onClick={() => { triggerHaptic('light'); setCurrentTab('FEED'); }}
 className={`flex flex-col items-center justify-center gap-0.5 py-1 px-2 rounded-xl transition-all min-h-[44px] cursor-pointer ${
 currentTab === 'FEED' ? 'text-brand-700 font-bold' : 'text-stone-500 hover:text-stone-900'
 }`}
 >
 <Compass className={`w-5 h-5 ${currentTab === 'FEED' ? 'stroke-[2.5]' : ''}`} />
 <span className="text-xs">Explore</span>
 </button>

        {/* 2. My Orders Tab */}
 <button
 type="button"
 onClick={() => { triggerHaptic('light'); setCurrentTab('ORDERS'); }}
 className={`flex flex-col items-center justify-center gap-0.5 py-1 px-2 rounded-xl transition-all min-h-[44px] cursor-pointer ${
 currentTab === 'ORDERS' ? 'text-brand-700 font-bold' : 'text-stone-500 hover:text-stone-900'
 }`}
 >
 <ReceiptText className={`w-5 h-5 ${currentTab === 'ORDERS' ? 'stroke-[2.5]' : ''}`} />
 <span className="text-xs">My Orders</span>
 </button>

 {/* 3. Profile / Account Tab */}
 <button
 type="button"
 id="mobile-account-tab-btn"
 onClick={() => { triggerHaptic('light'); setActiveModal(currentUser ? 'PROFILE' : 'AUTH'); }}
 className="flex flex-col items-center justify-center gap-0.5 py-1 px-2 rounded-xl text-stone-500 hover:text-stone-900 transition-all min-h-[44px] cursor-pointer"
 >
 {currentUser?.avatar ? (
              <img src={currentUser.avatar} alt="" className="w-5 h-5 rounded-full object-cover border border-brand-300" />
            ) : (
              <User className="w-5 h-5" />
            )}
            <span className="text-xs font-semibold truncate max-w-[70px]">
              Profile
            </span>
 </button>
        </div>
      </motion.div>
    </>
 );
};

