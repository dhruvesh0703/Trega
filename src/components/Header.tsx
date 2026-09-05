import React from 'react';
import { motion } from 'motion/react';
import {
  MapPin,
  Sparkles,
  ShieldCheck,
  LogIn,
  UserPlus,
  Plus,
  Compass,
  ReceiptText,
  Clock,
  Home,
  Heart
} from 'lucide-react';
import { useMarketplace } from '../core/context/MarketplaceContext';
import { NotificationBell } from './NotificationBell';

interface HeaderProps {
 currentTab: string;
 setCurrentTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, setCurrentTab }) => {
 const {
 flags,
 userLocation,
 currentUser,
 setActiveModal,
 openCreateListing,
 isUserKycVerified,
 } = useMarketplace();

 return (
 <header className="sticky top-0 shrink-0 z-40 bg-white/70 backdrop-blur-3xl border-b border-white/60 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.1)]">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Cool animated background glow */}
        <motion.div 
          className="absolute -top-10 left-20 w-32 h-32 bg-brand-200/40 rounded-full blur-3xl"
          animate={{ x: [0, 100, 0], scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
 
        <div className="flex items-center justify-between h-16 py-1">
          {/* Left Side: Welcome & Location */}
          <div className="flex flex-col gap-1 max-w-[65%]">
            <div className="flex items-center gap-2 mb-0.5">
              <h1 className="text-lg font-bold text-stone-800 truncate">
                Welcome, {currentUser ? currentUser.name.split(' ')[0] : 'Guest'}
              </h1>
            </div>
            
            {/* Hyperlocal Locality Selector Button */}
            <button
              type="button"
              onClick={() => setActiveModal('LOCATION_PICKER')}
              className="flex items-center gap-1 text-sm font-semibold text-stone-500 hover:text-stone-700 transition-all cursor-pointer group"
              title="Click to change locality or discovery radius"
            >
              <Home className="w-4 h-4 text-brand-600 shrink-0" />
              <span className="font-bold text-stone-700 mr-1">Home</span>
              <span className="truncate max-w-[140px]">{userLocation.name}</span>
              <svg className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Right Side: Action Icons */}
          <div className="flex items-center gap-3">
            {/* Notification Bell wrapper for style matching */}
            <div className="relative">
              <div className="w-11 h-11 rounded-full bg-stone-200/60 flex items-center justify-center cursor-pointer hover:bg-stone-200 transition-colors">
                <NotificationBell />
              </div>
            </div>
            
            {/* Heart / Favorites */}
            <button
              type="button"
              onClick={() => setCurrentTab('SAVED')}
              className={`w-11 h-11 rounded-full flex items-center justify-center cursor-pointer transition-colors ${currentTab === 'SAVED' ? 'bg-brand-100 text-brand-700' : 'bg-stone-200/60 hover:bg-stone-200 text-stone-700'}`}
              title="Favorites"
            >
              <Heart className="w-5 h-5" />
            </button>
          </div>
        </div>

      </div>
    </header>
 );
};
