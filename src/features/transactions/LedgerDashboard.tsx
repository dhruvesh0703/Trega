import React, { useState, useEffect } from 'react';
import {
  Lock,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  ReceiptText,
  Truck,
  ShieldAlert,
  Zap,
  FileCheck2,
  BadgePercent,
  Check,
  XCircle,
  ChevronDown
} from 'lucide-react';
import { useMarketplace } from '../../core/context/MarketplaceContext';
import { TransactionOrder, EscrowStatus } from '../../types';
import { jsPDF } from 'jspdf';
import { WidgetErrorBoundary } from '../../components/ErrorBoundary';

const generateInvoice = (order: TransactionOrder) => {
  const doc = new jsPDF();
  
  doc.setFontSize(22);
  doc.setTextColor(40, 40, 40);
  doc.text('TREGA ESCROW INVOICE', 105, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Order ID: ${order.id}`, 20, 40);
  doc.text(`Date: ${order.createdAt}`, 20, 46);
  
  doc.setDrawColor(200, 200, 200);
  doc.line(20, 52, 190, 52);
  
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text('Buyer Details', 20, 62);
  doc.text('Seller Details', 120, 62);
  
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text(`Name: ${order.buyerName}`, 20, 70);
  if (order.deliveryAddress) {
    doc.text(`Delivery Address:`, 20, 76);
    doc.text(`${order.deliveryAddress}`, 20, 82);
    doc.text(`${order.deliveryHostelOrRoom}`, 20, 88);
  }
  
  doc.text(`Name: ${order.sellerName}`, 120, 70);
  
  doc.line(20, 98, 190, 98);
  
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text('Item Description', 20, 108);
  doc.text('Amount', 170, 108, { align: 'right' });
  
  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);
  
  const basePrice = Math.round(order.amount - (order.deliveryFee || 100) / 2 - (order.platformFee || 0) / 2);
  const buyerDelFee = (order.deliveryFee || 100) / 2;
  const buyerPlatFee = (order.platformFee || 0) / 2;
  const sellerPayout = order.sellerPayout || basePrice - buyerDelFee - buyerPlatFee;

  doc.text(`${order.listingTitle} (Base Price)`, 20, 118);
  doc.text(`Rs. ${basePrice.toLocaleString('en-IN')}`, 170, 118, { align: 'right' });
  
  doc.text('Platform Fee', 20, 126);
  doc.text(`Rs. ${buyerPlatFee.toLocaleString('en-IN')}`, 170, 126, { align: 'right' });
  
  doc.text('Delivery Charge', 20, 134);
  doc.text(`Rs. ${buyerDelFee.toLocaleString('en-IN')}`, 170, 134, { align: 'right' });
  
  doc.line(20, 142, 190, 142);
  
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('Total Amount Paid:', 100, 154);
  doc.text(`Rs. ${order.amount.toLocaleString('en-IN')}`, 170, 154, { align: 'right' });
  
  doc.setFontSize(12);
  doc.setTextColor(20, 160, 80);
  doc.text('Net Seller Payout:', 100, 164);
  doc.text(`Rs. ${sellerPayout.toLocaleString('en-IN')}`, 170, 164, { align: 'right' });

  
  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  doc.text('This is a computer-generated receipt for the escrow transaction.', 105, 270, { align: 'center' });
  doc.text('Thank you for using Trega.', 105, 276, { align: 'center' });
  
  doc.save(`Trega_Invoice_${order.id}.pdf`);
};

export const LedgerDashboard: React.FC = () => {
  const {
    flags,
    orders,
    offers,
    listings,
    respondToOffer,
    markAsSold, reserveListing,
    showToast,
    currentUser,
    releaseEscrowToSeller,
    autoRelease24Hours,
    setActiveModal,
    setModalPayload,
  } = useMarketplace();

  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'PAST' | 'OFFERS'>('ACTIVE');
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  
  // Memoized Debounced State
  const [debouncedOrders, setDebouncedOrders] = useState<TransactionOrder[]>([]);
  const [debouncedOffers, setDebouncedOffers] = useState<any[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  useEffect(() => {
    setIsDataLoading(true);
    const debounceTimer = setTimeout(() => {
      setDebouncedOrders(orders);
      setDebouncedOffers(offers);
      setIsDataLoading(false);
    }, 450); // Debounce to prevent UI thrashing on stream updates

    return () => clearTimeout(debounceTimer);
  }, [orders, offers]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 15000);
    return () => clearInterval(timer);
  }, []);

  const handleAcceptOffer = (offerId: string, listingId: string, price: number, buyerId: string, buyerName: string) => {
    const listing = listings.find((l) => l.id === listingId);
    if (!listing) return;
    respondToOffer(offerId, 'ACCEPTED');
    reserveListing(listingId, buyerId);
    showToast(`Offer of ₹${price} accepted! The item is reserved for 12 hours for the buyer to complete checkout.`);
  };

  const handleDeclineOffer = (offerId: string) => {
    respondToOffer(offerId, 'REJECTED');
    showToast('Offer declined');
  };

  const outgoingOffers = debouncedOffers.filter((off) => currentUser && off.buyerId === currentUser.id);
  const incomingOffers = debouncedOffers.filter((off) => {
    const listing = listings.find((l) => l.id === off.listingId);
    return listing && (!currentUser || listing.seller.id === currentUser.id || listing.seller.name === currentUser.name);
  });

  const activeOrders = debouncedOrders.filter(o => !['PAYOUT_COMPLETED', 'DEAL_CLOSED', 'REFUNDED'].includes(o.escrowStatus));
  const pastOrders = debouncedOrders.filter(o => ['PAYOUT_COMPLETED', 'DEAL_CLOSED', 'REFUNDED'].includes(o.escrowStatus));
  const displayOrders = activeTab === 'ACTIVE' ? activeOrders : pastOrders;

  const statusBadges: Record<EscrowStatus, { label: string; bg: string; text: string; icon: React.FC<{ className?: string }> }> = {
    PENDING_SETTLEMENT: { label: 'Pending Settlement', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', icon: Clock },
    HELD_IN_ESCROW: { label: 'In Escrow', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', icon: Lock },
    DELIVERY_CONFIRMED: { label: 'Delivered', bg: 'bg-teal-50 border-teal-200', text: 'text-teal-700', icon: CheckCircle2 },
    PAYOUT_COMPLETED: { label: 'Deal Closed', bg: 'bg-brand-50 border-brand-200', text: 'text-brand-700', icon: CheckCircle2 },
    DEAL_CLOSED: { label: 'Deal Closed', bg: 'bg-stone-100 border-stone-300', text: 'text-stone-700', icon: FileCheck2 },
    DISPUTE_OPEN: { label: 'Dispute Open', bg: 'bg-rose-50 border-rose-200', text: 'text-rose-700', icon: AlertTriangle },
    REFUNDED: { label: 'Refunded', bg: 'bg-purple-50 border-purple-200', text: 'text-purple-700', icon: ShieldCheck },
  };

  const handleRaiseDispute = (order: TransactionOrder) => {
    setModalPayload(order);
    setActiveModal('DISPUTE');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 font-display flex items-center gap-2">
            <ReceiptText className="w-6 h-6 text-brand-600" />
            My Orders
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Manage your purchases, sales, and offers. Escrow payments release 24 hours after delivery.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 border-b border-stone-200 pb-px mb-4">
        <button 
          onClick={() => setActiveTab('ACTIVE')} 
          className={`pb-3 px-1 text-sm font-bold border-b-2 transition-colors ${activeTab === 'ACTIVE' ? 'border-brand-600 text-brand-700' : 'border-transparent text-stone-500 hover:text-stone-700'}`}
        >
          Active Orders {activeOrders.length > 0 && !isDataLoading && <span className="ml-1 text-xs text-stone-400">({activeOrders.length})</span>}
        </button>
        <button 
          onClick={() => setActiveTab('PAST')} 
          className={`pb-3 px-1 text-sm font-bold border-b-2 transition-colors ${activeTab === 'PAST' ? 'border-brand-600 text-brand-700' : 'border-transparent text-stone-500 hover:text-stone-700'}`}
        >
          Past Orders
        </button>
        <button 
          onClick={() => setActiveTab('OFFERS')} 
          className={`pb-3 px-1 text-sm font-bold border-b-2 transition-colors ${activeTab === 'OFFERS' ? 'border-brand-600 text-brand-700' : 'border-transparent text-stone-500 hover:text-stone-700'}`}
        >
          Offers
          {(incomingOffers.length > 0 || outgoingOffers.length > 0) && !isDataLoading && <span className="ml-1.5 bg-brand-100 text-brand-700 py-0.5 px-2 rounded-full text-[10px]">{incomingOffers.length + outgoingOffers.length}</span>}
        </button>
      </div>

      {isDataLoading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
          <div className="w-8 h-8 border-4 border-stone-200 border-t-brand-600 rounded-full animate-spin"></div>
          <p className="text-xs font-bold text-stone-500 animate-pulse">Syncing transactions...</p>
        </div>
      ) : activeTab === 'OFFERS' ? (
        <div className="space-y-6">
          {incomingOffers.length === 0 && outgoingOffers.length === 0 ? (
            <div className="text-center py-10 bg-white border border-stone-200 rounded-2xl">
              <BadgePercent className="w-8 h-8 text-stone-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-stone-500">No active offers</p>
            </div>
          ) : (
            <>
              {/* Outgoing Offers (Offers Made) */}
              {outgoingOffers.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-stone-800">Offers You Made</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {outgoingOffers.map((off) => {
                      const listing = listings.find((l) => l.id === off.listingId);
                      const isExpired = listing?.reservedUntil && listing.reservedUntil < Date.now() && off.status === 'ACCEPTED';
                      const isAccepted = off.status === 'ACCEPTED' && !isExpired;
                      const isRejected = off.status === 'REJECTED';
                      const isPending = off.status === 'PENDING';
                      
                      const handleCheckout = () => {
                        if (listing && isAccepted) {
                           setModalPayload({
                              ...listing,
                              price: off.offeredPrice,
                              acceptedOffer: off
                           });
                           setActiveModal('CHECKOUT');
                        }
                      };

                      return (
                        <WidgetErrorBoundary key={off.id}>
                          <div className="p-4 bg-white rounded-2xl border border-stone-200 space-y-3 shadow-sm">
                            <div className="flex items-start gap-3">
                              {listing?.images[0] && (
                                <img src={listing.images[0]} alt={listing?.title} className="w-12 h-12 rounded-xl object-cover border border-stone-200 shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <h4 className="text-xs font-bold text-stone-900 truncate">{listing?.title || 'Marketplace Item'}</h4>
                                <p className="text-[11px] text-stone-500 mt-0.5">Offer to <strong>{listing?.seller?.name || 'Seller'}</strong> • {off.createdAt}</p>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="text-sm font-extrabold text-brand-700 block">₹{off.offeredPrice.toLocaleString('en-IN')}</span>
                                {listing && <span className="text-[10px] text-stone-500 block">Listed: ₹{listing.price.toLocaleString('en-IN')}</span>}
                              </div>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                              <div>
                                {isAccepted ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Offer Accepted
                                  </span>
                                ) : isRejected ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-lg">
                                    <XCircle className="w-3.5 h-3.5" /> Declined
                                  </span>
                                ) : (
                                  <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-lg">Pending Review</span>
                                )}
                              </div>
                              {isAccepted && !isExpired && (
                                <button onClick={handleCheckout} className="px-3.5 py-1.5 bg-brand-600 text-white hover:bg-brand-700 text-xs font-bold rounded-xl transition-all cursor-pointer">
                                  Pay & Order
                                </button>
                              )}
                            </div>
                          </div>
                        </WidgetErrorBoundary>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Incoming Offers (Offers Received) */}
              {incomingOffers.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-stone-800">Offers Received</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {incomingOffers.map((off) => {
                      const listing = listings.find((l) => l.id === off.listingId);
                      const isExpired = listing?.reservedUntil && listing.reservedUntil < Date.now() && off.status === 'ACCEPTED';
                      const isAccepted = off.status === 'ACCEPTED' && !isExpired;
                      const isRejected = off.status === 'REJECTED';
                      const isPending = off.status === 'PENDING';
                      return (
                        <WidgetErrorBoundary key={off.id}>
                          <div className="p-4 bg-white rounded-2xl border border-stone-200 space-y-3 shadow-sm">
                            <div className="flex items-start gap-3">
                              {listing?.images[0] && (
                                <img src={listing.images[0]} alt={listing.title} className="w-12 h-12 rounded-xl object-cover border border-stone-200 shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <h4 className="text-xs font-bold text-stone-900 truncate">{listing?.title || 'Marketplace Item'}</h4>
                                <p className="text-[11px] text-stone-500 mt-0.5">Offer from <strong>{off.buyerName}</strong> • {off.createdAt}</p>
                                <p className="text-[11px] text-stone-600 italic mt-1 line-clamp-1">"{off.message || 'No custom note attached'}"</p>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="text-sm font-extrabold text-brand-700 block">₹{off.offeredPrice.toLocaleString('en-IN')}</span>
                                {listing && <span className="text-[10px] text-stone-500 block">Listed: ₹{listing.price.toLocaleString('en-IN')}</span>}
                              </div>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                              <div>
                                {isAccepted ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Accepted
                                  </span>
                                ) : isRejected ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-lg">
                                    <XCircle className="w-3.5 h-3.5" /> Declined
                                  </span>
                                ) : (
                                  <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-lg">Pending Review</span>
                                )}
                              </div>
                              {isPending && (
                                <div className="flex items-center gap-2">
                                  <button onClick={() => handleDeclineOffer(off.id)} className="px-3 py-1.5 hover:bg-stone-100 text-stone-600 text-xs font-bold rounded-xl transition-all cursor-pointer">Decline</button>
                                  <button onClick={() => handleAcceptOffer(off.id, off.listingId, off.offeredPrice, off.buyerId, off.buyerName)} className="px-3.5 py-1.5 bg-brand-50 text-brand-700 hover:bg-brand-100 text-xs font-bold rounded-xl transition-all cursor-pointer">Accept Offer</button>
                                </div>
                              )}
                            </div>
                          </div>
                        </WidgetErrorBoundary>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      ) : (activeTab === 'ACTIVE' || activeTab === 'PAST') ? (
        <div className="space-y-4">
          {displayOrders.length === 0 ? (
            <div className="text-center py-10 bg-white border border-stone-200 rounded-2xl">
              <ReceiptText className="w-8 h-8 text-stone-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-stone-500">No {activeTab.toLowerCase()} orders found.</p>
            </div>
          ) : (
            displayOrders.map((order) => {
              if (order.amount === undefined || !order.listingTitle) return null;
              const badge = statusBadges[order.escrowStatus] || statusBadges.HELD_IN_ESCROW;
              const Icon = badge.icon;
              const isHeld = order.escrowStatus === 'HELD_IN_ESCROW';
              const isPayoutDone = order.escrowStatus === 'PAYOUT_COMPLETED' || order.escrowStatus === 'DEAL_CLOSED';
              const isDisputeOpen = order.escrowStatus === 'DISPUTE_OPEN';

              const expiresAt = order.disputeExpiresAtTimestamp || (order.createdAtTimestamp ? order.createdAtTimestamp + 24 * 3600 * 1000 : currentTime + 24 * 3600 * 1000);
              const diffMs = expiresAt - currentTime;
              const is24hElapsed = diffMs <= 0 || order.isDisputeExpired || isPayoutDone;
              const remainingHours = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
              const remainingMinutes = Math.max(0, Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)));

              return (
                <WidgetErrorBoundary key={order.id}>
                  <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                    <div className="p-4 sm:p-5">
                      <div className="flex flex-col sm:flex-row gap-4">
                        <img src={order.listingImage} alt={order.listingTitle} className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-stone-100 shrink-0" />
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1.5">
                            <span className="text-[10px] font-mono font-semibold text-stone-400">#{order.id.slice(-6)}</span>
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md ${badge.bg} ${badge.text}`}>
                              <Icon className="w-3 h-3" /> {badge.label}
                            </span>
                            <span className="text-[10px] text-stone-400 ml-auto">{order.createdAt}</span>
                          </div>
                          
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <h4 className="text-sm font-bold text-stone-900 line-clamp-1">{order.listingTitle}</h4>
                              <p className="text-xs text-stone-500 mt-0.5">Buyer: <strong>{order.buyerName}</strong> • Seller: <strong>{order.sellerName}</strong></p>
                              {(currentUser?.isAdmin || currentUser?.id === order.sellerId) && (
                                <p className="text-[10px] text-stone-500 mt-1 font-mono">Seller UPI: {order.sellerUpiId}</p>
                              )}
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-[10px] uppercase font-bold text-stone-400 block mb-0.5">Total</span>
                              <span className="text-base font-black text-brand-600 font-display">₹{order.amount.toLocaleString('en-IN')}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Active Order Actions & Info */}
                      {activeTab === 'ACTIVE' && (
                        <div className="mt-4 pt-4 border-t border-stone-100">
                          {isHeld && !is24hElapsed && (
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-amber-50/50 p-3 rounded-xl border border-amber-100">
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-amber-600" />
                                <span className="text-xs font-semibold text-amber-900">
                                  Auto-release in <span className="font-bold">{remainingHours}h {remainingMinutes}m</span>
                                </span>
                              </div>
                              <div className="flex gap-2 w-full sm:w-auto">
                                {flags.isDisputeEnabled && (
                                  <button onClick={() => handleRaiseDispute(order)} className="flex-1 sm:flex-none px-3 py-1.5 border border-rose-200 text-rose-700 text-[11px] font-bold rounded-lg hover:bg-rose-50 transition-colors">Raise Dispute</button>
                                )}
                                <button onClick={() => releaseEscrowToSeller(order.id, false)} className="flex-1 sm:flex-none px-3 py-1.5 bg-brand-600 text-white text-[11px] font-bold rounded-lg hover:bg-brand-700 transition-colors">Release Payout</button>
                                <button onClick={() => autoRelease24Hours(order.id)} title="Dev tool: simulate expiry" className="px-2 border border-stone-200 rounded-lg flex items-center justify-center hover:bg-stone-50"><Zap className="w-3 h-3 text-amber-500"/></button>
                              </div>
                            </div>
                          )}
                          {isDisputeOpen && (
                            <div className="flex items-center justify-between bg-rose-50 p-3 rounded-xl border border-rose-100">
                              <div className="flex items-center gap-2">
                                <ShieldAlert className="w-4 h-4 text-rose-600" />
                                <span className="text-xs font-semibold text-rose-900">Dispute is currently open</span>
                              </div>
                              <button onClick={() => handleRaiseDispute(order)} className="px-3 py-1.5 bg-rose-600 text-white text-[11px] font-bold rounded-lg hover:bg-rose-700 transition-colors">View Ticket</button>
                            </div>
                          )}

                                                    {/* Delivery Status */}
                          <div className="mt-3 flex items-center justify-between text-xs font-bold text-stone-600 bg-stone-50 px-3 py-2 rounded-lg">
                            <div className="flex items-center gap-2">
                              <Truck className="w-4 h-4 text-brand-600" />
                              Delivery Status: <span className="text-brand-700 font-semibold">{(order.deliveryStatus || 'ORDER_CONFIRMED').replace(/_/g, ' ')}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Past Order Actions */}
                      {activeTab === 'PAST' && (
                        <div className="mt-4 pt-4 border-t border-stone-100 flex justify-between items-center">
                          <p className="text-[11px] text-stone-500 flex items-center gap-1">
                            <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
                            Funds settled. Transaction complete.
                          </p>
                          <button onClick={() => generateInvoice(order)} className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 text-stone-700 text-[11px] font-bold rounded-lg hover:bg-stone-200 transition-colors">
                            <ReceiptText className="w-3.5 h-3.5" /> Download Invoice
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </WidgetErrorBoundary>
              );
            })
          )}
        </div>
      ) : null}
    </div>
  );
};
