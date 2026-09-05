import React from 'react';
import { ShieldCheck, Sparkles, Clock, AlertTriangle } from 'lucide-react';
import { useMarketplace } from '../../core/context/MarketplaceContext';
import { KycStatus } from '../../types';

interface TrustBadgeProps {
  compact?: boolean;
 isVerified?: boolean;
 kycStatus?: KycStatus;
 kycType?: string;
 
 collegeOrArea?: string;
 size?: 'sm' | 'md' | 'lg';
 showDetails?: boolean;
}

export const TrustBadge: React.FC<TrustBadgeProps> = ({
 isVerified,
 kycStatus,
 kycType,
 
 collegeOrArea,
 size = 'md',
 showDetails = false,
}) => {
 const { flags, setActiveModal } = useMarketplace();

 // If KYC feature flag is disabled, hide all verification badges
 if (!flags.isKycEnabled) {
 return null;
 }

 // Handle Incomplete Mode
 if (kycStatus === 'INCOMPLETE') {
 return (
 <span
 onClick={(e) => {
 e.stopPropagation();
 setActiveModal('KYC');
 }}
 className={`inline-flex items-center gap-1 font-semibold text-amber-700 bg-transparent border border-amber-500 hover:bg-amber-50 px-2 py-0.5 rounded-full cursor-pointer transition-colors shadow-xs ${
 size === 'sm' ? 'text-[10px]' : 'text-xs'
 }`}
 title="KYC incomplete. Click to complete verification."
 >
 <AlertTriangle className="w-3 h-3 text-amber-600" />
 <span>KYC Incomplete</span>
 </span>
 );
 }

 // Handle Rejected
 if (kycStatus === 'REJECTED') {
 return (
 <span
 onClick={(e) => {
 e.stopPropagation();
 setActiveModal('KYC');
 }}
 className={`inline-flex items-center gap-1 font-semibold text-rose-700 bg-transparent border border-rose-500 hover:bg-rose-50 px-2 py-0.5 rounded-full cursor-pointer transition-colors ${
 size === 'sm' ? 'text-[10px]' : 'text-xs'
 }`}
 title="Verification failed. Click to retry."
 >
 <AlertTriangle className="w-3 h-3 text-rose-600" />
 <span>KYC Rejected (Retry)</span>
 </span>
 );
 }

 // Handle Unverified
 if (!isVerified && kycStatus !== 'APPROVED') {
 return (
 <span
 onClick={(e) => {
 e.stopPropagation();
 setActiveModal('KYC');
 }}
 className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-700 bg-transparent border border-brand-500 hover:bg-brand-50 px-2 py-0.5 rounded-full cursor-pointer transition-colors"
 title="Unverified account - Click to verify Identity "
 >
 <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
 Unverified
 </span>
 );
 }

 const label =
 kycType === 'AADHAAR'
 ? 'Identity Verified'
 : kycType === 'PAN'
 ? 'Identity Verified'
 : kycType === 'STUDENT_ID'
 ? 'Verified Student'
 : kycType === 'FACULTY_ID'
 ? 'Verified Faculty'
 : 'Identity Verified';

 if (size === 'sm') {
 return (
 <span
 className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-transparent border border-emerald-500 px-2 py-0.5 rounded-full shadow-xs"
 title={label}
 >
 <ShieldCheck className="w-3 h-3 text-emerald-600" />
 <span>Verified</span>
 </span>
 );
 }

 return (
 <div className="inline-flex flex-col">
 <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-transparent border border-emerald-500 px-2.5 py-1 rounded-full shadow-xs">
 <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
 <span className="tracking-tight">{label}</span>
 
 </div>
 {showDetails && collegeOrArea && (
 <span className="text-[11px] text-stone-500 mt-0.5 pl-1 flex items-center gap-1">
 <Sparkles className="w-2.5 h-2.5 text-brand-500" />
 Verified ID @ {collegeOrArea}
 </span>
 )}
 </div>
 );
};
