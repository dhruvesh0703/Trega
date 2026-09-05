import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Camera, Video, Plus, MapPin, ShieldAlert, ShieldCheck,
  X, Sparkles, Lock, ArrowRight, RotateCw, Play, ChevronLeft, Image as ImageIcon, Info
} from 'lucide-react';
import { useMarketplace } from '../../core/context/MarketplaceContext';
import { ProductCategory, ItemCondition } from '../../types';
import { InAppMediaCaptureModal } from '../camera/InAppMediaCaptureModal';
import { removeImageBackground } from '../../utils/backgroundRemoval';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../core/firebase/firebase';

const CATEGORY_OPTIONS = [
  { id: 'ELECTRONICS_TECH', label: 'Electronics & Tech', img: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Laptop/3D/laptop_3d.png' },
  { id: 'BOOKS_NOTES', label: 'Books & Notes', img: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Books/3D/books_3d.png' },
  { id: 'HOME_LIVING', label: 'Home & Living', img: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/House%20with%20garden/3D/house_with_garden_3d.png' },
  { id: 'CYCLES_MOBILITY', label: 'Cycles & Bikes', img: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Bicycle/3D/bicycle_3d.png' },
  { id: 'TOOLS_APPLIANCES', label: 'Tools & Lab', img: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Microscope/3D/microscope_3d.png' },
  { id: 'SPORTS_FITNESS', label: 'Sports & Gym', img: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Soccer%20ball/3D/soccer_ball_3d.png' },
  { id: 'MUSIC_HOBBIES', label: 'Music & Hobbies', img: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Headphone/3D/headphone_3d.png' },
  { id: 'FASHION_ACCESSORIES', label: 'Fashion & Bags', img: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Handbag/3D/handbag_3d.png' },
];

export const CreateListingModal: React.FC = () => {
  const {
    activeModal, setActiveModal, flags, userLocation, fetchLiveLocation, isLocating,
    addListing, showToast, currentUser, updateUserProfile, isUserKycVerified
  } = useMarketplace();

  const [step, setStep] = useState(1);
  const [agreedToPolicy, setAgreedToPolicy] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState<ProductCategory>('ELECTRONICS_TECH');
  const [condition, setCondition] = useState<ItemCondition>('LIKE_NEW');
  const [sellerUpiId, setSellerUpiId] = useState(currentUser?.upiId || '');
  const [selectedPickupAddressId, setSelectedPickupAddressId] = useState(
    currentUser?.savedAddresses && currentUser.savedAddresses.length > 0
      ? currentUser.savedAddresses[0].id
      : ''
  );

  const [images, setImages] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraInitialMode, setCameraInitialMode] = useState<'PHOTO' | 'VIDEO'>('VIDEO');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  React.useEffect(() => {
    if (activeModal === 'CREATE_LISTING' && currentUser && flags.isListingEnabled && isUserKycVerified) {
      if (!currentUser.savedAddresses || currentUser.savedAddresses.length === 0) {
        showToast('Please add a pickup address to continue.');
        setActiveModal('LOCATION_PICKER_ADD');
      } else if (!selectedPickupAddressId) {
        setSelectedPickupAddressId(currentUser.savedAddresses[0].id);
      }
    }
  }, [activeModal, currentUser, flags.isListingEnabled, isUserKycVerified]);

   

  if (!flags.isListingEnabled) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900 ">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-sm border border-stone-200 text-center">
          <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-4 text-stone-500">
            <Plus className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-stone-900 mb-2">Listing Creation Paused</h3>
          <p className="text-sm text-stone-600 mb-6">Listing creation is currently disabled.</p>
          <button onClick={() => setActiveModal(null)} className="w-full py-2.5 px-4 bg-stone-900 hover:bg-stone-800 text-white text-sm font-semibold rounded-xl transition-all cursor-pointer">
            Close
          </button>
        </div>
      </div>
    );
  }

  if (!isUserKycVerified) {
    const isPendingReview = currentUser?.kycStatus === 'PENDING_REVIEW';
    const isRejected = currentUser?.kycStatus === 'REJECTED';
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900 animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-sm border border-stone-100 relative">
          <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-100 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
          <div className="text-center mb-5">
            <div className="w-14 h-14 rounded-2xl bg-transparent border border-amber-300 text-amber-600 flex items-center justify-center mx-auto mb-3 shadow-sm shadow-amber-500/20">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full mb-2 border border-amber-300">
              <Lock className="w-3 h-3" />
              <span>KYC Verification Required</span>
            </div>
            <h2 className="text-xl font-extrabold text-stone-900 font-display">Didit Verified Sellers Only</h2>
            <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto leading-relaxed">
              To protect Local Area marketplace buyers, you must be Verified to create listings.
            </p>
          </div>
          <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 mb-5 text-left">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-semibold text-stone-600">Your Account Status:</span>
              {!currentUser ? <span className="font-bold text-stone-600 bg-stone-200 px-2 py-0.5 rounded-md text-[11px]">Not Signed In</span> : isPendingReview ? <span className="font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md text-[11px]">⏳ KYC Incomplete</span> : isRejected ? <span className="font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md text-[11px]">KYC Rejected</span> : <span className="font-bold text-brand-700 bg-brand-100 px-2 py-0.5 rounded-md text-[11px]">Unverified Account</span>}
            </div>
            <p className="text-[11px] text-stone-500 leading-snug mt-1">
              {!currentUser ? 'Please log in with your phone number, then complete instant Didit PAN verification.' : isPendingReview ? 'Your KYC details are incomplete. Please verify your Identity via Didit.' : isRejected ? 'Your previous Didit verification failed. Please try again with a valid document.' : 'Verify your Identity with Didit to earn the Verified Badge and start selling.'}
            </p>
          </div>
          <div className="space-y-2.5">
            {!currentUser ? (
              <button type="button" onClick={() => setActiveModal('AUTH')} className="w-full py-3.5 px-4 bg-transparent border border-brand-600 text-brand-700 hover:bg-brand-50 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 min-h-[44px]">
                <span>Sign In with Phone Number</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button type="button" onClick={() => setActiveModal('KYC')} className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                <span>{isRejected ? 'Retry Didit KYC' : 'Verify PAN with Didit'}</span>
              </button>
            )}
            <button type="button" onClick={() => setActiveModal(null)} className="w-full py-2 text-stone-500 hover:text-stone-700 text-xs font-semibold rounded-xl transition-colors">
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleOpenCamera = (mode: 'PHOTO' | 'VIDEO') => {
    setCameraInitialMode(mode);
    setIsCameraOpen(true);
  };

  const handleSaveCapturedMedia = async (media: { images: string[]; videoUrl: string; videoBlob?: Blob }) => {
    setVideoUrl(media.videoUrl);
    if (media.videoBlob) setVideoBlob(media.videoBlob);
    
    if (media.images.length > 0) {
      setIsProcessingImage(true);
      showToast('AI Magic: Removing background...');
      const newImages = [...media.images];
      try {
        const cleanCoverImage = await removeImageBackground(newImages[0]);
        newImages[0] = cleanCoverImage;
        showToast('AI Background Removal Complete!');
      } catch (err) {
        showToast('Failed to remove background, using original.');
      }
      setImages(newImages);
      setIsProcessingImage(false);
    } else {
      setImages(media.images);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrl || images.length === 0) {
      showToast('Mandatory media missing.');
      return;
    }
    const cleanUpi = sellerUpiId.trim();
    if (!cleanUpi || !cleanUpi.includes('@') || cleanUpi.length < 5) {
      showToast('Please provide a valid UPI ID in step 4.');
      return;
    }

    setIsSubmitting(true);
    const parsedPrice = parseInt(price.replace(/\D/g, ''), 10) || 100;

    if (currentUser && currentUser.upiId !== cleanUpi) {
      updateUserProfile({ upiId: cleanUpi }).catch(console.debug);
    }

    try {
      let finalVideoUrl = videoUrl;
      if (videoBlob) {
        showToast('Uploading securely to cloud...');
        const videoRef = ref(storage, `listings/videos/${Date.now()}_${Math.random().toString(36).substring(7)}.webm`);
        await uploadBytes(videoRef, videoBlob);
        finalVideoUrl = await getDownloadURL(videoRef);
      }
      
      setIsSubmitting(false);
      addListing({
        title: title.trim(),
        description: description.trim() || 'Genuine item with live verified video and photos.',
        price: parsedPrice,
        category,
        condition,
        images: images,
        videoUrl: finalVideoUrl,
        sellerUpiId: cleanUpi,
        locationId: selectedPickupAddressId || userLocation.id,
        locationName: currentUser?.savedAddresses?.find(a => a.id === selectedPickupAddressId)?.addressLine2 || userLocation.name,
        locationArea: currentUser?.savedAddresses?.find(a => a.id === selectedPickupAddressId)?.addressLine1 || userLocation.area,
        lat: currentUser?.savedAddresses?.find(a => a.id === selectedPickupAddressId)?.lat || userLocation.lat,
        lng: currentUser?.savedAddresses?.find(a => a.id === selectedPickupAddressId)?.lng || userLocation.lng,
        hasWarranty: false,
        originalBillIncluded: true,
        tags: ['local', 'deal', 'marketplace'],
      });

      setImages([]);
      setVideoUrl(null);
      setActiveModal(null);
      showToast('Listing published securely as Verified!');
    } catch (e) {
      console.error("Upload error:", e);
      showToast('Failed to upload video to cloud. Please try again.');
      setIsSubmitting(false);
    }
  };

  const renderProgressBar = (current: number) => (
    <div className="flex gap-2 mb-8 px-1">
      {[1, 2, 3, 4, 5, 6].map(i => (
         <div key={i} className={`h-1.5 flex-1 rounded-full ${current >= i ? 'bg-brand-600' : 'bg-brand-100'}`}></div>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      <div className="flex items-center mb-6">
        <button onClick={() => setActiveModal(null)} className="p-2 -ml-2 rounded-full hover:bg-stone-100 cursor-pointer">
          <ChevronLeft className="w-6 h-6" />
        </button>
      </div>
      
      {renderProgressBar(1)}
      
      <h2 className="text-2xl font-bold text-stone-900 mb-1">Add photos and videos of your item</h2>
      <p className="text-stone-500 text-sm mb-6">Listings with photos sell faster</p>
      
      <div className="grid grid-cols-3 gap-3 mb-6 overflow-y-auto pr-2 pb-10">
         <div 
           onClick={() => handleOpenCamera('PHOTO')}
           className="col-span-2 row-span-2 bg-stone-50 border-2 border-dashed border-brand-200 rounded-3xl flex flex-col items-center justify-center relative overflow-hidden h-56 cursor-pointer hover:bg-brand-50 transition-colors"
         >
           {images[0] ? <img src={images[0]} className="w-full h-full object-cover" /> : (
             <>
               <div className="absolute top-3 right-3 bg-brand-500 text-white rounded-full p-1"><Plus className="w-5 h-5"/></div>
               <ImageIcon className="w-12 h-12 text-brand-200 mb-2" strokeWidth={1} />
               <span className="text-brand-400 font-medium text-sm">Front View</span>
               <div className="absolute bottom-3 mx-3 bg-white/90 backdrop-blur-sm rounded-xl p-3 flex gap-2 items-start text-left shadow-sm">
                 <Sparkles className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
                 <span className="text-[11px] text-stone-600 leading-tight">Background removed automatically upon listing.</span>
               </div>
             </>
           )}
         </div>
         
         <div onClick={() => handleOpenCamera('PHOTO')} className="col-span-1 border-2 border-dashed border-brand-200 rounded-3xl flex flex-col items-center justify-center relative overflow-hidden h-26 cursor-pointer hover:bg-brand-50">
           {images[1] ? <img src={images[1]} className="w-full h-full object-cover" /> : (
             <>
               <div className="absolute top-2 right-2 bg-brand-500 text-white rounded-full p-0.5"><Plus className="w-3 h-3"/></div>
               <ImageIcon className="w-6 h-6 text-brand-200 mb-1" strokeWidth={1} />
               <span className="text-brand-400 text-xs font-medium">Top View</span>
             </>
           )}
         </div>

         <div onClick={() => handleOpenCamera('PHOTO')} className="col-span-1 border-2 border-dashed border-brand-200 rounded-3xl flex flex-col items-center justify-center relative overflow-hidden h-26 cursor-pointer hover:bg-brand-50">
           {images[2] ? <img src={images[2]} className="w-full h-full object-cover" /> : (
             <>
               <div className="absolute top-2 right-2 bg-brand-500 text-white rounded-full p-0.5"><Plus className="w-3 h-3"/></div>
               <ImageIcon className="w-6 h-6 text-brand-200 mb-1" strokeWidth={1} />
               <span className="text-brand-400 text-xs font-medium">Side View</span>
             </>
           )}
         </div>

         <div onClick={() => handleOpenCamera('PHOTO')} className="col-span-1 border-2 border-dashed border-brand-200 rounded-3xl flex flex-col items-center justify-center relative overflow-hidden h-26 cursor-pointer hover:bg-brand-50">
           {images[3] ? <img src={images[3]} className="w-full h-full object-cover" /> : (
             <>
               <div className="absolute top-2 right-2 bg-brand-500 text-white rounded-full p-0.5"><Plus className="w-3 h-3"/></div>
               <ImageIcon className="w-6 h-6 text-brand-200 mb-1" strokeWidth={1} />
               <span className="text-brand-400 text-xs font-medium">Back View</span>
             </>
           )}
         </div>

         <div onClick={() => handleOpenCamera('PHOTO')} className="col-span-1 border-2 border-dashed border-brand-200 rounded-3xl flex flex-col items-center justify-center relative overflow-hidden h-26 cursor-pointer hover:bg-brand-50">
           {images[4] ? <img src={images[4]} className="w-full h-full object-cover" /> : (
             <>
               <div className="absolute top-2 right-2 bg-brand-500 text-white rounded-full p-0.5"><Plus className="w-3 h-3"/></div>
               <ImageIcon className="w-6 h-6 text-brand-200 mb-1" strokeWidth={1} />
               <span className="text-brand-400 text-xs font-medium">Close Up</span>
             </>
           )}
         </div>

         <div onClick={() => handleOpenCamera('VIDEO')} className="col-span-1 border-2 border-dashed border-brand-200 rounded-3xl flex flex-col items-center justify-center relative overflow-hidden h-26 cursor-pointer hover:bg-brand-50">
           {videoUrl ? (
             <>
               <video src={videoUrl} className="w-full h-full object-cover" />
               <div className="absolute inset-0 flex items-center justify-center bg-black/20"><Play className="w-6 h-6 text-white"/></div>
             </>
           ) : (
             <>
               <div className="absolute top-2 right-2 bg-brand-500 text-white rounded-full p-0.5"><Plus className="w-3 h-3"/></div>
               <Video className="w-6 h-6 text-brand-200 mb-1" strokeWidth={1} />
               <span className="text-brand-400 text-[10px] font-medium leading-tight text-center px-1">Video<br/>(Recommended)</span>
             </>
           )}
         </div>
      </div>
      
      <p className="text-xs text-stone-500 mt-2 mb-4">*Add a minimum of 1 photo of the item</p>

      <div className="mt-auto">
        <button 
          onClick={() => {
            if (images.length === 0) showToast('Please add at least 1 photo.');
            else setStep(2);
          }}
          className={`w-full py-4 rounded-full font-bold text-white transition-colors cursor-pointer ${images.length > 0 ? 'bg-brand-500 hover:bg-brand-600' : 'bg-brand-200'}`}
        >
          Continue
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="flex flex-col h-full animate-in slide-in-from-right duration-300">
      <div className="flex items-center mb-6">
        <button onClick={() => setStep(1)} className="p-2 -ml-2 rounded-full hover:bg-stone-100 cursor-pointer"><ChevronLeft className="w-6 h-6" /></button>
      </div>
      
      {renderProgressBar(2)}

      <h2 className="text-2xl font-bold text-stone-900 mb-1">Choose a category</h2>
      <p className="text-stone-500 text-sm mb-6">Tell us what type of item you're listing</p>
      
      <div className="grid grid-cols-2 gap-4 overflow-y-auto pb-6">
        {CATEGORY_OPTIONS.map(cat => (
           <div 
             key={cat.label} 
             onClick={() => setCategory(cat.id as ProductCategory)} 
             className={`bg-stone-50 rounded-3xl p-4 flex flex-col items-center justify-center cursor-pointer border-2 transition-all ${category === cat.id ? 'border-brand-500 bg-brand-50/50' : 'border-transparent hover:border-stone-200'}`}
           >
             <img src={cat.img} alt={cat.label} className="w-20 h-20 object-contain mb-3" />
             <span className="font-medium text-stone-700 text-sm text-center">{cat.label}</span>
           </div>
        ))}
      </div>
      
      <div className="mt-auto pt-4 bg-white">
        <button onClick={() => setStep(3)} className="w-full py-4 rounded-full font-bold text-white bg-brand-500 hover:bg-brand-600 transition-colors cursor-pointer">
          Continue
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="flex flex-col h-full animate-in slide-in-from-right duration-300">
      <div className="flex items-center mb-6">
        <button onClick={() => setStep(2)} className="p-2 -ml-2 rounded-full hover:bg-stone-100 cursor-pointer"><ChevronLeft className="w-6 h-6" /></button>
      </div>
      
      {renderProgressBar(3)}

      <h2 className="text-2xl font-bold text-stone-900 mb-1">Item details</h2>
      <p className="text-stone-500 text-sm mb-6">Tell us about what you're selling</p>
      
      <div className="space-y-6 overflow-y-auto pb-10">
        <div>
          <label className="block text-sm font-semibold text-stone-500 mb-2">What are you selling? <span className="text-rose-500">*</span></label>
          <input 
            type="text" 
            value={title} 
            onChange={e => setTitle(e.target.value)}
            className="w-full bg-brand-50/30 border border-brand-100 rounded-2xl px-5 py-4 text-base focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-stone-500 mb-2">What is the condition? <span className="text-rose-500">*</span></label>
          <div className="space-y-2">
            {[
              { id: 'BRAND_NEW', label: 'Brand New' },
              { id: 'NEW', label: 'New' },
              { id: 'LIKE_NEW', label: 'Like New' },
              { id: 'GOOD', label: 'Good' },
              { id: 'FAIR', label: 'Fair' },
              { id: 'POOR', label: 'Poor' }
            ].map(cond => (
              <div 
                key={cond.id} 
                onClick={() => setCondition(cond.id as ItemCondition)}
                className={`px-5 py-4 rounded-2xl cursor-pointer font-medium text-base transition-colors border ${condition === cond.id ? 'bg-white border-brand-500 text-stone-900 shadow-sm' : 'bg-stone-50 border-transparent text-stone-700'}`}
              >
                {cond.label}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="mt-auto pt-4 bg-white">
        <button 
          onClick={() => { if(title) setStep(4); else showToast('Please enter what you are selling.'); }} 
          className={`w-full py-4 rounded-full font-bold text-white transition-colors cursor-pointer ${title ? 'bg-brand-500 hover:bg-brand-600' : 'bg-brand-200'}`}
        >
          Continue
        </button>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="flex flex-col h-full animate-in slide-in-from-right duration-300">
      <div className="flex items-center mb-6">
        <button onClick={() => setStep(3)} className="p-2 -ml-2 rounded-full hover:bg-stone-100 cursor-pointer"><ChevronLeft className="w-6 h-6" /></button>
      </div>
      
      {renderProgressBar(4)}

      <h2 className="text-2xl font-bold text-stone-900 mb-1">Set your price</h2>
      <p className="text-stone-500 text-sm mb-6">Price it right to sell faster</p>
      
      <div className="bg-stone-50 rounded-3xl p-6 mb-4 flex items-center">
         <span className="text-4xl text-brand-500 mr-2 font-medium">₹</span>
         <input 
            type="number"
            value={price}
            onChange={e => setPrice(e.target.value)}
            placeholder="0"
            className="bg-transparent text-5xl font-medium text-stone-800 w-full focus:outline-none"
         />
      </div>
      
      <div className="bg-brand-50 text-brand-600 rounded-2xl p-4 flex items-center gap-3">
         <Info className="w-5 h-5 shrink-0" />
         <span className="text-sm font-medium">Fairly priced items sell 3x faster</span>
      </div>

      <div className="mt-6">
        <label className="block text-sm font-semibold text-stone-500 mb-2">UPI ID for Escrow Payouts <span className="text-rose-500">*</span></label>
        <input 
          type="text" 
          value={sellerUpiId} 
          onChange={e => setSellerUpiId(e.target.value)}
          placeholder="yourname@bank"
          className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-5 py-4 text-base focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>
      
      <div className="mt-auto pt-4">
        <button 
          onClick={() => {
             if(!price) { showToast('Please enter a price.'); return; }
             if(!sellerUpiId.includes('@')) { showToast('Please enter a valid UPI ID.'); return; }
             setStep(5);
          }} 
          className={`w-full py-4 rounded-full font-bold text-white transition-colors cursor-pointer ${(price && sellerUpiId) ? 'bg-brand-500 hover:bg-brand-600' : 'bg-brand-200'}`}
        >
          Continue
        </button>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="flex flex-col h-full animate-in slide-in-from-right duration-300">
      <div className="flex items-center mb-6">
        <button onClick={() => setStep(4)} className="p-2 -ml-2 rounded-full hover:bg-stone-100 cursor-pointer"><ChevronLeft className="w-6 h-6" /></button>
      </div>
      
      {renderProgressBar(5)}
      
      {images[0] && (
         <div className="w-full h-24 sm:h-32 rounded-2xl overflow-hidden mb-6 bg-stone-100 flex-shrink-0">
            <img src={images[0]} className="w-full h-full object-cover" />
         </div>
      )}

      <h2 className="text-2xl font-bold text-stone-900 mb-1">What's the story behind this item?</h2>
      <p className="text-stone-500 text-sm mb-6">Buyers don't just buy products, they buy stories</p>
      
      <div className="flex flex-wrap gap-2 mb-4">
        {["My first setup", "Used for college", "Barely used"].map(chip => (
          <div 
            key={chip} 
            onClick={() => {
              if (description.includes(chip)) {
                setDescription(prev => prev.replace(chip, '').replace('  ', ' ').trim());
              } else {
                setDescription(prev => prev ? `${prev} ${chip}`.trim() : chip);
              }
            }}
            className={`${description.includes(chip) ? 'bg-brand-600 text-white' : 'bg-stone-100 text-stone-700'} px-4 py-2.5 rounded-full text-sm font-medium cursor-pointer hover:bg-brand-500 hover:text-white transition-colors`}
          >
            {chip}
          </div>
        ))}
      </div>
      
      <div className="relative flex-1 min-h-[120px] mb-4">
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Maybe your first setup, a project, or a memory..."
          className="w-full h-full bg-brand-50/50 border border-brand-100 rounded-3xl p-5 text-base focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
          maxLength={512}
        />
        <span className="absolute bottom-5 right-5 text-xs text-stone-400 font-medium">{description.length} / 512</span>
      </div>
      
      <div className="mt-auto pt-4">
        <button 
          onClick={() => setStep(6)} 
          className="w-full py-4 rounded-full font-bold text-white bg-brand-500 hover:bg-brand-600 transition-colors cursor-pointer"
        >
          {description.trim() ? 'Continue' : 'Skip'}
        </button>
      </div>
    </div>
  );

  const renderStep6 = () => (
    <div className="flex flex-col h-full animate-in slide-in-from-right duration-300">
      <div className="flex items-center mb-6">
        <button onClick={() => setStep(5)} className="p-2 -ml-2 rounded-full hover:bg-stone-100 cursor-pointer"><ChevronLeft className="w-6 h-6" /></button>
        <h2 className="text-xl font-bold text-stone-900 ml-2">Pickup Address</h2>
      </div>
      
      {renderProgressBar(6)}
      
      <p className="text-stone-500 text-sm mb-6">Buyers only see your area, never full address.</p>
      
      <div className="bg-stone-50 rounded-3xl mb-8 border border-stone-100">
         <div className="flex items-center gap-4 p-5 hover:bg-stone-100 rounded-3xl cursor-pointer transition-colors" onClick={() => fetchLiveLocation()}>
            <div className="w-12 h-12 bg-brand-500 rounded-full flex items-center justify-center text-white shrink-0">
               <MapPin className="w-6 h-6" />
            </div>
            <div>
               <h4 className="font-bold text-stone-900 text-base">Use Current Location</h4>
               <p className="text-sm text-stone-500">{isLocating ? 'Detecting...' : 'Auto-detect your location'}</p>
            </div>
         </div>
         <div className="h-px bg-stone-200 mx-5"></div>
         <div className="flex items-center gap-4 p-5 hover:bg-stone-100 rounded-3xl cursor-pointer transition-colors" onClick={() => setActiveModal('LOCATION_PICKER_ADD')}>
            <div className="w-12 h-12 bg-white border border-stone-200 rounded-full flex items-center justify-center text-brand-500 shrink-0">
               <Plus className="w-5 h-5" />
            </div>
            <div>
               <h4 className="font-bold text-stone-900 text-base">Add address</h4>
               <p className="text-sm text-stone-500">Find by name or locality</p>
            </div>
         </div>
      </div>

      {currentUser?.savedAddresses && currentUser.savedAddresses.length > 0 && (
         <>
           <h3 className="font-bold text-stone-400 text-sm mb-4">Saved Addresses</h3>
           <div className="space-y-3 overflow-y-auto pb-10">
             {currentUser.savedAddresses.map((addr, idx) => (
                <div 
                  key={addr.id} 
                  onClick={() => setSelectedPickupAddressId(addr.id)}
                  className={`p-5 rounded-3xl border cursor-pointer transition-all ${selectedPickupAddressId === addr.id ? 'border-brand-500 bg-brand-50/50' : 'border-stone-200 bg-white hover:border-stone-300'}`}
                >
                  <div className="flex gap-4 items-center">
                     <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center text-brand-600 shrink-0">
                        <MapPin className="w-5 h-5" />
                     </div>
                     <div>
                       <div className="flex items-center gap-2 mb-1">
                         <h4 className="font-bold text-stone-900">{addr.label}</h4>
                         {idx === 0 && <span className="text-[10px] bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-bold">Default</span>}
                       </div>
                       <p className="text-xs text-stone-500 leading-snug">{addr.addressLine1}, {addr.addressLine2}</p>
                     </div>
                  </div>
                </div>
             ))}
           </div>
         </>
      )}
      
      <div className="mt-auto pt-4">
        <button 
          onClick={() => {
             if(selectedPickupAddressId || userLocation) setStep(7);
             else showToast('Please select a pickup address');
          }} 
          className="w-full py-4 rounded-full font-bold text-white bg-brand-500 hover:bg-brand-600 transition-colors cursor-pointer"
        >
          Confirm
        </button>
      </div>
    </div>
  );

  const renderStep7 = () => (
    <div className="flex flex-col h-full animate-in slide-in-from-right duration-300">
      <div className="flex items-center mb-6">
        <button onClick={() => setStep(6)} className="p-2 -ml-2 rounded-full hover:bg-stone-100 cursor-pointer"><ChevronLeft className="w-6 h-6" /></button>
        <h2 className="text-xl font-bold text-stone-900 ml-2">Review your listing</h2>
      </div>
      
      <div className="space-y-6 overflow-y-auto pb-10">
         <div>
           <div className="flex items-center justify-between mb-3">
             <h3 className="text-base font-bold text-stone-900">Photos</h3>
             <button onClick={() => setStep(1)} className="text-brand-600 font-semibold text-sm cursor-pointer">Edit</button>
           </div>
           <div className="flex gap-3 overflow-x-auto pb-2">
              {images.map((img, i) => (
                 <img key={i} src={img} className="w-20 h-20 rounded-2xl object-cover shrink-0 border border-stone-200" />
              ))}
              {videoUrl && <div className="w-20 h-20 rounded-2xl bg-black flex items-center justify-center shrink-0 border border-stone-200"><Play className="w-8 h-8 text-white opacity-50"/></div>}
           </div>
         </div>
         
         <div className="h-px bg-stone-100"></div>

         <div>
           <div className="flex items-center justify-between mb-3">
             <h3 className="text-base font-bold text-stone-900">Choose a category</h3>
             <button onClick={() => setStep(2)} className="text-brand-600 font-semibold text-sm cursor-pointer">Edit</button>
           </div>
           <div className="flex justify-between items-center text-sm">
              <span className="text-stone-500">Category</span>
              <span className="font-medium text-stone-900">{CATEGORY_OPTIONS.find(c => c.id === category)?.label || 'Others'}</span>
           </div>
         </div>

         <div className="h-px bg-stone-100"></div>

         <div>
           <div className="flex items-center justify-between mb-3">
             <h3 className="text-base font-bold text-stone-900">Item details</h3>
             <button onClick={() => setStep(3)} className="text-brand-600 font-semibold text-sm cursor-pointer">Edit</button>
           </div>
           <div className="space-y-3 text-sm">
             <div className="flex justify-between items-center">
                <span className="text-stone-500">What are you selling?</span>
                <span className="font-medium text-stone-900 text-right max-w-[60%] truncate">{title}</span>
             </div>
             <div className="flex justify-between items-center">
                <span className="text-stone-500">What is the condition?</span>
                <span className="font-medium text-stone-900 capitalize">{condition.toLowerCase().replace('_', ' ')}</span>
             </div>
           </div>
         </div>
         
         <div className="h-px bg-stone-100"></div>
         
         <div>
           <div className="flex items-center justify-between mb-3">
             <h3 className="text-base font-bold text-stone-900">Price</h3>
             <button onClick={() => setStep(4)} className="text-brand-600 font-semibold text-sm cursor-pointer">Edit</button>
           </div>
           <div className="bg-stone-50 rounded-2xl p-4 border border-stone-100">
              <span className="text-lg font-bold text-stone-900">₹{price}</span>
           </div>
         </div>

         <div className="h-px bg-stone-100"></div>
         
         <div>
           <div className="flex items-center justify-between mb-3">
             <h3 className="text-base font-bold text-stone-900">Story</h3>
             <button onClick={() => setStep(5)} className="text-brand-600 font-semibold text-sm cursor-pointer">Edit</button>
           </div>
           <div className="bg-stone-50 rounded-2xl p-4 border border-stone-100">
              <p className="text-sm text-stone-600 whitespace-pre-wrap">{description || 'No story added'}</p>
           </div>
         </div>
      </div>

      <div className="mt-auto pt-4 bg-white space-y-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input 
            type="checkbox" 
            checked={agreedToPolicy} 
            onChange={e => setAgreedToPolicy(e.target.checked)} 
            className="w-5 h-5 rounded border-stone-300 text-brand-500 focus:ring-brand-500" 
          />
          <span className="text-sm text-stone-600">I agree to the <span className="text-brand-500 underline font-medium">Packaging Policy</span>.</span>
        </label>
        <button 
          onClick={handleSubmit} 
          disabled={!agreedToPolicy || isSubmitting || !videoUrl || isProcessingImage}
          className="w-full py-4 rounded-full font-bold text-white bg-stone-200 hover:bg-stone-300 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer text-stone-500 [&:not(:disabled)]:bg-brand-500 [&:not(:disabled)]:text-white [&:not(:disabled)]:hover:bg-brand-600"
        >
          {isSubmitting ? (
            <><RotateCw className="w-5 h-5 animate-spin" /> Publishing...</>
          ) : (
            'Post your listing'
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 z-50 flex flex-col bg-white sm:bg-stone-900/60 sm:backdrop-blur-sm sm:p-6 sm:justify-center overflow-hidden">
        <div className="flex flex-col w-full h-full sm:h-[90vh] sm:max-h-[850px] relative sm:rounded-[2rem] max-w-[480px] mx-auto bg-white overflow-hidden sm:shadow-2xl p-6 sm:p-8">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
          {step === 5 && renderStep5()}
          {step === 6 && renderStep6()}
          {step === 7 && renderStep7()}
        </div>
      </div>
      
      <InAppMediaCaptureModal
        isOpen={isCameraOpen}
        initialMode={cameraInitialMode}
        existingImages={images}
        existingVideo={videoUrl}
        onClose={() => setIsCameraOpen(false)}
        onSaveMedia={handleSaveCapturedMedia}
      />
    </>
  );
};
