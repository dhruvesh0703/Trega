import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { AddAddressView } from './AddAddressView';
import { MapPin, Navigation, X, SlidersHorizontal, RefreshCw, CheckCircle2, Radio, Plus, Home, Briefcase, Map } from 'lucide-react';
import { useMarketplace } from '../../core/context/MarketplaceContext';
const RADIUS_OPTIONS = [
  { label: "5 km", value: 5 },
  { label: "10 km", value: 10 },
  { label: "25 km", value: 25 },
  { label: "City", value: null },
];

export const LocationPickerModal: React.FC = () => {
  const {
    activeModal, setActiveModal, flags, userLocation, setUserLocation, fetchLiveLocation, isLocating, radiusKm, setRadiusKm, currentUser
  } = useMarketplace();
  const [view, setView] = useState<'MAIN' | 'ADD'>('MAIN');
  
  useEffect(() => {
    if (activeModal === 'LOCATION_PICKER_ADD') {
      setView('ADD');
    } else {
      setView('MAIN');
    }
  }, [activeModal]);
  
  return (
    <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed inset-0 z-50 flex flex-col bg-stone-50 overflow-hidden shadow-[0_-20px_60px_-15px_rgba(0,0,0,0.2)] md:rounded-t-[40px] md:top-10 md:inset-x-20">
      <div className="flex flex-col w-full h-full relative overflow-y-auto p-4 sm:p-6 pb-24">
        <button onClick={() => setActiveModal(null)} className="absolute top-5 right-5 p-2 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-100 transition-colors cursor-pointer z-10">
          <X className="w-5 h-5" />
        </button>
        
        {view === 'ADD' ? (
           <AddAddressView onBack={() => setView('MAIN')} />
        ) : (
          <>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-2xl bg-transparent border border-brand-300 flex items-center justify-center text-brand-600 shadow-2xs">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-stone-900 font-display">Current Location</h2>
                <p className="text-xs text-stone-500">Auto-detected real-time position for hyperlocal deals</p>
              </div>
            </div>

            {/* Live Location Status Card */}
            <div className="p-4 rounded-2xl border border-brand-100 bg-brand-50 mb-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-stone-900 leading-snug">{userLocation.name}</h3>
                  </div>
                </div>
              </div>
            </div>

            {/* Re-detect GPS Button */}
            <button 
              type="button" 
              disabled={isLocating}
              onClick={async () => {
                await fetchLiveLocation({ highAccuracy: true });
              }}
              className="w-full mb-4 flex items-center justify-center gap-2 py-3.5 bg-transparent border border-brand-600 text-brand-700 hover:bg-brand-50 font-bold text-sm rounded-xl transition-all cursor-pointer shadow-sm shadow-brand-600/20 disabled:opacity-75"
            >
              {isLocating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Detecting Location...</span>
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4" />
                  <span>Auto-Locate Current Position</span>
                </>
              )}
            </button>

            {/* Discovery Radius Options */}
            {flags.isLocationEnabled ? (
              <div className="mb-4 bg-stone-50 p-4 rounded-2xl border border-stone-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-brand-600" /> Discovery Radius
                  </h3>
                  <span className="text-xs font-bold text-brand-700 font-display">
                    {radiusKm ? `${radiusKm} km radius` : 'Entire City'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {RADIUS_OPTIONS && RADIUS_OPTIONS.map((opt: any) => (
                    <button
                      key={String(opt.value)}
                      type="button"
                      onClick={() => setRadiusKm(opt.value)}
                      className={`text-xs font-medium px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                        radiusKm === opt.value
                          ? 'border-brand-600 bg-brand-600 text-white shadow-xs font-semibold'
                          : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mb-4 p-3 bg-transparent border border-amber-300 rounded-xl text-xs text-amber-800">
                <strong>Location Engine Disabled:</strong> Proximity radius calculations are paused. All listings are shown globally.
              </div>
            )}

            {/* Saved Addresses */}
            {currentUser && (
              <div className="mb-4">
                <h3 className="text-sm font-bold text-stone-900 mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-brand-600" /> Saved Addresses
                </h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {(currentUser.savedAddresses || []).length === 0 ? (
                    <p className="text-xs text-stone-500 italic">No saved addresses yet.</p>
                  ) : (
                    (currentUser.savedAddresses || []).map((addr) => (
                      <div 
                        key={addr.id} 
                        onClick={() => {
                          setUserLocation({
                            id: addr.id,
                            name: `${addr.addressLine1}, ${addr.addressLine2}`,
                            lat: addr.lat,
                            lng: addr.lng,
                            type: 'LOCALITY',
                            area: addr.addressLine1
                          });
                          setActiveModal(null);
                        }} 
                        className="p-3 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-between cursor-pointer hover:border-brand-300 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-stone-200 shrink-0">
                            {addr.label === 'Home' ? <Home className="w-4 h-4 text-stone-600" /> :
                              addr.label === 'Office' ? <Briefcase className="w-4 h-4 text-stone-600" /> :
                              <Map className="w-4 h-4 text-stone-600" />}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-stone-900">{addr.label}</p>
                            <p className="text-[10px] text-stone-500 truncate max-w-[180px]">{addr.addressLine1}, {addr.addressLine2}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <button 
                  onClick={() => setView('ADD')}
                  className="mt-3 w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add New Address
                </button>
              </div>
            )}
            
            {/* Footer info */}
            <div className="mt-auto pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
              <span className="flex items-center gap-1 text-stone-600 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-brand-600 shrink-0" /> Precise Proximity Sorting Enabled
              </span>
              <button 
                type="button" 
                onClick={() => setActiveModal(null)} 
                className="text-xs font-bold text-brand-600 hover:text-brand-800 cursor-pointer"
              >
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};
