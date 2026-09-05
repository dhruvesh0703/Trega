import React from 'react';
import { MapPin } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useMarketplace } from '../../core/context/MarketplaceContext';
import { calculateDistanceKm, formatDistance } from '../../core/location/localLocations';

interface DistanceBadgeProps {
 lat: number;
 lng: number;
 locationName: string;
 size?: 'sm' | 'md';
}

export const DistanceBadge: React.FC<DistanceBadgeProps> = ({ lat, lng, locationName, size = 'md' }) => {
 const { flags, userLocation } = useMarketplace();

 // If Hyperlocal location flag is disabled, hide GPS distance calculation per PRD fallback
 if (!flags.isLocationEnabled) {
 return (
 <span className="inline-flex items-center gap-1 text-[11px] text-stone-500 truncate">
 <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
 <span className="truncate">{locationName}</span>
 </span>
 );
 }

 const distanceKm = calculateDistanceKm(userLocation.lat, userLocation.lng, lat, lng);
 const formatted = formatDistance(distanceKm);
 const isNear = distanceKm <= 1.5;

 return (
 <span
 className={`inline-flex items-center gap-1 font-medium truncate max-w-full ${
 size === 'sm' ? 'text-[11px]' : 'text-xs'
 } ${isNear ? 'text-brand-900 font-bold' : 'text-stone-600'}`}
 title={`${locationName} (${formatted} from your location ${userLocation.name})`}
 >
 <MapPin className={cn('w-3 h-3 shrink-0', isNear ? 'text-brand-600' : 'text-stone-400')} />
 <span className="truncate">{locationName.split('(')[0]}</span>
 <span
 className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded-full ${
 isNear ? 'bg-transparent border border-brand-300 text-brand-700 font-bold border border-brand-200' : 'bg-stone-100 text-stone-600'
 }`}
 >
 {formatted}
 </span>
 </span>
 );
};
