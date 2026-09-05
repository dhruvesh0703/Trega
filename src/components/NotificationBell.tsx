import { formatDistanceToNow } from 'date-fns';
import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, X, Tag, CheckCircle2, AlertCircle } from 'lucide-react';
import { useMarketplace } from '../core/context/MarketplaceContext';
import { requestFCMPermission } from '../lib/fcm';

export const NotificationBell: React.FC = () => {
 const {
 currentUser,
 notifications,
 unreadNotificationCount,
 markNotificationAsRead,
 clearAllNotifications,
 showToast,
 setActiveModal,
   setModalPayload, filteredListings, listings, offers } = useMarketplace();

 const [isOpen, setIsOpen] = useState(false);
 const [pushStatus, setPushStatus] = useState<NotificationPermission>(
 typeof window !== 'undefined' && 'Notification' in window
 ? Notification.permission
 : 'default'
 );

 const dropdownRef = useRef<HTMLDivElement>(null);

 useEffect(() => {
 const handleClickOutside = (event: MouseEvent) => {
 if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
 setIsOpen(false);
 }
 };
 document.addEventListener('mousedown', handleClickOutside);
 return () => document.removeEventListener('mousedown', handleClickOutside);
 }, []);

 const handleEnablePush = async () => {
 const token = await requestFCMPermission(currentUser?.id);
 if (token) {
 setPushStatus('granted');
 showToast('Push notifications enabled! You will get instant alerts for offers.');
 } else {
 setPushStatus(typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'denied');
 showToast('Notice: Notification permission was not granted or blocked.');
 }
 };

 return (
 <div className="relative" ref={dropdownRef}>
 <button
 type="button"
 id="header-notification-bell-btn"
 onClick={() => setIsOpen(!isOpen)}
 className="relative flex items-center justify-center text-stone-700 w-full h-full"
 title="Notifications & Alerts"
 >
 <Bell className="w-5 h-5" />
 {unreadNotificationCount > 0 && (
          <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-red-500 border border-white" />
        )}
 </button>

 {isOpen && (
 <div className="fixed top-16 right-4 left-4 sm:absolute sm:top-auto sm:right-0 sm:left-auto sm:mt-2 sm:w-96 bg-white rounded-2xl shadow-xl border border-stone-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
 <div className="p-3.5 bg-white text-stone-900 border-b border-stone-100 flex items-center justify-between">
 <div className="flex items-center gap-2">
 <Bell className="w-4 h-4 text-brand-700" />
 <h3 className="font-extrabold text-xs tracking-tight">Notifications</h3>
 {unreadNotificationCount > 0 && (
 <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-600 text-white">
 {unreadNotificationCount} New
 </span>
 )}
 </div>
 {notifications.length > 0 && (
 <button
 type="button"
 onClick={clearAllNotifications}
 className="text-[11px] font-semibold text-stone-500 hover:text-brand-700 transition"
 >
 Clear All
 </button>
 )}
 </div>

 {/* FCM Push Permission Banner */}
 {pushStatus !== 'granted' && (
 <div className="p-3 bg-brand-50 border-b border-brand-200 flex items-center justify-between gap-2">
 <div className="flex items-center gap-2 text-xs font-semibold text-brand-900">
 <AlertCircle className="w-4 h-4 text-brand-700 shrink-0" />
 <span>Enable Browser Push Alerts for new offers</span>
 </div>
 <button
 type="button"
 onClick={handleEnablePush}
 className="px-2.5 py-1 bg-transparent border border-brand-700 text-brand-800 hover:bg-brand-50 text-[11px] font-extrabold rounded-lg shrink-0 transition"
 >
 Enable 
 </button>
 </div>
 )}

 {/* Notification List */}
 <div className="max-h-80 overflow-y-auto divide-y divide-stone-100">
 {notifications.length === 0 ? (
 <div className="py-8 px-4 text-center text-stone-500">
 <Bell className="w-8 h-8 text-stone-300 mx-auto mb-2" />
 <p className="text-xs font-bold text-stone-700">No notifications yet</p>
 <p className="text-[11px] text-stone-500 mt-0.5">
 You'll be notified here when buyers send offers or sellers accept your offers.
 </p>
 </div>
 ) : (
 notifications.map((notif) => {
 const isOfferType = notif.data?.type === 'NEW_OFFER';
 const isAcceptType = notif.data?.type === 'OFFER_ACCEPTED';

 return (
 <div
 key={notif.id}
 onClick={() => {
                  markNotificationAsRead(notif.id);
                  setIsOpen(false);
                  const type = notif.data?.type;
                  const listingId = notif.data?.listingId;
                  if (!listingId) return;
                  
                  const targetListing = listings.find((l) => l.id === listingId);
                  if (!targetListing) {
                    showToast('Listing no longer available.');
                    return;
                  }
                  
                  if (type === 'NEW_OFFER' || type === 'OFFER_REJECTED') {
                    setModalPayload(targetListing);
                    setActiveModal('MAKE_OFFER');
                  } else if (type === 'OFFER_ACCEPTED') {
                    const targetOffer = offers.find((o) => o.id === notif.data?.offerId);
                    setModalPayload({
                      ...targetListing,
                      price: notif.data?.offeredPrice || targetOffer?.offeredPrice || targetListing.price,
                      acceptedOffer: targetOffer || undefined
                    });
                    setActiveModal('CHECKOUT');
                  }
                }}
 className={`p-3 text-left hover:bg-stone-50 transition cursor-pointer flex items-start gap-3 ${
 !notif.read ? 'bg-brand-50' : ''
 }`}
 >
 <div className="shrink-0 mt-0.5">
 {isOfferType ? (
 <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
 <Tag className="w-3.5 h-3.5" />
 </div>
 ) : isAcceptType ? (
 <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
 <CheckCircle2 className="w-3.5 h-3.5" />
 </div>
 ) : (
 <div className="w-7 h-7 rounded-full bg-stone-100 text-stone-700 flex items-center justify-center font-bold">
 <Bell className="w-3.5 h-3.5" />
 </div>
 )}
 </div>

 <div className="flex-1 min-w-0">
 <div className="flex items-center justify-between gap-2">
 <h4 className="text-xs font-extrabold text-stone-900 truncate">
 {notif.title}
 </h4>
 <span className="text-[10px] font-medium text-stone-400 shrink-0">
 {notif.createdAt ? (isNaN(new Date(notif.createdAt).getTime()) ? notif.createdAt : formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })) : 'Now'}
 </span>
 </div>
 <p className="text-[11px] text-stone-600 mt-0.5 line-clamp-2 leading-relaxed">
 {notif.body}
 </p>
 </div>

 {!notif.read && (
 <span className="w-2 h-2 rounded-full bg-brand-600 shrink-0 mt-2" />
 )}
 </div>
 );
 })
 )}
 </div>
 </div>
 )}
 </div>
 );
};
