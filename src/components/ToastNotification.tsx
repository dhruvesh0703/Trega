import React from 'react';
import { useMarketplace } from '../core/context/MarketplaceContext';

export const ToastNotification: React.FC = () => {
  const { toastMessage } = useMarketplace();

  if (!toastMessage) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-6 z-[9999] animate-in slide-in-from-bottom-5 duration-300 pointer-events-none">
      <div className="bg-stone-900 text-white px-5 py-3.5 rounded-xl shadow-2xl border border-stone-800 flex items-center gap-3 text-sm max-w-sm pointer-events-auto">
        <p className="font-medium tracking-wide">{toastMessage}</p>
      </div>
    </div>
  );
};
