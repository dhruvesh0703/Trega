import React from 'react';
import { AlertTriangle, RefreshCw, Layers } from 'lucide-react';
import { useMarketplace } from '../../core/context/MarketplaceContext';

export const FeedFallbackBanner: React.FC = () => {
 const { toggleFlag } = useMarketplace();

 return (
 <div className="min-h-[400px] flex items-center justify-center p-6 text-center">
 <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-stone-200 shadow-sm">
 <div className="w-14 h-14 rounded-2xl bg-transparent border border-amber-300 text-amber-600 flex items-center justify-center mx-auto mb-4">
 <Layers className="w-7 h-7" />
 </div>
 <div className="inline-block px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg text-xs font-mono font-bold mb-3">
 FEATURE_FEED_ENABLED: false
 </div>
 <h3 className="text-xl font-bold text-stone-900 font-display mb-2">
 Marketplace Feed Paused
 </h3>
 <p className="text-sm text-stone-600 mb-6 leading-relaxed">
 The marketplace feed is currently in scheduled maintenance mode via the centralized Feature-Flag engine. Core account access and offline ledger inquiries remain unaffected.
 </p>
 <button
 onClick={() => toggleFlag('isFeedEnabled')}
 className="w-full py-2.5 px-4 bg-transparent border border-brand-600 text-brand-700 hover:bg-brand-50 text-xs font-semibold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2"
 >
 <RefreshCw className="w-4 h-4" />
 Re-enable Feed in Dev Console
 </button>
 </div>
 </div>
 );
};
