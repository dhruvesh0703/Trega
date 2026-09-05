import React, { useState, useEffect, useRef } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { MapPin, ArrowLeft, Save, Search, LocateFixed } from 'lucide-react';
import { useMarketplace } from '../../core/context/MarketplaceContext';
import { UserAddress } from '../../types';

const MAPS_KEY = 'AIzaSyBJyZULMUCDFyyUBIvkCqn988ujkyBvdDs'; // Maps JS API key
const API_KEY = MAPS_KEY;

export const AddAddressView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { currentUser, updateUserProfile, showToast } = useMarketplace();
  
  const [hasKey] = useState(Boolean(API_KEY) && (API_KEY as string) !== "YOUR_API_KEY");
  const [markerPos, setMarkerPos] = useState({ lat: 18.5204, lng: 73.8567 }); // Local Area default
  const [panToPos, setPanToPos] = useState<{lat: number, lng: number} | null>(null);
  
  const [label, setLabel] = useState('Home');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('Local Area');
  const [pincode, setPincode] = useState('');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setMarkerPos(newPos);
          setPanToPos(newPos);
        },
        (err) => console.warn('Geolocation error:', err),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      showToast('You must be logged in to save addresses');
      return;
    }
    
    // Pune limits validation
    const lowerCity = city.toLowerCase();
    const lowerArea = addressLine2.toLowerCase();
    const isPunePincode = pincode && (pincode.startsWith('411') || pincode.startsWith('412'));
    const puneKeywords = ['pune', 'pcmc', 'pimpri', 'chinchwad', 'hinjewadi', 'wakad', 'baner', 'bhosari', 'kothrud', 'hadapsar', 'kharadi', 'viman nagar', 'wagholi', 'katraj', 'kondhwa', 'camp', 'shivajinagar'];
    
    const isPuneCity = puneKeywords.some(k => lowerCity.includes(k));
    const isPuneArea = puneKeywords.some(k => lowerArea.includes(k));
    
    if (!isPunePincode && !isPuneCity && !isPuneArea) {
      showToast('Address must be within Pune / PCMC limits (Porter & Borzo delivery zones).');
      setIsSaving(false);
      return;
    }
    
    setIsSaving(true);
    
    const newAddress: UserAddress = {
      id: Date.now().toString(),
      label,
      addressLine1,
      addressLine2,
      city,
      pincode,
      phone,
      lat: markerPos.lat,
      lng: markerPos.lng,
      isDefault: (currentUser.savedAddresses || []).length === 0,
    };
    
    try {
      const updatedAddresses = [...(currentUser.savedAddresses || []), newAddress];
      await updateUserProfile({ savedAddresses: updatedAddresses });
      showToast('Address saved successfully!');
      onBack();
    } catch (error) {
      showToast('Error saving address');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!hasKey) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-center p-4 bg-white">
        <h2 className="text-lg font-bold mb-2">Google Maps API Key Required</h2>
        <button onClick={onBack} className="text-brand-600 font-bold text-sm">Go Back</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 shrink-0 bg-white border-b border-stone-100 z-10 shadow-sm relative">
        <button onClick={onBack} className="p-2 hover:bg-stone-100 rounded-full cursor-pointer -ml-2">
          <ArrowLeft className="w-6 h-6 text-stone-900" />
        </button>
        <h2 className="text-xl font-bold text-stone-900 font-display">Add New Address</h2>
      </div>

      <APIProvider apiKey={API_KEY} version="weekly">
        {/* Map Section */}
        <div className="relative h-[45vh] shrink-0 w-full bg-stone-100 border-b border-stone-200">
          <Map
            defaultCenter={markerPos}
            defaultZoom={15}
            mapId="ADD_ADDRESS_MAP"
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            style={{ width: '100%', height: '100%' }}
            onClick={(e) => {
              if (e.detail.latLng) {
                setMarkerPos(e.detail.latLng);
              }
            }}
            disableDefaultUI={true} gestureHandling='greedy'
          >
            <SafeAdvancedMarker markerPos={markerPos} setMarkerPos={setMarkerPos} />
            <ReverseGeocoder markerPos={markerPos} setAddressLine2={setAddressLine2} setCity={setCity} setPincode={setPincode} />
            <MapController panToPos={panToPos} />
            <PlaceAutocomplete onPlaceSelect={(pos) => {
              setMarkerPos(pos);
              setPanToPos(pos);
            }} />
          </Map>
          
          <button 
            onClick={() => {
              if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition((pos) => {
                  const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                  setMarkerPos(newPos);
                  setPanToPos(newPos);
                });
              }
            }}
            className="absolute bottom-4 right-4 bg-white p-3 rounded-full shadow-lg border border-stone-200 text-brand-600 hover:bg-stone-50 cursor-pointer z-10"
          >
            <LocateFixed className="w-5 h-5" />
          </button>
        </div>

        {/* Form Section */}
        <div className="flex-1 overflow-y-auto p-5 pb-24">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-brand-600" /> Enter Address Details
            </h3>
            <p className="text-xs text-stone-500 mt-1">Move the pin on the map to set precise location</p>
          </div>

          <form id="add-address-form" onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-2">Save As</label>
              <div className="flex gap-2">
                {['Home', 'Office', 'Other'].map(l => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLabel(l)}
                    className={`px-5 py-2 rounded-full text-xs font-bold transition-all border ${
                      label === l ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">House no, Flat, Building *</label>
              <input
                type="text"
                required
                value={addressLine1}
                onChange={e => setAddressLine1(e.target.value)}
                className="w-full px-4 py-3 text-sm border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                placeholder="e.g. Flat 302, Green Woods"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Area, Street, Sector *</label>
              <input
                type="text"
                required
                value={addressLine2}
                onChange={e => setAddressLine2(e.target.value)}
                className="w-full px-4 py-3 text-sm border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 bg-stone-50"
                placeholder="e.g. DP Road, Kothrud"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">City</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  className="w-full px-4 py-3 text-sm border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 bg-stone-50"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Pincode</label>
                <input
                  type="text"
                  value={pincode}
                  onChange={e => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full px-4 py-3 text-sm border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 bg-stone-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Phone Number *</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full px-4 py-3 text-sm border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                placeholder="+91"
              />
            </div>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-stone-100 z-20">
          <button
            type="submit"
            form="add-address-form"
            disabled={isSaving}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-brand-600 text-white font-bold rounded-xl cursor-pointer hover:bg-brand-700 disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            <span className="text-sm">{isSaving ? 'Saving...' : 'Save Address'}</span>
          </button>
        </div>
      </APIProvider>
    </div>
  );
};

// Sub-components

const SafeAdvancedMarker: React.FC<{ markerPos: any, setMarkerPos: any }> = ({ markerPos, setMarkerPos }) => {
  const markerLib = useMapsLibrary('marker');
  if (!markerLib) return null;
  return (
    <AdvancedMarker position={markerPos} draggable onDragEnd={(e) => {
      if (e.latLng) {
        setMarkerPos({ lat: e.latLng.lat(), lng: e.latLng.lng() });
      }
    }}>
      <Pin background="#ea580c" glyphColor="#fff" borderColor="#c2410c" />
    </AdvancedMarker>
  );
};

const MapController: React.FC<{ panToPos: {lat: number, lng: number} | null }> = ({ panToPos }) => {
  const map = useMap();
  useEffect(() => {
    if (map && panToPos) {
      map.panTo(panToPos);
      map.setZoom(16);
    }
  }, [map, panToPos]);
  return null;
};

const PLACES_KEY = 'AIzaSyDcsTvwyrOfVIazoys4inSQWyCrrrwyvJQ';

const PlaceAutocomplete: React.FC<{ onPlaceSelect: (pos: {lat: number, lng: number}) => void }> = ({ onPlaceSelect }) => {
  const [query, setQuery] = useState('');
  const [predictions, setPredictions] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  
  useEffect(() => {
    if (query.trim().length < 3) {
      setPredictions([]);
      setIsOpen(false);
      return;
    }
    
    const timeout = setTimeout(async () => {
      try {
        const response = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': PLACES_KEY
          },
          body: JSON.stringify({
            input: query,
            // optionally you could restrict to India
            includedPrimaryTypes: ["locality", "sublocality", "neighborhood", "route", "street_address"],
          })
        });
        const data = await response.json();
        if (data.suggestions) {
          setPredictions(data.suggestions.map((s: any) => s.placePrediction));
          setIsOpen(true);
        }
      } catch (e) {
        console.warn('Autocomplete error', e);
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [query]);

  const handleSelect = async (placeId: string) => {
    setIsOpen(false);
    setQuery('');
    try {
      const response = await fetch(`https://places.googleapis.com/v1/places/${placeId}?fields=location&key=${PLACES_KEY}`);
      const data = await response.json();
      if (data.location) {
        onPlaceSelect({ lat: data.location.latitude, lng: data.location.longitude });
      }
    } catch(e) {
      console.warn('Place details error', e);
    }
  };

  return (
    <div className="absolute top-4 left-4 right-14 z-10">
      <div className="bg-white rounded-xl shadow-md flex items-center px-3 py-2.5 border border-stone-200">
        <Search className="w-5 h-5 text-stone-400 mr-2 shrink-0" />
        <input 
           value={query}
           onChange={e => setQuery(e.target.value)}
           className="w-full text-sm outline-none bg-transparent font-medium text-stone-800 placeholder-stone-400"
           placeholder="Search for an area or landmark..." 
         />
      </div>
      {isOpen && predictions.length > 0 && (
        <div className="mt-2 bg-white rounded-xl shadow-lg border border-stone-100 overflow-hidden">
          {predictions.map(p => (
            <div 
              key={p.placeId} 
              onClick={() => handleSelect(p.placeId)}
              className="px-4 py-3 border-b border-stone-50 text-sm hover:bg-stone-50 cursor-pointer flex flex-col"
            >
              <span className="font-medium text-stone-900">{p.text.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ReverseGeocoder: React.FC<{
  markerPos: { lat: number; lng: number };
  setAddressLine2: (s: string) => void;
  setCity: (s: string) => void;
  setPincode: (s: string) => void;
}> = ({ markerPos, setAddressLine2, setCity, setPincode }) => {
  const GEOCODING_KEY = 'AIzaSyAX5IkBcM7E1exRgIGF8_BdqBWuGIZFKUI'; // Geocoding API key

  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${markerPos.lat},${markerPos.lng}&key=${GEOCODING_KEY}`);
        const data = await response.json();
        
        if (data.status === 'OK' && data.results && data.results[0]) {
          const result = data.results[0];
          const components = result.address_components;
          const formattedAddress = result.formatted_address;
          
          let subloc = '';
          let route = '';
          let cityStr = '';
          let pinStr = '';

          for (const component of components) {
            const types = component.types;
            if (types.includes('postal_code')) pinStr = component.long_name;
            if (types.includes('locality') || types.includes('administrative_area_level_2')) {
              if (!cityStr) cityStr = component.long_name;
            }
            if (types.includes('sublocality') || types.includes('sublocality_level_1')) subloc = component.long_name;
            if (types.includes('route')) route = component.long_name;
          }

          if (pinStr) setPincode(pinStr);
          if (cityStr) setCity(cityStr);

          // Extract everything from start up to the city name from formatted_address
          let fullArea = '';
          if (cityStr && formattedAddress.includes(cityStr)) {
            fullArea = formattedAddress.substring(0, formattedAddress.indexOf(cityStr));
            // Remove trailing commas and spaces
            fullArea = fullArea.replace(/(,\s*)+$/, '').trim();
          }
          
          // Fallback if parsing fails
          if (!fullArea) {
            const line2Parts = [];
            if (route) line2Parts.push(route);
            if (subloc) line2Parts.push(subloc);
            fullArea = line2Parts.length > 0 ? line2Parts.join(', ') : formattedAddress.split(',')[0];
          }

          // Optionally strip Plus Codes from the beginning (e.g. "GWHQ+PRF, ")
          fullArea = fullArea.replace(/^[A-Z0-9]{4,8}\+[A-Z0-9]{2,3}(,\s*)?/, '');

          setAddressLine2(fullArea);
        }
      } catch (e) {
        console.warn('Geocoding failed:', e);
      }
    }, 800);
    
    return () => clearTimeout(timeoutId);
  }, [markerPos, setAddressLine2, setCity, setPincode]);

  return null;
};
