import React, { useState } from 'react';
import {
 AlertTriangle,
 ShieldAlert,
 Upload,
 CheckCircle2,
 X,
 Sparkles,
 HelpCircle,
 FileCheck,
 Scale,
} from 'lucide-react';
import { TransactionOrder, DisputeTicket } from '../../types';
import { useMarketplace } from '../../core/context/MarketplaceContext';

export const DisputeModal: React.FC = () => {
 const {
 activeModal,
 setActiveModal,
 modalPayload,
 flags,
 raiseDispute,
 resolveDispute,
 disputes,
 showToast,
    currentUser,
 } = useMarketplace();

 const order: TransactionOrder | null = modalPayload;

 const [reason, setReason] = useState<DisputeTicket['reason']>('DEFECTIVE_ITEM');
 const [description, setDescription] = useState('');
 const [evidenceImages, setEvidenceImages] = useState<string[]>([
 'https://images.unsplash.com/photo-1587145820266-a5951ee6f620?w=800&auto=format&fit=crop&q=80',
 ]);
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [activeTicket, setActiveTicket] = useState<DisputeTicket | null>(null);

 if (activeModal !== 'DISPUTE' || !order) return null;

 // Fallback when Dispute flag is disabled per PRD
 if (!flags.isDisputeEnabled) {
 return (
 <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-stone-50 overflow-hidden">
 <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-sm border border-stone-200 text-center">
 <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-4 text-stone-500">
 <AlertTriangle className="w-6 h-6" />
 </div>
 <h3 className="text-lg font-bold text-stone-900 mb-1">Dispute System Offline</h3>
 <p className="text-xs font-mono text-amber-700 bg-amber-50 py-1 px-2 rounded-md inline-block mb-3">
 FEATURE_DISPUTE_ENABLED: false
 </p>
 <p className="text-sm text-stone-600 mb-6 leading-relaxed">
 The automated 24-hour dispute module is paused by runtime feature flag. Please write directly to <strong className="text-stone-900">dhruveshpatil03@gmail.com</strong> with your order ID <code>{order.id}</code>.
 </p>
 <button
 onClick={() => setActiveModal(null)}
 className="w-full py-2.5 px-4 bg-stone-900 hover:bg-stone-800 text-white text-sm font-semibold rounded-xl transition-all"
 >
 Close
 </button>
 </div>
 </div>
 );
 }

 const existingDispute = disputes.find((d) => d.orderId === order.id) || activeTicket;

 const isWindowExpired =
 !existingDispute &&
 (order.isDisputeExpired ||
 order.escrowStatus === 'PAYOUT_COMPLETED' ||
 order.escrowStatus === 'DEAL_CLOSED' ||
 (order.disputeExpiresAtTimestamp && Date.now() > order.disputeExpiresAtTimestamp));

 if (isWindowExpired) {
 return (
 <div className="fixed inset-0 z-50 flex flex-col bg-stone-50 overflow-y-auto">
 <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-sm border border-stone-200 text-center space-y-4">
 <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
 <AlertTriangle className="w-7 h-7" />
 </div>
 <div>
 <h3 className="text-base font-bold text-stone-900">24-Hour Dispute Window Closed</h3>
 <p className="text-xs text-stone-500 mt-1">Order #{order.id}</p>
 </div>
 <p className="text-xs text-stone-600 leading-relaxed bg-stone-50 p-3.5 rounded-xl border border-stone-200 text-left">
 The 24-hour buyer dispute window for this order has expired. Escrow funds of <strong>₹{order.amount}</strong> have been released to the seller's UPI{(currentUser?.isAdmin || currentUser?.id === order.sellerId) && (<span> (<code>{order.sellerUpiId}</code>)</span>)}. As per policy, Trega is now officially out of the deal and the transaction is closed.
 </p>
 <button
 type="button"
 onClick={() => setActiveModal(null)}
 className="w-full py-2.5 px-4 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
 >
 Understood
 </button>
 </div>
 </div>
 );
 }

 const handleSubmitDispute = (e: React.FormEvent) => {
 e.preventDefault();
 if (!description.trim()) {
 showToast('Please describe the issue with the item');
 return;
 }

 setIsSubmitting(true);
 setTimeout(() => {
 setIsSubmitting(false);
 const ticket = raiseDispute(order.id, reason, description.trim(), evidenceImages);
 setActiveTicket(ticket);
 }, 800);
 };

 return (
 <div className="fixed inset-0 z-50 flex flex-col bg-stone-50 overflow-y-auto">
 <div className="flex flex-col w-full h-full relative p-4 sm:p-6 pb-24 max-w-lg mx-auto">
 <button
 onClick={() => setActiveModal(null)}
 className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-100 transition-colors"
 >
 <X className="w-5 h-5" />
 </button>

 {/* Header */}
 <div className="flex items-center gap-3 mb-5">
 <div className="w-10 h-10 rounded-xl bg-transparent border border-rose-300 flex items-center justify-center text-rose-600">
 <ShieldAlert className="w-5 h-5" />
 </div>
 <div>
 <h2 className="text-lg font-bold text-stone-900 font-display">24-Hour Buyer Protection Window</h2>
 <p className="text-xs text-stone-500">Order ID: #{order.id} • Amount in Escrow: ₹{order.amount}</p>
 </div>
 </div>

 {!existingDispute ? (
 <form onSubmit={handleSubmitDispute} className="space-y-4 text-xs">
 <div>
 <label className="block font-bold text-stone-700 mb-1">Dispute Reason</label>
 <select
 value={reason}
 onChange={(e) => setReason(e.target.value as any)}
 className="w-full px-3.5 py-2.5 text-xs font-semibold border border-stone-200 rounded-xl focus:outline-none focus:border-rose-500 bg-white"
 >
 <option value="DEFECTIVE_ITEM">Item Defective / Broken / Not Working</option>
 <option value="NOT_AS_DESCRIBED">Item Significantly Not as Described</option>
 <option value="WRONG_ITEM">Wrong Item / Missing Vital Accessories</option>
 <option value="SELLER_NO_SHOW">Seller Failed to Deliver or Hand Over Item</option>
 <option value="OTHER">Other Serious Violation</option>
 </select>
 </div>

 <div>
 <label className="block font-bold text-stone-700 mb-1">Detailed Explanation</label>
 <textarea
 value={description}
 onChange={(e) => setDescription(e.target.value)}
 rows={3}
 placeholder="Explain the discrepancies or defects discovered upon delivery..."
 className="w-full px-3.5 py-2 text-xs border border-stone-200 rounded-xl focus:outline-none focus:border-rose-500"
 required
 />
 </div>

 <div>
 <label className="block font-bold text-stone-700 mb-1">Photo Evidence Attached</label>
 <div className="flex items-center gap-2">
 {evidenceImages.map((img, idx) => (
 <div key={idx} className="w-14 h-14 rounded-xl overflow-hidden border border-stone-200 relative">
 <img src={img} alt="proof" className="w-full h-full object-cover" />
 </div>
 ))}
 <div className="w-14 h-14 rounded-xl border border-dashed border-stone-300 flex items-center justify-center text-stone-400 bg-stone-50">
 <Upload className="w-4 h-4" />
 </div>
 </div>
 </div>

 <div className="p-3 bg-transparent border border-rose-300 rounded-xl text-[11px] text-rose-800 flex items-start gap-2">
 <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
 <span>
 Raising a dispute instantly freezes escrow funds (<code>DISPUTE_OPEN</code>). Trega mediators will review the submitted proof within 2 hours.
 </span>
 </div>

 <div className="flex gap-3 pt-2">
 <button
 type="button"
 onClick={() => setActiveModal(null)}
 className="flex-1 py-3 px-4 border border-stone-200 hover:bg-stone-50 text-stone-700 font-bold rounded-xl transition-all"
 >
 Cancel
 </button>
 <button
 type="submit"
 disabled={isSubmitting}
 className="flex-[2] py-3 px-4 bg-transparent border border-rose-600 text-rose-700 hover:bg-rose-50 font-bold rounded-xl shadow-sm shadow-rose-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
 >
 {isSubmitting ? (
 <>
 <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
 Submitting Ticket...
 </>
 ) : (
 'Freeze Escrow & Submit Dispute'
 )}
 </button>
 </div>
 </form>
 ) : (
 /* Dispute Ticket Active / Mediation Simulation */
 <div className="space-y-4 text-xs">
 <div className="p-4 bg-transparent border border-rose-300 rounded-2xl">
 <div className="flex items-center justify-between mb-1.5">
 <span className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
 <AlertTriangle className="w-4 h-4 text-rose-600" />
 Ticket #{existingDispute.id}
 </span>
 <span className="text-[10px] font-mono font-extrabold uppercase bg-rose-200 text-rose-900 px-2 py-0.5 rounded-md">
 {existingDispute.status}
 </span>
 </div>
 <p className="text-xs text-rose-800 font-semibold mb-1">Reason: {existingDispute.reason.replace(/_/g, ' ')}</p>
 <p className="text-[11px] text-rose-700 italic">"{existingDispute.description}"</p>
 </div>

 

 <button
 onClick={() => setActiveModal(null)}
 className="w-full py-2.5 px-4 border border-stone-200 hover:bg-stone-50 text-stone-700 font-semibold rounded-xl transition-all text-xs"
 >
 Close
 </button>
 </div>
 )}
 </div>
 </div>
 );
};
