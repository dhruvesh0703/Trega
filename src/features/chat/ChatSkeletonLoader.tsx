import React from 'react';

export const ChatSkeletonLoader: React.FC = () => {
 return (
 <div
 className="max-w-6xl mx-auto px-4 py-4 sm:py-6 h-[calc(100vh-140px)] min-h-[550px]"
 id="chat-skeleton-loader"
 aria-label="Loading chat threads and messages securely"
 >
 <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden h-full flex flex-col md:flex-row">
 {/* Left: Conversations List Skeleton */}
 <div className="w-full md:w-80 border-r border-stone-100 flex flex-col h-1/3 md:h-full bg-stone-50">
 <div className="p-4 border-b border-stone-100 bg-white">
 <div className="h-4 w-36 bg-stone-200 rounded animate-pulse mb-1.5" />
 <div className="h-3 w-48 bg-stone-200 rounded animate-pulse" />
 </div>

 <div className="flex-1 overflow-y-auto divide-y divide-stone-100 p-2 space-y-2">
 {[1, 2, 3, 4].map((i) => (
 <div
 key={`conv-skel-${i}`}
 className={`p-3 rounded-2xl flex items-center gap-3 ${
 i === 1 ? 'bg-brand-50 border border-brand-100' : 'bg-white'
 }`}
 >
 {/* Avatar */}
 <div className="w-11 h-11 rounded-2xl bg-stone-200 animate-pulse shrink-0" />
 <div className="flex-1 min-w-0 space-y-2">
 <div className="flex items-center justify-between">
 <div className="h-3.5 w-24 bg-stone-200 rounded animate-pulse" />
 <div className="h-2.5 w-10 bg-stone-200 rounded animate-pulse" />
 </div>
 <div className="h-3 w-32 bg-stone-200 rounded animate-pulse" />
 <div className="h-2.5 w-40 bg-stone-200 rounded animate-pulse" />
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* Right: Active Chat Thread Skeleton */}
 <div className="flex-1 flex flex-col h-2/3 md:h-full bg-white">
 {/* Chat Header Skeleton */}
 <div className="p-3.5 sm:p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-full bg-stone-200 animate-pulse shrink-0" />
 <div className="space-y-1.5">
 <div className="flex items-center gap-2">
 <div className="h-3.5 w-28 bg-stone-200 rounded animate-pulse" />
 <div className="h-3.5 w-16 bg-stone-200 rounded-full animate-pulse" />
 </div>
 <div className="h-3 w-44 bg-stone-200 rounded animate-pulse" />
 </div>
 </div>
 <div className="w-28 h-8 bg-stone-200 rounded-xl animate-pulse shrink-0" />
 </div>

 {/* Sync Status Banner */}
 <div className="bg-brand-50 border-b border-brand-100 px-4 py-2 flex items-center justify-between text-xs text-brand-900">
 <div className="flex items-center gap-2">
 <span className="w-2 h-2 rounded-full bg-brand-600 animate-ping" />
 <span className="font-semibold">Syncing real-time messages...</span>
 </div>
 <span className="text-[11px] font-mono text-brand-600 font-medium">Listening</span>
 </div>

 {/* Messages Scroll Area Skeleton */}
 <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50">
 {/* System Info Bubble */}
 <div className="flex justify-center my-2">
 <div className="w-64 h-7 bg-brand-100 rounded-full animate-pulse" />
 </div>

 {/* Seller Message (Left) */}
 <div className="flex flex-col items-start space-y-1">
 <div className="w-64 sm:w-80 h-14 bg-white border border-stone-200 rounded-2xl rounded-bl-xs p-3 space-y-2">
 <div className="h-3 w-3/4 bg-stone-200 rounded animate-pulse" />
 <div className="h-3 w-1/2 bg-stone-200 rounded animate-pulse" />
 </div>
 <div className="h-2.5 w-12 bg-stone-200 rounded animate-pulse ml-1" />
 </div>

 {/* Buyer Offer Message (Right) */}
 <div className="flex flex-col items-end space-y-1">
 <div className="w-72 sm:w-88 bg-brand-600 rounded-2xl rounded-br-xs p-3 space-y-2 text-white">
 <div className="h-14 bg-black rounded-xl p-2 space-y-1.5">
 <div className="h-3 w-28 bg-white rounded animate-pulse" />
 <div className="h-4 w-20 bg-white rounded animate-pulse" />
 </div>
 <div className="h-3 w-40 bg-white rounded animate-pulse" />
 </div>
 <div className="h-2.5 w-12 bg-stone-200 rounded animate-pulse mr-1" />
 </div>

 {/* Seller Response (Left) */}
 <div className="flex flex-col items-start space-y-1">
 <div className="w-56 sm:w-72 h-12 bg-white border border-stone-200 rounded-2xl rounded-bl-xs p-3 space-y-1.5">
 <div className="h-3 w-5/6 bg-stone-200 rounded animate-pulse" />
 <div className="h-3 w-1/3 bg-stone-200 rounded animate-pulse" />
 </div>
 <div className="h-2.5 w-12 bg-stone-200 rounded animate-pulse ml-1" />
 </div>

 {/* Buyer Delivery Address Share (Right) */}
 <div className="flex flex-col items-end space-y-1">
 <div className="w-64 sm:w-80 bg-brand-600 rounded-2xl rounded-br-xs p-3 space-y-2 text-white">
 <div className="h-10 bg-black rounded-xl p-2 flex items-center gap-2">
 <div className="w-5 h-5 bg-white rounded animate-pulse shrink-0" />
 <div className="h-3.5 w-36 bg-white rounded animate-pulse" />
 </div>
 <div className="h-3 w-44 bg-white rounded animate-pulse" />
 </div>
 <div className="h-2.5 w-12 bg-stone-200 rounded animate-pulse mr-1" />
 </div>
 </div>

 {/* Footer Input Bar Skeleton */}
 <div className="p-3 sm:p-4 border-t border-stone-100 bg-white flex items-center gap-2">
 <div className="w-9 h-9 rounded-xl bg-stone-200 animate-pulse shrink-0" />
 <div className="w-9 h-9 rounded-xl bg-stone-200 animate-pulse shrink-0" />
 <div className="flex-1 h-10 rounded-2xl bg-stone-100 animate-pulse" />
 <div className="w-10 h-10 rounded-2xl bg-stone-200 animate-pulse shrink-0" />
 </div>
 </div>
 </div>
 </div>
 );
};
