import React from 'react';
import { motion } from 'motion/react';

interface FeedSkeletonLoaderProps {
 count?: number;
}

export const FeedSkeletonLoader: React.FC<FeedSkeletonLoaderProps> = ({ count = 8 }) => {
 return (
 <motion.div 
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="space-y-4" id="feed-skeleton-loader" aria-label="Loading marketplace listings"
 >
 {/* Visual Sync Indicator Bar */}
 <motion.div 
 initial={{ y: -10, opacity: 0 }}
 animate={{ y: 0, opacity: 1 }}
 transition={{ duration: 0.4, ease: "easeOut" }}
 className="flex items-center justify-between px-3 py-2 bg-brand-50 border border-brand-100 rounded-xl text-xs text-brand-900"
 >
 <div className="flex items-center gap-2">
 <span className="w-2 h-2 rounded-full bg-brand-600 animate-ping" />
 <span className="font-semibold">Fetching local listings securely...</span>
 </div>
 <span className="text-[11px] text-brand-600 font-mono font-medium">Syncing...</span>
 </motion.div>

 {/* Grid of Skeleton Cards */}
 <motion.div 
 className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-6 sm:gap-x-5 sm:gap-y-10"
 initial="hidden"
 animate="show"
 variants={{
 hidden: { opacity: 0 },
 show: {
 opacity: 1,
 transition: {
 staggerChildren: 0.1,
 }
 }
 }}
 >
 {Array.from({ length: count }).map((_, idx) => (
 <motion.div
 key={`feed-skeleton-${idx}`}
 variants={{
 hidden: { opacity: 0, y: 20, scale: 0.95 },
 show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
 }}
 className="bg-transparent flex flex-col"
 >
 {/* Image Placeholder */}
 <div className="relative aspect-[4/5] bg-stone-200 animate-pulse rounded-2xl border border-stone-100">
 {/* Fake condition badge */}
 <div className="absolute top-2.5 left-2.5 w-16 h-5 bg-stone-300 rounded-full" />
 {/* Fake discount badge */}
 {idx % 2 === 0 && (
 <div className="absolute top-2.5 right-2.5 w-14 h-5 bg-stone-300 rounded-full" />
 )}
 </div>

 {/* Content Placeholder */}
 <div className="pt-2.5 sm:pt-3 flex-1 flex flex-col justify-between space-y-3">
 <div className="space-y-2">
 {/* Distance Badge Skeleton */}
 <div className="w-28 h-4 bg-stone-200 rounded-md animate-pulse" />

 {/* Title Skeletons */}
 <div className="space-y-1.5 pt-1">
 <div
 className="h-3.5 bg-stone-200 rounded animate-pulse"
 style={{ width: idx % 3 === 0 ? '90%' : idx % 2 === 0 ? '75%' : '85%' }}
 />
 <div
 className="h-3.5 bg-stone-200 rounded animate-pulse"
 style={{ width: idx % 3 === 0 ? '60%' : '50%' }}
 />
 </div>
 </div>

 {/* Price and Seller Bar Skeleton */}
 <div className="mt-1.5 sm:mt-2 flex items-end justify-between">
 <div className="space-y-1.5 flex-1">
 {/* Price */}
 <div className="h-5 w-20 bg-stone-200 rounded-md animate-pulse" />

 {/* Seller Profile info */}
 <div className="flex items-center gap-1.5">
 <div className="w-4 h-4 rounded-full bg-stone-200 animate-pulse shrink-0" />
 <div className="h-2.5 w-16 bg-stone-200 rounded animate-pulse" />
 <div className="w-3.5 h-3.5 rounded bg-stone-200 animate-pulse" />
 </div>
 </div>

 {/* Action button */}
 <div className="w-8 h-8 rounded-xl bg-stone-200 animate-pulse shrink-0" />
 </div>
 </div>
 </motion.div>
 ))}
 </motion.div>
 </motion.div>
 );
};
