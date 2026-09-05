import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, User as UserIcon, Phone, MapPin, ShieldCheck, Camera as CameraIcon, LogOut, 
  Trash2, Package, Clock, AlertCircle, Plus, ArrowUpRight, CheckCircle2, 
  XCircle, BadgePercent, Edit2, Save, Navigation, RefreshCw, LogIn, UserPlus
} from 'lucide-react';
import { useMarketplace } from '../../core/context/MarketplaceContext';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { TrustBadge } from '../kyc/TrustBadge';

export const UserProfileModal: React.FC = () => {
  const { 
    currentUser, activeModal, setActiveModal, logout, updateUserProfile, 
    listings, offers, respondToOffer, markAsSold, deleteListing, 
    openCreateListing, showToast, userLocation, fetchLiveLocation, isLocating,
    setSelectedListing
  } = useMarketplace();

  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [upiInput, setUpiInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize state when modal opens
  React.useEffect(() => {
    if (activeModal === 'PROFILE' && currentUser) {
      setNameInput(currentUser.name || '');
      setUpiInput(currentUser.upiId || '');
      setProfilePhotoUrl(currentUser.avatar || '');
    }
  }, [activeModal, currentUser]);

  if (activeModal !== 'PROFILE') return null;

  if (!currentUser) {
    return (
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-stone-50 overflow-hidden shadow-[0_-20px_60px_-15px_rgba(0,0,0,0.2)] md:rounded-t-[40px] md:top-10 md:inset-x-20">
        <div className="relative w-full max-w-md bg-white rounded-3xl border border-stone-200 shadow-2xl overflow-hidden my-6">
          <div className="p-8 text-center space-y-6">
            <div className="w-20 h-20 bg-stone-100 rounded-full mx-auto flex items-center justify-center text-stone-300">
              <UserIcon className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-xl font-black text-stone-900 font-display">Sign In Required</h3>
              <p className="text-sm text-stone-500 mt-2 font-medium">Please sign in to view your profile, manage your listings, and access settings.</p>
            </div>
            <div className="flex flex-col gap-3 pt-4">
              <button 
                onClick={() => setActiveModal('AUTH')}
                className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-brand-600/20"
              >
                Sign In / Sign Up
              </button>
              <button 
                onClick={() => setActiveModal(null)}
                className="w-full py-3.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
          
          <div className="border-t border-stone-100 bg-stone-50 p-6 space-y-3">
            <a href="/policies/contact" target="_blank" className="w-full flex items-center justify-between p-3 bg-white border border-stone-200 hover:bg-stone-50 rounded-xl text-left transition-colors cursor-pointer">
              <span className="text-xs font-bold text-stone-700">Contact Us</span>
              <span className="text-[10px] text-stone-400">&gt;</span>
            </a>
            <a href="/policies/terms" target="_blank" className="w-full flex items-center justify-between p-3 bg-white hover:bg-stone-100 rounded-xl text-left border border-stone-100 transition-colors cursor-pointer">
              <span className="text-xs font-bold text-stone-700">Terms & Conditions</span>
              <span className="text-[10px] text-stone-400">&gt;</span>
            </a>
            <a href="/policies/privacy" target="_blank" className="w-full flex items-center justify-between p-3 bg-white hover:bg-stone-100 rounded-xl text-left border border-stone-100 transition-colors cursor-pointer">
              <span className="text-xs font-bold text-stone-700">Privacy Policy</span>
              <span className="text-[10px] text-stone-400">&gt;</span>
            </a>
            <a href="/policies/refund" target="_blank" className="w-full flex items-center justify-between p-3 bg-white hover:bg-stone-100 rounded-xl text-left border border-stone-100 transition-colors cursor-pointer">
              <span className="text-xs font-bold text-stone-700">Refund & Cancellation Policy</span>
              <span className="text-[10px] text-stone-400">&gt;</span>
            </a>
            <a href="/policies/return" target="_blank" className="w-full flex items-center justify-between p-3 bg-white hover:bg-stone-100 rounded-xl text-left border border-stone-100 transition-colors cursor-pointer">
              <span className="text-xs font-bold text-stone-700">Return Policy</span>
              <span className="text-[10px] text-stone-400">&gt;</span>
            </a>
            <a href="/policies/shipping" target="_blank" className="w-full flex items-center justify-between p-3 bg-white hover:bg-stone-100 rounded-xl text-left border border-stone-100 transition-colors cursor-pointer">
              <span className="text-xs font-bold text-stone-700">Shipping Policy</span>
              <span className="text-[10px] text-stone-400">&gt;</span>
            </a>
          </div>
        </div>
      </motion.div>
    );
  }

  const myListings = listings.filter((l) => l.seller.id === currentUser.id && !l.isDeleted);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    await updateUserProfile({
      name: nameInput.trim(),
      upiId: upiInput.trim(),
      avatar: profilePhotoUrl
    });
    setIsSaving(false);
    setIsEditing(false);
    showToast('Profile updated successfully!');
  };

  const handlePhotoUpload = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Prompt
      });
      if (image.dataUrl) {
        setProfilePhotoUrl(image.dataUrl);
      }
    } catch (error) {
      console.log('Camera error or cancelled:', error);
    }
  };

  return (
<motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed inset-0 z-50 flex flex-col bg-stone-50 overflow-hidden shadow-[0_-20px_60px_-15px_rgba(0,0,0,0.2)] md:rounded-t-[40px] md:top-10 md:inset-x-20">
<div className="flex flex-col w-full h-full relative max-w-4xl mx-auto bg-stone-50 overflow-hidden">
          {/* Header */}
          <div className="shrink-0 p-5 sm:p-6 bg-white border-b border-stone-100 flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center text-brand-600">
                <UserIcon className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-black text-stone-900 font-display">Account Profile</h2>
            </div>
            <button
              onClick={() => setActiveModal(null)}
              className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="overflow-y-auto p-5 sm:p-6 space-y-6 flex-1">
            
            {/* Identity Card */}
            <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
                <div className="flex items-start gap-4">
                  <div className="relative group">
                    <img 
                      src={profilePhotoUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"} 
                      alt={currentUser.name} 
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-stone-100"
                    />
                    {isEditing && (
                      <button 
                        onClick={handlePhotoUpload}
                        className="absolute -bottom-2 -right-2 bg-brand-600 text-white p-2 rounded-xl shadow-lg border-2 border-white hover:bg-brand-700 transition-colors"
                      >
                        <CameraIcon className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="space-y-1 mt-1">
                    {isEditing ? (
                      <input 
                        type="text"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        className="text-lg font-bold text-stone-900 bg-stone-50 border border-stone-200 rounded-lg px-3 py-1.5 w-full focus:outline-none focus:border-brand-500"
                        placeholder="Your full name"
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-stone-900">{currentUser.name}</h3>
                        <TrustBadge isVerified={currentUser.isKycVerified} kycStatus={currentUser.kycStatus} kycType={currentUser.kycType} size="md" />
                      </div>
                    )}
                    
                    <div className="flex items-center gap-1.5 text-stone-500 text-sm font-medium">
                      <Phone className="w-3.5 h-3.5" />
                      <span>{currentUser.phone}</span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex items-center justify-end sm:justify-start w-full sm:w-auto">
                  {isEditing ? (
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button 
                        onClick={() => {
                          setIsEditing(false);
                          setNameInput(currentUser.name || '');
                          setUpiInput(currentUser.upiId || '');
                          setProfilePhotoUrl(currentUser.avatar || '');
                        }}
                        className="flex-1 sm:flex-none px-4 py-2 border border-stone-200 text-stone-600 rounded-xl text-xs font-bold hover:bg-stone-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleSaveProfile}
                        disabled={isSaving}
                        className="flex-1 sm:flex-none px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700 transition-colors flex items-center justify-center gap-2"
                      >
                        {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        Save
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="w-full sm:w-auto px-4 py-2 bg-stone-100 text-stone-700 rounded-xl text-xs font-bold hover:bg-stone-200 transition-colors flex items-center justify-center gap-2"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Edit Profile
                    </button>
                  )}
                </div>
              </div>

              {/* UPI Section */}
              <div className="mt-5 pt-5 border-t border-stone-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                      UPI VPA ID
                      <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] rounded-md font-bold uppercase tracking-wider">For Payouts</span>
                    </h4>
                    {!isEditing && (
                      <p className="text-xs text-stone-500 mt-1 font-medium">
                        {currentUser.upiId || 'Not set up yet. Add a UPI ID to receive payments.'}
                      </p>
                    )}
                  </div>
                  {isEditing && (
                    <div className="w-full sm:w-64 shrink-0">
                       <input 
                        type="text"
                        value={upiInput}
                        onChange={(e) => setUpiInput(e.target.value)}
                        className="text-sm font-bold text-stone-900 bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 w-full focus:outline-none focus:border-brand-500"
                        placeholder="e.g. name@okhdfcbank"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* My Listings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2 uppercase tracking-wider">
                  <Package className="w-4 h-4 text-brand-600" />
                  My Listings
                </h3>
                <span className="px-2 py-0.5 bg-stone-200 text-stone-700 rounded-full text-xs font-bold">
                  {myListings.length}
                </span>
              </div>

              {myListings.length === 0 ? (
                <div className="bg-stone-100 border-2 border-dashed border-stone-200 rounded-2xl p-8 text-center">
                  <Package className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                  <h4 className="text-stone-900 font-bold mb-1">No listings yet</h4>
                  <p className="text-stone-500 text-xs mb-4">You haven't posted any items for sale.</p>
                  <button 
                    onClick={() => { setActiveModal(null); setTimeout(() => openCreateListing(), 100); }}
                    className="px-5 py-2.5 bg-brand-600 text-white font-bold text-xs rounded-xl hover:bg-brand-700 transition-colors shadow-lg shadow-brand-600/20 mx-auto flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Post an Item
                  </button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {myListings.map((listing) => {
                    const listingOffers = offers.filter(o => o.listingId === listing.id);
                    return (
                      <div key={listing.id} className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm flex flex-col gap-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div 
                            className="flex items-center gap-3 cursor-pointer group flex-1"
                            onClick={() => {
                              setActiveModal(null);
                              setTimeout(() => setSelectedListing(listing), 200);
                            }}
                          >
                            <img src={listing.images[0] || 'https://via.placeholder.com/150'} className="w-14 h-14 rounded-xl object-cover border border-stone-200 bg-stone-100 shrink-0 group-hover:opacity-90 transition-opacity" alt="Listing" />
                            <div className="min-w-0">
                              <h4 className="text-sm font-bold text-stone-900 truncate group-hover:text-brand-700 transition-colors">{listing.title}</h4>
                              <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-[10px] sm:text-xs text-stone-500 mt-1">
                                <span className="font-bold text-stone-900">₹{listing.price}</span>
                                <span>•</span>
                                <span className="truncate">{listing.locationName}</span>
                                <span>•</span>
                                <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                                  listing.isDeleted ? 'bg-rose-100 text-rose-700' :
                                  listing.isSold ? 'bg-stone-100 text-stone-600' : 'border border-brand-200 text-brand-700'
                                }`}>
                                  {listing.isDeleted ? 'DELETED' : listing.isSold ? 'SOLD' : 'ACTIVE'}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto w-full sm:w-auto justify-end">
                            {!listing.isDeleted && !listing.isSold && (
                              <button 
                                onClick={() => {
                                  markAsSold(listing.id);
                                  showToast('Listing marked as sold!');
                                }}
                                className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                              >
                                Mark Sold
                              </button>
                            )}
                            {!listing.isDeleted && (
                              <button 
                                onClick={() => {
                                  if (window.confirm('Are you sure you want to delete this listing?')) {
                                    deleteListing(listing.id);
                                    showToast('Listing deleted.');
                                  }
                                }}
                                className="p-1.5 text-stone-400 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-colors cursor-pointer"
                                title="Delete Listing"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        {listingOffers.length > 0 && (
                          <div className="border-t border-stone-100 pt-3 space-y-2">
                            <div className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                              <BadgePercent className="w-3.5 h-3.5 text-brand-600" />
                              Offers Received ({listingOffers.length})
                            </div>
                            <div className="space-y-2">
                              {listingOffers.map(off => (
                                <div key={off.id} className="bg-stone-50 border border-stone-200 rounded-xl p-2.5 flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <img src={off.buyerAvatar} alt={off.buyerName} className="w-7 h-7 rounded-full object-cover shrink-0" />
                                    <div className="min-w-0">
                                      <div className="text-xs font-bold text-stone-900 truncate">{off.buyerName}</div>
                                      <div className="text-[11px] font-extrabold text-brand-700">Offered ₹{off.offeredPrice}</div>
                                    </div>
                                  </div>
                                  <div className="shrink-0">
                                    {off.status === 'PENDING' ? (
                                      <div className="flex items-center gap-1.5">
                                        <button onClick={() => respondToOffer(off.id, 'ACCEPTED')} className="px-3 py-1.5 bg-brand-600 text-white text-[10px] font-bold rounded-lg hover:bg-brand-700">Accept</button>
                                        <button onClick={() => respondToOffer(off.id, 'REJECTED')} className="px-3 py-1.5 bg-white border border-stone-200 text-stone-600 text-[10px] font-bold rounded-lg hover:bg-stone-50">Reject</button>
                                      </div>
                                    ) : (
                                      <span className={`text-[10px] font-bold px-2 py-1 rounded ${off.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                        {off.status}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Support Section */}
            <div className="border-t border-stone-200 pt-6">
              <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">Support</h4>
              <div className="space-y-2">
                <a href="/policies/contact" target="_blank" className="w-full flex items-center justify-between p-3 bg-white border border-stone-200 hover:bg-stone-50 rounded-xl text-left transition-colors cursor-pointer">
                  <span className="text-xs font-bold text-stone-700">Contact Us / Help Center</span>
                  <span className="text-[10px] text-stone-400">&gt;</span>
                </a>
              </div>
            </div>

            {/* Legal Section */}
            <div className="border-t border-stone-200 pt-6">
              <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">Legal & Policies</h4>
              <div className="space-y-2">
                <a href="/policies/terms" target="_blank" className="w-full flex items-center justify-between p-3 bg-white border border-stone-200 hover:bg-stone-50 rounded-xl text-left transition-colors cursor-pointer">
                  <span className="text-xs font-bold text-stone-700">Terms & Conditions</span>
                  <span className="text-[10px] text-stone-400">&gt;</span>
                </a>
                <a href="/policies/privacy" target="_blank" className="w-full flex items-center justify-between p-3 bg-white border border-stone-200 hover:bg-stone-50 rounded-xl text-left transition-colors cursor-pointer">
                  <span className="text-xs font-bold text-stone-700">Privacy Policy</span>
                  <span className="text-[10px] text-stone-400">&gt;</span>
                </a>
                <a href="/policies/refund" target="_blank" className="w-full flex items-center justify-between p-3 bg-white border border-stone-200 hover:bg-stone-50 rounded-xl text-left transition-colors cursor-pointer">
                  <span className="text-xs font-bold text-stone-700">Refund & Cancellation Policy</span>
                  <span className="text-[10px] text-stone-400">&gt;</span>
                </a>
                <a href="/policies/return" target="_blank" className="w-full flex items-center justify-between p-3 bg-white border border-stone-200 hover:bg-stone-50 rounded-xl text-left transition-colors cursor-pointer">
                  <span className="text-xs font-bold text-stone-700">Return Policy</span>
                  <span className="text-[10px] text-stone-400">&gt;</span>
                </a>
                <a href="/policies/shipping" target="_blank" className="w-full flex items-center justify-between p-3 bg-white border border-stone-200 hover:bg-stone-50 rounded-xl text-left transition-colors cursor-pointer">
                  <span className="text-xs font-bold text-stone-700">Shipping Policy</span>
                  <span className="text-[10px] text-stone-400">&gt;</span>
                </a>
                <button 
                  type="button" 
                  onClick={() => setActiveModal('LEGAL_DELETION')}
                  className="w-full flex items-center justify-between p-3 bg-rose-50 border border-rose-100 hover:bg-rose-100 rounded-xl text-left transition-colors cursor-pointer"
                >
                  <span className="text-xs font-bold text-rose-700">Account & Data Deletion</span>
                  <span className="text-[10px] text-rose-400">&gt;</span>
                </button>
              </div>
            </div>
            
            {/* Logout Section */}
            <div className="border-t border-stone-200 pt-5 pb-2 flex items-center justify-between">
              <button
                type="button"
                onClick={async () => {
                  await logout();
                  setActiveModal(null);
                }}
                className="px-5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer mx-auto"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out of Trega</span>
              </button>
            </div>

          </div>
          </div>
</motion.div>
    
  );
};
