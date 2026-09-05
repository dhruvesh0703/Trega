import React, { useState, useEffect, useRef } from 'react';
import { Search, Clock,
 BookOpen,
 Laptop,
 BedDouble,
 Bike,
 Calculator,
 Dumbbell,
 Shirt,
 Music,
 LayoutGrid,
 ShieldCheck,
 ArrowUpDown,
 Sparkles,
 MapPin,
 RotateCw,
} from 'lucide-react';
import { ProductCategory, ItemCondition } from '../../types';
import { useMarketplace, SortOption } from '../../core/context/MarketplaceContext';

export const CATEGORIES: { id: ProductCategory; label: string; icon: React.FC<{ className?: string }> }[] = [
 { id: 'ALL', label: 'All Items', icon: LayoutGrid },
 { id: 'ELECTRONICS_TECH', label: 'Electronics & Tech', icon: Laptop },
 { id: 'BOOKS_NOTES', label: 'Books & Notes', icon: BookOpen },
 { id: 'HOME_LIVING', label: 'Home & Living', icon: BedDouble },
 { id: 'CYCLES_MOBILITY', label: 'Cycles & Bikes', icon: Bike },
 { id: 'TOOLS_APPLIANCES', label: 'Tools & Lab Appliances', icon: Calculator },
 { id: 'SPORTS_FITNESS', label: 'Sports & Gym', icon: Dumbbell },
 { id: 'MUSIC_HOBBIES', label: 'Music & Jamming', icon: Music },
 { id: 'FASHION_ACCESSORIES', label: 'Fashion & Bags', icon: Shirt },
];

export const FeedFilterBar: React.FC = () => {
 const {
 flags,
 searchQuery,
 setSearchQuery,
 selectedCategory,
 setSelectedCategory,
 selectedCondition,
 setSelectedCondition,
 sortOption,
 setSortOption,
 userLocation,
 radiusKm,
 setActiveModal,
 isFeedLoading,
 refreshFeedData,
 } = useMarketplace();
    const [localQuery, setLocalQuery] = useState(searchQuery);

  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localQuery !== searchQuery) {
        setSearchQuery(localQuery);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [localQuery, searchQuery, setSearchQuery]);

  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const historyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('trega_search_history');
    if (saved) {
      try {
        setSearchHistory(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (historyRef.current && !historyRef.current.contains(e.target)) {
        setShowHistory(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const saveSearch = (query) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    const updated = [trimmed, ...searchHistory.filter(q => q.toLowerCase() !== trimmed.toLowerCase())].slice(0, 5);
    setSearchHistory(updated);
    localStorage.setItem('trega_search_history', JSON.stringify(updated));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      saveSearch(localQuery);
      setShowHistory(false);
      e.currentTarget.blur();
    }
  };

  const handleHistorySelect = (query) => {
    setLocalQuery(query);
    setSearchQuery(query);
    saveSearch(query);
    setShowHistory(false);
  };


 return (
 <div className="space-y-3 w-full">
 {/* Search & Location Bar */}
 <div className="flex flex-col sm:flex-row gap-2.5">
 <div className="relative flex-1" ref={historyRef}> <Search className="w-5 h-5 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" /> <input type="text" value={localQuery} onChange={(e) => setLocalQuery(e.target.value)} onFocus={() => setShowHistory(true)} onKeyDown={handleKeyDown} placeholder="Search textbooks, calculators, laptops, cycles locally..." className="w-full pl-12 pr-14 py-3 bg-white/90 text-base border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 shadow-sm placeholder:text-stone-400/80 transition-all" /> {localQuery && ( <button onClick={() => { setLocalQuery(''); setSearchQuery(''); setShowHistory(false); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-stone-400 hover:text-stone-600 cursor-pointer" > Clear </button> )} 
      {/* Search History Dropdown */}
      {showHistory && searchHistory.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-4 py-2.5 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Recent Searches</span>
            <button 
              onClick={() => { setSearchHistory([]); localStorage.removeItem('trega_search_history'); }} 
              className="text-xs font-semibold text-stone-400 hover:text-rose-600 transition-colors"
            >
              Clear All
            </button>
          </div>
          <div className="flex flex-col">
            {searchHistory.map((q, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleHistorySelect(q)}
                className="px-4 py-3 hover:bg-stone-50 flex items-center gap-3 cursor-pointer border-b border-stone-100 last:border-0 w-full text-left transition-colors"
              >
                <Clock className="w-4 h-4 text-stone-400 shrink-0" />
                <span className="text-sm font-medium text-stone-700 truncate">{q}</span>
              </button>
            ))}
          </div>
        </div>
      )}
</div> </div>

 {/* Categories Horizontal Scroll */}
 <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
 {CATEGORIES.map((cat) => {
 const Icon = cat.icon;
 const isSelected = selectedCategory === cat.id;
 return (
 <button
 key={cat.id}
 type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`group flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
 isSelected
 ? 'bg-transparent border border-brand-700 text-brand-800 hover:bg-brand-50 shadow-sm shadow-brand-700/20'
 : 'bg-white border border-stone-200 text-stone-500 hover:text-brand-700 hover:border-brand-300 hover:bg-brand-50'
 }`}
 >
 <Icon className="w-4 h-4" />
 <span>{cat.label}</span>
 </button>
 );
 })}
 </div>

 {/* Secondary Controls: Sorting & Verified filter */}
      <div className="flex items-center justify-between gap-3 text-xs pt-1 w-full flex-wrap">
        {/* Condition Filter */}
        <select
          value={selectedCondition}
          onChange={(e) => setSelectedCondition(e.target.value as any)}
          className="bg-white border border-stone-200 text-stone-700 py-2 px-3 rounded-xl font-medium focus:outline-none focus:border-brand-700 text-sm cursor-pointer flex-1 min-w-[130px] max-w-xs"
        >
          <option value="ALL">All Conditions</option>
          <option value="BRAND_NEW">Brand New Only</option>
          <option value="LIKE_NEW">Like New</option>
          <option value="EXCELLENT">Excellent</option>
          <option value="GOOD">Good</option>
          <option value="FAIR">Fair</option>
        </select>

        {/* Sort Dropdown */}
        <div className="flex items-center justify-end gap-1.5 text-stone-500 font-medium flex-1 min-w-[150px]">
          <ArrowUpDown className="w-4 h-4 text-stone-400 shrink-0" />
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as SortOption)}
            className="bg-white border border-stone-200 text-stone-700 py-2 px-3 rounded-xl font-semibold focus:outline-none focus:border-brand-700 text-sm cursor-pointer w-full max-w-xs"
          >
            {flags.isLocationEnabled && <option value="NEAREST">Nearest First</option>}
            <option value="NEWEST">Newly Listed</option>
            <option value="PRICE_LOW">Price: Low to High</option>
            <option value="PRICE_HIGH">Price: High to Low</option>
            
          </select>
        </div>
      </div>
    </div>
  );
};
