import { motion } from 'motion/react';
import { getApiBaseUrl } from '../../config';
import React, { useState, useMemo } from 'react';
import {
 Lock,
 ShieldCheck,
 QrCode,
 Smartphone,
 CreditCard,
 Building,
 CheckCircle2,
 AlertCircle,
 X,
 Sparkles,
 Clock,
 ArrowRight,
 Truck,
 Building2,
 Phone,
 MapPin,
 AlertTriangle,
 FileCheck2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Listing } from '../../types';
import { useMarketplace } from '../../core/context/MarketplaceContext';
import { auth } from '../../lib/firebase';

export const CheckoutLedgerModal: React.FC = () => {
 const {
 activeModal,
 setActiveModal,
 modalPayload,
 flags,
 initiateOrder,
 currentUser,
 userLocation,
 showToast,
 } = useMarketplace();

 const listing: Listing | null = modalPayload;

 const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CASHFREE' | 'NET_BANKING'>('UPI');
 const [upiApp, setUpiApp] = useState<'GPAY' | 'PHONEPE' | 'PAYTM' | 'CUSTOM_UPI'>('GPAY');
 const [customUpiId, setCustomUpiId] = useState('dhruvesh@okhdfcbank');
 
 // Delivery address details
 const [selectedAddressId, setSelectedAddressId] = useState(
    currentUser?.savedAddresses && currentUser.savedAddresses.length > 0 
      ? currentUser.savedAddresses[0].id 
      : ''
  );


      const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listing) return;
    
    setIsProcessing(true);
    setPaymentFailed(false);
    
    const amount = listing.price + 50 + Math.round(listing.price * 0.01);
    
    try {
      const idToken = await auth.currentUser?.getIdToken() || '';
      
      // 1. Create order on server
      const response = await fetch(`${getApiBaseUrl()}/api/cashfree/create-order`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
          'x-trega-client': 'trega-web-app'
        },
        body: JSON.stringify({
          amount: amount,
          purpose: `Payment for ${listing.title}`,
          buyer_name: currentUser?.name || 'Verified Buyer',
          email: currentUser?.email || 'buyer@trega.com',
          phone: currentUser?.phone || '9999999999',
          customer_id: currentUser?.id || 'guest_user'
        })
      });
      
      const orderData = await response.json();
      
      if (!response.ok || !orderData.payment_session_id) {
        console.error("Failed to create order:", orderData);
        throw new Error(orderData.error || "Failed to initialize payment gateway");
      }

      // 2. Initialize Cashfree SDK
      const cashfree = (window as any).Cashfree({ mode: orderData.environment === "PRODUCTION" ? "production" : "sandbox" });
      
      // 3. Open Checkout Modal
      const result = await cashfree.checkout({
        paymentSessionId: orderData.payment_session_id,
        redirectTarget: "_modal",
      });

      if (result.error) {
        console.error("Payment failed or cancelled by user", result.error);
        setIsProcessing(false);
        setPaymentFailed(true);
        return;
      }
      
      // 4. Verify Payment on Backend
      const verifyRes = await fetch(`${getApiBaseUrl()}/api/cashfree/verify/${orderData.order_id}`);
      const verifyData = await verifyRes.json();
      
      if (verifyData.order_status === 'PAID') {
        const newOrder = initiateOrder(listing, amount, paymentMethod, { 
          address: selectedAddressId, 
          phone: currentUser?.phone || '',
          orderId: orderData.order_id,
          paymentId: verifyData.order_id
        });
        
        setIsProcessing(false);
        setCompletedOrder({
          ...newOrder,
          cashfreeOrderId: verifyData.order_id
        });
        
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#22c55e', '#10b981', '#fbbf24']
        });
      } else {
        console.error("Payment not completed successfully:", verifyData);
        setIsProcessing(false);
        setPaymentFailed(true);
      }
      
    } catch (error) {
      console.error("Payment flow error:", error);
      setIsProcessing(false);
      setPaymentFailed(true);
    }
  };

  React.useEffect(() => {
    if (activeModal === 'CHECKOUT' && currentUser) {
      if (!currentUser.savedAddresses || currentUser.savedAddresses.length === 0) {
        showToast('Please add a delivery address to continue.');
        setActiveModal('LOCATION_PICKER_ADD');
      } else if (!selectedAddressId) {
        setSelectedAddressId(currentUser.savedAddresses[0].id);
      }
    }
  }, [activeModal, currentUser]);

  const selectedAddress = useMemo(() => 
    currentUser?.savedAddresses?.find(a => a.id === selectedAddressId),
    [currentUser, selectedAddressId]
  );
  
  const deliveryAddress = selectedAddress ? `${selectedAddress.addressLine2}, ${selectedAddress.city || 'Local Area'}` : '';
  const flatOrHouse = selectedAddress ? selectedAddress.addressLine1 : '';
  const phone = selectedAddress ? selectedAddress.phone : (currentUser?.phone || '');

 const [isProcessing, setIsProcessing] = useState(false);
  const [paymentFailed, setPaymentFailed] = useState(false);
 const [completedOrder, setCompletedOrder] = useState<any>(null);

 // Check if delivery address is within Local Area
 const isOutsideLocalArea = useMemo(() => {
    if (!deliveryAddress) return false;
    const lower = deliveryAddress.toLowerCase().trim();
    const isPunePincode = /41[12]\d{3}/.test(lower);
    const puneKeywords = ['pune', 'pcmc', 'pimpri', 'chinchwad', 'hinjewadi', 'wakad', 'baner', 'bhosari', 'kothrud', 'hadapsar', 'kharadi', 'viman nagar', 'wagholi', 'katraj', 'kondhwa', 'camp', 'shivajinagar'];
    const isPuneKeyword = puneKeywords.some((keyword) => lower.includes(keyword));
    return !isPunePincode && !isPuneKeyword;
  }, [deliveryAddress]);

  

 // Fallback when Checkout is disabled per PRD
   if (activeModal !== 'CHECKOUT' || !listing) return null;

  // Fallback when Checkout is disabled per PRD
  if (!flags.isCheckoutEnabled) {
    return (
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-stone-50 overflow-hidden shadow-[0_-20px_60px_-15px_rgba(0,0,0,0.2)] md:rounded-t-[40px] md:top-10 md:inset-x-20">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-sm border border-stone-200 text-center">
          <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-4 text-stone-500">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-stone-900 mb-1">Checkout Offline</h3>
          <p className="text-sm text-stone-600 mb-6">
            The checkout and escrow module is currently paused. Please try again later.
          </p>
          <button
            onClick={() => setActiveModal(null)}
            className="w-full py-2.5 px-4 bg-stone-900 hover:bg-stone-800 text-white text-sm font-semibold rounded-xl transition-all"
          >
            Close
          </button>
        </div>
      </motion.div>
    );
  }

  return (
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed inset-0 z-50 flex flex-col bg-stone-50 overflow-hidden shadow-[0_-20px_60px_-15px_rgba(0,0,0,0.2)] md:rounded-t-[40px] md:top-10 md:inset-x-20">

 <div className="flex flex-col w-full h-full relative max-w-2xl mx-auto bg-white overflow-hidden shadow-2xl p-6 sm:p-7">
 <button
 onClick={() => setActiveModal(null)}
 className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-100 transition-colors z-10 cursor-pointer"
 >
 <X className="w-5 h-5" />
 </button>

 <div className="flex-1 overflow-y-auto pr-1">
 {!completedOrder ? (
 <div>
 {/* Header */}
 <div className="flex items-center gap-3 mb-4">
 <div className="w-10 h-10 rounded-xl bg-transparent border border-brand-300 flex items-center justify-center text-brand-600 shrink-0">
 <Truck className="w-5 h-5" />
 </div>
 <div>
 <h2 className="text-lg font-bold text-stone-900 font-display">Trega Escrow &amp; Local Area Delivery</h2>
 <p className="text-xs text-stone-500">delivery anywhere in Local Area — escrow funds held safely</p>
 </div>
 </div>

 {/* Item Summary */}
 <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-100 mb-4 flex items-center gap-3">
 <img
 src={listing.images[0]}
 alt={listing.title}
 className="w-14 h-14 rounded-xl object-cover border border-stone-200"
 />
 <div className="flex-1 min-w-0">
 <h4 className="text-xs font-bold text-stone-900 truncate">{listing.title}</h4>
 <p className="text-[11px] text-stone-500">Seller: {listing.seller.name} ({listing.locationName})</p>
 <div className="mt-2 space-y-1 w-full bg-white p-2 rounded-lg border border-stone-200">
   <div className="flex justify-between text-[11px] text-stone-600">
     <span>Item Price</span>
     <span>₹{listing.price.toLocaleString('en-IN')}</span>
   </div>
   <div className="flex justify-between text-[11px] text-stone-600">
     <span>Platform Fee</span>
     <span>₹{Math.round(listing.price * 0.01).toLocaleString('en-IN')}</span>
   </div>
   <div className="flex justify-between text-[11px] text-stone-600">
     <span>Delivery Charge</span>
     <span>₹50</span>
   </div>
   <div className="flex justify-between text-xs font-bold text-brand-700 pt-1 border-t border-stone-100">
     <span>Total Amount to Pay</span>
     <span>₹{Math.round(listing.price + 50 + listing.price * 0.01).toLocaleString('en-IN')}</span>
   </div>
 </div>
 </div>
 </div>

 <form onSubmit={handlePay} className="space-y-4">
 {/* delivery Address */}
 <div className="bg-transparent border border-brand-300 rounded-2xl p-3.5 space-y-2.5">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-1.5 text-xs font-bold text-brand-950">
 <Truck className="w-4 h-4 text-brand-600 shrink-0" />
 <span>Local delivery Details</span>
 </div>
 <span className="text-[10px] font-bold text-brand-700 bg-brand-100 px-2 py-0.5 rounded-full">
 Local Area City &amp; District
 </span>
 </div>

 <div>
 <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-semibold text-stone-700">Select Delivery Address *</label>
                <button 
                  type="button"
                  onClick={() => setActiveModal('LOCATION_PICKER_ADD')}
                  className="text-[11px] font-bold text-brand-600 hover:text-brand-700"
                >
                  + Add New
                </button>
              </div>
              {currentUser?.savedAddresses && currentUser.savedAddresses.length > 0 ? (
                <select
                  value={selectedAddressId}
                  onChange={(e) => setSelectedAddressId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl bg-white focus:outline-none focus:border-brand-500 appearance-none cursor-pointer"
                  required
                >
                  {currentUser.savedAddresses.map(addr => (
                    <option key={addr.id} value={addr.id}>
                      {addr.label} - {addr.addressLine1}, {addr.addressLine2}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="w-full px-3 py-2 text-xs border border-rose-200 bg-rose-50 text-rose-700 rounded-xl">
                  No saved addresses. Please add one.
                </div>
              )}
 </div>

 {/* Outside City Geofencing Warning */}
 {isOutsideLocalArea && (
 <div className="p-2.5 bg-transparent border border-rose-300 rounded-xl text-xs text-rose-800 flex items-start gap-2 animate-in fade-in duration-200">
 <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
 <div>
 <strong className="block font-bold">Non-Deliverable Location</strong>
 <span>Delivery and escrow services are restricted to Pune and PCMC limits only (Porter/Borzo zones). Locations Outside City cannot be delivered.</span>
 </div>
 </div>
 )}

 <div className="grid grid-cols-2 gap-2">
 <div>
 <label className="block text-[11px] font-semibold text-stone-700 mb-1">Flat / House / Building</label>
 <input
 type="text"
 value={flatOrHouse}
 onChange={(e) => {}}
 placeholder="e.g. Flat 302, Green Woods"
 className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl bg-white focus:outline-none focus:border-brand-500"
 />
 </div>
 <div>
 <label className="block text-[11px] font-semibold text-stone-700 mb-1">Delivery Contact Phone</label>
 <input
 type="tel"
 value={phone}
 onChange={(e) => {}}
 placeholder="+91 98221 00293"
 className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl bg-white focus:outline-none focus:border-brand-500"
 />
 </div>
 </div>
 </div>

 {/* Payment Methods */}
 <div>
 <label className="block text-xs font-bold text-stone-700 mb-1.5">Select Instant Payment Method</label>
 <div className="grid grid-cols-3 gap-2">
 <button
 type="button"
 onClick={() => setPaymentMethod('UPI')}
 className={`py-2.5 px-2 rounded-xl border text-center transition-all cursor-pointer ${
 paymentMethod === 'UPI'
 ? 'border-brand-600 bg-brand-50 text-brand-950 font-bold shadow-xs'
 : 'border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-semibold'
 }`}
 >
 <Smartphone className="w-4 h-4 mx-auto mb-1 text-brand-600" />
 <span className="text-xs">UPI / GPay</span>
 </button>

 <button
 type="button"
 onClick={() => setPaymentMethod('CASHFREE')}
 className={`py-2.5 px-2 rounded-xl border text-center transition-all cursor-pointer ${
 paymentMethod === 'CASHFREE'
 ? 'border-brand-600 bg-brand-50 text-brand-950 font-bold shadow-xs'
 : 'border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-semibold'
 }`}
 >
 <CreditCard className="w-4 h-4 mx-auto mb-1 text-brand-600" />
 <span className="text-xs">Debit / Credit</span>
 </button>

 <button
 type="button"
 onClick={() => setPaymentMethod('NET_BANKING')}
 className={`py-2.5 px-2 rounded-xl border text-center transition-all cursor-pointer ${
 paymentMethod === 'NET_BANKING'
 ? 'border-brand-600 bg-brand-50 text-brand-950 font-bold shadow-xs'
 : 'border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-semibold'
 }`}
 >
 <Building className="w-4 h-4 mx-auto mb-1 text-purple-600" />
 <span className="text-xs">Net Banking</span>
 </button>
 </div>
 </div>

 {/* UPI App Selection */}
 {paymentMethod === 'UPI' && (
 <div className="bg-stone-50 p-3 rounded-xl border border-stone-100 space-y-2">
 <span className="text-[11px] font-bold text-stone-600">Choose UPI App:</span>
 <div className="flex gap-2">
 {[
 { id: 'GPAY', label: 'Google Pay' },
 { id: 'PHONEPE', label: 'PhonePe' },
 { id: 'PAYTM', label: 'Paytm' },
 { id: 'CUSTOM_UPI', label: 'Custom UPI' },
 ].map((app) => (
 <button
 key={app.id}
 type="button"
 onClick={() => setUpiApp(app.id as any)}
 className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
 upiApp === app.id
 ? 'bg-stone-900 text-white border-stone-900'
 : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
 }`}
 >
 {app.label}
 </button>
 ))}
 </div>

 {upiApp === 'CUSTOM_UPI' && (
 <input
 type="text"
 value={customUpiId}
 onChange={(e) => setCustomUpiId(e.target.value)}
 placeholder="yourname@upi"
 className="w-full px-3 py-1.5 text-xs border border-stone-200 rounded-lg bg-white mt-2 font-mono"
 />
 )}
 </div>
 )}

 {/* Escrow Guarantee Pill */}
 <div className="p-3 bg-transparent border border-brand-300 rounded-2xl flex items-start gap-2.5">
 <ShieldCheck className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
 <p className="text-[11px] text-brand-950 leading-relaxed">
 <strong>100% Escrow Protection:</strong> Money is held securely by Trega. You get an active <strong>24-Hour Buyer Dispute Window</strong> from delivery to inspect the item. After 24 hours without dispute, payment is automatically released to the seller's UPI and Trega is out of the deal.
 </p>
 </div>

 <button
 type="submit"
 disabled={isProcessing || isOutsideLocalArea}
 className="w-full py-3.5 px-4 bg-transparent border border-brand-600 text-brand-700 hover:bg-brand-50 font-extrabold text-xs sm:text-sm rounded-xl shadow-sm shadow-brand-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
 >
 {isProcessing ? (
 <>
 <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
 <span>Locking Funds in Escrow...</span>
 </>
 ) : isOutsideLocalArea ? (
 'Outside City (Non-Deliverable)'
 ) : (
 <>
 <span>Pay ₹{Math.round(listing.price + 50 + listing.price * 0.01).toLocaleString('en-IN')} &amp; Place Order</span>
 <ArrowRight className="w-4 h-4" />
 </>
 )}
 </button>
 </form>
 </div>
 ) : (
 /* Order Placed Success View */
 <div className="text-center py-4 space-y-4">
 <div className="w-16 h-16 bg-transparent border border-brand-300 text-brand-600 rounded-full flex items-center justify-center mx-auto border-2 border-brand-200 shadow-sm">
 <CheckCircle2 className="w-8 h-8" />
 </div>

 <div>
 <h3 className="text-lg font-black text-stone-900 font-display">
 Order Confirmed &amp; Delivery Dispatched!
 </h3>
 <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
 ₹{completedOrder.amount} is securely held in Trega Escrow.
 </p>
 </div>

 {/* 24-Hour Dispute Window Active Card */}
 <div className="p-4 bg-transparent border border-brand-300 rounded-2xl max-w-sm mx-auto text-left space-y-2 shadow-xs">
 <div className="flex items-center gap-2">
 <Clock className="w-4 h-4 text-brand-600 shrink-0" />
 <span className="text-xs font-bold text-brand-950">
 24-Hour Buyer Dispute Window Active
 </span>
 </div>
 <p className="text-[11px] text-stone-600 leading-relaxed">
 Upon delivery, you have <strong>24 hours</strong> to test and inspect the item. If defective or not as described, click <strong>Dispute</strong> in your Orders tab.
 </p>
 <div className="pt-1.5 border-t border-brand-100 flex items-center gap-1.5 text-[10px] text-brand-800 font-semibold">
 <FileCheck2 className="w-3.5 h-3.5 text-brand-600 shrink-0" />
 <span>After 24 hours without dispute, funds are released to the seller's UPI and Trega is out of the deal.</span>
 </div>
 </div>

 <div className="text-left bg-stone-50 p-3.5 rounded-2xl border border-stone-100 text-xs space-y-1.5 max-w-sm mx-auto">
 {completedOrder.cashfreeOrderId && (
 <div className="flex justify-between">
 <span className="text-stone-500">Fastrr Checkout ID:</span>
 <span className="font-mono font-bold text-emerald-700 text-right truncate max-w-[200px]">
 {completedOrder.cashfreeOrderId}
 </span>
 </div>
 )}
 {completedOrder.cashfreeOrderId && (
 <div className="flex justify-between">
 <span className="text-stone-500">Fastrr Order ID:</span>
 <span className="font-mono text-stone-700 text-right truncate max-w-[200px]">
 {completedOrder.cashfreeOrderId}
 </span>
 </div>
 )}
 <div className="flex justify-between">
 <span className="text-stone-500">Delivery Address:</span>
 <span className="font-semibold text-stone-800 text-right truncate max-w-[200px]">
 {completedOrder.deliveryAddress}
 </span>
 </div>
 {(currentUser?.isAdmin || currentUser?.id === completedOrder.sellerId) && (
                <div className="flex justify-between">
                  <span className="text-stone-500">Seller Payout UPI:</span>
                  <span className="font-mono font-bold text-stone-800 text-right truncate max-w-[200px]">
                    {completedOrder.sellerUpiId}
                  </span>
                </div>
              )}
 <div className="flex justify-between">
 <span className="text-stone-500">Settlement Policy:</span>
 <span className="font-semibold text-brand-700">24-hour buyer inspection window</span>
 </div>
 <div className="flex justify-between">
 <span className="text-stone-500">Estimated Delivery:</span>
 <span className="font-semibold text-brand-700">Same-Day / Within 4 Hours</span>
 </div>
 </div>

 <button
 type="button"
 onClick={() => setActiveModal(null)}
 className="py-2.5 px-6 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm"
 >
 Back to Marketplace
 </button>
 </div>
 )}
 </div>
 </div>
     </motion.div>
  );
};