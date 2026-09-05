import { LocationData } from '../../types';

export const DEFAULT_USER_LOCATION: LocationData = {
 id: 'live_location_local',
 name: 'Local Area (Current Location)',
 type: 'NEIGHBORHOOD',
 area: 'Local Area',
 lat: 18.5204,
 lng: 73.8567,
};

/**
 * Reverse geocode latitude/longitude coordinates to human-readable locality & area
 */
export async function reverseGeocode(
 lat: number,
 lng: number
): Promise<{ name: string; area: string; city: string }> {
 try {
 const controller = new AbortController();
 const timeoutId = setTimeout(() => controller.abort(), 4000);

 const response = await fetch(
 `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`,
 {
 signal: controller.signal,
 headers: {
 'Accept-Language': 'en',
 },
 }
 );
 clearTimeout(timeoutId);

 if (response.ok) {
 const data = await response.json();
 const addr = data.address || {};

 const locality =
 addr.suburb ||
 addr.neighbourhood ||
 addr.residential ||
 addr.road ||
 addr.city_district ||
 addr.village ||
 addr.town ||
 '';

 const city =
 addr.city ||
 addr.state_district ||
 addr.county ||
 'Local Area';

 const resolvedName = locality
 ? `${locality}, ${city}`
 : `${city} (${lat.toFixed(3)}°N, ${lng.toFixed(3)}°E)`;

 return {
 name: resolvedName,
 area: locality || city,
 city: city,
 };
 }
 } catch (err) {
 console.debug('Reverse geocode network fallback:', err);
 }

 // Graceful fallback when reverse geocode fails or offline
 return {
 name: `Live Location (${lat.toFixed(3)}°N, ${lng.toFixed(3)}°E)`,
 area: 'Local Area',
 city: 'Local Area',
 };
}

/**
 * Acquire user's current GPS position via Web Geolocation API
 */
export function getCurrentGpsPosition(): Promise<{
 lat: number;
 lng: number;
 accuracy: number;
}> {
 return new Promise((resolve, reject) => {
 if (!navigator.geolocation) {
 reject(new Error('Geolocation is not supported by your browser'));
 return;
 }

 navigator.geolocation.getCurrentPosition(
 (position) => {
 resolve({
 lat: position.coords.latitude,
 lng: position.coords.longitude,
 accuracy: position.coords.accuracy,
 });
 },
 (error) => {
 reject(error);
 },
 {
 enableHighAccuracy: true,
 timeout: 10000,
 maximumAge: 30000,
 }
 );
 });
}

/**
 * Calculate distance between two coordinates in kilometers using Haversine formula
 */
export function calculateDistanceKm(
 lat1: number,
 lon1: number,
 lat2: number,
 lon2: number
): number {
 const R = 6371; // Earth's radius in km
 const dLat = ((lat2 - lat1) * Math.PI) / 180;
 const dLon = ((lon2 - lon1) * Math.PI) / 180;
 const a =
 Math.sin(dLat / 2) * Math.sin(dLat / 2) +
 Math.cos((lat1 * Math.PI) / 180) *
 Math.cos((lat2 * Math.PI) / 180) *
 Math.sin(dLon / 2) *
 Math.sin(dLon / 2);
 const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
 const distance = R * c;
 return Math.round(distance * 10) / 10;
}

export function formatDistance(km: number): string {
 if (km < 0.2) return 'Right here (< 200m)';
 if (km < 1) return `${Math.round(km * 1000)}m away`;
 return `${km.toFixed(1)} km away`;
}
