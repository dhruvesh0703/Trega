import React from 'react';
import { Sparkles, ShieldCheck, Zap, Lock, MapPin, Users, Star, Circle, Triangle } from 'lucide-react';

export const BannerLoop: React.FC = () => {
  const items = [
    { text: '100% Secure Escrow', icon: ShieldCheck },
    { text: 'Trusted Community', icon: Users },
    { text: 'Zero Fraud Guarantee', icon: Lock },
    { text: 'Instant UPI Payouts', icon: Zap },
    { text: 'Fast & Reliable Delivery', icon: MapPin },
    { text: 'Premium Trega Support', icon: Sparkles },
    { text: 'Exclusive Discounts', icon: Zap },
  ];

  // We render exactly 2 sets to make the -50% translateX loop perfectly
  const set = (
    <div className="flex items-center gap-8 px-4">
      {items.map((item, index) => {
        const Icon = item.icon;
        return (
          <div key={index} className="flex items-center gap-2 text-brand-50 whitespace-nowrap">
            <Icon className="w-4 h-4 text-brand-200" />
            <span className="text-sm font-bold tracking-wide uppercase drop-shadow-sm">{item.text}</span>
          </div>
        );
      })}
    </div>
  );

  // Decorative animated background elements
  const bgElements = (
    <div className="flex items-center gap-16 px-8">
      {[...Array(6)].map((_, i) => (
        <React.Fragment key={i}>
          <Star className="w-8 h-8 text-brand-600/40" style={{ animation: 'spin 8s linear infinite' }} />
          <Circle className="w-5 h-5 text-brand-500/30" style={{ animation: 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
          <Triangle className="w-7 h-7 text-brand-600/40" style={{ animation: 'bounce 3s infinite' }} />
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <div className="relative w-full overflow-hidden bg-brand-700 py-3.5 flex items-center shadow-md border-y border-brand-800/50">
      
      {/* Animated Background Loop */}
      <div 
        className="absolute inset-0 flex w-max animate-marquee pointer-events-none" 
        style={{ animationDuration: '45s', animationDirection: 'reverse' }}
      >
        {bgElements}
        {bgElements}
      </div>

      {/* Edge Fades */}
      <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-brand-700 to-transparent z-10 pointer-events-none"></div>
      <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-brand-700 to-transparent z-10 pointer-events-none"></div>
      
      {/* Main Foreground Marquee */}
      <div className="flex w-max animate-marquee hover:[animation-play-state:paused] relative z-20">
        {set}
        {set}
      </div>
    </div>
  );
};
