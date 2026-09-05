import React, { useState, useRef, useEffect } from 'react';
import {
 Send,
 Image as ImageIcon,
 MapPin,
 ShieldCheck,
 BadgePercent,
 CheckCircle2,
 XCircle,
 ExternalLink,
 MessageSquare,
 AlertTriangle,
 Lock,
 ChevronLeft,
 Truck,
 Building2,
 RotateCw,
} from 'lucide-react';
import { useMarketplace } from '../../core/context/MarketplaceContext';
import { TrustBadge } from '../kyc/TrustBadge';
import { ChatSkeletonLoader } from './ChatSkeletonLoader';

export const ChatScreen: React.FC = () => {
 const {
 flags,
 conversations,
 messages,
 activeConversationId,
 setActiveConversationId,
 sendMessage,
 currentUser,
 respondToOffer,
 setActiveModal,
 setModalPayload,
 listings,
 offers,
 showToast,
 isChatLoading,
 refreshChatData,
 } = useMarketplace();

 const [inputMessage, setInputMessage] = useState('');
 const [showDeliveryHelper, setShowDeliveryHelper] = useState(false);
 const messagesEndRef = useRef<HTMLDivElement>(null);

 const activeConv = conversations.find((c) => c.id === activeConversationId) || conversations[0];
 const activeListing = listings.find((l) => l.id === activeConv?.listingId);
 const currentMessages = activeConv ? messages[activeConv.id] || [] : [];

 // Find linked offer
 const linkedOffer = offers.find((o) => o.listingId === activeConv?.listingId);
 const offerStatus = activeConv?.offerStatus || linkedOffer?.status || 'PENDING';
 const isMeBuyer = activeConv ? (currentUser ? activeConv.buyerId === currentUser.id : true) : true;
 const isMeSeller = activeConv ? (currentUser ? activeConv.sellerId === currentUser.id : false) : false;

 let isChatLocked = offerStatus !== 'ACCEPTED';
  if (activeListing && activeListing.reservedUntil && activeListing.reservedUntil < Date.now()) {
    // If the 12-hour reservation has expired, the offer is essentially discarded
    isChatLocked = true;
  }

 useEffect(() => {
 messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
 }, [currentMessages.length, activeConversationId]);

 // Fallback when Chat is disabled per PRD
 if (false) {
 return (
 <div className="max-w-4xl mx-auto px-4 py-8">
 <div className="bg-white rounded-3xl p-8 border border-stone-200 shadow-sm text-center">
 <div className="w-14 h-14 rounded-2xl bg-transparent border border-amber-300 text-amber-600 flex items-center justify-center mx-auto mb-4">
 <MessageSquare className="w-7 h-7" />
 </div>
 <div className="inline-block px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg text-xs font-mono font-bold mb-3">
 FEATURE_CHAT_ENABLED: false
 </div>
 <h3 className="text-xl font-bold text-stone-900 font-display mb-2">
 In-App Messaging Service Suspended
 </h3>
 <p className="text-sm text-stone-600 mb-6 max-w-md mx-auto leading-relaxed">
 Direct chat threads are currently isolated via runtime feature flag. Please use the WhatsApp direct contact fallback below to reach local sellers.
 </p>
 {activeConv && (
 <button
 onClick={() => {
 const cleanPhone = '919823045612';
 window.open(
 `https://wa.me/${cleanPhone}?text=Hi!%20I%20am%20interested%20in%20your%20Trega%20Local Area%20listing:%20${encodeURIComponent(
 activeConv.listingTitle
 )}`,
 '_blank'
 );
 }}
 className="py-3 px-6 bg-transparent border border-brand-600 text-brand-700 hover:bg-brand-50 font-bold text-xs rounded-xl transition-all shadow-sm inline-flex items-center gap-2"
 >
 <ExternalLink className="w-4 h-4" />
 <span>Contact Seller on WhatsApp</span>
 </button>
 )}
 </div>
 </div>
 );
 }

 const handleSend = (e: React.FormEvent) => {
 e.preventDefault();
 if (!inputMessage.trim() || !activeConv) return;
 if (isChatLocked) {
 showToast('Chat is locked until the seller accepts the offer.');
 return;
 }
 sendMessage(activeConv.id, inputMessage.trim());
 setInputMessage('');
 };

 const handleShareDeliveryAddress = (addressStr: string) => {
 if (!activeConv) return;
 sendMessage(activeConv.id, `delivery Address: ${addressStr}`, {
 isLocationShare: true,
 sharedLocation: addressStr,
 });
 setShowDeliveryHelper(false);
 showToast(`Shared delivery location`);
 };

 const handleAcceptOfferQuick = () => {
 if (linkedOffer) {
 respondToOffer(linkedOffer.id, 'ACCEPTED');
 } else if (activeConv?.offerId) {
 respondToOffer(activeConv.offerId, 'ACCEPTED');
 } else {
 showToast('Offer accepted! Chat unlocked.');
 }
 };

 const handleRejectOfferQuick = () => {
 if (linkedOffer) {
 respondToOffer(linkedOffer.id, 'REJECTED');
 } else if (activeConv?.offerId) {
 respondToOffer(activeConv.offerId, 'REJECTED');
 } else {
 showToast('Offer declined.');
 }
 };

 const handleSendImageMock = () => {
 if (!activeConv) return;
 if (isChatLocked) {
 showToast('Chat is locked until the seller accepts the offer.');
 return;
 }
 sendMessage(activeConv.id, 'Shared item condition photo', {
 imageUrl: 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=800&auto=format&fit=crop&q=80',
 });
 showToast('Sent photo attachment to chat');
 };

 if (isChatLoading) {
 return <ChatSkeletonLoader />;
 }

 if (conversations.length === 0) {
 return (
 <div className="max-w-4xl mx-auto px-4 py-16 text-center">
 <div className="w-14 h-14 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-stone-400">
 <MessageSquare className="w-7 h-7" />
 </div>
 <h3 className="text-base font-bold text-stone-900 mb-1">No Active Chat Threads</h3>
 <p className="text-xs text-stone-500 max-w-sm mx-auto">
 Make an offer on any marketplace listing. Once the seller accepts, you can chat directly to coordinate delivery.
 </p>
 </div>
 );
 }

 return (
 <div className="max-w-6xl mx-auto px-4 py-4 sm:py-6 h-[calc(100vh-140px)] min-h-[550px]">
 <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden h-full flex flex-col md:flex-row">
 {/* Left: Conversations List */}
 <div className="w-full md:w-80 border-r border-stone-100 flex flex-col h-1/3 md:h-full bg-stone-50">
 <div className="p-4 border-b border-stone-100 bg-white flex items-center justify-between">
 <div>
 <h2 className="text-sm font-extrabold text-stone-900 font-display">Conversations</h2>
 <p className="text-[11px] text-stone-400">Unlocked upon seller offer acceptance</p>
 </div>
 <button
 type="button"
 id="refresh-chat-btn"
 onClick={() => refreshChatData()}
 disabled={isChatLoading}
 className="p-1.5 hover:bg-stone-100 rounded-lg text-stone-400 hover:text-brand-600 transition-colors cursor-pointer"
 title="Re-sync messages"
 >
 <RotateCw className={`w-3.5 h-3.5 ${isChatLoading ? 'animate-spin' : ''}`} />
 </button>
 </div>

 <div className="flex-1 overflow-y-auto divide-y divide-stone-100">
 {conversations.map((c) => {
 const isSelected = c.id === activeConv?.id;
 const isPending = c.offerStatus === 'PENDING';
 const isRejected = c.offerStatus === 'REJECTED';
 return (
 <button
 key={c.id}
 onClick={() => setActiveConversationId(c.id)}
 className={`w-full p-3.5 text-left flex items-center gap-3 transition-colors cursor-pointer ${
 isSelected ? 'bg-brand-50 border-l-4 border-brand-600' : 'hover:bg-stone-100'
 }`}
 >
 <img
 src={c.sellerAvatar || c.listingImage}
 alt={c.sellerName}
 className="w-11 h-11 rounded-2xl object-cover border border-stone-200 shrink-0"
 />
 <div className="flex-1 min-w-0">
 <div className="flex items-center justify-between mb-0.5">
 <span className="text-xs font-bold text-stone-900 truncate">{c.sellerName}</span>
 <span className="text-[10px] text-stone-400 shrink-0">{c.lastMessageTime}</span>
 </div>
 <p className="text-[11px] font-bold text-brand-600 truncate mb-0.5 font-display flex items-center gap-1">
 <span className="truncate">{c.listingTitle}</span>
 {isPending && (
 <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded shrink-0">
 Offer Pending
 </span>
 )}
 {isRejected && (
 <span className="text-[9px] bg-red-100 text-red-800 font-bold px-1.5 py-0.5 rounded shrink-0">
 Declined
 </span>
 )}
 </p>
 <p className="text-[11px] text-stone-500 truncate">{c.lastMessage}</p>
 </div>
 </button>
 );
 })}
 </div>
 </div>

 {/* Right: Active Chat Thread */}
 {activeConv ? (
 <div className="flex-1 flex flex-col h-2/3 md:h-full bg-white">
 {/* Chat Header */}
 <div className="p-3.5 sm:p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50">
 <div className="flex items-center gap-3 min-w-0">
 <img
 src={activeConv.sellerAvatar}
 alt={activeConv.sellerName}
 className="w-10 h-10 rounded-full object-cover border border-stone-200"
 />
 <div className="min-w-0">
 <div className="flex items-center gap-1.5">
 <h3 className="text-xs sm:text-sm font-bold text-stone-900 truncate">{activeConv.sellerName}</h3>
 <TrustBadge isVerified={true} kycType="STUDENT_ID" size="sm" />
 </div>
 <p className="text-[11px] text-stone-500 truncate flex items-center gap-1">
 <span>Item: <strong className="text-stone-800">{activeConv.listingTitle}</strong></span>
 <span className="text-brand-600 font-bold">• delivery</span>
 </p>
 </div>
 </div>

 {/* Action: Checkout / Escrow */}
 {activeListing && flags.isCheckoutEnabled && !isChatLocked && activeListing.reservedUntil && activeListing.reservedUntil > Date.now() && (
 <button
 type="button"
 onClick={() => {
 setModalPayload({
 ...activeListing,
 price: activeConv.offeredPrice || activeListing.price,
 });
 setActiveModal('CHECKOUT');
 }}
 className="px-3.5 py-1.5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
 >
 <Truck className="w-3.5 h-3.5" />
 <span className="hidden sm:inline">Order Delivery</span>
 <span>₹{activeConv.offeredPrice || activeListing.price}</span>
 </button>
 )}
 </div>

 {/* Offer Gating Lock Banner */}
 {isChatLocked && (
 <div className={`${offerStatus === 'REJECTED' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'} border-b p-3 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5`}>
 <div className="flex items-start gap-2.5">
 <div className={`w-7 h-7 rounded-lg ${offerStatus === 'REJECTED' ? 'bg-red-200 text-red-800' : 'bg-amber-200 text-amber-800'} flex items-center justify-center shrink-0 mt-0.5`}>
 <Lock className="w-4 h-4" />
 </div>
 <div>
 <h4 className={`text-xs font-bold ${offerStatus === 'REJECTED' ? 'text-red-950' : 'text-amber-950'}`}>
 {offerStatus === 'REJECTED' ? 'Offer Rejected' : `Offer Proposal Pending (₹${activeConv.offeredPrice || activeConv.listingPrice})`}
 </h4>
 <p className={`text-[11px] ${offerStatus === 'REJECTED' ? 'text-red-800' : 'text-amber-800'}`}>
 {offerStatus === 'REJECTED' 
 ? 'This offer was declined. Chat remains locked.'
 : isMeSeller
 ? `A buyer sent an offer of ₹${activeConv.offeredPrice || activeConv.listingPrice}. Accept to unlock chat.`
 : `Chat is locked until ${activeConv.sellerName} accepts your offer of ₹${activeConv.offeredPrice || activeConv.listingPrice}.`}
 </p>
 </div>
 </div>

 {/* Seller Quick Response */}
 {offerStatus === 'PENDING' && (
 <div className="flex items-center gap-2 shrink-0">
 <button
 type="button"
 onClick={handleAcceptOfferQuick}
 className="py-1.5 px-3.5 bg-transparent border border-emerald-600 text-emerald-700 hover:bg-emerald-50 text-xs font-bold rounded-lg transition-all shadow-xs cursor-pointer flex items-center gap-1"
 >
 <CheckCircle2 className="w-3.5 h-3.5" />
 <span>Accept Offer (Unlock Chat)</span>
 </button>
 <button
 type="button"
 onClick={handleRejectOfferQuick}
 className="py-1.5 px-3 bg-stone-200 hover:bg-rose-100 text-stone-700 hover:text-rose-700 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1"
 >
 <XCircle className="w-3.5 h-3.5" />
 <span>Decline</span>
 </button>
 </div>
 )}
 </div>
 )}

 {/* Messages Scroll Area */}
 <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-stone-50">
 {currentMessages.map((msg) => {
 const isMe = msg.senderId === (currentUser?.id || 'user_me');

 if (msg.isSystem) {
 return (
 <div key={msg.id} className="text-center my-3">
 <div className="inline-block bg-transparent border border-brand-300 text-brand-900 text-[11px] px-3.5 py-1.5 rounded-full max-w-md font-medium">
 {msg.text}
 </div>
 </div>
 );
 }

 return (
 <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
 <div
 className={`max-w-[85%] sm:max-w-md rounded-2xl p-3 text-xs leading-relaxed shadow-2xs ${
 isMe
 ? 'bg-brand-600 text-white rounded-br-xs'
 : 'bg-white border border-stone-200 text-stone-800 rounded-bl-xs'
 }`}
 >
 {/* Offer card inside chat */}
 {msg.isOfferCard && msg.offerDetails && (
 <div className="mb-2 p-2.5 bg-black border border-white rounded-xl">
 <div className="flex items-center justify-between text-xs font-bold mb-1">
 <span className="flex items-center gap-1">
 <BadgePercent className="w-3.5 h-3.5 text-brand-300" />
 Offer Proposal
 </span>
 <span className="text-brand-300 font-display text-sm font-extrabold">
 ₹{msg.offerDetails.amount}
 </span>
 </div>
 <p className="text-[10px] opacity-80 mb-2">
 Status: <strong className="uppercase">{msg.offerDetails.status}</strong>
 </p>
 {msg.offerDetails.status === 'PENDING' ? (
 <div className="flex items-center gap-1.5">
 <button
 onClick={handleAcceptOfferQuick}
 className="flex-1 py-1.5 bg-transparent border border-emerald-600 text-emerald-700 hover:bg-emerald-50 text-[11px] font-bold rounded-lg transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1"
 >
 <CheckCircle2 className="w-3 h-3" />
 <span>Accept (₹{msg.offerDetails.amount})</span>
 </button>
 <button
 onClick={handleRejectOfferQuick}
 className="py-1.5 px-2 bg-stone-800 hover:bg-rose-900 text-stone-200 hover:text-white text-[11px] font-bold rounded-lg transition-all cursor-pointer"
 >
 Decline
 </button>
 </div>
 ) : (
 activeListing && flags.isCheckoutEnabled && activeListing.reservedUntil && activeListing.reservedUntil > Date.now() && (
 activeListing.isSold ? (
 <div className="w-full py-1.5 bg-stone-100 text-stone-600 text-[11px] font-bold rounded-lg border border-stone-200 text-center">
 Item Sold Out
 </div>
 ) : (
 <button
 onClick={() => {
 setModalPayload({
 ...activeListing,
 price: msg.offerDetails!.amount,
 });
 setActiveModal('CHECKOUT');
 }}
 className="w-full py-1.5 bg-brand-500 hover:bg-brand-600 text-white text-[11px] font-bold rounded-lg transition-all cursor-pointer shadow-xs"
 >
 Order with delivery (₹{msg.offerDetails.amount})
 </button>
 )
 )
 )}
 </div>
 )}

 {/* Location Spot Card */}
 {msg.isLocationShare && msg.sharedLocation && (
 <div className="mb-2 p-2.5 bg-black border border-white rounded-xl flex items-start gap-2">
 <Truck className="w-4 h-4 text-brand-300 shrink-0 mt-0.5" />
 <div>
 <p className="text-[10px] font-bold uppercase tracking-wider text-brand-300">
 Local Area Locality Delivery Address
 </p>
 <p className="text-xs font-bold mt-0.5">{msg.sharedLocation}</p>
 </div>
 </div>
 )}

 {/* Photo Attachment */}
 {msg.imageUrl && (
 <div className="mb-2 rounded-xl overflow-hidden border border-stone-300">
 <img src={msg.imageUrl} alt="attachment" className="w-full h-auto max-h-48 object-cover" />
 </div>
 )}

 <p>{msg.text}</p>
 </div>
 <span className="text-[10px] text-stone-400 mt-1 px-1">{msg.timestamp}</span>
 </div>
 );
 })}
 <div ref={messagesEndRef} />
 </div>

 {/* Quick Delivery Helper Popover */}
 {showDeliveryHelper && (
 <div className="p-3 bg-brand-50 border-t border-brand-200 text-xs">
 <div className="flex items-center justify-between mb-2">
 <span className="font-bold text-brand-950 flex items-center gap-1">
 <Truck className="w-3.5 h-3.5 text-brand-600" />
 Share Locality Delivery Address with Seller
 </span>
 <button
 onClick={() => setShowDeliveryHelper(false)}
 className="text-[10px] text-stone-400 hover:text-stone-700 cursor-pointer"
 >
 Close
 </button>
 </div>
 <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
 {[
 'Flat 402, Rohan Heights, Shivajinagar',
 'Society Gate Reception, Kothrud',
 'Near Ferguson College Road Junction',
 'Building B, Tech Park Road, Baner',
 ].map((addr) => (
 <button
 key={addr}
 type="button"
 onClick={() => handleShareDeliveryAddress(addr)}
 className="text-[11px] font-medium bg-white hover:bg-brand-100 text-stone-800 px-2.5 py-1 rounded-lg border border-brand-200 transition-all text-left cursor-pointer"
 >
 {addr}
 </button>
 ))}
 </div>
 </div>
 )}

 {/* Input Bar */}
 <form onSubmit={handleSend} className="p-3 sm:p-4 border-t border-stone-100 bg-white flex items-center gap-2">
 <button
 type="button"
 disabled={isChatLocked}
 onClick={() => setShowDeliveryHelper(!showDeliveryHelper)}
 className="p-2.5 rounded-xl text-stone-500 hover:text-brand-600 hover:bg-brand-50 transition-colors cursor-pointer disabled:opacity-40"
 title="Share delivery address"
 >
 <Truck className="w-4 h-4" />
 </button>
 <button
 type="button"
 disabled={isChatLocked}
 onClick={handleSendImageMock}
 className="p-2.5 rounded-xl text-stone-500 hover:text-brand-600 hover:bg-brand-50 transition-colors cursor-pointer disabled:opacity-40"
 title="Send photo attachment"
 >
 <ImageIcon className="w-4 h-4" />
 </button>

 <input
 type="text"
 disabled={isChatLocked}
 value={inputMessage}
 onChange={(e) => setInputMessage(e.target.value)}
 placeholder={
 isChatLocked
 ? 'Chat is locked. Waiting for seller to accept offer...'
 : 'Type a message to coordinate delivery...'
 }
 className="flex-1 px-4 py-2.5 text-xs sm:text-sm border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:bg-stone-100 disabled:text-stone-400"
 />

 <button
 type="submit"
 disabled={isChatLocked || !inputMessage.trim()}
 className="p-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white rounded-2xl shadow-xs transition-all cursor-pointer"
 >
 <Send className="w-4 h-4" />
 </button>
 </form>
 </div>
 ) : null}
 </div>
 </div>
 );
};
